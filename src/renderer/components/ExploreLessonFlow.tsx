import React, { useEffect, useRef, useState } from 'react';
import { Observable } from 'rxjs';
import { EEGSnapshot, PlotAnnotation } from '../../shared/eegVizTypes';
import { CLEAN_SIGNAL_LESSON, LessonId } from '../constants/exploreLessons';
import { PLOTTING_INTERVAL } from '../constants/constants';
import { SignalQualityData } from '../constants/interfaces';
import { ExploreSession, FrozenComparison } from '../utils/eeg/exploreSignal';
import { LessonAudio } from '../utils/eeg/lessonAudio';
import SignalQualityIndicatorComponent from './SignalQualityIndicatorComponent';
import ViewerComponent from './ViewerComponent';
import { Button } from './ui/button';
import { cn } from './ui/utils';

interface Props {
  lesson: LessonId;
  stream?: Observable<SignalQualityData>;
  channels: string[];
  samplingRate: number;
  session: ExploreSession;
  sample: SignalQualityData | null;
  onExit: () => void;
}

type CueMode = 'audio' | 'partner' | 'haptic';
interface CueWindow {
  startTime: number;
  endTime: number | null;
}

const FRONTAL_CHANNELS = ['AF7', 'AF8'];
const NOISE_TITLES = [
  'Your brain is making electricity right now',
  'Now blink — hard, a few times',
  'Same brain, same sensors, five seconds apart',
  'Close your eyes until the second chime',
];
const labelClass = 'text-[13px] font-bold tracking-[0.5px] text-ink-muted';

