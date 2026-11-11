import type { Tone } from '../../industrial/status';

import type { ViewerPart, ViewerSystem } from './viewerModel';

export type ColorMode = 'none' | 'status' | 'system' | 'health';

export type ColorKey = 'steel' | Tone | 'sys1' | 'sys2' | 'sys3' | 'sys4' | 'sys5';

export const COLOR_MODES: readonly { value: ColorMode; label: string }[] = [
  { value: 'none', label: 'Material' },
  { value: 'status', label: 'Run state' },
  { value: 'system', label: 'System' },
  { value: 'health', label: 'Health' },
];

/** Design tokens each colour key resolves to for 3D materials. */
export const COLOR_KEY_TOKENS: Record<ColorKey, string> = {
  steel: 'muted-foreground',
  neutral: 'neutral-foreground-strong',
  success: 'success-foreground-strong',
  warning: 'warning-foreground-strong',
  critical: 'critical-foreground-strong',
  info: 'info-foreground-strong',
  sys1: 'chart-1-450',
  sys2: 'chart-2-450',
  sys3: 'chart-3-450',
  sys4: 'chart-4-450',
  sys5: 'chart-5-450',
};

/** Background classes for legend swatches. */
export const COLOR_KEY_BG: Record<ColorKey, string> = {
  steel: 'bg-chart-neutral-300',
  neutral: 'bg-neutral-foreground-strong',
  success: 'bg-success-foreground-strong',
  warning: 'bg-warning-foreground-strong',
  critical: 'bg-critical-foreground-strong',
  info: 'bg-info-foreground-strong',
  sys1: 'bg-chart-1-450',
  sys2: 'bg-chart-2-450',
  sys3: 'bg-chart-3-450',
  sys4: 'bg-chart-4-450',
  sys5: 'bg-chart-5-450',
};

export const SYSTEM_ORDER: readonly ViewerSystem[] = ['separation', 'compression', 'cooling', 'piping', 'structure'];

const SYSTEM_KEYS: Record<ViewerSystem, ColorKey> = { separation: 'sys1', compression: 'sys2', cooling: 'sys3', piping: 'sys4', structure: 'sys5' };

const STATUS_KEYS: Record<ViewerPart['status'], ColorKey> = { running: 'success', standby: 'info', stopped: 'neutral', tripped: 'critical' };
const HEALTH_KEYS: Record<ViewerPart['health'], ColorKey> = { good: 'success', watch: 'warning', poor: 'critical' };

/** The colour a part takes in a mode. Material mode leaves everything steel. */
export function colorKeyFor(part: ViewerPart, mode: ColorMode): ColorKey {
  switch (mode) {
    case 'none':
      return 'steel';
    case 'status':
      return STATUS_KEYS[part.status];
    case 'system':
      return SYSTEM_KEYS[part.system];
    case 'health':
      return HEALTH_KEYS[part.health];
  }
}

export type LegendEntry = { key: ColorKey; label: string };

const SYSTEM_LABELS: Record<ViewerSystem, string> = { separation: 'Separation', compression: 'Compression', cooling: 'Cooling and lube', piping: 'Piping', structure: 'Structure' };
export const systemLabel = (system: ViewerSystem): string => SYSTEM_LABELS[system];

/** The legend of a mode, in reading order. Material mode has none. */
export function legendFor(mode: ColorMode): LegendEntry[] {
  switch (mode) {
    case 'none':
      return [];
    case 'status':
      return [
        { key: 'success', label: 'Running' },
        { key: 'info', label: 'Standby' },
        { key: 'neutral', label: 'Stopped' },
        { key: 'critical', label: 'Tripped' },
      ];
    case 'system':
      return SYSTEM_ORDER.map((system) => ({ key: SYSTEM_KEYS[system], label: SYSTEM_LABELS[system] }));
    case 'health':
      return [
        { key: 'success', label: 'Good' },
        { key: 'warning', label: 'Watch' },
        { key: 'critical', label: 'Poor' },
      ];
  }
}

/** The legend entries that apply to at least one of the parts, so the legend never promises a colour that is not there. */
export function legendInUse(mode: ColorMode, parts: readonly ViewerPart[]): LegendEntry[] {
  const used = new Set(parts.map((part) => colorKeyFor(part, mode)));
  return legendFor(mode).filter((entry) => used.has(entry.key));
}
