import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';

interface Props {
  isPreviewing: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Offered next to the preview toggle. Becomes the one dominant action once
   * a preview has been started and stopped (or ran to the end).
   */
  onRunAndRecord?: () => void;
}

/** Preview toggle plus the persistent "nothing is recorded" preview status. */
export default function PreviewButton({
  isPreviewing,
  onClick,
  onRunAndRecord,
}: Props) {
  const [hasPreviewed, setHasPreviewed] = useState(false);
  useEffect(() => {
    if (isPreviewing) setHasPreviewed(true);
  }, [isPreviewing]);
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
            variant={runIsPrimary || !onRunAndRecord ? 'outline' : 'default'}
            onClick={onClick}
          >
            {hasPreviewed ? 'Preview again' : 'Preview experiment'}
          </Button>
        </>
      )}
      <span role="status" className="text-[15px] text-ink-muted">
        {isPreviewing ? (
          <>
            <b className="tracking-[0.5px] text-ink">PREVIEW</b> · nothing is
            being recorded
          </>
        ) : (
          'Nothing is recorded during a preview.'
        )}
      </span>
    </div>
  );
}
