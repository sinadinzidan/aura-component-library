/**
 * Shared vocabulary for every industrial component: tones, limits, zones, run states and the
 * token classes each tone maps to. Keep status decisions here so a value that is "warning" in a
 * KPI tile is the same orange in a gauge, a sparkline and a status dot.
 */

export type Tone = 'neutral' | 'success' | 'warning' | 'critical' | 'info';

/** Operating limits of a measurement. Any subset may be set. */
export type Limits = {
  /** Trip limit below `low`. */
  lowLow?: number;
  low?: number;
  high?: number;
  /** Trip limit above `high`. */
  highHigh?: number;
};

/** A stretch of a scale that carries a status. */
export type Zone = { from: number; to: number; tone: Tone };

/** Shape of a status dot. Shape repeats what colour says, so state survives without colour. */
export type DotShape = 'dot' | 'ring' | 'square' | 'diamond';

/** Everything needed to draw a status: spread it into `StatusIndicator` or `StatusDot`. */
export type StatusDescriptor = { tone: Tone; label: string; shape: DotShape };

export type RunState = 'running' | 'standby' | 'stopped' | 'tripped' | 'maintenance';
export type Health = 'good' | 'watch' | 'poor';
export type SignalQuality = 'good' | 'uncertain' | 'bad';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type GoodDirection = 'up' | 'down';

const MINUS = '\u2212';
export const NBSP = '\u00a0';
export const NO_VALUE = '\u2014';

/** Status text on a plain surface. */
export const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-neutral-foreground-strong',
  success: 'text-success-foreground-strong',
  warning: 'text-warning-foreground-strong',
  critical: 'text-critical-foreground-strong',
  info: 'text-info-foreground-strong',
};

/** A value readout: stays the normal text colour until its tone says otherwise. */
export const TONE_VALUE_TEXT: Record<Tone, string> = {
  neutral: 'text-base-foreground',
  success: 'text-success-foreground-strong',
  warning: 'text-warning-foreground-strong',
  critical: 'text-critical-foreground-strong',
  info: 'text-info-foreground-strong',
};

/** Tinted status surface with its matching text colour. */
export const TONE_SURFACE: Record<Tone, string> = {
  neutral: 'bg-neutral-background text-neutral-foreground',
  success: 'bg-success-background text-success-foreground',
  warning: 'bg-warning-background text-warning-foreground',
  critical: 'bg-critical-background text-critical-foreground',
  info: 'bg-info-background text-info-foreground',
};

/** Solid status fill for dots and other small HTML marks. */
export const TONE_DOT: Record<Tone, string> = {
  neutral: 'bg-neutral-foreground-strong',
  success: 'bg-success-foreground-strong',
  warning: 'bg-warning-foreground-strong',
  critical: 'bg-critical-foreground-strong',
  info: 'bg-info-foreground-strong',
};

/** Status outline for hollow dots. */
export const TONE_BORDER: Record<Tone, string> = {
  neutral: 'border-neutral-foreground-strong',
  success: 'border-success-foreground-strong',
  warning: 'border-warning-foreground-strong',
  critical: 'border-critical-foreground-strong',
  info: 'border-info-foreground-strong',
};

/**
 * Plotted marks (bars, arcs, lines). A neutral mark is the default data colour, `chart-1`;
 * the other tones use the status-coloured chart ramps.
 */
export const TONE_MARK_BG: Record<Tone, string> = {
  neutral: 'bg-chart-1-450',
  success: 'bg-chart-success-450',
  warning: 'bg-chart-warning-450',
  critical: 'bg-chart-critical-450',
  info: 'bg-chart-info-450',
};

export const TONE_MARK_STROKE: Record<Tone, string> = {
  neutral: 'stroke-chart-1-450',
  success: 'stroke-chart-success-450',
  warning: 'stroke-chart-warning-450',
  critical: 'stroke-chart-critical-450',
  info: 'stroke-chart-info-450',
};

export const TONE_MARK_FILL: Record<Tone, string> = {
  neutral: 'fill-chart-1-450',
  success: 'fill-chart-success-450',
  warning: 'fill-chart-warning-450',
  critical: 'fill-chart-critical-450',
  info: 'fill-chart-info-450',
};

