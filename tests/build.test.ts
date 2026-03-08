import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

describe('Build output verification', () => {
  it('out/main/index.js exists after build', () => {
    expect(existsSync(path.join(root, 'out/main/index.js'))).toBe(true);
  });

  it('out/renderer/index.html exists after build', () => {
    expect(existsSync(path.join(root, 'out/renderer/index.html'))).toBe(true);
  });
});
