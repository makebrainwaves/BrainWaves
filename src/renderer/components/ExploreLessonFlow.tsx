import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Observable } from 'rxjs';
import type { EEGSnapshot, PlotAnnotation } from '../../shared/eegVizTypes';
import { LessonId } from '../constants/exploreLessons';
import { PLOTTING_INTERVAL } from '../constants/constants';
import { SignalQualityData } from '../constants/interfaces';
import {
  ExploreSession,
  FRONTAL,
  FrozenComparison,
  POSTERIOR,
} from '../utils/eeg/exploreSignal';
import { LessonAudio } from '../utils/eeg/lessonAudio';
import { channelColors } from '../utils/eeg/traceColors';
import ViewerComponent from './ViewerComponent';
import {
  BlinkLessonView,
  CleanSignalView,
  EyesClosedPhase,
  EyesClosedView,
} from './Explore/ExploreScreens';
import { REVIEW_SEGMENT_MS } from './Explore/fixtures';

interface Props {
  lesson: LessonId;
  stream?: Observable<SignalQualityData>;
  /** The device's full channel list. */
  channels: string[];
  /** Plot caption: `device name · sampling rate Hz`. */
  legend: string;
  session: ExploreSession;
  sample: SignalQualityData | null;
  onExit: () => void;
}

interface CueWindow {
  startTime: number;
  endTime: number | null;
}

/** Blink steps 1–3 say no blink was seen after this long without one. */
const NO_BLINK_MS = 8000;
/** Step 4 asks for five still seconds before freezing the comparison. */
const STILL_MS = 5000;
/** A stream older than this cannot time the eyes-closed interval. */
const STALE_MS = 1500;

/**
 * Runs one Explore lesson in the design's views, all state local: the
 * cleaner-signal tips 1–3, the noise lesson's blink steps 0–4, and the
 * eyes-closed activity (intro → 3-2-1 → the chime-bounded interval → review).
 * One live viewer stays mounted across a lesson's steps; frozen copies come
 * from `session`. Arrow keys and Escape, from the page or the focused viewer,
 * go Back / Next / Exit.
 */
