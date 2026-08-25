/**
 * Every official jsPsych v8 plugin, exposed under the global name a script-style
 * timeline expects.
 *
 * A timeline writes `type: jsPsychHtmlKeyboardResponse` — a bare global — so the
 * class must be reachable as a global before the author's file is evaluated.
 *
 * The global name is DERIVED, never hand-written: each plugin class carries its
 * own `info.name` (the dashed package name), and every upstream package passes
 * `makeRollupConfig('jsPsych' + CamelCase(info.name))` in its rollup config.
 * Deriving it means the name list cannot drift from the import list, because
 * there is only one list.
 *
 * ESM imports, not each package's IIFE build: the published `dist/index.js`
 * starts with `import { ParameterType } from 'jspsych'`, and only Vite can
 * resolve that bare specifier.
 *
 * WHY THE WHOLE SET, and not a "common" subset. The renderer bundle is built by
 * Vite at package time, so a teacher holding the .dmg cannot add a plugin. A
 * timeline referencing an unshipped plugin can NEVER run on their machine, and
 * no message we show them is actionable — "npm install and rebuild" is not a
 * thing a classroom can do. Measured cost of the full set: ~9 MB of node_modules
 * (mean 181 KB/package, mostly sourcemaps and duplicate build formats; the
 * tree-shaken bundle contribution is a fraction of that) against a Pyodide
 * runtime an order of magnitude larger that already ships. Bounded, one-time
 * disk cost against an unfixable classroom failure — take the disk.
 * `@jspsych/extension-*` still stays out: extensions only fire for trials that
 * declare them in the author's own file, so shipping them wholesale buys nothing.
 */
import jsPsychAnimation from '@jspsych/plugin-animation';
import jsPsychAudioButtonResponse from '@jspsych/plugin-audio-button-response';
import jsPsychAudioKeyboardResponse from '@jspsych/plugin-audio-keyboard-response';
import jsPsychAudioSliderResponse from '@jspsych/plugin-audio-slider-response';
import jsPsychBrowserCheck from '@jspsych/plugin-browser-check';
import jsPsychCallFunction from '@jspsych/plugin-call-function';
import jsPsychCanvasButtonResponse from '@jspsych/plugin-canvas-button-response';
import jsPsychCanvasKeyboardResponse from '@jspsych/plugin-canvas-keyboard-response';
import jsPsychCanvasSliderResponse from '@jspsych/plugin-canvas-slider-response';
import jsPsychCategorizeAnimation from '@jspsych/plugin-categorize-animation';
import jsPsychCategorizeHtml from '@jspsych/plugin-categorize-html';
import jsPsychCategorizeImage from '@jspsych/plugin-categorize-image';
import jsPsychCloze from '@jspsych/plugin-cloze';
import jsPsychExternalHtml from '@jspsych/plugin-external-html';
import jsPsychFreeSort from '@jspsych/plugin-free-sort';
import jsPsychFullscreen from '@jspsych/plugin-fullscreen';
import jsPsychHtmlAudioResponse from '@jspsych/plugin-html-audio-response';
import jsPsychHtmlButtonResponse from '@jspsych/plugin-html-button-response';
import jsPsychHtmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import jsPsychHtmlSliderResponse from '@jspsych/plugin-html-slider-response';
import jsPsychHtmlVideoResponse from '@jspsych/plugin-html-video-response';
import jsPsychIatHtml from '@jspsych/plugin-iat-html';
import jsPsychIatImage from '@jspsych/plugin-iat-image';
import jsPsychImageButtonResponse from '@jspsych/plugin-image-button-response';
import jsPsychImageKeyboardResponse from '@jspsych/plugin-image-keyboard-response';
import jsPsychImageSliderResponse from '@jspsych/plugin-image-slider-response';
import jsPsychInitializeCamera from '@jspsych/plugin-initialize-camera';
import jsPsychInitializeMicrophone from '@jspsych/plugin-initialize-microphone';
import jsPsychInstructions from '@jspsych/plugin-instructions';
import jsPsychMaxdiff from '@jspsych/plugin-maxdiff';
import jsPsychMirrorCamera from '@jspsych/plugin-mirror-camera';
import jsPsychPreload from '@jspsych/plugin-preload';
import jsPsychReconstruction from '@jspsych/plugin-reconstruction';
import jsPsychResize from '@jspsych/plugin-resize';
import jsPsychSameDifferentHtml from '@jspsych/plugin-same-different-html';
import jsPsychSameDifferentImage from '@jspsych/plugin-same-different-image';
import jsPsychSerialReactionTime from '@jspsych/plugin-serial-reaction-time';
import jsPsychSerialReactionTimeMouse from '@jspsych/plugin-serial-reaction-time-mouse';
import jsPsychSketchpad from '@jspsych/plugin-sketchpad';
import jsPsychSurveyHtmlForm from '@jspsych/plugin-survey-html-form';
import jsPsychSurveyLikert from '@jspsych/plugin-survey-likert';
import jsPsychSurveyMultiChoice from '@jspsych/plugin-survey-multi-choice';
import jsPsychSurveyMultiSelect from '@jspsych/plugin-survey-multi-select';
import jsPsychSurveyText from '@jspsych/plugin-survey-text';
import jsPsychVideoButtonResponse from '@jspsych/plugin-video-button-response';
import jsPsychVideoKeyboardResponse from '@jspsych/plugin-video-keyboard-response';
import jsPsychVideoSliderResponse from '@jspsych/plugin-video-slider-response';
import jsPsychVirtualChinrest from '@jspsych/plugin-virtual-chinrest';
import jsPsychVisualSearchCircle from '@jspsych/plugin-visual-search-circle';
import jsPsychWebgazerCalibrate from '@jspsych/plugin-webgazer-calibrate';
import jsPsychWebgazerInitCamera from '@jspsych/plugin-webgazer-init-camera';
import jsPsychWebgazerValidate from '@jspsych/plugin-webgazer-validate';

