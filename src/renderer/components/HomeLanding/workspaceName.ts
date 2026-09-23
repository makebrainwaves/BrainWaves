/**
 * Superset of `sanitizeTextInput`'s strip set plus Windows-illegal `\ : * ?`,
 * so an accepted name survives the existing sanitize step unchanged.
 */
const ILLEGAL_CHARS = /[|&;$%@"<>()+,./\\:*?]/;

export type NameProblem = 'empty' | 'illegal' | 'taken';

/**
 * Next free name for a template: `base` if unused, else `base_N` with the
 * lowest free N ≥ 2. `taken` lists the consecutive names that were skipped.
 * Comparison is case-insensitive (macOS/Windows folders are).
 */
export function suggestWorkspaceName(base: string, existing: string[]) {
  const used = new Set(existing.map((name) => name.toLowerCase()));
  const taken: string[] = [];
  let name = base;
  while (used.has(name.toLowerCase())) {
    taken.push(name);
    name = `${base}_${taken.length + 1}`;
  }
  return { name, taken };
}

export function workspaceNameProblem(
  name: string,
  existing: string[]
): NameProblem | undefined {
  const trimmed = name.trim();
  if (!trimmed) return 'empty';
  if (ILLEGAL_CHARS.test(trimmed)) return 'illegal';
  if (existing.some((e) => e.toLowerCase() === trimmed.toLowerCase()))
    return 'taken';
  return undefined;
}
