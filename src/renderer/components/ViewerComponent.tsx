import React, { Component } from 'react';
import { Subscription, Observable } from 'rxjs';
import { isNil } from 'lodash';
import {
  MUSE_CHANNELS,
  VIEWER_DEFAULTS,
} from '../constants/constants';

type WebviewTag = HTMLElement & {
  send: (channel: string, ...args: unknown[]) => void;
  addEventListener: (event: string, handler: () => void) => void;
};
import { PipesEpoch, SignalQualityData } from '../constants/interfaces';

import Mousetrap from 'mousetrap';

interface Props {
  signalQualityObservable: Observable<SignalQualityData> | null | undefined;
  plottingInterval: number;
  // Channel labels of the connected device. Drives the viewer's traces and must
  // match the keys of the signal-quality chunks. Defaults to MUSE_CHANNELS so a
  // Muse renders correctly even before connectedDevice metadata is populated.
  channels?: Array<string>;
}

interface State {
  channels: Array<string>;
  domain: number;
  autoScale: boolean;
  viewerUrl: string;
}

class ViewerComponent extends Component<Props, State> {
  graphView: WebviewTag | null;

  signalQualitySubscription: Subscription | null;

  constructor(props: Props) {
    super(props);
    this.state = {
      ...VIEWER_DEFAULTS,
      channels: props.channels ?? MUSE_CHANNELS,
      viewerUrl: '',
    };
    this.graphView = null;
    this.signalQualitySubscription = null;
  }

  async componentDidMount() {
    const viewerUrl = await window.electronAPI.getViewerUrl();
    // setState schedules a re-render — the <webview> element doesn't exist in the
    // DOM until after that render completes. Webview setup is deferred to
    // componentDidUpdate where the DOM is guaranteed to reflect the new state.
    this.setState({ viewerUrl });
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // Webview enters the DOM when viewerUrl first becomes non-empty.
    // componentDidUpdate runs synchronously after React commits, so the listener
    // is attached before the browser can fire dom-ready.
    if (this.state.viewerUrl && !prevState.viewerUrl) {
      this.graphView = document.querySelector('webview');
      this.graphView?.addEventListener('dom-ready', () => {
        this.graphView?.send('initGraph', {
          plottingInterval: this.props.plottingInterval,
          channels: this.state.channels,
          domain: this.state.domain,
          channelColours: this.state.channels.map(() => '#66B0A9'),
        });
        this.setKeyListeners();
        const { signalQualityObservable } = this.props;
        if (signalQualityObservable != null) {
          this.subscribeToObservable(signalQualityObservable);
        }
      });
    }

    // Adopt the connected device's channels when they arrive/change. The block
    // below forwards the new set to the guest via 'updateChannels'.
    if (this.props.channels && this.props.channels !== prevProps.channels) {
      this.setState({ channels: this.props.channels });
    }

    const { signalQualityObservable } = this.props;
    if (
      signalQualityObservable !== prevProps.signalQualityObservable &&
      signalQualityObservable != null
    ) {
      this.subscribeToObservable(signalQualityObservable);
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
    if (this.state.autoScale !== prevState.autoScale) {
      this.graphView.send('autoScale');
    }
  }

  componentWillUnmount() {
    this.signalQualitySubscription?.unsubscribe();
    Mousetrap.unbind('up');
    Mousetrap.unbind('down');
  }

  setKeyListeners() {
    Mousetrap.bind('up', () => this.graphView?.send('zoomIn'));
    Mousetrap.bind('down', () => this.graphView?.send('zoomOut'));
  }

  subscribeToObservable(observable: Observable<SignalQualityData>) {
    this.signalQualitySubscription?.unsubscribe();
    this.signalQualitySubscription = observable.subscribe({
      next: (chunk) => {
        this.graphView?.send('newData', chunk);
      },
      // A thrown error here terminates the stream, so all EEG / signal-quality
      // data silently stops reaching the viewer. The previous handler built an
      // Error object and discarded it, hiding pipeline failures entirely — log
      // it so the failure is diagnosable.
      error: (error) =>
        console.error('[viewer] signal quality observable error:', error),
    });
  }

  render() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trueAsString = 'true' as any; // webview attribute requires string 'true' not boolean
    if (!this.state.viewerUrl) {
      return null;
    }
    return (
      <webview
        id="eegView"
        src={this.state.viewerUrl}
        autosize={trueAsString}
        plugins={trueAsString}
      />
    );
  }
}

export default ViewerComponent;
