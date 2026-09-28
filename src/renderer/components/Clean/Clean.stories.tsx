import React, { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { fn } from 'storybook/test';
import AppShell from '../AppShell/AppShell';
import type { Area } from '../AppShell/types';
import CleanDatasetSelect from './CleanDatasetSelect';
import CleanReview, {
  CleanConfirm,
  CleanSuggestion,
  SaveState,
} from './CleanReview';
import { PrimerStep } from './CleanPrimer';
import {
  EXAMPLE_EPOCH_ARRAYS,
  FACES_HOUSES_CODE_TO_LABEL,
  RAW_RECORDINGS,
  SUGGESTED_REJECTIONS,
  WORKSPACE_TITLE,
  RawRecording,
} from './fixtures';

interface ChromeParameters {
  /** Shell badges for the story's data state (`useWorkspaceProgress.summarize`). */
  badges?: Partial<Record<Area, string[]>>;
  nextArea?: Area;
}

/**
 * Storybook deep-merges object parameters, so stories set `badges` whole and
 * the fresh-workspace default lives here rather than in `meta.parameters`.
 *
 * The real chrome around Clean: AppShell at `clean` with the story's workspace
 * facts. Clean has no tab bar; the screen fills the rest without page scroll.
 */
const withCleanChrome: Decorator = (Story, { parameters }) => {
  const {
    badges = { collect: ['4 recordings'] },
    nextArea = 'clean',
  } = parameters as ChromeParameters;
  return (
    <MemoryRouter>
      <AppShell
        location="clean"
        workspace={{
          name: WORKSPACE_TITLE,
          experimentType: 'Faces/Houses',
          modality: 'eeg',
        }}
        device="connected"
        deviceName="Muse 2"
        badges={badges}
        nextArea={nextArea}
      >
        <Story />
      </AppShell>
    </MemoryRouter>
  );
};

const meta: Meta = {
  title: 'Domain/Clean',
  parameters: { layout: 'fullscreen' },
  decorators: [withCleanChrome],
};
export default meta;
type Story = StoryObj;

/** Dataset selection with local state; the reveal and delete confirm are live. */
function SelectHarness({
  recordings,
  initialShowIncomplete = false,
}: {
  recordings: RawRecording[];
  initialShowIncomplete?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(recordings[0].key);
  const [showIncomplete, setShowIncomplete] = useState(initialShowIncomplete);
  const [deleting, setDeleting] = useState<RawRecording | null>(null);
  return (
    <CleanDatasetSelect
      recordings={recordings}
      selected={selected}
      onSelectChange={setSelected}
      showIncomplete={showIncomplete}
      onShowIncompleteChange={setShowIncomplete}
      deletingRecording={deleting}
      onDeleteRequest={setDeleting}
      onDeleteConfirm={() => setDeleting(null)}
      onDeleteCancel={() => setDeleting(null)}
      onStart={fn()}
    />
  );
}

interface ReviewHarnessProps {
  status?: 'ready' | 'loading' | 'no-epochs';
  rejected?: number[];
  badChannels?: string[];
  suggestions?: CleanSuggestion[];
  saveState?: SaveState;
  confirm?: CleanConfirm | null;
  primerOpen?: boolean;
  primerStep?: PrimerStep;
}

/** Review with local state: exclusion clicks, suggestions, save and dialogs are live. */
function ReviewHarness({
  status = 'ready',
  rejected = [],
  badChannels = [],
  suggestions = [],
  saveState = 'idle',
  confirm = null,
  primerOpen = false,
  primerStep = 1,
}: ReviewHarnessProps) {
  const [rejectedSet, setRejectedSet] = useState(
    () =>
      new Set([
        ...rejected,
        // An accepted suggestion is excluded — the sets never disagree.
        ...suggestions.filter((s) => s.accepted).map((s) => s.index),
      ])
  );
  const [badChannelSet, setBadChannelSet] = useState(() => new Set(badChannels));
  const [suggestionState, setSuggestionState] = useState(suggestions);
  const [threshold, setThreshold] = useState(100);
  const [save, setSave] = useState(saveState);
  const [dialog, setDialog] = useState<CleanConfirm | null>(confirm);
  const [primer, setPrimer] = useState(primerOpen);
  const [step, setStep] = useState<PrimerStep>(primerStep);
  return (
    <CleanReview
      dataset={{ subject: 'P01', recording: 'P01-A-1-raw.csv' }}
      status={status}
      epochArrays={status === 'ready' ? EXAMPLE_EPOCH_ARRAYS : null}
      codeToLabel={FACES_HOUSES_CODE_TO_LABEL}
      rejected={rejectedSet}
      badChannels={badChannelSet}
      onToggleEpoch={(index) => {
        setPrimer(false);
        setRejectedSet((prev) => {
          const next = new Set(prev);
          if (next.has(index)) {
            next.delete(index);
          } else {
            next.add(index);
          }
          return next;
        });
      }}
      onToggleChannel={(name) => {
        setPrimer(false);
        const next = new Set(badChannelSet);
        const adding = !next.has(name);
        if (adding) {
          next.add(name);
        } else {
          next.delete(name);
        }
        setBadChannelSet(next);
        // Dropping more than one of four sensors is informational (existing
        // behavior): the flag applies either way, the dialog just warns.
        if (adding && next.size > 1) {
          setDialog('dropChannels');
        }
      }}
      autoFlagThreshold={threshold}
      onThresholdChange={setThreshold}
      suggestions={suggestionState}
      onAcceptSuggestion={(index) => {
        setPrimer(false);
        setRejectedSet((prev) => new Set(prev).add(index));
        setSuggestionState((prev) =>
          prev.map((s) => (s.index === index ? { ...s, accepted: true } : s))
        );
      }}
      onRestoreSuggestion={(index) => {
        setPrimer(false);
        setRejectedSet((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
        setSuggestionState((prev) =>
          prev.map((s) => (s.index === index ? { ...s, accepted: false } : s))
        );
      }}
      onSuggest={() =>
        setSuggestionState(
          SUGGESTED_REJECTIONS.map((s) => ({ ...s, accepted: false }))
        )
      }
      saveState={save}
      onApply={() => {
        if (rejectedSet.size >= EXAMPLE_EPOCH_ARRAYS.meta.n_epochs) {
          setDialog('rejectAll');
        } else {
          setSave('saving');
        }
      }}
      onSave={() => {
        if (rejectedSet.size >= EXAMPLE_EPOCH_ARRAYS.meta.n_epochs) {
          setDialog('rejectAll');
        } else if (rejectedSet.size > 0) {
          setDialog('removeSelected');
        } else if (badChannelSet.size > 0) {
          setDialog('applyChannels');
        } else {
          setSave('saving');
        }
      }}
      onRetrySave={() => setSave('saving')}
      onGoToAnalyze={fn()}
      onGoToCollect={fn()}
      onBackToSelection={fn()}
      confirm={dialog}
      onConfirmAccept={() => {
        setDialog(null);
        setSave('saving');
      }}
      onConfirmCancel={() => setDialog(null)}
      primerOpen={primer}
      primerStep={step}
      onPrimerOpenChange={setPrimer}
      onPrimerStepChange={setStep}
    />
  );
}

/** C01 — Pick a complete raw recording: ordinary list only, one primary Start cleaning. */
export const DatasetSelect: Story = {
  render: () => (
    <SelectHarness
      recordings={RAW_RECORDINGS.filter((recording) => !recording.incomplete)}
    />
  ),
};

/** C02 — Ended-early recordings hidden by default; reveal marks them incomplete and deletes with a confirm. */
export const DatasetSelectWithIncomplete: Story = {
  render: () => <SelectHarness recordings={RAW_RECORDINGS} />,
};

/** C03 — Loading epochs, said out loud; the rail stays usable. */
export const Loading: Story = {
  render: () => <ReviewHarness status="loading" />,
};

/** C04 — The recording produced no usable epochs: why, and what to do next. */
export const NoEpochs: Story = {
  render: () => <ReviewHarness status="no-epochs" />,
};

/** C05 — First view of review: the compact primer teaching the cleaning loop, pointing at the reviewer. */
export const Primer: Story = {
  render: () => <ReviewHarness primerOpen primerStep={1} />,
};

/** C06 — Review: the Epoch Reviewer and the Live ERP as a coordinated pair, with the controls rail. */
export const Review: Story = {
  render: () => <ReviewHarness />,
};

/** C07 — Four trials left out and one sensor flagged: the Live ERP is visibly cleaner, counts in words. */
export const ReviewWithSelections: Story = {
  render: () => (
    <ReviewHarness
      rejected={[2, 5, 11, 19]}
      badChannels={['AF7']}
      suggestions={SUGGESTED_REJECTIONS.map((s) => ({
        ...s,
        accepted: s.index === 3,
      }))}
    />
  ),
};

/** C08 — Auto-flag output as suggestions: distinct from your own exclusions, with accept and restore. */
export const AutoFlagSuggestions: Story = {
  render: () => (
    <ReviewHarness
      suggestions={SUGGESTED_REJECTIONS.map((s) => ({
        ...s,
        accepted: s.index === 3,
      }))}
    />
  ),
};

/** C09 — The reject-all confirmation, restyled as a dialog with a destructive confirm. */
export const ConfirmRejectAll: Story = {
  render: () => (
    <ReviewHarness
      rejected={Array.from(
        { length: EXAMPLE_EPOCH_ARRAYS.meta.n_epochs },
        (_, i) => i
      )}
      confirm="rejectAll"
    />
  ),
};

/** C10 — Flagging more than one of four sensors: the drop-channels caution, restyled. */
export const ConfirmDropChannels: Story = {
  render: () => (
    <ReviewHarness badChannels={['AF7', 'AF8']} confirm="dropChannels" />
  ),
};

/** C11 — Save in progress, said in words; the original recording is unchanged. */
export const Saving: Story = {
  render: () => <ReviewHarness rejected={[2, 5]} saveState="saving" />,
};

/** C12 — Save failed: nothing written, with Try again. */
export const SaveFailed: Story = {
  render: () => <ReviewHarness rejected={[2, 5]} saveState="failed" />,
};

/** C13 — Saved: success in words, pointing to Analyze as the next step. */
export const Saved: Story = {
  parameters: {
    badges: { collect: ['4 recordings'], clean: ['1 cleaned'] },
    nextArea: 'analyze',
  },
  render: () => <ReviewHarness rejected={[2, 5]} saveState="saved" />,
};
