import React, { useEffect, useRef, useState } from 'react';
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

export default function ViewerComponent(props: Props) {
  const [channels, setChannels] = useState(() => props.channels ?? MUSE_CHANNELS);
  const domain = VIEWER_DEFAULTS.domain;
  const [viewerUrl, setViewerUrl] = useState('');

  const graphViewRef = useRef<WebviewTag | null>(null);
  const subRef = useRef<Subscription | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const channelsRef = useRef(channels);
  channelsRef.current = channels;

  function subscribeToObservable(observable: Observable<SignalQualityData>) {
    subRef.current?.unsubscribe();
    subRef.current = observable.subscribe({
      next: (chunk) => {
        graphViewRef.current?.send('newData', chunk);
      },
      error: (error) =>
        console.error('[viewer] signal quality observable error:', error),
    });
  }

  // Mount: get the viewer URL
  useEffect(() => {
    let cancelled = false;
    window.electronAPI.getViewerUrl().then((url) => {
      if (!cancelled) setViewerUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Attach webview once viewerUrl becomes non-empty
  useEffect(() => {
    if (!viewerUrl) return;
    const el = document.querySelector('webview') as WebviewTag | null;
    graphViewRef.current = el;
    const onDomReady = () => {
      const p = propsRef.current;
      el?.send('initGraph', {
        plottingInterval: p.plottingInterval,
        channels: channelsRef.current,
        domain,
        channelColours: channelsRef.current.map(() => '#66B0A9'),
      });
      Mousetrap.bind('up', () => graphViewRef.current?.send('zoomIn'));
      Mousetrap.bind('down', () => graphViewRef.current?.send('zoomOut'));
      if (p.signalQualityObservable != null) {
        subscribeToObservable(p.signalQualityObservable);
      }
    };
    el?.addEventListener('dom-ready', onDomReady);
    // No StrictMode in the tree; class never removed the listener.
  }, [viewerUrl, domain]);

  // Adopt connected device's channels
  useEffect(() => {
    if (props.channels) setChannels(props.channels);
  }, [props.channels]);

  // Resubscribe when the observable identity changes
  useEffect(() => {
    if (props.signalQualityObservable == null) return;
    subscribeToObservable(props.signalQualityObservable);
  }, [props.signalQualityObservable]);

  // IPC: forward state changes to the webview guest
  useEffect(() => {
    if (!graphViewRef.current) return;
    graphViewRef.current.send('updateChannels', channels);
  }, [channels]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      subRef.current?.unsubscribe();
      Mousetrap.unbind('up');
      Mousetrap.unbind('down');
    };
  }, []);

  if (!viewerUrl) return null;
  const trueAsString = 'true' as any;
  return (
    <webview
      id="eegView"
      src={viewerUrl}
      autosize={trueAsString}
      plugins={trueAsString}
    />
  );
}