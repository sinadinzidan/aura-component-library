import type { ViewPresetId } from './viewCube';

export type ViewerCommand =
  | { type: 'mode'; mode: 'orbit' | 'pan' | 'zoom' }
  | { type: 'tool'; tool: 'select' | 'measure' | 'pin' }
  | { type: 'fit' }
  | { type: 'home' }
  | { type: 'preset'; preset: ViewPresetId }
  | { type: 'xray' }
  | { type: 'section' }
  | { type: 'help' }
  | { type: 'cancel' };

/** One row of the keyboard help: what the key does and the keys to press. */
export type Shortcut = { keys: readonly string[]; action: string; group: 'Navigate' | 'Tools' | 'View' };

export const VIEWER_SHORTCUTS: readonly Shortcut[] = [
  { keys: ['O'], action: 'Orbit mode', group: 'Navigate' },
  { keys: ['P'], action: 'Pan mode', group: 'Navigate' },
  { keys: ['Z'], action: 'Zoom mode', group: 'Navigate' },
  { keys: ['F'], action: 'Fit the model in view', group: 'Navigate' },
  { keys: ['H'], action: 'Return to the home view', group: 'Navigate' },
  { keys: ['1', '2', '3', '4'], action: 'Top, front, side and isometric views', group: 'Navigate' },
  { keys: ['V'], action: 'Select tool', group: 'Tools' },
  { keys: ['M'], action: 'Measure tool', group: 'Tools' },
  { keys: ['N'], action: 'Pin tool', group: 'Tools' },
  { keys: ['Esc'], action: 'Cancel the tool or clear the selection', group: 'Tools' },
  { keys: ['X'], action: 'Toggle x-ray', group: 'View' },
  { keys: ['S'], action: 'Toggle the section plane', group: 'View' },
  { keys: ['?'], action: 'Show this help', group: 'View' },
];

const PRESET_BY_KEY: Record<string, ViewPresetId> = { '1': 'top', '2': 'front', '3': 'side', '4': 'iso' };

/** The command for a key press, or `null` when the key is not a shortcut. Modifier keys are never shortcuts. */
export function commandForKey(event: { key: string; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean }): ViewerCommand | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  switch (key) {
    case 'o':
      return { type: 'mode', mode: 'orbit' };
    case 'p':
      return { type: 'mode', mode: 'pan' };
    case 'z':
      return { type: 'mode', mode: 'zoom' };
    case 'f':
      return { type: 'fit' };
    case 'h':
      return { type: 'home' };
    case 'v':
      return { type: 'tool', tool: 'select' };
    case 'm':
      return { type: 'tool', tool: 'measure' };
    case 'n':
      return { type: 'tool', tool: 'pin' };
    case 'x':
      return { type: 'xray' };
    case 's':
      return { type: 'section' };
    case '?':
      return { type: 'help' };
    case 'Escape':
      return { type: 'cancel' };
    default:
      return key in PRESET_BY_KEY ? { type: 'preset', preset: PRESET_BY_KEY[key] } : null;
  }
}
