/**
 * The one place third-party jsPsych code meets BrainWaves.
 *
 * The author's file calls `initJsPsych()` exactly as jsPsych documents. We make
 * that OUR function, injected onto `window` before the file is evaluated, and
 * that single interception buys markers, behavioral data, and the prod-only
 * safe-mode override without the author changing a line.
 */
import { initJsPsych } from 'jspsych';
import * as jsPsychModule from 'jspsych';
import { MarkerRegistry } from '../eeg/markerRegistry';
import { JSPSYCH_PLUGIN_GLOBALS } from './plugins';
import {
  BehavioralMapping,
  normalizeJsPsychTrials,
  toBehavioralCsv,
} from './normalize';

export interface JsPsychHostConfig {
  /** id of the div jsPsych renders into. Must already be in the document. */
  hostElementId: string;
  mapping: BehavioralMapping;
  registry: MarkerRegistry;
  eventCallback: (code: number, time: number) => void;
  onFinish: (csv: string) => void;
}

interface BuildJsPsychOptionsArgs extends JsPsychHostConfig {
  /** Reads back the instance our own initJsPsych wrapper created. */
  getInstance: () => unknown;
  authorOptions: Record<string, unknown>;
}

interface TrialNode {
  getDataParameter?: () => Record<string, unknown>;
}

interface JsPsychInternals {
  timeline?: { getLatestNode?: () => TrialNode | undefined };
  abortExperiment?: (endMessage?: string) => void;
}

/**
 * The resolved, parent-merged `data` values for the trial that is starting.
 *
 * `trialObject` is `deepCopy(description)` (Trial.ts:36) and `processParameters`
 * only evaluates keys declared in the plugin's `info.parameters` — `data` is not
 * one of them. So `trialObject.data.condition` is still a TimelineVariable
 * object for the near-universal
 * `data: { condition: jsPsych.timelineVariable('cond') }` pattern.
 *
 * `TimelineNode.getDataParameter()` (TimelineNode.ts:162) is the resolver: it
 * evaluates functions, resolves timeline variables, and merges parent-timeline
 * `data`. It is public on the Trial node, and the running Trial is reachable
 * here because `Timeline.run()` assigns `currentChild` BEFORE awaiting the child
 * (Timeline.ts:82,87). Reaching past initJsPsych's public surface for it is the
 * same contained third-party coupling as
 * `experimentToRun.internals.controller.audioContext` in LabjsExperimentWindow.
 */
export const resolveTrialData = (
  instance: unknown,
  trialObject: Record<string, unknown> | undefined
): Record<string, unknown> => {
  const node = (
    instance as JsPsychInternals | undefined
  )?.timeline?.getLatestNode?.();
  const resolved = node?.getDataParameter?.();
  if (resolved) return resolved;
  const raw = trialObject?.data;
  return typeof raw === 'object' && raw !== null
    ? (raw as Record<string, unknown>)
    : {};
};

export const buildJsPsychOptions = ({
  hostElementId,
  mapping,
  registry,
  eventCallback,
  onFinish,
  getInstance,
  authorOptions,
}: BuildJsPsychOptionsArgs): Record<string, unknown> => ({
  ...authorOptions,
  display_element: hostElementId,
  // MANDATORY, and dev will never reveal why. jsPsych's constructor checks
  // `window.location.protocol == "file:"` and, unless overridden, sets
  // use_webaudio = false and disables video preloading (JsPsych.ts:72-84).
  // Production loads the renderer with mainWindow.loadFile(...); development
  // runs on http://localhost:5173 and looks perfect.
  override_safe_mode: true,
  on_trial_start: (trialObject: Record<string, unknown>) => {
    const label = resolveTrialData(getInstance(), trialObject)[
      mapping.conditionKey
    ];
    if (typeof label === 'string') {
      const code = registry.eventId[label];
      if (code !== undefined) {
        // on_trial_start fires BEFORE the plugin writes DOM (Trial.ts:63-72).
        // For a synchronous plugin the write happens later in the same task, so
        // this rAF callback lands after the write and before paint. Async
        // plugins (audio/video preload) write in a later task and take an early
        // marker.
        requestAnimationFrame(() => eventCallback(code, Date.now()));
      }
    } else if (label !== undefined) {
      // A non-string condition means resolution failed — in practice an
      // unresolved TimelineVariable. Silence here is the worst failure in the
      // whole feature: the run completes, the behavioral CSV looks perfect, and
      // the EEG file carries a Marker column of zeros that nobody notices until
      // analysis, after 25 children have been recorded. Say it loudly.
      console.error(
        `jsPsych host: condition key '${mapping.conditionKey}' resolved to a ` +
          `${typeof label}, not a string — no marker written for this trial. ` +
          `Check that the Markers tab names a key this timeline actually sets.`
      );
    }
    (authorOptions.on_trial_start as ((t: unknown) => void) | undefined)?.(
      trialObject
    );
  },
  on_finish: (data: { values: () => Record<string, unknown>[] }) => {
    (authorOptions.on_finish as ((d: unknown) => void) | undefined)?.(data);
    onFinish(toBehavioralCsv(normalizeJsPsychTrials(data.values(), mapping)));
  },
});

export interface JsPsychHost {
  /** Aborts any running experiment and restores every global this installed. */
  teardown: () => void;
}

export const createJsPsychHost = (
  source: string,
  config: JsPsychHostConfig
): JsPsychHost => {
  const scope = window as unknown as Record<string, unknown>;
  const replaced = new Map<string, unknown>();
  let instance: JsPsychInternals | undefined;

  const install = (key: string, value: unknown) => {
    if (!replaced.has(key)) replaced.set(key, scope[key]);
    scope[key] = value;
  };

  const teardown = () => {
    try {
      instance?.abortExperiment?.();
    } catch {
      // A finished run has nothing left to abort; that is not an error.
    }
    instance = undefined;
    for (const [key, value] of replaced) {
      if (value === undefined) delete scope[key];
      else scope[key] = value;
    }
    replaced.clear();
  };

  for (const [key, value] of Object.entries(JSPSYCH_PLUGIN_GLOBALS)) {
    install(key, value);
  }
  // Plugin IIFE builds take this as their argument, and an author defining an
  // inline plugin needs ParameterType from it.
  install('jsPsychModule', jsPsychModule);
  install('initJsPsych', (authorOptions: Record<string, unknown> = {}) => {
    instance = initJsPsych(
      buildJsPsychOptions({
        ...config,
        getInstance: () => instance,
        authorOptions,
      })
    ) as unknown as JsPsychInternals;
    return instance;
  });

  try {
    // 'unsafe-eval' is already in the renderer CSP (index.html:7). A Function
    // body rather than an injected <script> keeps the author's top-level
    // `const jsPsych = …` function-scoped, so previewing and then running in one
    // session cannot throw "Identifier 'jsPsych' has already been declared" —
    // and a syntax or reference error throws HERE, where we can show it, instead
    // of landing on window.onerror. jsPsych's own migration shim also makes a v6
    // `jsPsych.init(...)` throw into this catch.
    // eslint-disable-next-line no-new-func
    new Function(source)();
  } catch (error) {
    teardown();
    throw new Error(
      `createJsPsychHost: the imported experiment threw while loading — ${
        (error as Error).message
      }`
    );
  }

  return { teardown };
};
