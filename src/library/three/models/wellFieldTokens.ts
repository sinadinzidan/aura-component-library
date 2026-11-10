/**
 * Extra tokens a well-field scene needs beyond the shared scene palette. Resolve them outside the
 * canvas with `useTokenColors(WELL_FIELD_TOKENS, ref)` and pass the result to `WellFieldScene`.
 */
export const WELL_FIELD_TOKENS = {
  producer: 'chart-1-450',
  injector: 'chart-2-450',
  horizon1: 'chart-3-450',
  horizon2: 'chart-4-450',
  horizon3: 'chart-5-450',
  horizon4: 'chart-neutral-450',
} as const;

/** Token keys for horizons, shallowest first; deeper horizons reuse the last one. */
export const HORIZON_TOKEN_KEYS = ['horizon1', 'horizon2', 'horizon3', 'horizon4'] as const;
