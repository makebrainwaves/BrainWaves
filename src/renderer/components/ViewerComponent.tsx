import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Observable } from 'rxjs';
import type { WebviewTag } from 'electron';
import { MUSE_CHANNELS, VIEWER_DEFAULTS } from '../constants/constants';
import { SignalQualityData } from '../constants/interfaces';
import type {
  EEGSnapshot,
  PlotAnnotation,
  PlotTimeWindow,
} from '../../shared/eegVizTypes';
import type {
  ViewerGraphParameters,
  ViewerMessages,
  ViewerNavigateMessage,
  ViewerViewport,
} from '../../shared/viewerTypes';

interface Props {
  signalQualityObservable: Observable<SignalQualityData> | null | undefined;
  plottingInterval: number;
  channels?: string[];
  height?: number;
  windowDuration?: number;
  annotations?: PlotAnnotation[];
  snapshot?: EEGSnapshot | null;
  /** Symmetric microvolt half-range; snapshots are centered on each channel's mean. */
  amplitudeScale?: number;
  onTimeWindowChange?: (window: PlotTimeWindow) => void;
  overlay?: (window: PlotTimeWindow) => ReactNode;
  /** Forward Left/Right/Escape from a focused webview guest to surrounding lesson UI. */
  onNavigate?: (action: 'left' | 'right' | 'escape') => void;
}

function graphParameters(props: Props): ViewerGraphParameters {
  const channels = props.channels ?? props.snapshot?.channels ?? MUSE_CHANNELS;
  return {
    channels,
    plottingInterval: props.plottingInterval,
    domain: props.windowDuration ?? VIEWER_DEFAULTS.domain,
    channelColours: channels.map(() => '#66B0A9'),
    annotations: props.annotations ?? [],
    snapshot: props.snapshot ?? null,
    amplitudeScale: props.amplitudeScale,
  };
}

/** Hosts one independently managed D3 guest; frozen views never subscribe to live data. */
export default function ViewerComponent(props: Props) {
  const [viewerUrl, setViewerUrl] = useState('');
  const [ready, setReady] = useState(false);
  const [viewport, setViewport] = useState<ViewerViewport | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const graphViewRef = useRef<WebviewTag | null>(null);
  const readyRef = useRef(false);
  const propsRef = useRef(props);
  propsRef.current = props;
  const channels = props.channels ?? props.snapshot?.channels ?? MUSE_CHANNELS;
  const frozen = props.snapshot != null;

  function send<K extends keyof ViewerMessages>(
    channel: K,
    message: ViewerMessages[K]
  ) {
    if (readyRef.current) graphViewRef.current?.send(channel, message);
  }

  useEffect(() => {
    let cancelled = false;
    window.electronAPI.getViewerUrl().then((url) => {
      if (!cancelled) setViewerUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const element = graphViewRef.current;
    if (!viewerUrl || !element) return;
    const onDomReady = () => {
      element.send('initGraph', graphParameters(propsRef.current));
      readyRef.current = true;
      setReady(true);
    };
    const onLoading = () => {
      readyRef.current = false;
      setReady(false);
      setViewport(null);
    };
    const onMessage = (event: Electron.IpcMessageEvent) => {
      if (event.channel === 'viewer:navigate') {
        const message = event.args[0] as ViewerNavigateMessage;
        propsRef.current.onNavigate?.(message.type);
        return;
      }
      if (event.channel !== 'viewer:viewport') return;
      const next = event.args[0] as ViewerViewport;
      setViewport(next);
      propsRef.current.onTimeWindowChange?.(next.timeWindow);
    };
    element.addEventListener('dom-ready', onDomReady);
    element.addEventListener('did-start-loading', onLoading);
    element.addEventListener('ipc-message', onMessage);
    return () => {
      readyRef.current = false;
      element.removeEventListener('dom-ready', onDomReady);
      element.removeEventListener('did-start-loading', onLoading);
      element.removeEventListener('ipc-message', onMessage);
    };
  }, [viewerUrl]);

  useEffect(() => {
    send('updateChannels', channels);
  }, [ready, channels]);

  useEffect(() => {
    send('updateDomain', props.windowDuration ?? VIEWER_DEFAULTS.domain);
  }, [ready, props.windowDuration]);

  useEffect(() => {
    send('updateAnnotations', props.annotations ?? []);
  }, [ready, props.annotations]);

  useEffect(() => {
    send('updateSnapshot', {
      snapshot: props.snapshot ?? null,
      amplitudeScale: propsRef.current.amplitudeScale,
    });
  }, [ready, props.snapshot]);

  useEffect(() => {
    send('updateAmplitudeScale', props.amplitudeScale);
  }, [ready, props.amplitudeScale]);

  useEffect(() => {
    if (!ready || frozen || !props.signalQualityObservable) return;
    const subscription = props.signalQualityObservable.subscribe({
      next: (chunk) => {
        if (!propsRef.current.snapshot) send('newData', chunk);
      },
      error: (error) =>
        console.error('[viewer] signal quality observable error:', error),
    });
    return () => subscription.unsubscribe();
  }, [ready, frozen, props.signalQualityObservable]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (propsRef.current.snapshot || event.defaultPrevented) return;
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      const { target } = event;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest('input, select, textarea, button'))
      )
        return;
      const wrapper = wrapperRef.current;
      const focused = wrapper?.contains(document.activeElement);
      const onlyLiveViewer =
        document.querySelectorAll('[data-eeg-viewer="live"]').length === 1;
      if (!focused && !onlyLiveViewer) return;
      send(event.key === 'ArrowUp' ? 'zoomIn' : 'zoomOut', undefined);
      event.preventDefault();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div
      ref={wrapperRef}
      data-eeg-viewer={frozen ? 'frozen' : 'live'}
      className="relative w-full min-w-0 overflow-hidden"
      style={{ height: props.height ?? '70vh' }}
      tabIndex={0}
      aria-label={frozen ? 'Frozen EEG trace' : 'Live EEG trace'}
    >
      {viewerUrl && (
        <webview
          ref={(element) => {
            graphViewRef.current = element as unknown as WebviewTag | null;
          }}
          src={viewerUrl}
          style={{ display: 'flex', width: '100%', height: '100%' }}
        />
      )}
      {viewport && props.overlay && (
        <div
          className="pointer-events-none absolute overflow-hidden"
          style={viewport.plotBounds}
        >
          {props.overlay(viewport.timeWindow)}
        </div>
      )}
    </div>
  );
}
