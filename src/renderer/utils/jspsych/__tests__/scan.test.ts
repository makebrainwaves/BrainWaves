import { describe, it, expect } from 'vitest';
import { scanTimelineSource } from '../scan';

const SHIPPED = ['jsPsychHtmlKeyboardResponse', 'jsPsychImageKeyboardResponse'];

describe('scanTimelineSource — v6 rejection', () => {
  it('rejects jsPsych.init(...)', () => {
    expect(
      scanTimelineSource('jsPsych.init({ timeline: [] });', SHIPPED).v6Token
    ).toBe('jsPsych.init');
  });

  it('rejects jsPsych.NO_KEYS and jsPsych.ALL_KEYS', () => {
    expect(scanTimelineSource('choices: jsPsych.NO_KEYS', SHIPPED).v6Token).toBe(
      'jsPsych.NO_KEYS'
    );
    expect(
      scanTimelineSource('choices: jsPsych.ALL_KEYS', SHIPPED).v6Token
    ).toBe('jsPsych.ALL_KEYS');
  });

  it('rejects string plugin types', () => {
    expect(
      scanTimelineSource(
        "var t = { type: 'html-keyboard-response', stimulus: 'hi' };",
        SHIPPED
      ).v6Token
    ).toBe("type: 'html-keyboard-response'");
  });

  it('accepts a v8 file', () => {
    const source = `
      const jsPsych = initJsPsych({});
      const trial = { type: jsPsychHtmlKeyboardResponse, stimulus: 'hi' };
      jsPsych.run([trial]);
    `;
    expect(scanTimelineSource(source, SHIPPED).v6Token).toBeNull();
  });
});

describe('scanTimelineSource — data keys', () => {
  it('collects keys and their string values from data object literals', () => {
    const source = `
      const a = { type: jsPsychImageKeyboardResponse,
        data: { condition: 'Face', phase: 'practice' } };
      const b = { type: jsPsychImageKeyboardResponse,
        data: { condition: "House", correct: true } };
    `;
    expect(scanTimelineSource(source, SHIPPED).dataKeys).toEqual({
      condition: ['Face', 'House'],
      phase: ['practice'],
      correct: [],
    });
  });

  it('records a key with no literal values when the value is dynamic', () => {
    // The key is real; its values only exist at runtime. The Markers tab is
    // where the teacher adds the values the scan could not see.
    expect(
      scanTimelineSource(
        `const a = { data: { condition: jsPsych.timelineVariable('cond') } };`,
        SHIPPED
      ).dataKeys
    ).toEqual({ condition: [] });
  });

  it('returns no keys for a timeline with no data parameter', () => {
    expect(
      scanTimelineSource('const a = { stimulus: "hi" };', SHIPPED).dataKeys
    ).toEqual({});
  });
});

describe('scanTimelineSource — missing plugin globals', () => {
  it('names every referenced plugin global this build does not ship', () => {
    const source = `
      const a = { type: jsPsychHtmlKeyboardResponse };
      const b = { type: jsPsychSurveyText };
      const c = { type: jsPsychVideoButtonResponse };
    `;
    expect(scanTimelineSource(source, SHIPPED).missingPluginGlobals).toEqual([
      'jsPsychSurveyText',
      'jsPsychVideoButtonResponse',
    ]);
  });

  it('does not report jsPsychModule, which the host always installs', () => {
    expect(
      scanTimelineSource('jsPsychModule.ParameterType.HTML_STRING', SHIPPED)
        .missingPluginGlobals
    ).toEqual([]);
  });

  it('reports nothing when every referenced plugin ships', () => {
    expect(
      scanTimelineSource(
        'const a = { type: jsPsychImageKeyboardResponse };',
        SHIPPED
      ).missingPluginGlobals
    ).toEqual([]);
  });
});
