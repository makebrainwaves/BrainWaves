/**
 * Point an author's relative asset URLs at their authorized folder.
 *
 * A jsPsych file written for a web server says `stimulus: 'stimuli/face1.png'`.
 * In production BrainWaves loads the renderer with `mainWindow.loadFile(...)`,
 * so that resolves inside the app bundle; in dev it resolves against the Vite
 * dev server. The folder the teacher actually picked is reachable only over
 * `bwfile://`, whose allowlist is the gate on disk access.
 *
 * SCOPE: a relative asset path that is quote-delimited on both sides. That one
 * shape covers both cases that matter, because the path is quote-bounded in
 * both. Anything else is untouched — an asset URL built at runtime by string
 * concatenation 404s visibly in Preview rather than being silently mangled.
 */
import path from 'pathe';
import { toStimulusFileUrl } from '../../../shared/stimulusUrl';

const ASSET_EXTENSIONS =
  'png|jpe?g|gif|webp|svg|bmp|mp3|wav|ogg|m4a|mp4|webm|ogv';

/** A relative path ending in an asset extension — no scheme, not root-anchored. */
const RELATIVE_ASSET = new RegExp(
  `^(?![A-Za-z][\\w+.-]*:|//|/|#)[\\w.@ -]+(?:/[\\w.@ -]+)*\\.(?:${ASSET_EXTENSIONS})$`,
  'i'
);

/**
 * A relative asset path with the SAME quote on both sides.
 *
 *   stimulus: 'stimuli/face1.png'          → the whole string literal
 *   stimulus: '<img src="stimuli/a.png">'  → an attribute inside a literal
 *
 * One pass, deliberately. An earlier draft ran two — one for whole literals, one
 * for `src|href|poster` attributes — which overlapped on the same bytes and made
 * the result depend on pass order. The delimiter is captured and re-emitted, so
 * an escaped inner quote (\") inside a double-quoted literal survives untouched.
 */
const DELIMITED_ASSET = new RegExp(
  `(\\\\?['"\`])` +
    `((?![A-Za-z][\\w+.-]*:|//|/|#)[\\w.@ -]+(?:/[\\w.@ -]+)*` +
    `\\.(?:${ASSET_EXTENSIONS}))\\1`,
  'gi'
);

export const rewriteRelativeAssetUrls = (
  source: string,
  assetDir: string
): string =>
  assetDir
    ? source.replace(
        DELIMITED_ASSET,
        (_match, quote: string, relative: string) =>
          `${quote}${toStimulusFileUrl(path.join(assetDir, relative))}${quote}`
      )
    : source;