/** Softer mark for bars that sit beside a stronger one. */
export const TONE_MARK_FILL_SOFT: Record<Tone, string> = {
  neutral: 'fill-chart-1-300',
  success: 'fill-chart-success-300',
  warning: 'fill-chart-warning-300',
  critical: 'fill-chart-critical-300',
  info: 'fill-chart-info-300',
};

export const TONE_MARK_BG_SOFT: Record<Tone, string> = {
  neutral: 'bg-chart-1-200',
  success: 'bg-chart-success-200',
  warning: 'bg-chart-warning-200',
  critical: 'bg-chart-critical-200',
  info: 'bg-chart-info-200',
};

/** The single permitted area fill under a line. */
export const TONE_AREA_FILL: Record<Tone, string> = {
  neutral: 'fill-chart-1-100',
  success: 'fill-chart-success-100',
  warning: 'fill-chart-warning-100',
  critical: 'fill-chart-critical-100',
  info: 'fill-chart-info-100',
};

/** Zone strips on gauges and bars. */
export const TONE_ZONE_BG: Record<Tone, string> = {
  neutral: 'bg-chart-neutral-200',
  success: 'bg-chart-success-400',
  warning: 'bg-chart-warning-400',
  critical: 'bg-chart-critical-400',
  info: 'bg-chart-info-400',
};

export const TONE_ZONE_STROKE: Record<Tone, string> = {
  neutral: 'stroke-chart-neutral-200',
  success: 'stroke-chart-success-400',
  warning: 'stroke-chart-warning-400',
  critical: 'stroke-chart-critical-400',
  info: 'stroke-chart-info-400',
};

/** Shared text styles, so labels, units and captions match across components. */
export const LABEL_TEXT = 'text-xs text-muted-foreground';
export const UNIT_TEXT = 'text-muted-foreground font-normal';
export const SCALE_TEXT = 'text-xs text-muted-foreground tabular-nums';

/**
 * Status of a value against its limits: critical at or beyond a trip limit, warning outside the
 * operating limits, otherwise `normal` (neutral by default, because normal is not news).
 */
export function toneFromLimits(value: number, limits: Limits, normal: Tone = 'neutral'): Tone {
  if (limits.highHigh !== undefined && value >= limits.highHigh) return 'critical';
  if (limits.lowLow !== undefined && value <= limits.lowLow) return 'critical';
  if (limits.high !== undefined && value > limits.high) return 'warning';
  if (limits.low !== undefined && value < limits.low) return 'warning';
  return normal;
}

/** Contiguous zones covering `min`–`max`, derived from limits. Limits outside the range are ignored. */
export function zonesFromLimits(min: number, max: number, limits: Limits): Zone[] {
  const inside = (limit: number | undefined): limit is number => limit !== undefined && limit > min && limit < max;
  const zones: Zone[] = [];
  let cursor = min;
  const push = (to: number, tone: Tone) => {
    if (to > cursor) zones.push({ from: cursor, to, tone });
    cursor = Math.max(cursor, to);
  };

  if (inside(limits.lowLow)) push(limits.lowLow, 'critical');
  if (inside(limits.low)) push(limits.low, 'warning');
  if (inside(limits.high)) push(limits.high, 'neutral');
  if (inside(limits.highHigh)) {
    push(limits.highHigh, limits.high === undefined ? 'neutral' : 'warning');
    push(max, 'critical');
  } else {
    push(max, inside(limits.high) ? 'warning' : 'neutral');
  }
  return zones;
}

/** Tone of the zone a value falls in; neutral when it is in none. */
export function toneFromZones(value: number, zones: readonly Zone[]): Tone {
  const last = zones[zones.length - 1];
  const zone = zones.find((candidate) => value >= candidate.from && value < candidate.to);
  if (zone) return zone.tone;
  if (last && value >= last.to) return last.tone;
  return 'neutral';
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Fixed decimals, thousands separators and a real minus sign. An em dash when there is no value. */
export function formatValue(value: number | null | undefined, decimals = 0): string {
  if (!isNumber(value)) return NO_VALUE;
  const text = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(value));
  const isZero = Number(text.replace(/,/g, '')) === 0;
  return value < 0 && !isZero ? `${MINUS}${text}` : text;
}

