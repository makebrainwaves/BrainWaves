/* eslint prefer-template: 0 */
import * as d3 from 'd3';
import throttle from 'lodash/throttle';
import simplify from 'simplify-js';

const ZOOM_SCALAR = 1.5;

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
// SVG clamps rx to half the box, so an oversized rx renders an oval, not a pill.
const LABEL_RADIUS = LABEL_HEIGHT / 2;

const LABEL_GUTTER = LABEL_HEIGHT + 8;

/** getBBox is unavailable before layout (and in jsdom); fall back to glyph width. */
function pillWidth(text) {
  const measured = text.node()?.getBBox?.()?.width ?? 0;
  return Math.max(measured, (text.text() ?? '').length * 6.5) + 20;
}

export default class EEGViewer {
  constructor(svg, parameters) {
    this.channels = parameters.channels;
    this.plottingInterval = parameters.plottingInterval;
    this.domain = parameters.domain;
    this.channelColours = parameters.channelColours;
    this.annotations = parameters.annotations ?? [];
    this.snapshot = parameters.snapshot ?? null;
    this.amplitudeScale = parameters.amplitudeScale;
    this.downsampling = 2;
    this.lineWidth = 1.75;
    this.zoom = 1;
    this.canvas = d3.select(svg);

    this.margin = { top: 20, right: 10, bottom: 30, left: 44 };
    this.lastTimestamp = Date.now();
    this.firstTimestamp = this.lastTimestamp - this.domain;

    this.data = new Array(this.channels.length).fill(null).map(() => []);
    this.channelMeans = new Array(this.channels.length).fill(0);
    this.amplitudeRange = 200;

    this.resize = this.resize.bind(this);
    if (this.snapshot) {
      this.updateSnapshot(this.snapshot, this.amplitudeScale);
    } else {
      this.init();
    }
    this.windowResizeHandler = throttle(this.resize, 200);
    window.addEventListener('resize', this.windowResizeHandler);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        if (!this.graph) return;
        if (width === this.lastWidth && height === this.lastHeight) return;
        this.init();
      });
      this.resizeObserver.observe(svg);
    }
  }

  destroy() {
    window.removeEventListener('resize', this.windowResizeHandler);
    this.resizeObserver?.disconnect();
    this.canvas.selectAll('*').remove();
  }

  computeGeometry() {
    const svgElement = this.canvas.node();
    let width = 0;
    let height = 0;
    if (svgElement) {
      const rect = svgElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
    }
    this.lastWidth = width;
    this.lastHeight = height;
    this.width = Math.max(0, width - (this.margin.left + this.margin.right));
    this.height = Math.max(0, height - (this.margin.top + this.margin.bottom));
  }

  init() {
    this.computeGeometry();
    this.canvas.selectAll('*').remove();
    this.canvas
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.graph = this.canvas
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    this.addDefs();
    this.addScales();
    this.addAxes();
    this.addLines();
    this.addAnnotationsLayer();
  }

  addDefs() {
    this.defs = this.canvas.append('defs');

    this.plotClipPath = this.defs
      .append('clipPath')
      .attr('id', this.uniqueId('plot-clip'));
    this.plotClipPath
      .append('rect')
      .attr('class', 'plot-clip')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this.width)
      .attr('height', this.height);

    this.annotationClipPath = this.defs
      .append('clipPath')
      .attr('id', this.uniqueId('annotation-clip'));
    this.annotationClipPath
      .append('rect')
      .attr('class', 'annotation-clip')
      .attr('x', 0)
      // Bands stay inside the plot box, but their pills sit just above and
      // below it — a plot-height clip would hide the end label entirely.
      .attr('y', -LABEL_GUTTER)
      .attr('width', this.width)
      .attr('height', this.height + 2 * LABEL_GUTTER);
  }

  uniqueId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  addScales() {
    this.xScale = d3
      .scaleTime()
      .domain([this.firstTimestamp, this.lastTimestamp])
      .range([0, this.width]);

    // Time labels are offsets from "now" ("-4s"), so the axis gets its own
    // fixed scale and never moves as timestamps advance.
    this.xAxisScale = d3
      .scaleLinear()
      .domain([-this.domain, 0])
      .range([0, this.width]);

    this.yScaleLines = d3.scaleLinear();
    this.yScaleLabels = d3
      .scaleLinear()
      .domain([this.channels.length - 1, 0])
      .range([
        (this.channels.length - 1) * (this.height / this.channels.length) +
          this.height / this.channels.length / 2,
        this.height / this.channels.length / 2,
      ]);
  }

  addAxes() {
    this.yAxis = d3
      .axisLeft()
      .scale(this.yScaleLabels)
      .tickSize(2)
      .tickFormat((d, i) => String(this.channels[i]))
      .tickValues(d3.range(this.channels.length));

    this.axisY = this.graph.append('g').attr('class', 'axis').call(this.yAxis);

    this.axisX = this.graph.append('g').attr('class', 'axis x-axis');
    this.renderTimeAxis();
  }

  /** Ticks change only with geometry or domain, never with incoming data. */
  renderTimeAxis() {
    this.xAxisScale.domain([-this.domain, 0]).range([0, this.width]);
    this.axisX
      .attr('transform', `translate(0,${this.height})`)
      .call(this.buildTimeAxis());
    this.axisWidth = this.width;
    this.axisHeight = this.height;
  }

  buildTimeAxis() {
    // Whole-second ticks only: sub-second steps would round to duplicate labels.
    const maxTicks = Math.max(2, Math.floor(this.width / 80));
    const step = Math.max(1, Math.ceil(this.domain / 1000 / maxTicks)) * 1000;
    const offsets = [];
    for (let offset = 0; offset >= -this.domain; offset -= step)
      offsets.push(offset);
    return d3
      .axisBottom()
      .scale(this.xAxisScale)
      .tickValues(offsets)
      .tickFormat((offset) => `${Math.round(Number(offset) / 1000)}s`);
  }

  addLines() {
    if (this.graph) this.graph.select('#lines').remove();
    this.lines = this.graph
      .append('g')
      .attr('id', 'lines')
      .attr('clip-path', `url(#${this.plotClipPath.attr('id')})`);

    this.line = d3
      .line()
      .x((d) => this.xScale(d.x))
      .y((d) => this.yScaleLines(d.y))
      .curve(d3.curveLinear)
      .defined((d) => d && typeof d.y === 'number' && !Number.isNaN(d.y));

    this.paths = this.channels.map((channelName, i) => {
      this.getYScaleForChannel(i);

      return this.lines
        .append('path')
        .attr('class', 'line')
        .attr('id', `line-${channelName}`)
        .datum(this.data[i])
        .attr('d', this.line)
        .attr('stroke', this.channelColours[i])
        .attr('stroke-width', this.lineWidth)
        .attr('fill', 'none');
    });
  }

  addAnnotationsLayer() {
    this.annotationsGroup = this.graph
      .append('g')
      .attr('class', 'annotations')
      .attr('clip-path', `url(#${this.annotationClipPath.attr('id')})`);
    this.annotationGroup = this.annotationsGroup
      .append('g')
      .attr('class', 'annotation-bands');
    this.labelsGroup = this.annotationsGroup
      .append('g')
      .attr('class', 'annotation-labels');
    this.renderAnnotations();
  }

  getYScaleForChannel(i) {
    const halfRange = (this.amplitudeScale ?? this.amplitudeRange) / this.zoom;
    const center = this.channelMeans[i];
    this.yScaleLines
      .domain([center + halfRange, center - halfRange])
      .range(EEGViewer.getLineRange(i, this.channels.length, this.height));
    return this.yScaleLines;
  }

  zoomIn() {
    this.zoom *= ZOOM_SCALAR;
    this.redraw();
  }

  zoomOut() {
    this.zoom /= ZOOM_SCALAR;
    this.redraw();
  }

  updateData(epoch) {
    if (this.snapshot) return;
    const {
      info: { samplingRate, startTime },
    } = epoch;
    const channelNames = epoch.info.channelNames ?? [];
    const mapped = this.mapChannels(channelNames);
    const sampleCount = epoch.data[0]?.length ?? 0;
    const endTime = startTime + sampleCount / (samplingRate / 1000);
    const previousLast = this.lastTimestamp;
    this.lastTimestamp = endTime;
    this.firstTimestamp = this.lastTimestamp - this.domain;

    for (let i = 0; i < this.channels.length; i++) {
      const sourceIndex = mapped[i];
      const source = epoch.data[sourceIndex];
      if (sourceIndex < 0 || !source) continue;
      const points = simplify(
        source.map((dataPoint, index) => ({
          x: startTime + index / (samplingRate / 1000),
          y: dataPoint,
        })),
        this.downsampling
      );
      this.data[i] = this.data[i]
        .concat(points)
        .filter(
          (sample) =>
            sample != null &&
            sample.x >= this.firstTimestamp &&
            sample.x <= this.lastTimestamp
        );
    }

    this.channelColours = this.channels.map(
      (channelName) =>
        epoch.signalQuality?.[channelName] ??
        this.channelColours[this.channels.indexOf(channelName)] ??
        '#66B0A9'
    );

    this.redraw();
    this.slideIn(this.lastTimestamp - previousLast);
  }

  /**
   * Data arrives once per plotting interval; slide the traces in over that
   * interval so the plot moves continuously instead of stepping.
   */
  slideIn(elapsed) {
    if (!this.lines || !this.annotationsGroup) return;
    const groups = [this.lines, this.annotationsGroup];
    const shift = (elapsed / this.domain) * this.width;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !(shift > 0) || elapsed > this.plottingInterval * 4) {
      groups.forEach((group) => group.interrupt().attr('transform', null));
      return;
    }
    groups.forEach((group) =>
      group
        .interrupt()
        .attr('transform', `translate(${shift},0)`)
        .transition()
        .duration(elapsed)
        .ease(d3.easeLinear)
        // Interpolate the offset ourselves: d3-interpolate would parse the
        // transform string via SVGElement.transform.baseVal.
        .attrTween(
          'transform',
          () => (progress) => `translate(${shift * (1 - progress)},0)`
        )
    );
  }

  mapChannels(sourceNames) {
    if (!sourceNames?.length) return this.channels.map((_, i) => i);
    return this.channels.map((name) => sourceNames.indexOf(name));
  }

  updateChannels(channels) {
    this.channels = channels;
    this.data = new Array(this.channels.length).fill(null).map(() => []);
    this.channelMeans = new Array(this.channels.length).fill(0);
    this.init();
  }

  updateDomain(domain) {
    this.domain = domain;
    this.firstTimestamp = this.lastTimestamp - this.domain;
    this.init();
  }

  centerChannelsForSnapshot() {
    this.channelMeans = this.data.map((channelData) =>
      channelData.length ? mean(channelData.map((d) => d.y)) : 0
    );
  }

  updateSnapshot(snapshot, amplitudeScale) {
    if (snapshot == null) {
      this.snapshot = null;
      this.amplitudeScale = amplitudeScale;
      this.resetData();
      this.init();
      return;
    }
    this.snapshot = snapshot;
    this.channels = snapshot.channels;
    this.domain = snapshot.endTime - snapshot.startTime;
    this.amplitudeScale =
      amplitudeScale != null ? amplitudeScale : this.amplitudeRange;
    this.data = snapshot.data.map((channelSamples) => {
      const startTime = snapshot.startTime;
      const count = channelSamples.length;
      const step = count ? (snapshot.endTime - startTime) / count : 0;
      return channelSamples.map((value, index) => ({
        x: startTime + index * step,
        y: value,
      }));
    });
    this.lastTimestamp = snapshot.endTime;
    this.firstTimestamp = snapshot.startTime;
    this.centerChannelsForSnapshot();
    this.init();
  }

  resetData() {
    const now = Date.now();
    this.lastTimestamp = now;
    this.firstTimestamp = now - this.domain;
    // Never seed a wall-clock point: device timestamps can lag Date.now(), and
    // a future point survives window pruning and draws a line across the plot.
    this.data = new Array(this.channels.length).fill(null).map(() => []);
    this.amplitudeRange = 200;
    this.channelMeans = new Array(this.channels.length).fill(0);
  }

  redraw() {
    this.computeGeometry();

    this.plotClipPath
      .select('rect')
      .attr('width', this.width)
      .attr('height', this.height);
    this.annotationClipPath
      .select('rect')
      .attr('width', this.width)
      .attr('height', this.height + 2 * LABEL_GUTTER);

    this.canvas
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.graph.attr(
      'transform',
      `translate(${this.margin.left},${this.margin.top})`
    );

    this.xScale
      .range([0, this.width])
      .domain([this.firstTimestamp, this.lastTimestamp]);
    this.yScaleLabels.range([
      (this.channels.length - 1) * (this.height / this.channels.length) +
        this.height / this.channels.length / 2,
      this.height / this.channels.length / 2,
    ]);

    this.axisY.call(this.yAxis);
    if (this.width !== this.axisWidth || this.height !== this.axisHeight)
      this.renderTimeAxis();

    for (let i = 0; i < this.channels.length; i++) {
      this.getYScaleForChannel(i);
      this.paths[i]
        .datum(this.data[i])
        .attr('d', this.line)
        .attr('stroke', this.channelColours[i])
        .attr('transform', null);
    }

    this.renderAnnotations();
  }

  resize() {
    if (this.graph) this.init();
  }

  updateAnnotations(annotations) {
    this.annotations = annotations ?? [];
    this.renderAnnotations();
  }

  renderAnnotations() {
    if (!this.annotationGroup || !this.labelsGroup) return;

    const bands = this.annotations
      .filter(
        (annotation) =>
          (annotation.endTime == null ||
            annotation.endTime >= this.firstTimestamp) &&
          annotation.startTime <= this.lastTimestamp
      )
      .map((annotation) => {
        const startX = this.xScale(annotation.startTime);
        const endX =
          annotation.endTime != null
            ? this.xScale(annotation.endTime)
            : this.width;
        return {
          ...annotation,
          x: Math.max(0, Math.min(this.width, startX)),
          width: Math.max(0, Math.min(this.width, endX) - Math.max(0, startX)),
        };
      });

    // A handful of annotations redrawn at 4 Hz: cheaper to re-append them than
    // to maintain a keyed join, and the slide transform lives on the parent.
    this.annotationGroup.selectAll('*').remove();
    this.labelsGroup.selectAll('*').remove();

    for (const band of bands) {
      const style = TONE_STYLES[band.tone];
      const solid = band.tone === 'eyes-closed';
      const group = this.annotationGroup
        .append('g')
        .attr('class', `annotation-band annotation-band--${band.tone}`);
      group
        .append('rect')
        .attr('class', 'annotation-band')
        .attr('y', 0)
        .attr('height', this.height)
        .attr('fill', style.fill)
        .attr('x', band.x)
        .attr('width', band.width);
      for (const [side, x, visible] of [
        ['left', band.x, true],
        ['right', band.x + band.width, !(solid && band.endTime == null)],
      ]) {
        group
          .append('line')
          .attr('class', `annotation-band-edge annotation-band-edge--${side}`)
          .attr('y1', 0)
          .attr('y2', this.height)
          .attr('stroke', style.stroke)
          .attr('stroke-width', solid ? 2 : 1)
          .attr('stroke-dasharray', solid ? null : '4 3')
          .attr('visibility', visible ? 'visible' : 'hidden')
          .attr('x1', x)
          .attr('x2', x);
      }
      if (band.width <= 40) continue;
      this.addLabel('start', band.label, band.x + 6, -6, style);
      if (band.endTime != null)
        this.addLabel(
          'end',
          band.endLabel ?? '',
          band.x + band.width + 6,
          this.height + 6,
          style
        );
    }
  }

  /**
   * Pill label clamped inside the plot. A start label ends at `x` (it points at
   * the band's left edge); an end label begins there.
   */
  addLabel(kind, text, x, y, style) {
    const group = this.labelsGroup
      .append('g')
      .attr('class', `annotation-label annotation-${kind}-label`);
    const label = group
      .append('text')
      .attr('class', 'annotation-label-text')
      .attr('dy', '0.35em')
      .text(text);
    const width = pillWidth(label);
    const left = Math.max(
      0,
      Math.min(this.width - width, kind === 'start' ? x - width : x)
    );
    group.attr('transform', `translate(${left},${y})`);
    group
      .insert('rect', 'text')
      .attr('class', 'annotation-label-bg')
      .attr('rx', LABEL_RADIUS)
      .attr('height', LABEL_HEIGHT)
      .attr('width', width)
      .attr('fill', style.stroke)
      .attr('x', 0);
    label
      .attr('x', width / 2)
      .attr('y', 11)
      .attr('text-anchor', 'middle')
      .attr('fill', style.text);
  }

  static getLineRange(index, nbChannels, height) {
    return [(index + 1) * (height / nbChannels), index * (height / nbChannels)];
  }
}
