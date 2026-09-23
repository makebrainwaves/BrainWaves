import { useEffect, useState } from 'react';
import {
  readWorkspaceRawEEGData,
  readWorkspaceCleanedEEGData,
  readWorkspaceBehaviorData,
} from '../../utils/filesystem/storage';
import { Area, Modality } from './types';

/** Factual pills per area plus the single recommended next step. */
export interface WorkspaceProgress {
  badges: Partial<Record<Area, string[]>>;
  next?: Area;
  /** Raw file counts, or null while the workspace folder has not been read. */
  counts: WorkspaceCounts | null;
}

/** File counts a workspace folder yields; all zero on a first-run workspace. */
export interface WorkspaceCounts {
  raw: number;
  cleaned: number;
  behavior: number;
}

const EMPTY: WorkspaceProgress = { badges: {}, counts: null };

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

/**
 * Pure progress rule: which badges to show and where to point next.
 * Behavior-only workspaces count behavioral CSVs as recordings and never
 * recommend Clean, since they have no Clean area.
 */
export function summarize(
  counts: WorkspaceCounts,
  modality: Modality
): WorkspaceProgress {
  const isEeg = modality === 'eeg';
  const recordings = isEeg ? counts.raw : counts.behavior;
  const badges: Partial<Record<Area, string[]>> = {};
  if (recordings > 0) badges.collect = [plural(recordings, 'recording')];
  if (isEeg && counts.cleaned > 0) badges.clean = [`${counts.cleaned} cleaned`];

  if (recordings === 0) return { badges, next: 'collect', counts };
  if (isEeg && counts.cleaned === 0) return { badges, next: 'clean', counts };
  return { badges, next: 'analyze', counts };
}

/**
 * Reads the workspace folder and derives AppShell's `badges` / `nextArea`.
 * Refreshes on navigation; an unreadable or missing folder counts as zero.
 */
export function useWorkspaceProgress(
  title: string | undefined,
  modality: Modality,
  pathname: string
): WorkspaceProgress {
  const [progress, setProgress] = useState<WorkspaceProgress>(EMPTY);

  useEffect(() => {
    if (!title) {
      setProgress(EMPTY);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      let counts: WorkspaceCounts = { raw: 0, cleaned: 0, behavior: 0 };
      try {
        const [raw, cleaned, behavior] = await Promise.all([
          readWorkspaceRawEEGData(title),
          readWorkspaceCleanedEEGData(title),
          readWorkspaceBehaviorData(title),
        ]);
        counts = {
          raw: raw?.length ?? 0,
          cleaned: cleaned?.length ?? 0,
          behavior: behavior?.length ?? 0,
        };
      } catch {
        // A workspace folder that does not exist yet is the normal first-run state.
      }
      if (!cancelled) setProgress(summarize(counts, modality));
    })();
    return () => {
      cancelled = true;
    };
  }, [title, modality, pathname]);

  return progress;
}
