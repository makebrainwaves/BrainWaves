// @flow
import React, { Component } from "react";
import { Segment, Button } from "semantic-ui-react";
import { Subscription } from "rxjs";
import { epoch, bandpassFilter, addInfo } from "eeg-pipes";
import { isNil } from "lodash";
import {
  MUSE_CHANNELS,
  EMOTIV_CHANNELS,
  DEVICES,
  ZOOM_SCALAR,
  VIEWER_DEFAULTS,
  SIGNAL_QUALITY
} from "../../constants/constants";

const Mousetrap = require("mousetrap");

interface Props {
  rawObservable: any;
  deviceType: DEVICES;
  samplingRate: number;
  plottingInterval: number;
}

interface State {
  channels: Array<string>;
  domain: number;
  zoom: number;
  autoScale: boolean;
}

class ViewerComponent extends Component<Props, State> {
  props: Props;
  state: State;
  graphView: ?HTMLElement;
  viewerSubscription: Subscription;

  constructor(props: Object) {
    super(props);
    this.state = {
      ...VIEWER_DEFAULTS,
      channels:
        props.deviceType === DEVICES.EMOTIV ? EMOTIV_CHANNELS : MUSE_CHANNELS
    };
    this.graphView = null;
    this.viewerSubscription = null;
  }

  componentDidMount() {
    this.graphView = document.querySelector("webview");
    this.graphView.addEventListener("dom-ready", () => {
      this.graphView.openDevTools();
      this.graphView.send("initGraph", {
        plottingInterval: this.props.plottingInterval,
        samplingRate: this.props.samplingRate,
        channels: this.state.channels,
        domain: this.state.domain,
        zoom: this.state.zoom,
        channelColours: this.state.channels.map(() => "#66B0A9")
      });
      this.setKeyListeners();
      this.subscribeToObservable(this.props.rawObservable);
    });
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.props.rawObservable !== prevProps.rawObservable) {
      this.subscribeToObservable(this.props.rawObservable);
    }

    if (this.state.channels !== prevState.channels) {
      this.graphView.send("updateChannels", this.state.channels);
    }
    if (this.state.domain !== prevState.domain) {
      this.graphView.send("updateDomain", this.state.domain);
    }
    if (this.state.channels !== prevState.channels) {
      this.graphView.send("updateChannels", this.state.channels);
    }
    if (this.state.autoScale !== prevState.autoScale) {
      this.graphView.send("autoScale");
    }
  }

  setKeyListeners() {
    Mousetrap.bind("up", () => this.graphView.send("zoomIn"));
    Mousetrap.bind("down", () => this.graphView.send("zoomOut"));
  }

  subscribeToObservable(observable: any) {
    if (!isNil(this.viewerSubscription)) {
      this.viewerSubscription.unsubscribe();
    }

    // Convert time interval in ms to # of EEG samples
    const intervalSamples =
      (this.props.plottingInterval * this.props.samplingRate) / 1000;

    this.viewerSubscription = observable
      .pipe(
        addInfo({ samplingRate: this.props.samplingRate }),
        epoch({
          duration: intervalSamples,
          interval: intervalSamples
        }),
        bandpassFilter({
          nbChannels: this.state.channels.length,
          lowCutoff: 1,
          highCutoff: 50
        })
      )
      .subscribe(
        chunk => {
          this.graphView.send("newData", chunk);
        },
        error => new Error("Error in viewer subscription: ", error)
      );
  }

  render() {
    return (
      <Segment>
        <webview
          id="eegView"
          src={`file://${__dirname}/viewer.html`}
          autosize="true"
          nodeintegration="true"
          plugins="true"
        />
        <Button
          onClick={() => this.setState({ autoScale: !this.state.autoScale })}
        >
          Autoscale
        </Button>
      </Segment>
    );
  }
}

export default ViewerComponent;
