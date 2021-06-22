import React, { Component } from 'react';
import { Subscription, Observable } from 'rxjs';
import { isNil } from 'lodash';
import { WebviewTag } from 'electron';
import {
  MUSE_CHANNELS,
  EMOTIV_CHANNELS,
  DEVICES,
  VIEWER_DEFAULTS,
} from '../constants/constants';
import { PipesEpoch, SignalQualityData } from '../constants/interfaces';

const Mousetrap = require('mousetrap');

interface Props {
  signalQualityObservable: Observable<SignalQualityData>;
  deviceType: DEVICES;
  plottingInterval: number;
}

interface State {
  channels: Array<string>;
  domain: number;
  autoScale: boolean;
}

class ViewerComponent extends Component<Props, State> {
  graphView: WebviewTag | null;

  signalQualitySubscription: Subscription | null;

  constructor(props: Props) {
    super(props);
    this.state = {
      ...VIEWER_DEFAULTS,
      channels:
        props.deviceType === DEVICES.EMOTIV ? EMOTIV_CHANNELS : MUSE_CHANNELS,
    };
    this.graphView = null;
    this.signalQualitySubscription = null;
  }

  componentDidMount() {
    this.graphView = document.querySelector('webview');
    this.graphView?.addEventListener('dom-ready', () => {
      this.graphView?.send('initGraph', {
        plottingInterval: this.props.plottingInterval,
        channels: this.state.channels,
        domain: this.state.domain,
        channelColours: this.state.channels.map(() => '#66B0A9'),
      });
      this.setKeyListeners();
      if (!isNil(this.props.signalQualityObservable)) {
        this.subscribeToObservable(this.props.signalQualityObservable);
      }
    });
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (
      this.props.signalQualityObservable !== prevProps.signalQualityObservable
    ) {
      this.subscribeToObservable(this.props.signalQualityObservable);
    }
    if (this.props.deviceType !== prevProps.deviceType) {
      this.setState({
        channels:
          this.props.deviceType === DEVICES.MUSE
            ? MUSE_CHANNELS
            : EMOTIV_CHANNELS,
      });
    }
    if (!this.graphView) {
      return;
    }
    if (this.state.channels !== prevState.channels) {
      this.graphView.send('updateChannels', this.state.channels);
    }
    if (this.state.domain !== prevState.domain) {
      this.graphView.send('updateDomain', this.state.domain);
    }
    if (this.state.channels !== prevState.channels) {
      this.graphView.send('updateChannels', this.state.channels);
    }
    if (this.state.autoScale !== prevState.autoScale) {
      this.graphView.send('autoScale');
    }
  }

  componentWillUnmount() {
    if (!isNil(this.signalQualitySubscription)) {
      this.signalQualitySubscription.unsubscribe();
    }
    Mousetrap.unbind('up');
    Mousetrap.unbind('down');
  }

  setKeyListeners() {
    Mousetrap.bind('up', () => this.graphView?.send('zoomIn'));
    Mousetrap.bind('down', () => this.graphView?.send('zoomOut'));
  }

  subscribeToObservable(observable: any) {
    if (!isNil(this.signalQualitySubscription)) {
      this.signalQualitySubscription.unsubscribe();
    }
    this.signalQualitySubscription = observable.subscribe(
      (chunk) => {
        this.graphView?.send('newData', chunk);
      },
      (error) => new Error(`Error in epochSubscription ${error}`)
    );
  }

  render() {
    const trueAsString = 'true' as any;
    return (
      <webview
        id="eegView"
        src={`file://${app.getAppPath()}/viewer.html`}
        autosize={trueAsString}
        nodeintegration={trueAsString}
        plugins={trueAsString}
      />
    );
  }
}

export default ViewerComponent;