function FrozenStrip({
  snapshot,
  scale,
  blinking,
  ratio,
}: {
  snapshot: EEGSnapshot;
  scale: number;
  blinking?: boolean;
  ratio?: number;
}) {
  return (
    <section
      className={cn(
        'h-[180px] flex-none rounded-lg border bg-white px-[18px] py-4',
        blinking ? 'border-2 border-accent' : 'border-gray-200'
      )}
    >
      <div className="flex items-center justify-between gap-3 text-[13px] text-ink-muted">
        <span className="font-bold tracking-[0.5px]">
          {blinking
            ? 'WHILE YOU WERE BLINKING · FROZEN'
            : 'SITTING STILL · 5 SECONDS, FROZEN'}
        </span>
        <span className="max-[700px]:hidden">
          {blinking ? 'same sensors, same scale' : 'measured on AF7 · AF8'}
        </span>
      </div>
      <div className="flex h-[120px] items-center gap-3">
        <div className="min-w-0 flex-1">
          <ViewerComponent
            signalQualityObservable={null}
            plottingInterval={PLOTTING_INTERVAL}
            channels={snapshot.channels}
            snapshot={snapshot}
            amplitudeScale={scale}
            height={120}
          />
        </div>
        <div className="flex w-[118px] flex-none items-center gap-2.5">
          <div
            className={cn(
              'w-[9px] flex-none rounded-r border border-l-0',
              blinking ? 'border-accent' : 'border-signal-great'
            )}
            style={{
              height: Math.max(1, (snapshot.peakToPeak / (2 * scale)) * 96),
            }}
          />
          <div>
            <div className="text-lg">{snapshot.peakToPeak.toFixed(0)} µV</div>
            <div className="text-xs text-ink-muted">
              {blinking && ratio !== undefined
                ? `${Math.round(ratio)}× the still signal`
                : 'peak to peak'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The live viewer stays mounted across steps; comparison/review use owned copies. */
export default function ExploreLessonFlow(props: Props) {
  const { lesson, stream, channels, samplingRate, session, sample, onExit } =
    props;
  const noise = lesson === 'noise-sources';
  const [step, setStep] = useState(0);
  const [comparison, setComparison] = useState<FrozenComparison | null>(null);
  const [comparisonSkipped, setComparisonSkipped] = useState(false);
  const [waitedForBaseline, setWaitedForBaseline] = useState(false);
  const [mode, setMode] = useState<CueMode>('audio');
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [cue, setCue] = useState<CueWindow | null>(null);
  const [review, setReview] = useState<EEGSnapshot | null>(null);
  const [alphaRatio, setAlphaRatio] = useState<number | null>(null);
  const [cueError, setCueError] = useState('');
  const [hapticsAvailable] = useState(
    () => typeof navigator.vibrate === 'function'
  );
  const audio = useRef<LessonAudio | null>(null);
  const hapticTimer = useRef<number | null>(null);
  const mounted = useRef(true);
  const cueGeneration = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const signalClock = useRef({ sampleTime: 0, wallTime: 0 });
  const status = session.status();
  const { latestTime } = status;
  const lastSample = useRef<SignalQualityData | null>(null);
  if (sample && sample !== lastSample.current) {
    lastSample.current = sample;
    signalClock.current = {
      sampleTime:
        sample.info.startTime +
        ((sample.data[0]?.length ?? 0) * 1000) / sample.info.samplingRate,
      wallTime: Date.now(),
    };
  }

  useEffect(() => {
    mounted.current = true;
    audio.current = new LessonAudio();
    return () => {
      mounted.current = false;
      cueGeneration.current++;
      audio.current?.dispose();
      if (hapticTimer.current !== null)
        window.clearTimeout(hapticTimer.current);
      if (typeof navigator.vibrate === 'function') navigator.vibrate(0);
    };
  }, []);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    setWaitedForBaseline(false);
    if (!noise || step !== 1) return;
    const timer = window.setTimeout(() => setWaitedForBaseline(true), 8000);
    return () => window.clearTimeout(timer);
  }, [noise, step]);

  useEffect(() => {
    if (
      cue?.endTime == null ||
      latestTime == null ||
      latestTime < cue.endTime ||
      review
    )
      return;
    const frozen = session.snapshot(cue.startTime - 2000, cue.endTime + 250);
    if (!frozen) return;
    setReview(frozen);
    setAlphaRatio(session.alphaRatio(cue.startTime, cue.endTime));
  }, [cue, latestTime, review, session]);

  function stopCues() {
    cueGeneration.current++;
    audio.current?.cancel();
    if (hapticTimer.current !== null) window.clearTimeout(hapticTimer.current);
    hapticTimer.current = null;
    if (typeof navigator.vibrate === 'function') navigator.vibrate(0);
    setRunning(false);
    setAudioBusy(false);
    setCue(null);
    setReview(null);
    setAlphaRatio(null);
    setCueError('');
  }

  function exit() {
    stopCues();
    onExit();
  }

  function back() {
    stopCues();
    if (step === 0) onExit();
    else setStep(noise && step === 3 && comparisonSkipped ? 1 : step - 1);
  }

  function next() {
    if (running || audioBusy) return;
    if (step === 3) {
      exit();
      return;
    }
    if (noise && step === 1) {
      const result = session.comparison();
      setComparison(result);
      setComparisonSkipped(result === null);
      setStep(result ? 2 : 3);
    } else setStep(step + 1);
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

  function rerecord() {
    stopCues();
    session.reset();
    setComparison(null);
    setComparisonSkipped(false);
    setWaitedForBaseline(false);
    setStep(1);
  }

  function sampleTimeAt(wallTime: number) {
    return (
      signalClock.current.sampleTime + wallTime - signalClock.current.wallTime
    );
  }

  async function hearChime() {
    if (!audio.current) return;
    setAudioBusy(true);
    setCueError('');
    const generation = cueGeneration.current;
    try {
      const played = await audio.current.preview();
      if (mounted.current && generation === cueGeneration.current)
        setAudioUnlocked(played);
    } catch (error) {
      if (mounted.current && generation === cueGeneration.current)
        setCueError(
          error instanceof Error
            ? error.message
            : 'Check your sound output, or use partner mode.'
        );
    } finally {
      if (mounted.current && generation === cueGeneration.current)
        setAudioBusy(false);
    }
  }

  async function startInterval() {
    if (
      latestTime == null ||
      Date.now() - signalClock.current.wallTime > 1500
    ) {
      setCueError('Wait for a live signal before starting the interval.');
      return;
    }
    stopCues();
    const generation = cueGeneration.current;
    setRunning(true);
    const startAt = (wallTime: number) => {
      if (!mounted.current || generation !== cueGeneration.current) return;
      setCue({ startTime: sampleTimeAt(wallTime), endTime: null });
    };
    const endAt = (wallTime: number) => {
      if (!mounted.current || generation !== cueGeneration.current) return;
      setCue(
        (current) => current && { ...current, endTime: sampleTimeAt(wallTime) }
      );
      setRunning(false);
    };
    if (mode === 'audio') {
      try {
        await audio.current?.start(startAt, endAt);
      } catch (error) {
        if (mounted.current && generation === cueGeneration.current) {
          setRunning(false);
          setCueError(
            error instanceof Error
              ? error.message
              : 'Audio could not start. Use partner mode.'
          );
        }
      }
    } else {
      const wallStart = Date.now();
      if (mode === 'haptic' && !navigator.vibrate(200)) {
        setRunning(false);
        setCueError(
          'Vibration is unavailable on this device. Use partner mode.'
        );
        return;
      }
      startAt(wallStart);
      if (mode === 'haptic')
        hapticTimer.current = window.setTimeout(() => {
          navigator.vibrate([200, 100, 200]);
          endAt(wallStart + 10000);
        }, 10000);
    }
  }

  function partnerStop() {
    setCue(
      (current) => current && { ...current, endTime: sampleTimeAt(Date.now()) }
    );
    setRunning(false);
  }

  const visibleBlinks =
    latestTime == null
      ? []
      : status.blinkEvents.filter(
          (event) => event.endTime >= latestTime - 5000
        );
  const annotations: PlotAnnotation[] =
    noise && step === 1
      ? visibleBlinks.map((event) => ({
          id: `blink-${event.startTime}`,
          startTime: event.startTime,
          endTime: event.endTime,
          label: 'blink · eye muscle, not brain',
          tone: 'blink',
        }))
      : noise && step === 3 && cue
        ? [
            {
              id: 'eyes-closed',
              ...cue,
              label: `${mode === 'audio' ? 'chime' : mode === 'haptic' ? 'vibration' : 'partner'} · eyes closed`,
              endLabel: `${mode === 'audio' ? 'chime' : mode === 'haptic' ? 'vibration' : 'partner'} · eyes open`,
              tone: 'eyes-closed',
            },
          ]
        : [];
  const caption =
    !noise || step === 0
      ? 'your signal, live'
      : step === 1
        ? 'watching the frontal sensors (AF7, AF8)'
        : running
          ? 'recording'
          : 'your signal, live';
  const title = noise
    ? step === 3 && mode !== 'audio'
      ? 'Close your eyes until your partner signals'
      : NOISE_TITLES[step]
    : CLEAN_SIGNAL_LESSON[step].title;
  const displayChannels =
    noise && step === 1 && status.supported ? FRONTAL_CHANNELS : channels;

  return (
    <section
      className="flex min-h-full flex-1 flex-col gap-5 text-ink"
      aria-label={
        noise
          ? 'Where is this noise coming from?'
          : 'How do I get a cleaner signal?'
      }
    >
      <header className="flex flex-none flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3.5">
        <div className={labelClass} role="status">
          {noise
            ? 'WHERE IS THIS NOISE COMING FROM?'
            : 'HOW DO I GET A CLEANER SIGNAL?'}{' '}
          · STEP {step + 1} OF 4
        </div>
        <div className="flex gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={cn(
                'h-1.5 w-7 rounded-full',
                index === step
                  ? 'bg-accent'
                  : index < step
                    ? 'bg-accent-light'
                    : 'bg-ink-faint'
              )}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-ink-muted"
          onClick={exit}
        >
          Exit lesson ✕
        </Button>
      </header>
      <div
        className={
          noise && step === 2
            ? 'hidden'
            : cn(
                'flex flex-none gap-[18px] rounded-lg border border-gray-200 bg-white p-[18px]',
                noise && step === 3 ? 'h-[340px]' : 'h-[360px]'
              )
        }
      >
        <div className="min-w-0 flex-1">
          <div className="mb-2.5 flex min-h-5 items-center justify-between gap-3 text-[13px] text-ink-muted">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand" />
              {caption}
            </span>
            {noise && step === 1 && (
              <span aria-live="polite">
                {visibleBlinks.length}{' '}
                {visibleBlinks.length === 1 ? 'blink' : 'blinks'} caught
              </span>
            )}
            {noise && step === 3 && (
              <span>
                alpha band (8–12 Hz)
                {alphaRatio === null
                  ? ''
                  : ` · ${alphaRatio.toFixed(1)}× before`}
              </span>
            )}
          </div>
          <ViewerComponent
            signalQualityObservable={stream}
            plottingInterval={PLOTTING_INTERVAL}
            channels={displayChannels}
            annotations={annotations}
            height={noise && step === 3 ? 250 : 290}
            windowDuration={noise && step === 3 ? 20000 : 5000}
            onNavigate={navigateFromViewer}
          />
        </div>
        {(!noise || step === 0) && (
          <div className="w-[150px] flex-none max-[650px]:hidden">
            <SignalQualityIndicatorComponent
              signalQualityObservable={stream}
              plottingInterval={PLOTTING_INTERVAL}
              channels={channels}
              height={140}
            />
          </div>
        )}
      </div>
      {noise && step === 2 && comparison && (
        <div className="flex flex-none flex-col gap-4">
          <FrozenStrip
            snapshot={comparison.calm}
            scale={comparison.sharedScale}
          />
          <FrozenStrip
            snapshot={comparison.blink}
            scale={comparison.sharedScale}
            blinking
            ratio={comparison.ratio}
          />
        </div>
      )}
      {noise && step === 1 && (
        <div role="status" className="text-sm text-ink-muted">
          {!status.supported
            ? 'Blink detection needs both AF7 and AF8. You can still watch your signal and continue to the eyes-closed step.'
            : !status.baselineStable
              ? waitedForBaseline
                ? 'We cannot see your blinks yet, check the forehead sensors.'
                : 'Sit still for a moment while the forehead sensors settle, then try blinking.'
              : 'Forehead baseline ready. Blink a few times, then sit still so we can compare.'}
        </div>
      )}
      {noise && step === 3 && comparisonSkipped && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
          <span>
            We don&apos;t have a blink window and five quiet seconds to compare.
          </span>
          <Button variant="outline-brand" size="sm" onClick={rerecord}>
            Try the blink step again
          </Button>
        </div>
      )}
      {noise && step === 3 && review && (
        <details className="rounded-lg border border-gray-200 bg-white px-[18px] py-3">
          <summary className="cursor-pointer text-sm text-brand">
            Review your marked interval · frozen copy
          </summary>
          <ViewerComponent
            signalQualityObservable={null}
            plottingInterval={PLOTTING_INTERVAL}
            channels={review.channels}
            snapshot={review}
            annotations={annotations}
            height={160}
          />
          <div className="text-sm text-ink-muted">
            {alphaRatio === null
              ? 'There is not enough continuous posterior-channel data to compare alpha power.'
              : alphaRatio > 1
                ? `Measured alpha power was ${alphaRatio.toFixed(1)}× the preceding five seconds.`
                : 'Alpha did not increase in this interval. That is a real result, not a failed lesson.'}
          </div>
        </details>
      )}
      <div
        key={step}
        className="explore-step-copy flex min-h-0 flex-1 flex-wrap items-end justify-between gap-x-10 gap-y-5 pb-3"
      >
        <div className="flex max-w-[620px] flex-col gap-2.5">
          <h2
            ref={heading}
            tabIndex={-1}
            className="text-[36px] font-light leading-tight tracking-[-0.025em] outline-none"
          >
            {title}
          </h2>
          {!noise ? (
            <p className="leading-7">{CLEAN_SIGNAL_LESSON[step].body}</p>
          ) : step === 0 ? (
            <p className="leading-7">
              Those wiggles are real voltage picked up off your scalp — a few
              millionths of a volt, arriving {samplingRate} times a second.
              Watch them for a moment before we start poking at them.
            </p>
          ) : step === 1 ? (
            <p className="leading-7">
              Every blink drops a big slow hump onto the two front sensors. That
              is your eyelid muscle moving, not your brain thinking, and it is
              the loudest thing in most student recordings.
            </p>
          ) : step === 2 ? (
            <p className="leading-7">
              {comparison && Math.round(comparison.ratio) >= 2
                ? `This is why researchers ask you to hold still: the noise is not small and shy, it’s ${Math.round(comparison.ratio)} times louder than the thing we came to measure.`
                : 'Same sensors, same scale. These windows are close in size: try re-recording while sitting still, then blinking clearly.'}
            </p>
          ) : (
            <>
              <p className="leading-7">
                {mode === 'audio'
                  ? 'One chime starts the ten seconds, two chimes end them. Nothing on screen needs watching in between.'
                  : mode === 'partner'
                    ? 'Ask a teacher or classmate to tap Start, signal you to close your eyes, and tap Stop after ten seconds as they signal you to open them.'
                    : 'One vibration starts the ten seconds, two vibrations end them. Keep a hand on your device; nothing on screen needs watching in between.'}
              </p>
              <p className="leading-7">
                The back of your head starts humming a steady rhythm when it has
                nothing to look at. That is the paradox of alpha waves: the
                seeing part of your brain gets louder once you stop giving it
                anything to see. Unlike the blink, this one really is your
                brain.
              </p>
            </>
          )}
          {noise && step === 3 && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
              <label htmlFor="explore-cue-mode">Cue mode</label>
              <select
                id="explore-cue-mode"
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                disabled={running || audioBusy}
                value={mode}
                onChange={(event) => {
                  stopCues();
                  setMode(event.target.value as CueMode);
                }}
              >
                <option value="audio">Audio chimes</option>
                <option value="partner">Partner mode (no sound needed)</option>
                {hapticsAvailable && (
                  <option value="haptic">Vibration on this device</option>
                )}
              </select>
              {cueError && <span role="alert">{cueError}</span>}
            </div>
          )}
        </div>
        <div className="flex flex-none flex-wrap items-center gap-3">
          {noise && step === 2 && (
            <Button variant="outline-brand" size="lg" onClick={rerecord}>
              Re-record
            </Button>
          )}
          {noise && step === 3 && mode === 'audio' && (
            <Button
              variant="outline-brand"
              size="lg"
              onClick={hearChime}
              disabled={running || audioBusy}
            >
              Hear the chime
            </Button>
          )}
          {noise && step === 3 && mode === 'partner' && running && (
            <Button variant="outline-brand" size="lg" onClick={partnerStop}>
              Stop · eyes open
            </Button>
          )}
          {noise && step === 3 && (mode !== 'partner' || !running) && (
            <Button
              variant="outline-brand"
              size="lg"
              onClick={startInterval}
              disabled={audioBusy || (mode === 'audio' && !audioUnlocked)}
            >
              {cue?.endTime != null && !running
                ? 'Record again'
                : 'Start · eyes closed'}
            </Button>
          )}
          <Button variant="secondary" size="lg" onClick={back}>
            Back
          </Button>
          <Button size="lg" onClick={next} disabled={running || audioBusy}>
            {step === 3 ? 'Finish lesson' : 'Next'}
          </Button>
        </div>
      </div>
    </section>
  );
}
