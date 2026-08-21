/**
 * Static scan of an author's timeline file, run BEFORE anything is evaluated.
 *
 * It exists because the three ways an import fails are all cheap to see in the
 * text and expensive to see at runtime:
 *   - a jsPsych v6 file dies mid-run with a MigrationError or a bare
 *     "Plugin not recognized";
 *   - a plugin this build does not ship dies with a bare ReferenceError;
 *   - the condition key is unguessable, because jsPsych has NO condition
 *     concept — `data` is a free-form bag and `trial_type` holds the plugin
 *     name, so Face and House trials rendered by image-keyboard-response are
 *     byte-identical there.
 *
 * The scan is deliberately NOT a source of truth for condition values: it only
 * sees branches spelled out as literals. Randomization, conditional nodes, and
 * timeline variables make the full set unknowable statically, which is exactly
 * why the Markers tab lets the teacher add what the scan missed.
 */

export const V6_MIGRATION_URL =
  'https://www.jspsych.org/7.0/support/migration-v7/';

export interface TimelineScan {
  /** Non-null when the file is jsPsych v6: the v6-only token that proved it. */
  v6Token: string | null;
  /** Every `data:` key found, mapped to the string literal values seen for it. */
  dataKeys: Record<string, string[]>;
  /** `jsPsych*` globals the file references but this build does not ship. */
  missingPluginGlobals: string[];
}

const V6_PATTERNS: RegExp[] = [
  /\bjsPsych\s*\.\s*init\s*\(/,
  /\bjsPsych\s*\.\s*NO_KEYS\b/,
  /\bjsPsych\s*\.\s*ALL_KEYS\b/,
  // v6 named plugins by string; v8 requires the plugin class.
  /\btype\s*:\s*(['"])[a-z][a-z0-9-]*\1/,
];

/** Reported token per pattern; null means "report the matched text itself". */
const V6_TOKENS: (string | null)[] = [
  'jsPsych.init',
  'jsPsych.NO_KEYS',
  'jsPsych.ALL_KEYS',
  null,
];

const DATA_BLOCK = /\bdata\s*:\s*\{([\s\S]*?)\}/g;
const PROPERTY = /([A-Za-z_$][\w$]*)\s*:\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)?/g;
const PLUGIN_GLOBAL = /\bjsPsych[A-Z][A-Za-z0-9]*\b/g;
const ALWAYS_INSTALLED = new Set(['jsPsychModule']);

const findV6Token = (source: string): string | null => {
  for (let i = 0; i < V6_PATTERNS.length; i += 1) {
    const match = V6_PATTERNS[i].exec(source);
    if (match) return V6_TOKENS[i] ?? match[0];
  }
  return null;
};

/**
 * Best-effort `data` key/value hints.
 *
 * The block regex is non-greedy to the first `}`, so a nested object or a `}`
 * inside a string truncates the block and later keys in it are missed. That is
 * acceptable BY DESIGN, and the design decision is the point: every consumer
 * treats this as a hint, and the Markers tab's "Add a label the scan missed"
 * input is the real completeness guarantee. A truncated block can also surface a
 * spurious inner key (`data: { a: { b: 1 } }` offers both `a` and `b`), which
 * costs one unused row in a dropdown. Randomization, conditional nodes,
 * and timeline variables make the full value set unknowable statically no matter
 * how good the parser is — so a brace-matching scanner would buy precision that
 * nothing downstream is able to spend.
 */
const collectDataKeys = (source: string): Record<string, string[]> => {
  const dataKeys: Record<string, string[]> = {};
  DATA_BLOCK.lastIndex = 0;
  let block: RegExpExecArray | null = DATA_BLOCK.exec(source);
  while (block) {
    const body = block[1];
    PROPERTY.lastIndex = 0;
    let property: RegExpExecArray | null = PROPERTY.exec(body);
    while (property) {
      const [, key, single, double, template] = property;
      const values = (dataKeys[key] ??= []);
      const value = single ?? double ?? template;
      if (value !== undefined && !values.includes(value)) values.push(value);
      property = PROPERTY.exec(body);
    }
    block = DATA_BLOCK.exec(source);
  }
  return dataKeys;
};

const collectMissingPluginGlobals = (
  source: string,
  shippedPluginGlobals: string[]
): string[] => {
  const shipped = new Set(shippedPluginGlobals);
  const missing = new Set<string>();
  PLUGIN_GLOBAL.lastIndex = 0;
  let match: RegExpExecArray | null = PLUGIN_GLOBAL.exec(source);
  while (match) {
    const name = match[0];
    if (!shipped.has(name) && !ALWAYS_INSTALLED.has(name)) missing.add(name);
    match = PLUGIN_GLOBAL.exec(source);
  }
  return [...missing].sort();
};

export const scanTimelineSource = (
  source: string,
  shippedPluginGlobals: string[]
): TimelineScan => ({
  v6Token: findV6Token(source),
  dataKeys: collectDataKeys(source),
  missingPluginGlobals: collectMissingPluginGlobals(
    source,
    shippedPluginGlobals
  ),
});
