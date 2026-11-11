/**
 * Extra tokens a subsea scene needs beyond the shared scene palette, one per network so each can
 * be told apart. Resolve them outside the canvas with `useTokenColors(SUBSEA_TOKENS, ref)` and
 * pass the result to `SubseaFieldScene`. Colour is never the only cue: lines are listed by name.
 */
export const SUBSEA_TOKENS = {
  production: 'chart-1-450',
  injection: 'chart-2-450',
  control: 'chart-3-450',
  mooring: 'chart-neutral-450',
} as const;
