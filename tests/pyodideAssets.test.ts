import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

/**
 * Guards the contract between where electron-builder *puts* the Pyodide payload
 * and where the main process *looks* for it.
 *
 * These two live in different files with no shared constant, and a mismatch is
 * invisible in dev (which reads from the source tree) while breaking prod
 * completely — the renderer's web worker gets 404s for every wheel and analysis
 * never starts. That exact mismatch shipped once; see the "Pyodide Asset Serving"
 * entry in .llms/learnings.md.
 *
 * Static source checks, so they need no build and run in the default suite.
 */

// process.cwd(), not __dirname — test files are ESM, where __dirname is undefined.
const repoRoot = process.cwd();

const packageJson = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')
);
const mainSource = fs.readFileSync(
  path.join(repoRoot, 'src/main/index.ts'),
  'utf8'
);

/** The `const pyodideRoot = is.dev ? ... : ...;` statement in src/main/index.ts. */
const pyodideRootDecl = mainSource.match(/const pyodideRoot =[\s\S]*?;/)?.[0];

/** Strip leading `./` and trailing `/` so path spellings compare equal. */
const normalize = (p: string) => p.replace(/^\.\//, '').replace(/\/$/, '');

describe('Pyodide asset path contract (package.json ↔ main process)', () => {
  const extraResource = (
    packageJson.build.extraResources as Array<{ from: string; to: string }>
  ).find((entry) => entry.from.includes('webworker'));

  it('package.json still ships the webworker payload via extraResources', () => {
    expect(extraResource).toBeDefined();
  });

  it('main process declares pyodideRoot with a dev and a prod branch', () => {
    expect(pyodideRootDecl).toBeDefined();
    expect(pyodideRootDecl).toContain('is.dev');
  });

  it('prod root matches the extraResources destination folder', () => {
    // package.json copies webworker/src -> resources/<to>; the handler resolves
    // path.join(process.resourcesPath, '<name>'). These must be the same name.
    const prodName = pyodideRootDecl?.match(
      /path\.join\(process\.resourcesPath,\s*'([^']+)'\)/
    )?.[1];

    expect(
      prodName,
      'could not find path.join(process.resourcesPath, ...) in the pyodideRoot declaration'
    ).toBeDefined();
    expect(normalize(prodName as string)).toBe(normalize(extraResource!.to));
  });

  it('dev root matches the extraResources source folder', () => {
    const devPath = pyodideRootDecl?.match(
      /path\.join\(app\.getAppPath\(\),\s*'([^']+)'\)/
    )?.[1];

    expect(
      devPath,
      'could not find path.join(app.getAppPath(), ...) in the pyodideRoot declaration'
    ).toBeDefined();
    expect(normalize(devPath as string)).toBe(normalize(extraResource!.from));
  });

  it('the dev root is the directory the install scripts write into', () => {
    // InstallPyodide.mjs / InstallMNE.mjs are the only producers of this payload.
    const installMne = fs.readFileSync(
      path.join(repoRoot, 'internals/scripts/InstallMNE.mjs'),
      'utf8'
    );
    const devPath = normalize(
      pyodideRootDecl?.match(
        /path\.join\(app\.getAppPath\(\),\s*'([^']+)'\)/
      )?.[1] as string
    );

    expect(installMne).toContain(`${devPath}/pyodide`);
    expect(installMne).toContain(`${devPath}/packages`);
  });
});

describe('pyodide:// scheme registration', () => {
  it('is registered as a privileged scheme before app ready', () => {
    // Without this the worker cannot fetch over pyodide:// at all.
    expect(mainSource).toContain("scheme: 'pyodide'");
    expect(mainSource).toContain("protocol.handle('pyodide'");
  });
});
