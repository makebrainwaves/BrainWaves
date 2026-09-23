import { describe, it, expect } from 'vitest';
import { suggestWorkspaceName, workspaceNameProblem } from './workspaceName';

describe('suggestWorkspaceName', () => {
  it('uses the bare template name when free', () => {
    expect(suggestWorkspaceName('Faces_Houses', ['Stroop'])).toEqual({
      name: 'Faces_Houses',
      taken: [],
    });
  });

  it('skips taken names case-insensitively and stops at the first gap', () => {
    expect(
      suggestWorkspaceName('Faces_Houses', [
        'faces_houses',
        'Faces_Houses_2',
        'Faces_Houses_4',
      ])
    ).toEqual({
      name: 'Faces_Houses_3',
      taken: ['Faces_Houses', 'Faces_Houses_2'],
    });
  });
});

describe('workspaceNameProblem', () => {
  const existing = ['Faces_Houses_2'];
  it.each([
    ['   ', 'empty'],
    ['my/study', 'illegal'],
    ['a:b', 'illegal'],
    [' FACES_HOUSES_2 ', 'taken'],
    ['Faces_Houses_3', undefined],
  ])('%j → %s', (name, problem) => {
    expect(workspaceNameProblem(name, existing)).toBe(problem);
  });
});
