/* eslint prefer-template: 0 */
const d3 = require("d3");
const throttle = require("lodash/throttle");
const simplify = require("simplify-js");

const COLORS = {
  RED: "#f4424b",
  YELLOW: "#f4d041",
  GREEN: "#4cf441"
};

const THRESHOLDS = {
  BAD: 15,
  OK: 10
};

class EEGViewer {
  constructor(svg, parameters) {
    this.channels = parameters.channels;
    this.plottingInterval = parameters.plottingInterval; // NOTE: Plotting interval in Ms
    this.domain = parameters.domain + this.plottingInterval;
    this.channelColours = parameters.channelColours;
    this.downsampling = 2;
    this.lineWidth = 1.5;
    this.zoom = 1;
    this.zoomScalar = 1.5;
    this.canvas = d3.select(svg);
    this.margin = { top: 100, right: 50, bottom: 50, left: 50 };
    this.channelMaxs = new Array(this.channels.length).fill(100);
    this.channelMins = new Array(this.channels.length).fill(-100);
    this.lastTimestamp = new Date().getTime();
    this.firstTimestamp = this.lastTimestamp - this.domain;

    this.resetData();
    this.init();
    const resize = this.resize.bind(this);
    d3.select(window).on("resize.updatesvg", throttle(resize, 200));
  }

  updateData(epoch) {
    const {
      info: { samplingRate, startTime }
    } = epoch;
    this.lastTimestamp =
      startTime + epoch.data[0].length / (samplingRate / 1000);
    this.firstTimestamp = this.lastTimestamp - this.domain;

    for (let i = 0; i < this.channels.length; i++) {
      this.data[i] = this.data[i]
        .concat(
          simplify(
            epoch.data[i].map((dataPoint, index) => ({
              x: startTime + index / (samplingRate / 1000),
              y: dataPoint
            }))
          ),
          this.downsampling
        )
        .filter(sample => sample.x >= this.firstTimestamp);
    }

    this.channelColours = epoch.signalQuality.map(signalQuality => {
      if (signalQuality >= THRESHOLDS.BAD) {
        return COLORS.RED;
      }
      if (signalQuality >= THRESHOLDS.OK) {
        return COLORS.YELLOW;
      }
      return COLORS.GREEN;
    });
    this.redraw();
  }

  updateChannels(channels) {
    this.channels = channels;
    this.resetData();
    this.init();
  }

  updateDomain(domain) {
    this.domain = domain;
    this.resetData();
    this.init();
  }

  zoomIn() {
    this.zoom = this.zoom / this.zoomScalar;
    this.redraw();
  }

  zoomOut() {
    this.zoom = this.zoom * this.zoomScalar;
    this.redraw();
  }

  autoScale() {
    this.channelMaxs = this.data.map(channelData =>
      EEGViewer.findExtreme(channelData, (a, b) => a > b)
    );
    this.channelMins = this.data.map(channelData =>
      EEGViewer.findExtreme(channelData, (a, b) => a < b)
    );
    this.zoom = 1;
    this.redraw();
  }

  resetData() {
    this.data = new Array(this.channels.length).fill([
      { x: this.lastTimestamp, y: 0 }
    ]);
    this.channelMaxs = new Array(this.channels.length).fill(100);
    this.channelMins = new Array(this.channels.length).fill(-100);
  }

  init() {
    try {
      d3.selectAll("svg > *").remove();
      this.width =
        parseInt(d3.select("#graph").style("width")) -
        (this.margin.left + this.margin.right);
      this.height =
        parseInt(d3.select("#graph").style("height")) -
        (this.margin.top + this.margin.bottom);
      this.graph = this.canvas
        .attr("width", this.width)
        .attr("height", this.height)
        .append("g")
        .attr(
          "transform",
          "translate(" + this.margin.left + "," + this.margin.top + ")"
        );
      this.addScales();
      this.addAxes();
      this.addLines();
    } catch (e) {
      console.error(e);
    }
  }

  addScales() {
    this.xScale = d3
      .scaleTime()
      .domain([this.lastTimestamp, this.firstTimestamp + this.plottingInterval])
      .range([this.width, 0]);

    this.yScaleLines = d3.scaleLinear();

    this.yScaleLabels = d3
      .scaleLinear()
      .domain([this.channels.length, 0])
      .range([this.height, 0]);
  }