/** A signed change: "+0.8", "−1.4", and "0.0" without a sign when it rounds to nothing. */
export function formatDelta(delta: number | null | undefined, decimals = 0): string {
  if (!isNumber(delta)) return NO_VALUE;
  const text = formatValue(delta, decimals);
  return delta > 0 && Number(text.replace(/,/g, '')) !== 0 ? `+${text}` : text;
}

/** Value and unit joined by a non-breaking space: "48.6 barg". */
export function formatReading(value: number | null | undefined, unit?: string, decimals = 0): string {
  const text = formatValue(value, decimals);
  return unit && isNumber(value) ? `${text}${NBSP}${unit}` : text;
}

/** Whether a change is good news, given which direction is good. No direction, no judgement. */
export function deltaTone(delta: number, goodDirection?: GoodDirection): Tone {
  if (delta === 0 || goodDirection === undefined) return 'neutral';
  const isGood = goodDirection === 'up' ? delta > 0 : delta < 0;
  return isGood ? 'success' : 'critical';
}

/** The change between a value and its reference; `null` when a percent change has no base. */
export function computeDelta(value: number, reference: number, format: 'absolute' | 'percent' = 'absolute'): number | null {
  if (format === 'absolute') return value - reference;
  if (reference === 0) return null;
  return ((value - reference) / Math.abs(reference)) * 100;
}

const TONE_WORD: Record<Tone, string> = {
  neutral: '',
  success: 'normal',
  warning: 'warning',
  critical: 'critical',
  info: 'information',
};

/** Accessible name for a reading: "Discharge pressure: 48.6 barg, warning". */
export function describeReading(
  label: string,
  value: number | null | undefined,
  unit?: string,
  decimals = 0,
  tone: Tone = 'neutral'
): string {
  if (!isNumber(value)) return `${label}: no data`;
  const word = TONE_WORD[tone];
  return `${label}: ${formatReading(value, unit, decimals)}${word ? `, ${word}` : ''}`;
}

const RUN_STATE_STATUS: Record<RunState, StatusDescriptor> = {
  running: { tone: 'success', label: 'Running', shape: 'dot' },
  standby: { tone: 'info', label: 'Standby', shape: 'ring' },
  stopped: { tone: 'neutral', label: 'Stopped', shape: 'square' },
  tripped: { tone: 'critical', label: 'Tripped', shape: 'diamond' },
  maintenance: { tone: 'warning', label: 'Maintenance', shape: 'square' },
};

const HEALTH_STATUS: Record<Health, StatusDescriptor> = {
  good: { tone: 'success', label: 'Good', shape: 'dot' },
  watch: { tone: 'warning', label: 'Watch', shape: 'square' },
  poor: { tone: 'critical', label: 'Poor', shape: 'diamond' },
};

const QUALITY_STATUS: Record<SignalQuality, StatusDescriptor> = {
  good: { tone: 'success', label: 'Good', shape: 'dot' },
  uncertain: { tone: 'warning', label: 'Uncertain', shape: 'ring' },
  bad: { tone: 'critical', label: 'Bad', shape: 'diamond' },
};

const SEVERITY_STATUS: Record<Severity, StatusDescriptor> = {
  critical: { tone: 'critical', label: 'Critical', shape: 'diamond' },
  high: { tone: 'warning', label: 'High', shape: 'square' },
  medium: { tone: 'info', label: 'Medium', shape: 'dot' },
  low: { tone: 'neutral', label: 'Low', shape: 'ring' },
};

export const runStateStatus = (state: RunState): StatusDescriptor => RUN_STATE_STATUS[state];
export const healthStatus = (health: Health): StatusDescriptor => HEALTH_STATUS[health];
export const qualityStatus = (quality: SignalQuality): StatusDescriptor => QUALITY_STATUS[quality];
export const severityStatus = (severity: Severity): StatusDescriptor => SEVERITY_STATUS[severity];
