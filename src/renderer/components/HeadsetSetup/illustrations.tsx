import React from 'react';

const LINE = { stroke: '#1a1a1a', strokeWidth: 1.5 } as const;

/** Numbered callout that pairs a spot on the drawing with a written cue. */
function Callout({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={11} fill="#fff" {...LINE} />
      <text
        x={x}
        y={y + 4.5}
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="#1a1a1a"
      >
        {n}
      </text>
    </g>
  );
}

/**
 * Muse worn, three-quarter view: sensor strip across the forehead (1), arms
 * over the ears (2), rubber sensors behind the ears (3). Decorative: the
 * numbered cues beside it carry the information.
 */
export function MuseWearArt({ className }: { className?: string }) {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 240 200" className={className}>
      <ellipse
        cx="120"
        cy="108"
        rx="62"
        ry="76"
        className="fill-accent-light"
        {...LINE}
      />
      <ellipse
        cx="58"
        cy="118"
        rx="9"
        ry="16"
        className="fill-accent-light"
        {...LINE}
      />
      <ellipse
        cx="182"
        cy="118"
        rx="9"
        ry="16"
        className="fill-accent-light"
        {...LINE}
      />
      <path d="M96 118 q6 5 12 0 M132 118 q6 5 12 0" {...LINE} />
      <path d="M112 150 q8 6 16 0" {...LINE} />
      <path
        d="M64 86 Q120 62 176 86 L176 98 Q120 74 64 98 Z"
        className="fill-accent"
        {...LINE}
      />
      <path d="M64 92 Q52 104 56 132" {...LINE} strokeWidth={5} />
      <path d="M176 92 Q188 104 184 132" {...LINE} strokeWidth={5} />
      <circle cx="54" cy="136" r="5" fill="#1a1a1a" />
      <circle cx="186" cy="136" r="5" fill="#1a1a1a" />
      <Callout x={120} y={46} n={1} />
      <Callout x={30} y={96} n={2} />
      <Callout x={210} y={150} n={3} />
    </svg>
  );
}

/**
 * Neurosity Crown worn, side view: front rests on the forehead (1), sensor
 * arms curve over the top and back (2), tips reach the scalp (3). Decorative.
 */
export function CrownWearArt({ className }: { className?: string }) {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 240 200" className={className}>
      <path
        d="M78 176 Q60 150 64 112 Q70 48 132 40 Q192 40 196 104 Q198 130 186 150 L176 150 L172 176 Z"
        className="fill-accent-light"
        {...LINE}
      />
      <path d="M186 116 l12 10 l-12 4" {...LINE} />
      <ellipse
        cx="116"
        cy="112"
        rx="10"
        ry="16"
        className="fill-accent-light"
        {...LINE}
      />
      <path
        d="M186 84 Q170 30 116 34 Q70 38 62 90 L74 94 Q82 50 118 46 Q164 44 176 88 Z"
        className="fill-accent"
        {...LINE}
      />
      {[
        [92, 54],
        [118, 48],
        [146, 52],
        [70, 82],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y + 6} r="3.5" fill="#1a1a1a" />
      ))}
      <Callout x={214} y={74} n={1} />
      <Callout x={120} y={16} n={2} />
      <Callout x={36} y={80} n={3} />
    </svg>
  );
}

/** Small device glyph for the choose-headset cards. Decorative. */
export function HeadsetGlyph({ kind }: { kind: 'muse' | 'crown' }) {
  return (
    <svg
      aria-hidden
      fill="none"
      viewBox="0 0 64 48"
      className="h-[48px] w-[64px]"
    >
      {kind === 'muse' ? (
        <>
          <path
            d="M8 22 Q32 6 56 22 L56 28 Q32 12 8 28 Z"
            className="fill-accent"
            {...LINE}
          />
          <path
            d="M8 26 Q4 34 8 42 M56 26 Q60 34 56 42"
            {...LINE}
            strokeWidth={3}
          />
        </>
      ) : (
        <>
          <path
            d="M6 40 Q8 8 32 6 Q56 8 58 40 L50 40 Q48 16 32 14 Q16 16 14 40 Z"
            className="fill-accent"
            {...LINE}
          />
          <circle cx="20" cy="22" r="2.5" fill="#1a1a1a" />
          <circle cx="32" cy="16" r="2.5" fill="#1a1a1a" />
          <circle cx="44" cy="22" r="2.5" fill="#1a1a1a" />
        </>
      )}
    </svg>
  );
}
