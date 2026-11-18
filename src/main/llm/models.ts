/**
 * Small instruct models the app can use, best first (both Apache-2.0). They
 * only phrase feedback the rules engine already decided, so 2-4B is enough.
 * `minRamGB` is total system RAM: the model plus Electron, Pyodide and MNE.
 */
export const LLM_MODEL_TIERS = [
  { file: 'Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf', sizeGB: 2.5, minRamGB: 8 },
  { file: 'Qwen_Qwen3.5-2B-Q4_K_M.gguf', sizeGB: 1.4, minRamGB: 4 },
] as const;

/** Picks the best installed tier this machine can hold, or undefined. */
export function pickModelFile(
  installed: ReadonlySet<string>,
  totalRamBytes: number
): string | undefined {
  const ramGB = totalRamBytes / 1024 ** 3;
  return LLM_MODEL_TIERS.find(
    // 0.5 GB slack: an "8 GB" machine can report slightly less than 8 GiB.
    (tier) => installed.has(tier.file) && ramGB + 0.5 >= tier.minRamGB
  )?.file;
}
