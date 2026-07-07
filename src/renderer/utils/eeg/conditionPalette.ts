// Canonical condition color palette — single source of truth for BOTH the React
// EpochReviewer (via cssColorForIndex) and the Python matplotlib plots
// (utils.py plot_topo/plot_conditions), which receive CONDITION_PALETTE_RGB
// JSON-injected by the worker. RGB components are 0..1 floats to match MNE/
// matplotlib's convention. Keep these values in sync across the WASM boundary
// by keeping this file the ONE place they are defined.
export const CONDITION_PALETTE_RGB: ReadonlyArray<
  readonly [number, number, number]
> = [
  [0.86, 0.37, 0.34],
  [0.34, 0.86, 0.37],
  [0.37, 0.34, 0.86],
  [0.86, 0.72, 0.34],
];

// CSS rgb() string for the i-th condition (cycles via modulo). Used by the
// canvas renderer to color epoch traces by their condition.
export function cssColorForIndex(index: number): string {
  const [r, g, b] =
    CONDITION_PALETTE_RGB[
      ((index % CONDITION_PALETTE_RGB.length) + CONDITION_PALETTE_RGB.length) %
        CONDITION_PALETTE_RGB.length
    ];
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}
