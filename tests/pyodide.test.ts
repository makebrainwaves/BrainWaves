import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

describe('Pyodide setup', () => {
  it('webworker.js exists', () => {
    expect(
      existsSync(path.join(root, 'src/renderer/utils/pyodide/webworker.js'))
    ).toBe(true);
  });

  it('webworker.js uses loadPyodide API', () => {
    const src = readFileSync(
      path.join(root, 'src/renderer/utils/pyodide/webworker.js'),
      'utf-8'
    );
    expect(src).toContain('loadPyodide');
    expect(src).toContain('runPythonAsync');
  });

  it('utils.py does not use deprecated sns.tsplot', () => {
    const src = readFileSync(
      path.join(root, 'src/renderer/utils/pyodide/utils.py'),
      'utf-8'
    );
    expect(src).not.toContain('sns.tsplot');
  });

  it('utils.py uses lineplot/fill_between instead', () => {
    const src = readFileSync(
      path.join(root, 'src/renderer/utils/pyodide/utils.py'),
      'utf-8'
    );
    expect(src).toContain('fill_between');
  });

  it('InstallPyodide.js targets v0.27.0', () => {
    const src = readFileSync(
      path.join(root, 'internals/scripts/InstallPyodide.js'),
      'utf-8'
    );
    expect(src).toContain("PYODIDE_VERSION = '0.27.0'");
  });
});
