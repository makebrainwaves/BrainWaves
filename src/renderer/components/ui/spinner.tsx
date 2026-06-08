import * as React from 'react';
import { cn } from './utils';

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  /** Diameter in pixels. Defaults to 24. */
  size?: number;
}

/**
 * Lightweight loading spinner — no extra icon dependency. Uses Tailwind's
 * `animate-spin` on an SVG arc; the colour follows `currentColor` and defaults
 * to the brand teal, so it can be re-tinted via className (e.g. `text-white`).
 */
function Spinner({ size = 24, className, ...props }: SpinnerProps) {
  return (
    <svg
      role="status"
      aria-label="Loading"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('animate-spin text-brand', className)}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="4"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { Spinner };
