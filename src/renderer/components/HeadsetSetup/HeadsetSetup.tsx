import React, { useId } from 'react';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { cn } from '../ui/utils';
import { DEVICES } from '../../constants/constants';
import { CrownWearArt, HeadsetGlyph, MuseWearArt } from './illustrations';

/** Device types the setup flow can pair or start. */
export type SetupDevice =
  | DEVICES.MUSE
  | DEVICES.NEUROSITY
  | DEVICES.FIXTURE
  | DEVICES.LSL;

/**
 * One screen of the pairing flow. `wear` is the device-specific wearing and
 * power-on screen for Muse/Crown and the intro screen for Fixture/LSL.
 */
export type PairingStep =
  | 'choose'
  | 'wear'
  | 'ready'
  | 'searching'
  | 'notFound'
  | 'found'
  | 'connecting'
  | 'failed'
  | 'connected';

/** A headset the platform reported during discovery. */
export interface FoundHeadset {
  id: string;
  /** Advertised name, e.g. `Muse-4A2F`. This is what the student checks. */
  name: string;
  /** Friendly model line, e.g. `Muse 2`. */
  model: string;
}

interface Props {
  step: PairingStep;
  /** Chosen type; required for every step after `choose`. */
  device?: SetupDevice;
  /** Discovery results for `found`. */
  found?: FoundHeadset[];
  /** Row the student picked in `found`; also names the device in later steps. */
  selectedId?: string;
  /** Offer the no-headset replay option (dev builds). */
  showFixture?: boolean;
  /** Offer external LSL streams (only when liblsl loaded). */
  showLSL?: boolean;
  onChooseDevice(device: SetupDevice): void;
  onBack(): void;
  /** `wear` → `ready`. */
  onContinue(): void;
  /** The only way discovery starts. */
  onFindHeadset(): void;
  /** Stops the current search or connection attempt. */
  onCancel(): void;
  onSelectHeadset(id: string): void;
  onConnect(): void;
  /** Fixture: start replay. LSL: look for streams. */
  onStartSoftwareSource(): void;
  /** Leave pairing for signal preparation on Explore/Collect. */
  onDone(): void;
  /** Closing must also cancel any pending search. */
  onClose(): void;
}

const NAME: Record<SetupDevice, string> = {
  [DEVICES.MUSE]: 'Muse',
  [DEVICES.NEUROSITY]: 'Neurosity Crown',
  [DEVICES.FIXTURE]: 'Fixture data',
  [DEVICES.LSL]: 'LSL stream',
};

const STAGES = ['Choose', 'Get ready', 'Connect'] as const;

const TITLE = 'm-0 !text-[26px] !font-light !leading-tight !tracking-[0.3px]';
const BODY =
  'm-0 !text-[16px] leading-[1.55] !tracking-normal text-ink [text-wrap:pretty]';
const NOTE = 'm-0 !text-[14px] leading-normal !tracking-normal text-ink-muted';

const WEAR_CUES: Record<DEVICES.MUSE | DEVICES.NEUROSITY, string[]> = {
  [DEVICES.MUSE]: [
    'The flat sensor strip goes across your forehead, just above your eyebrows.',
    'The arms rest over your ears, like glasses.',
    'The rubber tips sit on bare skin behind each ear.',
  ],
  [DEVICES.NEUROSITY]: [
    'The front rests on your forehead.',
    'The sensor arms curve over the top and back of your head.',
    'Wiggle it gently so the sensor tips reach through your hair to your scalp.',
  ],
};

const POWER_ON: Record<DEVICES.MUSE | DEVICES.NEUROSITY, string> = {
  [DEVICES.MUSE]:
    'Hold the power button until the lights come on. Moving lights mean it is waiting to pair.',
  [DEVICES.NEUROSITY]:
    'Press the power button and wait for the light to come on.',
};

const TROUBLESHOOT = [
  'Is it turned on and charged?',
  'Close the headset’s phone app — a headset can only talk to one device.',
  'Bring it close to this computer.',
];