  addAxes() {
    this.xAxis = d3.axisBottom().scale(this.xScale);

    this.yAxis = d3
      .axisLeft()
      .scale(this.yScaleLabels)
      .tickSize(2)
      .tickFormat((d, i) => this.channels[i].replace(/\s/g, ""))
      .tickValues(d3.range(this.channels.length));

    this.axisX = this.graph
      .append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.xAxis);

    this.axisY = this.graph
      .append("g")
      .attr("class", "axis")
      .call(this.yAxis);
  }

  addLines() {
    this.graph.selectAll(".legend").remove();
    this.graph.select("#lines").remove();
    this.graph.selectAll("#clip").remove();
    this.paths = [];
    this.graph
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("height", this.height + this.height / this.channels.length)
      .attr("width", this.width)
      .attr(
        "transform",
        "translate(0," + -this.height / this.channels.length + ")"
      );
    this.lines = this.graph
      .append("g")
      .attr("id", "lines")
      .attr("clip-path", "url(#clip)");
    this.axisX.attr("clip-path", "url(#clip)");
    this.line = d3
      .line()
      .x(d => this.xScale(d.x))
      .y(d => this.yScaleLines(d.y))
      .curve(d3.curveLinear)
      .defined(d => d.y);

    for (let i = 0; i < this.channels.length; i++) {
      const channelData = this.data[i];

      this.yScaleLines
        .domain([
          this.channelMins[i] / this.zoom,
          this.channelMaxs[i] / this.zoom
        ])
        .range(EEGViewer.getLineRange(i, this.channels.length, this.height));

      this.paths[i] = this.lines
        .append("path")
        .data([channelData])
        .attr("class", "line")
        .attr("id", "line" + i + 1)
        .attr("d", this.line)
        .attr("stroke", this.channelColours[i])
        .attr("stroke-width", this.lineWidth);
    }
  }

  redraw() {
    if (this.paths != null) {
      for (let i = 0; i < this.channels.length; i++) {
        const channelData = this.data[i];
        this.yScaleLines
          .domain([
            this.channelMins[i] / this.zoom,
            this.channelMaxs[i] / this.zoom
          ])
          .range(EEGViewer.getLineRange(i, this.channels.length, this.height));

        this.paths[i]
          .interrupt()
          .transition()
          .duration(this.plottingInterval)
          .ease(d3.easeLinear)
          .attr(
            "transform",
            "translate(" +
              -(
                this.xScale(channelData[channelData.length - 1].x) - this.width
              ) +
              ", 0)"
          );

        this.paths[i]
          .data([channelData])
          .attr("d", this.line)
          .attr("stroke", this.channelColours[i])
          .attr("transform", "translate(0,0)");
      }

      this.xScale
        .domain([
          this.lastTimestamp,
          this.firstTimestamp + this.plottingInterval
        ])
        .range([this.width, 0]);

      this.axisX
        .transition()
        .duration(this.plottingInterval)
        .ease(d3.easeLinear)
        .call(this.xAxis);
    }
  }

  resize() {
    if (this.paths != null) {
      this.width =
        parseInt(d3.select("#graph").style("width")) -
        (this.margin.left + this.margin.right);
      this.height =
        parseInt(d3.select("#graph").style("height")) -
        (this.margin.top + this.margin.bottom);
      this.lines.attr("height", this.height).attr("width", this.width);
      this.xScale.range([this.width, 0]);
      this.yScaleLines.range([this.height, 0]);
      this.yScaleLabels.range([this.height, 0]);
      this.xAxis.scale(this.xScale);
      this.axisX
        .attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis);
      this.axisY.call(this.yAxis);
      this.addLines();
    }
  }

  static findExtreme(data, comparison) {
    return data
      .slice(data.slice(data.length / 2))
      .reduce(
        (acc, curr) => (comparison(curr.y, acc) ? curr.y : acc),
        data[0].y
      );
  }

  static getLineRange(index, nbChannels, height) {
    return [
      (index + 1) * (height / nbChannels) - height / (2 * nbChannels),
      index * (height / nbChannels) - height / (2 * nbChannels)
    ];
  }
}

module.exports = EEGViewer;
