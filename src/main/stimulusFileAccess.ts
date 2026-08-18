import fs from 'fs';
import path from 'path';

export class StimulusFileAccess {
  private readonly directories = new Set<string>();

  constructor(private readonly storagePath: string) {
    for (const directory of this.loadDirectories()) {
      this.directories.add(directory);
    }
  }

  authorizeDirectory(directory: string): void {
    const canonical = fs.realpathSync(directory);
    if (!fs.statSync(canonical).isDirectory()) {
      throw new Error(
        'StimulusFileAccess.authorizeDirectory: expected a directory'
      );
    }
    if (this.directories.has(canonical)) return;

    this.directories.add(canonical);
    fs.mkdirSync(path.dirname(this.storagePath), { recursive: true });
    fs.writeFileSync(
      this.storagePath,
      JSON.stringify([...this.directories].sort())
    );
  }

  resolveUrl(requestUrl: string): string {
    const url = new URL(requestUrl);
    const requestedPath = url.searchParams.get('path');
    if (url.protocol !== 'bwfile:' || !requestedPath || !path.isAbsolute(requestedPath)) {
      throw new Error('StimulusFileAccess.resolveUrl: invalid stimulus URL');
    }

    const canonical = fs.realpathSync(requestedPath);
    const authorized = [...this.directories].some((directory) => {
      const relative = path.relative(directory, canonical);
      return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
    });
    if (!authorized) {
      throw new Error(
        'StimulusFileAccess.resolveUrl: file is not in an authorized directory'
      );
    }
    if (!fs.statSync(canonical).isFile()) {
      throw new Error('StimulusFileAccess.resolveUrl: expected a file');
    }
    return canonical;
  }

  private loadDirectories(): string[] {
    try {
      const stored = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
      if (!Array.isArray(stored)) return [];
      return stored.flatMap((directory) => {
        if (typeof directory !== 'string') return [];
        try {
          const canonical = fs.realpathSync(directory);
          return fs.statSync(canonical).isDirectory() ? [canonical] : [];
        } catch {
          return [];
        }
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      if (error instanceof SyntaxError) return [];
      throw error;
    }
  }
}
