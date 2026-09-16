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

export default class EEGViewer {
  constructor(svg, parameters, reportViewport) {
    this.channels = parameters.channels;
    this.plottingInterval = parameters.plottingInterval;
    this.domain = parameters.domain;
    this.channelColours = parameters.channelColours;
    this.annotations = parameters.annotations ?? [];
    this.snapshot = parameters.snapshot ?? null;
    this.amplitudeScale = parameters.amplitudeScale;
    this.reportViewport = reportViewport;
    this.downsampling = 2;
    this.lineWidth = 1.75;
    this.zoom = 1;
    this.svgScale = 1;
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
      this.resizeObserver = new ResizeObserver(() => {
        if (this.graph) this.init();
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
    this.svgScale = 1;
    this.width = Math.max(0, width - (this.margin.left + this.margin.right));
    this.height = Math.max(0, height - (this.margin.top + this.margin.bottom));
    this.plotBounds = {
      left: this.margin.left,
      top: this.margin.top,
      width: this.width,
      height: this.height,
    };
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
    this.reportTimeWindow();
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
      .attr('y', 0)
      .attr('width', this.width)
      .attr('height', this.height);
  }

  uniqueId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  addScales() {
    this.xScale = d3
      .scaleTime()
      .domain([this.firstTimestamp, this.lastTimestamp])
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

    this.axisX = this.graph
      .append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${this.height})`)
      .call(this.buildTimeAxis());
  }

  buildTimeAxis() {
    return d3
      .axisBottom()
      .scale(this.xScale)
      .ticks(Math.max(2, Math.floor(this.width / 80)))
      .tickFormat((timestamp) => {
        const seconds = (Number(timestamp) - this.lastTimestamp) / 1000;
        return `${Math.round(seconds)}s`;
      });
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

  autoScale() {
    if (this.snapshot) return;
    const ranges = this.data.map((channelData) => {
      const ys = channelData.map((d) => d.y);
      return { min: Math.min(...ys), max: Math.max(...ys) };
    });
    const allMax = Math.max(
      ...ranges.map((r) => Math.max(Math.abs(r.max), Math.abs(r.min)))
    );
    this.amplitudeRange = Number.isFinite(allMax) ? allMax * 2 || 200 : 200;
    this.zoom = 1;
    this.redraw();
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
        .filter((sample) => sample != null && sample.x >= this.firstTimestamp);
    }

    this.channelColours = this.channels.map(
      (channelName) =>
        epoch.signalQuality?.[channelName] ??
        this.channelColours[this.channels.indexOf(channelName)] ??
        '#66B0A9'
    );

    this.redraw();
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

  updateAmplitudeScale(scale) {
    this.amplitudeScale = scale;
    this.redraw();
  }

  resetData() {
    const now = Date.now();
    this.lastTimestamp = now;
    this.firstTimestamp = now - this.domain;
    this.data = new Array(this.channels.length)
      .fill(null)
      .map(() => [{ x: this.lastTimestamp, y: 0 }]);
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
      .attr('height', this.height);

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
    this.axisX
      .attr('transform', `translate(0,${this.height})`)
      .call(this.buildTimeAxis());

    for (let i = 0; i < this.channels.length; i++) {
      this.getYScaleForChannel(i);
      this.paths[i]
        .datum(this.data[i])
        .attr('d', this.line)
        .attr('stroke', this.channelColours[i])
        .attr('transform', null);
    }

    this.renderAnnotations();
    this.reportTimeWindow();
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
      .filter((annotation) => {
        if (
          annotation.endTime != null &&
          annotation.endTime < this.firstTimestamp
        )
          return false;
        if (annotation.startTime > this.lastTimestamp) return false;
        return true;
      })
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
          rightEdge: endX,
        };
      });

    const join = this.annotationGroup
      .selectAll('g.annotation-band')
      .data(bands, (d) => d.id);
    join.exit().remove();
    const enter = join
      .enter()
      .append('g')
      .attr('class', (d) => `annotation-band annotation-band--${d.tone}`);

    enter
      .append('rect')
      .attr('class', 'annotation-band')
      .attr('y', 0)
      .attr('height', this.height);
    enter
      .append('line')
      .attr('class', 'annotation-band-edge annotation-band-edge--left')
      .attr('y1', 0)
      .attr('y2', this.height);
    enter
      .append('line')
      .attr('class', 'annotation-band-edge annotation-band-edge--right')
      .attr('y1', 0)
      .attr('y2', this.height);

    enter
      .merge(join)
      .select('rect.annotation-band')
      .attr('fill', (d) => TONE_STYLES[d.tone].fill)
      .attr('x', (d) => d.x)
      .attr('width', (d) => d.width);

    enter
      .merge(join)
      .select('line.annotation-band-edge--left')
      .attr('stroke', (d) => TONE_STYLES[d.tone].stroke)
      .attr('stroke-width', (d) => (d.tone === 'eyes-closed' ? 2 : 1))
      .attr('stroke-dasharray', (d) =>
        d.tone === 'eyes-closed' ? null : '4 3'
      )
      .attr('x1', (d) => d.x)
      .attr('x2', (d) => d.x);

    enter
      .merge(join)
      .select('line.annotation-band-edge--right')
      .attr('stroke', (d) => TONE_STYLES[d.tone].stroke)
      .attr('stroke-width', (d) => (d.tone === 'eyes-closed' ? 2 : 1))
      .attr('stroke-dasharray', (d) =>
        d.tone === 'eyes-closed' ? null : '4 3'
      )
      .attr('visibility', (d) =>
        d.tone === 'eyes-closed' && d.endTime == null ? 'hidden' : 'visible'
      )
      .attr('x1', (d) => d.x + d.width)
      .attr('x2', (d) => d.x + d.width);

    const openBands = bands.filter((d) => d.endTime == null);
    const activeStyles = openBands.map((d) => TONE_STYLES[d.tone]);
    this.annotationGroup
      .selectAll('rect.annotation-band-pulse')
      .data(activeStyles)
      .join(
        (enter) =>
          enter
            .append('rect')
            .attr('class', 'annotation-band-pulse')
            .attr('y', 0)
            .attr('height', this.height),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr('fill', (_d, i) => activeStyles[i].fill)
      .attr('x', (_d, i) => openBands[i].x)
      .attr('width', (_d, i) => openBands[i].width);

    this.renderLabels(bands);
  }

  renderLabels(bands) {
    const plotWidth = this.width;
    const plotHeight = this.height;
    const startLabels = bands.filter((d) => d.width > 40);
    const endLabels = bands.filter((d) => d.endTime != null && d.width > 40);

    const startJoin = this.labelsGroup
      .selectAll('g.annotation-start-label')
      .data(startLabels, (d) => `${d.id}-start`);
    startJoin.exit().remove();
    const startEnter = startJoin
      .enter()
      .append('g')
      .attr('class', 'annotation-label annotation-start-label')
      .attr('data-label-x', 0)
      .attr('data-label-width', 0);
    startEnter
      .append('rect')
      .attr('class', 'annotation-label-bg')
      .attr('rx', 999)
      .attr('height', 22);
    startEnter
      .append('text')
      .attr('class', 'annotation-label-text')
      .attr('dy', '0.35em');

    startEnter.merge(startJoin).each(function (d) {
      const group = d3.select(this);
      const style = TONE_STYLES[d.tone];
      const text = group.select('text').text(d.label);
      const bbox = text.node()?.getBBox?.() ?? { width: 0, height: 0 };
      const paddingX = 10;
      const labelWidth = bbox.width + paddingX * 2;
      const desiredX = d.x + 6 - labelWidth;
      const x = Math.max(0, Math.min(plotWidth - labelWidth, desiredX));
      group.attr('transform', `translate(${x},-6)`);
      group
        .select('rect')
        .attr('width', labelWidth)
        .attr('fill', style.stroke)
        .attr('x', 0);
      group
        .select('text')
        .attr('x', labelWidth / 2)
        .attr('y', 11)
        .attr('text-anchor', 'middle')
        .attr('fill', style.text);
      group.attr('data-label-x', x).attr('data-label-width', labelWidth);
    });

    const endJoin = this.labelsGroup
      .selectAll('g.annotation-end-label')
      .data(endLabels, (d) => `${d.id}-end`);
    endJoin.exit().remove();
    const endEnter = endJoin
      .enter()
      .append('g')
      .attr('class', 'annotation-label annotation-end-label');
    endEnter
      .append('rect')
      .attr('class', 'annotation-label-bg')
      .attr('rx', 999)
      .attr('height', 22);
    endEnter
      .append('text')
      .attr('class', 'annotation-label-text')
      .attr('dy', '0.35em');

    endEnter.merge(endJoin).each(function (d) {
      const group = d3.select(this);
      const style = TONE_STYLES[d.tone];
      const text = group.select('text').text(d.endLabel ?? '');
      const bbox = text.node()?.getBBox?.() ?? { width: 0 };
      const paddingX = 10;
      const labelWidth = bbox.width + paddingX * 2;
      const desiredX = d.x + d.width + 6;
      const x = Math.max(0, Math.min(plotWidth - labelWidth, desiredX));
      group.attr('transform', `translate(${x},${plotHeight + 6})`);
      group
        .select('rect')
        .attr('width', labelWidth)
        .attr('fill', style.stroke)
        .attr('x', 0);
      group
        .select('text')
        .attr('x', labelWidth / 2)
        .attr('y', 11)
        .attr('text-anchor', 'middle')
        .attr('fill', style.text);
    });
  }

  reportTimeWindow() {
    if (!this.reportViewport) return;
    this.reportViewport({
      timeWindow: {
        startTime: this.firstTimestamp,
        endTime: this.lastTimestamp,
      },
      plotBounds: this.plotBounds,
    });
  }

  static getLineRange(index, nbChannels, height) {
    return [(index + 1) * (height / nbChannels), index * (height / nbChannels)];
  }
}