type PluginClass = { info?: { name?: string } };

const ALL_PLUGINS: PluginClass[] = [
  jsPsychAnimation,
  jsPsychAudioButtonResponse,
  jsPsychAudioKeyboardResponse,
  jsPsychAudioSliderResponse,
  jsPsychBrowserCheck,
  jsPsychCallFunction,
  jsPsychCanvasButtonResponse,
  jsPsychCanvasKeyboardResponse,
  jsPsychCanvasSliderResponse,
  jsPsychCategorizeAnimation,
  jsPsychCategorizeHtml,
  jsPsychCategorizeImage,
  jsPsychCloze,
  jsPsychExternalHtml,
  jsPsychFreeSort,
  jsPsychFullscreen,
  jsPsychHtmlAudioResponse,
  jsPsychHtmlButtonResponse,
  jsPsychHtmlKeyboardResponse,
  jsPsychHtmlSliderResponse,
  jsPsychHtmlVideoResponse,
  jsPsychIatHtml,
  jsPsychIatImage,
  jsPsychImageButtonResponse,
  jsPsychImageKeyboardResponse,
  jsPsychImageSliderResponse,
  jsPsychInitializeCamera,
  jsPsychInitializeMicrophone,
  jsPsychInstructions,
  jsPsychMaxdiff,
  jsPsychMirrorCamera,
  jsPsychPreload,
  jsPsychReconstruction,
  jsPsychResize,
  jsPsychSameDifferentHtml,
  jsPsychSameDifferentImage,
  jsPsychSerialReactionTime,
  jsPsychSerialReactionTimeMouse,
  jsPsychSketchpad,
  jsPsychSurveyHtmlForm,
  jsPsychSurveyLikert,
  jsPsychSurveyMultiChoice,
  jsPsychSurveyMultiSelect,
  jsPsychSurveyText,
  jsPsychVideoButtonResponse,
  jsPsychVideoKeyboardResponse,
  jsPsychVideoSliderResponse,
  jsPsychVirtualChinrest,
  jsPsychVisualSearchCircle,
  jsPsychWebgazerCalibrate,
  jsPsychWebgazerInitCamera,
  jsPsychWebgazerValidate,
];

const toGlobalName = (dashedName: string) =>
  'jsPsych' +
  dashedName
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');

export const JSPSYCH_PLUGIN_GLOBALS: Record<string, unknown> =
  Object.fromEntries(
    ALL_PLUGINS.map((plugin, index) => {
      const name = plugin?.info?.name;
      if (!name) {
        // Crash at module load, naming the culprit, rather than hand a timeline
        // an `undefined` global and let it die later as a bare ReferenceError.
        throw new Error(
          `plugins.ts: the plugin at index ${index} has no info.name — it is ` +
            `probably resolving to its CJS build. Add that package to ` +
            `renderer.optimizeDeps.include in vite.config.ts.`
        );
      }
      return [toGlobalName(name), plugin];
    })
  );
