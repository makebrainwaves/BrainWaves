import React, { useState } from 'react';
import { Button } from './ui/button';
import PreviewLabel from './PreviewLabel';

interface Props {
  isPreviewing: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Offered next to the preview toggle. Becomes the one dominant action once
   * a preview has been started and stopped (or ran to the end).
   */
  onRunAndRecord?: () => void;
  /** Turns off starting a preview; Stop preview always stays available. */
  disabled?: boolean;
}

/** Preview toggle plus the shared preview status: `PreviewLabel` while previewing, a "nothing is recorded" note otherwise. */
export default function PreviewButton({
  isPreviewing,
  onClick,
  onRunAndRecord,
  disabled,
}: Props) {
  const [hasPreviewed, setHasPreviewed] = useState(false);
  if (isPreviewing && !hasPreviewed) setHasPreviewed(true);
  const runIsPrimary = Boolean(onRunAndRecord) && hasPreviewed;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {isPreviewing ? (
        <Button size="lg" variant="destructive" onClick={onClick}>
          Stop preview
        </Button>
      ) : (
        <>
          {runIsPrimary && (
            <Button size="lg" onClick={onRunAndRecord}>
              Run &amp; record
            </Button>
          )}
          <Button
            size="lg"
            variant={onRunAndRecord && !hasPreviewed ? 'default' : 'outline'}
            onClick={onClick}
            disabled={disabled}
          >
            {hasPreviewed ? 'Preview again' : 'Preview experiment'}
          </Button>
        </>
      )}
      {isPreviewing ? (
        <PreviewLabel />
      ) : (
        <span className="text-[15px] text-ink-muted">
          Nothing is recorded during a preview.
        </span>
      )}
    </div>
  );
}
