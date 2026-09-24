import React from 'react';

/**
 * The app's one "preview, not recording" status. Same vocabulary as RunBar's
 * run status (glyph + bold uppercase label + muted detail), with an outline eye
 * glyph distinct from the red EEG dot and the square behavior-only glyph.
 */
export default function PreviewLabel() {
  return (
    <div
      role="status"
      aria-label="Preview, nothing is being recorded"
      className="flex items-center gap-[10px]"
    >
      <svg
        aria-hidden
        width="18"
        height="12"
        viewBox="0 0 18 12"
        className="flex-none text-ink"
      >
        <path
          d="M1 6c2-3.3 4.7-5 8-5s6 1.7 8 5c-2 3.3-4.7 5-8 5S3 9.3 1 6z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle cx="9" cy="6" r="2.25" fill="currentColor" />
      </svg>
      <span className="text-[14px] text-ink-muted">
        <b className="font-bold uppercase tracking-[0.5px] text-ink">Preview</b>
        {' · not recording'}
      </span>
    </div>
  );
}
