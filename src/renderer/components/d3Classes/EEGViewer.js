import throttle from 'lodash/throttle';

const ZOOM_SCALAR = 1.5;

/** Trace color before the first epoch reports quality. */
const DEFAULT_COLOUR = '#66B0A9';

const TONE_STYLES = {
  blink: {
    fill: 'rgba(255, 193, 7, 0.18)',
    stroke: '#ffc107',
    text: '#1a1a1a',
  },
  'eyes-closed': {
    fill: 'rgba(0, 124, 112, 0.10)',
    stroke: '#007c70',
    text: '#ffffff',
  },
};

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

const LABEL_HEIGHT = 22;
// Canvas roundRect, like SVG, clamps radius to half the box; exactly half is a pill.
const LABEL_RADIUS = LABEL_HEIGHT / 2;

/** Static-plot oscilloscope: fixed axes, data sweeps left→right overwriting the previous sweep. */
export default class EEGViewer {
  constructor(element, parameters) {
    this.element = element;
    try {
      this.ctx = element.getContext?.('2d') ?? null;
    } catch {
      this.ctx = null;
    }
    this.channels = parameters.channels;
    this.plottingInterval = parameters.plottingInterval;
    this.domain = parameters.domain;
    this.fixedColours = parameters.channelColours != null;
    this.channelColours =
      parameters.channelColours ?? this.channels.map(() => DEFAULT_COLOUR);
    this.annotations = parameters.annotations ?? [];
    this.snapshot = parameters.snapshot ?? null;
    this.amplitudeScale = parameters.amplitudeScale;
    this.lineWidth = 1.75;
    this.zoom = 1;
    this.margin = { top: 20, right: 10, bottom: 30, left: 44 };
    this.data = this.channels.map(() => []);
    this.channelMeans = this.channels.map(() => 0);
    this.amplitudeRange = 200;
    // Sweep anchor: sample time that maps to x=0. Null until the first live
    // epoch — never seeded from Date.now() (device clocks can lag wall time).
    this.sweepStart = null;
    this.headTime = null;
    // Revealed up to here; advances in real time via rAF so the sweep moves
    // smoothly even though data arrives in 250 ms chunks (PLOTTING_INTERVAL
    // itself is load-bearing for signal-quality epoching and stays 250 ms).
    this.displayTime = null;
    this.rafId = null;
    this.lastFrame = null;
    this.firstTimestamp = null;
    this.lastTimestamp = null;
    this.destroyed = false;

    this.resize = this.resize.bind(this);
    if (this.snapshot) this.updateSnapshot(this.snapshot, this.amplitudeScale);
    else this.init();

    this.windowResizeHandler = throttle(this.resize, 200);
    window.addEventListener('resize', this.windowResizeHandler);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(([entry]) => {
        if (this.destroyed) return;
        const { width, height } = entry.contentRect;
        if (width === this.totalWidth && height === this.totalHeight) return;
        this.init();
      });
      this.resizeObserver.observe(element);
    }
  }

  destroy() {
    this.destroyed = true;
    window.removeEventListener('resize', this.windowResizeHandler);
    this.windowResizeHandler.cancel?.();
    this.resizeObserver?.disconnect();
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.ctx && this.totalWidth)
      this.ctx.clearRect(0, 0, this.totalWidth, this.totalHeight);
  }

  computeGeometry() {
    const rect = this.element?.getBoundingClientRect?.() ?? {
      width: 0,
      height: 0,
    };
    this.totalWidth = rect.width || 0;
    this.totalHeight = rect.height || 0;
    this.width = Math.max(
      0,
      this.totalWidth - (this.margin.left + this.margin.right)
    );
    this.height = Math.max(
      0,
      this.totalHeight - (this.margin.top + this.margin.bottom)
    );
    this.dpr = window.devicePixelRatio || 1;
  }

  init() {
    this.draw();
  }

  resize() {
    if (!this.destroyed) this.draw();
  }

  redraw() {
    this.draw();
  }

  /**
   * Erase the proximate next step ahead of the write head, in the same draw
   * pass as the incoming trace: a full-height slice of background (clearRect,
   * the canvas is transparent) roughly one frame-step wide. Old data is wiped
   * just before the head overwrites it — incoming and overwriting stay on the
   * one rAF timescale, not split between chunk arrival and reveal.
   */
  drawEraseBar() {
    if (this.snapshot || this.sweepStart == null || this.displayTime == null)
      return;
    const { ctx } = this;
    const offset =
      (((this.displayTime - this.sweepStart) % this.domain) + this.domain) %
      this.domain;
    const headX = this.margin.left + (offset / this.domain) * this.width;
    const barWidth = Math.max(2, (1000 / 60 / this.domain) * this.width);
    ctx.clearRect(headX, this.margin.top, barWidth, this.height);
    // The head wraps: erase at the left edge with whatever crosses over.
    const overflow = headX + barWidth - (this.margin.left + this.width);
    if (overflow > 0)
      ctx.clearRect(this.margin.left, this.margin.top, overflow, this.height);
  }

  /**
   * Reveal buffered points in real time (rAF, ~60 fps): the display head
   * advances by frame elapsed time toward the latest data head, so a chunk
   * draws as a smooth sweep instead of a 250 ms jump.
   */
  startReveal() {
    if (
      this.rafId != null ||
      this.destroyed ||
      this.snapshot ||
      this.displayTime == null ||
      this.headTime == null ||
      typeof requestAnimationFrame === 'undefined'
    )
      return;
    this.rafId = requestAnimationFrame((timestamp) => {
      this.rafId = null;
      if (
        this.destroyed ||
        this.snapshot ||
        this.displayTime == null ||
        this.headTime == null
      )
        return;
      if (this.lastFrame == null) this.lastFrame = timestamp;
      const elapsed = Math.max(0, timestamp - this.lastFrame);
      this.lastFrame = timestamp;
      // Fell a full window behind (hidden guest throttles rAF): resync
      // instead of sweeping empty plot for seconds.
      this.displayTime =
        this.headTime - this.displayTime > this.domain
          ? this.headTime
          : Math.min(this.headTime, this.displayTime + elapsed);
      this.draw();
      if (this.displayTime < this.headTime) this.startReveal();
      else this.lastFrame = null;
    });
  }
  draw() {
    this.computeGeometry();
    const { ctx } = this;
    if (!ctx || !(this.domain > 0)) return;
    const totalW = this.width + this.margin.left + this.margin.right;
    const totalH = this.height + this.margin.top + this.margin.bottom;
    if (this.element.width !== Math.round(totalW * this.dpr))
      this.element.width = Math.round(totalW * this.dpr);
    if (this.element.height !== Math.round(totalH * this.dpr))
      this.element.height = Math.round(totalH * this.dpr);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, totalW, totalH);
    if (this.width <= 0 || this.height <= 0) return;
    this.drawAxes();
    this.drawAnnotations();
    this.drawTraces();
    this.drawEraseBar();
  }

  /** Fixed geometry: labels and whole-second offset ticks depend only on size/domain, never on data. */
  drawAxes() {
    const { ctx } = this;
    ctx.fillStyle = '#484848';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.font = '14px "Helvetica Neue", serif';
    const band = this.height / Math.max(1, this.channels.length);
    this.channels.forEach((name, i) => {
      ctx.fillText(
        String(name),
        this.margin.left - 8,
        this.margin.top + band * (i + 0.5)
      );
    });
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '12px "Helvetica Neue", serif';
    // Whole-second ticks only: sub-second steps would round to duplicate labels.
    const maxTicks = Math.max(2, Math.floor(this.width / 80));
    const step = Math.max(1, Math.ceil(this.domain / 1000 / maxTicks)) * 1000;
    for (let offset = 0; offset >= -this.domain; offset -= step) {
      const x =
        this.margin.left + ((offset + this.domain) / this.domain) * this.width;
      ctx.fillText(
        `${Math.round(offset / 1000)}s`,
        x,
        this.margin.top + this.height + 8
      );
    }
  }

  yFor(value, i) {
    const half = (this.amplitudeScale ?? this.amplitudeRange) / this.zoom;
    if (!(half > 0)) return this.margin.top;
    const [bottom, top] = EEGViewer.getLineRange(
      i,
      this.channels.length,
      this.height
    );
    return (
      this.margin.top +
      bottom +
      ((value - this.channelMeans[i] - half) * (top - bottom)) / (-2 * half)
    );
  }

  /** X in plot coordinates for a visible time, or null when erased/not yet written. */
  xFor(time) {
    if (this.snapshot) {
      const x = ((time - this.firstTimestamp) / this.domain) * this.width;
      return x >= 0 && x <= this.width ? x : null;
    }
    if (this.sweepStart == null || this.displayTime == null) return null;
    if (time > this.displayTime || time <= this.displayTime - this.domain)
      return null;
    const offset =
      (((time - this.sweepStart) % this.domain) + this.domain) % this.domain;
    return (offset / this.domain) * this.width;
  }

  updateData(epoch) {
    if (this.snapshot) return;
    const { samplingRate, startTime } = epoch.info;
    const mapped = this.mapChannels(epoch.info.channelNames ?? []);
    const sampleCount = epoch.data[0]?.length ?? 0;
    const endTime = startTime + sampleCount / (samplingRate / 1000);
    if (this.sweepStart == null) this.sweepStart = startTime;
    else if (endTime >= this.sweepStart + this.domain)
      this.sweepStart +=
        Math.floor((endTime - this.sweepStart) / this.domain) * this.domain;
    this.headTime =
      this.headTime == null ? endTime : Math.max(this.headTime, endTime);
    this.firstTimestamp = this.sweepStart;
    this.lastTimestamp = this.headTime;
    if (this.displayTime == null) this.displayTime = startTime;

    for (let i = 0; i < this.channels.length; i++) {
      const source = epoch.data[mapped[i]];
      if (mapped[i] < 0 || !source) continue;
      const points = source
        .map((y, index) => ({
          x: startTime + index / (samplingRate / 1000),
          y,
        }))
        .filter((p) => Number.isFinite(p.y));
      // Prune on the display clock (what's visible), not the data head: old
      // points then leave in xFor / the erase bar, on the reveal timescale.
      this.data[i] = this.data[i]
        .filter((p) => p.x > this.displayTime - this.domain)
        .concat(points);
    }
    if (!this.fixedColours)
      this.channelColours = this.channels.map(
        (name, i) =>
          epoch.signalQuality?.[name] ??
          this.channelColours[i] ??
          DEFAULT_COLOUR
      );
    this.draw();
    this.startReveal();
  }

  mapChannels(sourceNames) {
    if (!sourceNames?.length) return this.channels.map((_, i) => i);
    return this.channels.map((name) => sourceNames.indexOf(name));
  }

  drawTraces() {
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.margin.left, this.margin.top, this.width, this.height);
    ctx.clip();
    for (let i = 0; i < this.channels.length; i++) {
      ctx.strokeStyle = this.channelColours[i] ?? DEFAULT_COLOUR;
      ctx.lineWidth = this.lineWidth;
      ctx.beginPath();
      let pen = false;
      let prevX = -Infinity;
      for (const point of this.data[i] ?? []) {
        const x = this.xFor(point.x);
        if (x == null) {
          pen = false;
          continue;
        }
        const absX = this.margin.left + x;
        const y = this.yFor(point.y, i);
        // Break the path at the wrap (x jumps back) — never connect across it or the gap.
        if (!pen || x < prevX) ctx.moveTo(absX, y);
        else ctx.lineTo(absX, y);
        pen = true;
        prevX = x;
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Visible [{x,width,drawLeft,drawRight}] segments for an annotation interval, split at the wrap. */
  annotationSegments(annotation) {
    const style = TONE_STYLES[annotation.tone] ?? TONE_STYLES.blink;
    const solid = annotation.tone === 'eyes-closed';
    if (this.snapshot) {
      const start = Math.max(this.firstTimestamp, annotation.startTime);
      const end = Math.min(
        this.lastTimestamp,
        annotation.endTime ?? this.lastTimestamp
      );
      if (end < start) return { style, segments: [] };
      const x = ((start - this.firstTimestamp) / this.domain) * this.width;
      const width = ((end - start) / this.domain) * this.width;
      return {
        style,
        segments: [
          {
            x,
            width,
            drawLeft: true,
            drawRight: !(solid && annotation.endTime == null),
          },
        ],
      };
    }
    if (this.sweepStart == null || this.displayTime == null)
      return { style, segments: [] };
    const visibleStart = this.displayTime - this.domain;
    const start = Math.max(annotation.startTime, visibleStart);
    const end = Math.min(
      annotation.endTime ?? this.displayTime,
      this.displayTime
    );
    if (end < start) return { style, segments: [] };
    const spans =
      start < this.sweepStart && end >= this.sweepStart
        ? [
            [start, this.sweepStart],
            [this.sweepStart, end],
          ]
        : [[start, end]];
    const segments = spans.map(([a, b], index) => {
      const offset =
        (((a - this.sweepStart) % this.domain) + this.domain) % this.domain;
      return {
        x: (offset / this.domain) * this.width,
        width: ((b - a) / this.domain) * this.width,
        drawLeft: index === 0,
        drawRight:
          index === spans.length - 1 && !(solid && annotation.endTime == null),
      };
    });
    // A span ending exactly at the wrap gets full remaining width from toX math; clamp.
    segments.forEach((s) => {
      s.width = Math.min(s.width, this.width - s.x);
    });
    return { style, segments };
  }

  drawAnnotations() {
    const { ctx } = this;
    for (const annotation of this.annotations) {
      const { style, segments } = this.annotationSegments(annotation);
      if (!segments.length) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.margin.left, this.margin.top, this.width, this.height);
      ctx.clip();
      for (const seg of segments) {
        ctx.fillStyle = style.fill;
        ctx.fillRect(
          this.margin.left + seg.x,
          this.margin.top,
          seg.width,
          this.height
        );
        for (const [draw, x] of [
          [seg.drawLeft, seg.x],
          [seg.drawRight, seg.x + seg.width],
        ]) {
          if (!draw) continue;
          ctx.strokeStyle = style.stroke;
          ctx.lineWidth = annotation.tone === 'eyes-closed' ? 2 : 1;
          ctx.setLineDash(annotation.tone === 'eyes-closed' ? [] : [4, 3]);
          ctx.beginPath();
          ctx.moveTo(this.margin.left + x, this.margin.top);
          ctx.lineTo(this.margin.left + x, this.margin.top + this.height);
          ctx.stroke();
        }
      }
      ctx.restore();
      ctx.setLineDash([]);
      const totalWidth = segments.reduce((sum, s) => sum + s.width, 0);
      if (totalWidth <= 40) continue;
      this.drawLabel('start', annotation.label, segments[0].x + 6, -6, style);
      if (annotation.endTime != null) {
        const last = segments[segments.length - 1];
        this.drawLabel(
          'end',
          annotation.endLabel ?? '',
          last.x + last.width + 6,
          this.height - LABEL_HEIGHT - 4,
          style
        );
      }
    }
  }

  /** Pill label clamped inside the plot; a start label ends at its anchor, an end label begins there. */
  drawLabel(kind, text, anchorX, y, style) {
    const { ctx } = this;
    const measured = ctx.measureText?.(text)?.width ?? 0;
    const width = Math.max(measured, (text ?? '').length * 6.5) + 20;
    const left = Math.max(
      0,
      Math.min(
        Math.max(0, this.width - width),
        kind === 'start' ? anchorX - width : anchorX
      )
    );
    const absX = this.margin.left + left;
    const absY = this.margin.top + y;
    ctx.fillStyle = style.stroke;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function')
      ctx.roundRect(absX, absY, width, LABEL_HEIGHT, LABEL_RADIUS);
    else ctx.rect(absX, absY, width, LABEL_HEIGHT);
    ctx.fill();
    ctx.fillStyle = style.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px "Helvetica Neue", serif';
    ctx.fillText(text, absX + width / 2, absY + LABEL_HEIGHT / 2);
  }

  renderAnnotations() {
    this.draw();
  }

  updateAnnotations(annotations) {
    this.annotations = annotations ?? [];
    this.draw();
  }

  updateChannels(channels, channelColours) {
    this.channels = channels;
    this.fixedColours = channelColours != null;
    this.channelColours =
      channelColours ?? this.channels.map(() => DEFAULT_COLOUR);
    this.resetSweep();
    this.draw();
  }

  updateDomain(domain) {
    this.domain = domain;
    this.draw();
  }

  resetSweep() {
    this.data = this.channels.map(() => []);
    this.channelMeans = this.channels.map(() => 0);
    this.sweepStart = null;
    this.headTime = null;
    this.displayTime = null;
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.firstTimestamp = null;
    this.lastTimestamp = null;
  }

  resetData() {
    // Never seed a wall-clock point: device timestamps can lag Date.now().
    this.resetSweep();
    this.amplitudeRange = 200;
  }

  centerChannelsForSnapshot() {
    this.channelMeans = this.data.map((channelData) =>
      channelData.length ? mean(channelData.map((d) => d.y)) : 0
    );
  }

  /** `null` returns to live mode; an already-live viewer keeps its sweep and only rescales. */
  updateSnapshot(snapshot, amplitudeScale) {
    if (snapshot == null) {
      this.amplitudeScale = amplitudeScale;
      if (this.snapshot == null) {
        this.draw();
        return;
      }
      this.snapshot = null;
      this.resetData();
      this.draw();
      return;
    }
    this.snapshot = snapshot;
    this.channels = snapshot.channels;
    this.domain = snapshot.endTime - snapshot.startTime;
    this.amplitudeScale =
      amplitudeScale != null ? amplitudeScale : this.amplitudeRange;
    this.data = snapshot.data.map((samples) =>
      samples.map((value, index) => ({
        x:
          snapshot.startTime +
          (index * (snapshot.endTime - snapshot.startTime)) /
            Math.max(1, samples.length),
        y: value,
      }))
    );
    this.sweepStart = snapshot.startTime;
    this.headTime = snapshot.endTime;
    this.displayTime = snapshot.endTime;
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.firstTimestamp = snapshot.startTime;
    this.centerChannelsForSnapshot();
    this.draw();
  }

  zoomIn() {
    this.zoom *= ZOOM_SCALAR;
    this.draw();
  }

  zoomOut() {
    this.zoom /= ZOOM_SCALAR;
    this.draw();
  }

  static getLineRange(index, nbChannels, height) {
    return [(index + 1) * (height / nbChannels), index * (height / nbChannels)];
  }
}
