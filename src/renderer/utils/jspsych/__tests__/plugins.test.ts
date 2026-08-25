import { describe, it, expect } from 'vitest';
import jsPsychHtmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import { JSPSYCH_PLUGIN_GLOBALS } from '../plugins';

describe('JSPSYCH_PLUGIN_GLOBALS', () => {
  // These assert the DERIVATION against names upstream controls. An earlier
  // draft asserted "there are exactly 52 keys" and "every key round-trips
  // through camelCase(info.name)" against a hand-written key list — a test that
  // could only ever agree with itself, and that would need editing every time
  // jsPsych published a plugin. Deleted.
  it('exposes html-keyboard-response under the global a script timeline writes', () => {
    expect(JSPSYCH_PLUGIN_GLOBALS.jsPsychHtmlKeyboardResponse).toBe(
      jsPsychHtmlKeyboardResponse
    );
  });

  it('derives a jsPsych-prefixed CamelCase global for every shipped plugin', () => {
    const names = Object.keys(JSPSYCH_PLUGIN_GLOBALS);
    // Floor, not an exact count: publishing a 53rd plugin should not fail CI.
    expect(names.length).toBeGreaterThan(40);
    for (const name of names) {
      expect(name, name).toMatch(/^jsPsych[A-Z][A-Za-z0-9]*$/);
      expect(typeof JSPSYCH_PLUGIN_GLOBALS[name], name).toBe('function');
    }
  });
});