/** Gold progress for the three pairing stages; text says where you are. */
function Stepper({ stage }: { stage: number }) {
  return (
    <ol
      aria-label="Setup progress"
      className="m-0 flex list-none gap-[16px] p-0 text-[13px] font-bold tracking-[0.5px]"
    >
      {STAGES.map((label, i) => (
        <li
          key={label}
          aria-current={i === stage ? 'step' : undefined}
          className={cn(
            'border-b-[4px] pb-[4px]',
            i === stage && 'border-accent text-ink',
            i < stage && 'border-accent-light text-ink-muted',
            i > stage && 'border-transparent text-ink-faint'
          )}
        >
          {i + 1}. {label}
        </li>
      ))}
    </ol>
  );
}

/** Round badge with a check or cross so outcome is never color alone. */
function OutcomeMark({ ok }: { ok: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex h-[48px] w-[48px] flex-none items-center justify-center rounded-full text-[24px] font-bold',
        ok ? 'bg-brand-light text-brand' : 'bg-gray-100 text-ink'
      )}
    >
      {ok ? '✓' : '!'}
    </span>
  );
}

function Checklist({ items, label }: { items: string[]; label: string }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <p className={NOTE}>{label}</p>
      <ul className="m-0 flex flex-col gap-[6px] pl-[20px]">
        {items.map((t) => (
          <li key={t} className="!text-[15px] leading-normal">
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-[8px] flex items-center justify-end gap-[12px]">
      {children}
    </div>
  );
}

/**
 * Pairing flow for a headset or software EEG source. Its only job is getting
 * a device connected: wearing and power-on guidance, an explicit
 * `Find my headset` search, every discovery outcome, and a connected
 * confirmation that never implies recording. Signal teaching lives in
 * `SignalPrep` on Explore/Collect. Pure props; the container owns state.
 */
export default function HeadsetSetup(props: Props) {
  const { step, device, found = [], selectedId } = props;
  const titleId = useId();
  const selected = found.find((h) => h.id === selectedId);
  const deviceName = device ? NAME[device] : 'headset';
  const headsetLabel = selected?.name ?? deviceName;

  return (
    <section
      aria-labelledby={titleId}
      className="relative flex w-[560px] flex-col gap-[20px] rounded-[10px] bg-white p-[32px] text-left shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
    >
      <div className="flex items-start justify-between">
        <Stepper stage={step === 'choose' ? 0 : step === 'wear' ? 1 : 2} />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close setup"
          onClick={props.onClose}
          className="-mr-[8px] -mt-[8px] text-[20px]"
        >
          ×
        </Button>
      </div>
      {renderStep()}
    </section>
  );

  function renderStep() {
    switch (step) {
      case 'choose':
        return (
          <>
            <h2 id={titleId} className={TITLE}>
              Which headset are you using?
            </h2>
            <div className="flex gap-[12px]">
              {([DEVICES.MUSE, DEVICES.NEUROSITY] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => props.onChooseDevice(d)}
                  className="flex flex-1 flex-col items-center gap-[10px] rounded-[8px] border-2 border-[#e0e0e0] bg-white px-[16px] py-[20px] text-[16px] font-bold text-ink transition-colors hover:border-brand hover:bg-brand-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <HeadsetGlyph kind={d === DEVICES.MUSE ? 'muse' : 'crown'} />
                  {NAME[d]}
                </button>
              ))}
            </div>
            {(props.showFixture || props.showLSL) && (
              <div className="flex flex-col gap-[4px] border-t border-gray-200 pt-[12px]">
                <p className={NOTE}>No headset on you?</p>
                <div className="flex gap-[8px]">
                  {props.showFixture && (
                    <Button
                      variant="link"
                      className="h-auto px-0"
                      onClick={() => props.onChooseDevice(DEVICES.FIXTURE)}
                    >
                      Use fixture data
                    </Button>
                  )}
                  {props.showFixture && props.showLSL && (
                    <span className="text-ink-faint">·</span>
                  )}
                  {props.showLSL && (
                    <Button
                      variant="link"
                      className="h-auto px-0"
                      onClick={() => props.onChooseDevice(DEVICES.LSL)}
                    >
                      Connect an LSL stream
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        );

      case 'wear':
        if (device === DEVICES.FIXTURE || device === DEVICES.LSL) {
          return renderSoftwareIntro(device);
        }
        if (device !== DEVICES.MUSE && device !== DEVICES.NEUROSITY) {
          return null;
        }
        return (
          <>
            <h2 id={titleId} className={TITLE}>
              Put on your {deviceName}
            </h2>
            <div className="flex items-center gap-[20px]">
              {device === DEVICES.MUSE ? (
                <MuseWearArt className="w-[200px] flex-none" />
              ) : (
                <CrownWearArt className="w-[200px] flex-none" />
              )}
              <ol className="m-0 flex flex-col gap-[10px] pl-[20px]">
                {WEAR_CUES[device].map((cue) => (
                  <li key={cue} className="!text-[15px] leading-normal">
                    {cue}
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-[8px] bg-gray-100 p-[16px]">
              <p className="m-0 !text-[15px] font-bold">Turn it on</p>
              <p className={cn(NOTE, 'mt-[4px] text-ink')}>
                {POWER_ON[device]}
              </p>
            </div>
            <Actions>
              <Button variant="outline" size="lg" onClick={props.onBack}>
                Back
              </Button>
              <Button size="lg" onClick={props.onContinue}>
                It’s on
              </Button>
            </Actions>
          </>
        );

      case 'ready':
        return (
          <>
            <h2 id={titleId} className={TITLE}>
              Ready to find your {deviceName}
            </h2>
            <p className={BODY}>
              Keep it on and close by. We’ll start looking when you press the
              button — it keeps searching until it finds your headset or you
              cancel.
            </p>
            <Actions>
              <Button variant="outline" size="lg" onClick={props.onBack}>
                Back
              </Button>
              <Button
                size="lg"
                className="px-[32px]"
                onClick={props.onFindHeadset}
              >
                Find my headset
              </Button>
            </Actions>
          </>
        );

      case 'searching':
        return (
          <>
            <h2 id={titleId} className={TITLE}>
              Looking for your {deviceName}…
            </h2>
            <div role="status" className="flex items-center gap-[16px]">
              <Spinner aria-hidden size={32} className="flex-none" />
              <p className={BODY}>
                Searching. This can take a little while — keep the headset on
                and nearby.
              </p>
            </div>
            <Actions>
              <Button variant="outline" size="lg" onClick={props.onCancel}>
                Cancel search
              </Button>
            </Actions>
          </>
        );

      case 'notFound':
        return (
          <>
            <div className="flex items-center gap-[16px]">
              <OutcomeMark ok={false} />
              <h2 id={titleId} className={TITLE}>
                We couldn’t find your {deviceName}
              </h2>
            </div>
            <Checklist
              label="Check these, then search again:"
              items={TROUBLESHOOT}
            />
            <Actions>
              <Button variant="outline" size="lg" onClick={props.onBack}>
                Back to setup tips
              </Button>
              <Button size="lg" onClick={props.onFindHeadset}>
                Search again
              </Button>
            </Actions>
          </>
        );

      case 'found':
        return (
          <>
            <h2 id={titleId} className={TITLE}>
              Is this your headset?
            </h2>
            <p className={NOTE}>
              Check the name matches the label on your headset, then select it.
            </p>
            <ul
              role="listbox"
              aria-label="Headsets found"
              className="m-0 flex list-none flex-col gap-[8px] p-0"
            >
              {found.map((h) => {
                const isSelected = h.id === selectedId;
                return (
                  <li
                    key={h.id}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => props.onSelectHeadset(h.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        props.onSelectHeadset(h.id);
                      }
                    }}
                    className={cn(
                      'flex cursor-pointer items-center gap-[14px] rounded-[8px] border-2 px-[16px] py-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                      isSelected
                        ? 'border-brand bg-brand-light'
                        : 'border-[#e0e0e0] bg-white hover:border-brand'
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border-2 text-[13px] font-bold',
                        isSelected
                          ? 'border-brand bg-brand text-white'
                          : 'border-[#8d8d8d]'
                      )}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="text-[17px] font-bold text-ink">
                        {h.name}
                      </span>
                      <span className="text-[13px] text-ink-muted">
                        {h.model}
                      </span>
                    </span>
                    {isSelected && (
                      <span className="text-[13px] font-bold text-brand">
                        Selected
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <Actions>
              <Button variant="outline" size="lg" onClick={props.onFindHeadset}>
                Search again
              </Button>
              <Button size="lg" disabled={!selected} onClick={props.onConnect}>
                {selected ? `Connect to ${selected.name}` : 'Connect'}
              </Button>
            </Actions>
          </>
        );

      case 'connecting':
        return (
          <>
            <h2 id={titleId} className={TITLE}>
              Connecting to {headsetLabel}…
            </h2>
            <div role="status" className="flex items-center gap-[16px]">
              <Spinner aria-hidden size={32} className="flex-none" />
              <p className={BODY}>Keep the headset on and nearby.</p>
            </div>
            <Actions>
              <Button variant="outline" size="lg" onClick={props.onCancel}>
                Cancel
              </Button>
            </Actions>
          </>
        );

      case 'failed':
        return (
          <>
            <div className="flex items-center gap-[16px]">
              <OutcomeMark ok={false} />
              <h2 id={titleId} className={TITLE}>
                Couldn’t connect to {headsetLabel}
              </h2>
            </div>
            <Checklist label="This usually fixes it:" items={TROUBLESHOOT} />
            <Actions>
              <Button variant="outline" size="lg" onClick={props.onFindHeadset}>
                Search again
              </Button>
              <Button size="lg" onClick={props.onConnect}>
                Try again
              </Button>
            </Actions>
          </>
        );

      case 'connected':
        return (
          <>
            <div className="flex items-center gap-[16px]">
              <OutcomeMark ok />
              <h2 id={titleId} className={TITLE}>
                {headsetLabel} is connected
              </h2>
            </div>
            <p className={BODY}>
              {device === DEVICES.FIXTURE || device === DEVICES.LSL
                ? 'The app is receiving EEG data.'
                : `The app can hear your ${deviceName}${selected ? ` (${selected.model})` : ''}.`}{' '}
              <strong>Nothing is being recorded</strong> — recording only starts
              when you run an experiment.
            </p>
            <Actions>
              <Button size="lg" onClick={props.onDone}>
                Check my signal
              </Button>
            </Actions>
          </>
        );
    }
  }

  function renderSoftwareIntro(d: DEVICES.FIXTURE | DEVICES.LSL) {
    const fixture = d === DEVICES.FIXTURE;
    return (
      <>
        <h2 id={titleId} className={TITLE}>
          {fixture ? 'Use fixture data' : 'Connect an LSL stream'}
        </h2>
        {fixture ? (
          <p className={BODY}>
            Fixture mode replays a recorded EEG sample. No headset needed.
          </p>
        ) : (
          <>
            <p className={BODY}>
              LSL streams come from other software on this computer, like a lab
              amplifier’s app. Start the stream there first, then look for it
              here.
            </p>
            <p className={NOTE}>
              No headset needs to be worn for this step — follow your EEG
              system’s own setup guide.
            </p>
          </>
        )}
        <Actions>
          <Button variant="outline" size="lg" onClick={props.onBack}>
            Back
          </Button>
          <Button size="lg" onClick={props.onStartSoftwareSource}>
            {fixture ? 'Start fixture data' : 'Look for LSL streams'}
          </Button>
        </Actions>
      </>
    );
  }
}