export default function ExploreLessonFlow({
  lesson,
  stream,
  channels,
  legend,
  session,
  sample,
  onExit,
}: Props) {
  const noise = lesson === 'noise-sources';
  const [step, setStep] = useState(lesson === 'clean-signal' ? 1 : 0);
  const [waited, setWaited] = useState(false);
  const [comparison, setComparison] = useState<FrozenComparison | null>(null);
  const [range, setRange] = useState(150);
  const [phase, setPhase] = useState<EyesClosedPhase>('intro');
  const [countdown, setCountdown] = useState<3 | 2 | 1>(3);
  const [cue, setCue] = useState<CueWindow | null>(null);
  const [review, setReview] = useState<{
    segments: { open: EEGSnapshot; closed: EEGSnapshot } | null;
    ratio: number | null;
  } | null>(null);
  const [cueError, setCueError] = useState('');
  const audio = useRef<LessonAudio | null>(null);
  const cueGeneration = useRef(0);
  const stepStart = useRef<number | null>(null);
  const signalClock = useRef({ sampleTime: 0, wallTime: 0 });
  const lastSample = useRef<SignalQualityData | null>(null);
  const status = session.status();
  const { latestTime } = status;
  if (sample && sample !== lastSample.current) {
    lastSample.current = sample;
    signalClock.current = {
      sampleTime:
        sample.info.startTime +
        ((sample.data[0]?.length ?? 0) * 1000) / sample.info.samplingRate,
      wallTime: Date.now(),
    };
  }
  const running = phase === 'countdown' || phase === 'interval';

  useEffect(() => {
    audio.current = new LessonAudio();
    return () => {
      cueGeneration.current++;
      audio.current?.dispose();
    };
  }, []);

  useEffect(() => {
    stepStart.current = session.status().latestTime;
    setWaited(false);
    if (!noise || step < 1 || step > 3) return;
    const timer = window.setTimeout(() => setWaited(true), NO_BLINK_MS);
    return () => window.clearTimeout(timer);
  }, [noise, step, session]);

  useEffect(() => {
    if (
      !noise ||
      step !== 4 ||
      comparison ||
      latestTime == null ||
      stepStart.current == null ||
      latestTime < stepStart.current + STILL_MS
    )
      return;
    setComparison(session.comparison());
  }, [noise, step, comparison, latestTime, session]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    const timer = window.setTimeout(() => {
      if (countdown > 1) setCountdown((countdown - 1) as 2 | 1);
      else void startInterval();
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [phase, countdown]);

  useEffect(() => {
    if (
      cue?.endTime == null ||
      latestTime == null ||
      latestTime < cue.endTime ||
      review
    )
      return;
    const { startTime, endTime } = cue;
    const posterior = channels.filter((name) => POSTERIOR.test(name));
    const middle = (startTime + endTime) / 2;
    const open = posterior.length
      ? session.snapshot(startTime - REVIEW_SEGMENT_MS, startTime, posterior)
      : null;
    const closed = posterior.length
      ? session.snapshot(
          middle - REVIEW_SEGMENT_MS / 2,
          middle + REVIEW_SEGMENT_MS / 2,
          posterior
        )
      : null;
    setReview({
      segments: open && closed ? { open, closed } : null,
      ratio: session.alphaRatio(startTime, endTime),
    });
  }, [cue, latestTime, review, session, channels]);

  function stopCues() {
    cueGeneration.current++;
    audio.current?.cancel();
    setCountdown(3);
    setCue(null);
    setReview(null);
    setCueError('');
  }

  function sampleTimeAt(wallTime: number) {
    return (
      signalClock.current.sampleTime + wallTime - signalClock.current.wallTime
    );
  }

  /** Begin: unlock audio inside the click (autoplay needs the gesture), then count down. */
  async function begin() {
    if (
      latestTime == null ||
      Date.now() - signalClock.current.wallTime > STALE_MS
    ) {
      setCueError('Wait for a live signal before starting the interval.');
      return;
    }
    stopCues();
    const generation = cueGeneration.current;
    try {
      await audio.current?.preview();
    } catch (error) {
      if (generation === cueGeneration.current)
        setCueError(
          error instanceof Error ? error.message : 'Check your sound output.'
        );
      return;
    }
    if (generation === cueGeneration.current) setPhase('countdown');
  }

  async function startInterval() {
    const generation = cueGeneration.current;
    setPhase('interval');
    try {
      await audio.current?.start(
        (wallTime) => {
          if (generation === cueGeneration.current)
            setCue({ startTime: sampleTimeAt(wallTime), endTime: null });
        },
        (wallTime) => {
          if (generation !== cueGeneration.current) return;
          setCue(
            (current) =>
              current && { ...current, endTime: sampleTimeAt(wallTime) }
          );
          setPhase('end');
        }
      );
    } catch (error) {
      if (generation !== cueGeneration.current) return;
      setPhase('intro');
      setCueError(
        error instanceof Error
          ? error.message
          : 'Audio could not start. Check your sound output.'
      );
    }
  }

  function exit() {
    stopCues();
    onExit();
  }

  function back() {
    if (running) return;
    if (lesson === 'eyes-closed') {
      if (phase === 'intro') exit();
      else {
        stopCues();
        setPhase('intro');
      }
    } else if (step === (noise ? 0 : 1)) exit();
    else {
      setComparison(null);
      setStep(step - 1);
    }
  }

  function next() {
    if (running) return;
    if (lesson === 'eyes-closed') {
      if (phase === 'intro') void begin();
      else if (phase === 'end') setPhase('review');
      else exit();
    } else if (step === (noise ? 4 : 3)) exit();
    else setStep(step + 1);
  }

  const navigation = useRef({ back, next, exit });
  navigation.current = { back, next, exit };
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"]'))
        return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigation.current.back();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigation.current.next();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        navigation.current.exit();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  function navigateFromViewer(action: 'left' | 'right' | 'escape') {
    if (action === 'left') navigation.current.back();
    else if (action === 'right') navigation.current.next();
    else navigation.current.exit();
  }

  const shown = noise && step >= 1 && status.supported ? FRONTAL : channels;
  const colors = useMemo(
    () => channelColors(shown, channels),
    [shown, channels]
  );
  const visibleBlinks =
    noise && step >= 1 && latestTime != null
      ? status.blinkEvents.filter((event) => event.endTime >= latestTime - 5000)
      : [];
  const annotations: PlotAnnotation[] = noise
    ? visibleBlinks.map((event) => ({
        id: `blink-${event.startTime}`,
        startTime: event.startTime,
        endTime: event.endTime,
        label: 'blink · from your eyes, not your brain',
        tone: 'blink',
      }))
    : lesson === 'eyes-closed' && cue
      ? [
          {
            id: 'eyes-closed',
            ...cue,
            label: 'eyes closed',
            endLabel: 'eyes open',
            tone: 'eyes-closed',
          },
        ]
      : [];
  const livePlot = (
    <ViewerComponent
      signalQualityObservable={stream}
      plottingInterval={PLOTTING_INTERVAL}
      channels={shown}
      channelColors={lesson === 'clean-signal' ? undefined : colors}
      annotations={annotations}
      amplitudeScale={noise && step === 4 ? range : undefined}
      windowDuration={lesson === 'eyes-closed' ? 20000 : undefined}
      height="100%"
      onNavigate={navigateFromViewer}
    />
  );

  if (lesson === 'clean-signal')
    return (
      <CleanSignalView
        tip={step as 1 | 2 | 3}
        livePlot={livePlot}
        legend={legend}
        sample={sample}
        channels={channels}
        onBack={back}
        onNext={next}
        onExit={exit}
      />
    );
  if (noise)
    return (
      <BlinkLessonView
        step={step as 0 | 1 | 2 | 3 | 4}
        notDetected={
          waited &&
          step >= 1 &&
          step <= 3 &&
          !status.blinkEvents.some(
            (event) =>
              stepStart.current != null && event.endTime >= stepStart.current
          )
        }
        livePlot={livePlot}
        blinkCount={visibleBlinks.length}
        legend={legend}
        deviceChannels={channels}
        comparison={
          comparison
            ? {
                calm: comparison.calm,
                blinking: comparison.blink,
                ratio: comparison.ratio,
              }
            : undefined
        }
        onRangeChange={setRange}
        onBack={back}
        onNext={next}
        onExit={exit}
      />
    );
  return (
    <EyesClosedView
      phase={phase}
      countdown={countdown}
      rhythmRatio={review?.ratio ?? null}
      showExample={phase === 'intro' || phase === 'review'}
      livePlot={livePlot}
      segments={review?.segments}
      legend={legend}
      deviceChannels={channels}
      error={cueError || undefined}
      onBack={back}
      onNext={next}
      onExit={exit}
    />
  );
}
