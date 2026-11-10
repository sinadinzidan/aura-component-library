/** Pure parser for the text-mode console prompt. It knows the grammar, not the plant. */

export type AlarmFilter = 'active' | 'all';

export type TerminalCommand =
  | { kind: 'empty' }
  | { kind: 'help' }
  | { kind: 'clear' }
  | { kind: 'show-alarms'; filter: AlarmFilter }
  | { kind: 'show-tags' }
  | { kind: 'trend'; tag: string }
  | { kind: 'goto'; tag: string }
  | { kind: 'ack'; alarmId: string }
  | { kind: 'error'; message: string };

export type CommandHelp = { usage: string; description: string };

/** The grammar as shown by `help`. */
export const COMMAND_HELP: readonly CommandHelp[] = [
  { usage: 'help', description: 'List the commands' },
  { usage: 'show alarms [all]', description: 'Unacknowledged alarms, or the whole log' },
  { usage: 'show tags', description: 'Every tag in the plant' },
  { usage: 'trend <tag>', description: 'Plot a tag, for example trend 23-PT-92531' },
  { usage: 'goto <asset>', description: 'Select an asset, for example goto 23-KA-9101' },
  { usage: 'ack <alarm>', description: 'Acknowledge an alarm, for example ack alm-4811' },
  { usage: 'clear', description: 'Empty the output' },
];

export type ParseOptions = {
  /** Prefix added when an alarm is given by number only. */
  alarmPrefix?: string;
};

function usage(text: string): TerminalCommand {
  return { kind: 'error', message: `Usage: ${text}` };
}

/** Alarm ids are lower case; a bare number gets the prefix: `4811` → `alm-4811`. */
export function normalizeAlarmId(value: string, prefix = 'alm-'): string {
  const lower = value.toLowerCase();
  return /^\d+$/.test(lower) ? `${prefix}${lower}` : lower;
}

/**
 * Turns one line of input into a command. Verbs are case-insensitive, extra spaces are ignored,
 * tags come back upper case and alarm ids lower case. Anything it cannot read becomes an
 * `error` command with a message fit to print.
 */
export function parseCommand(input: string, options: ParseOptions = {}): TerminalCommand {
  const words = input.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { kind: 'empty' };
  const [first, ...rest] = words;
  const verb = first.toLowerCase();

  switch (verb) {
    case 'help':
    case '?':
      return rest.length === 0 ? { kind: 'help' } : usage('help');
    case 'clear':
    case 'cls':
      return rest.length === 0 ? { kind: 'clear' } : usage('clear');
    case 'show': {
      const what = rest[0]?.toLowerCase();
      if (what === 'tags' && rest.length === 1) return { kind: 'show-tags' };
      if (what === 'alarms' && rest.length === 1) return { kind: 'show-alarms', filter: 'active' };
      if (what === 'alarms' && rest.length === 2) {
        const filter = rest[1].toLowerCase();
        if (filter === 'all' || filter === 'active') return { kind: 'show-alarms', filter };
      }
      return usage('show alarms [all] | show tags');
    }
    case 'trend':
      return rest.length === 1 ? { kind: 'trend', tag: rest[0].toUpperCase() } : usage('trend <tag>');
    case 'goto':
      return rest.length === 1 ? { kind: 'goto', tag: rest[0].toUpperCase() } : usage('goto <asset>');
    case 'ack':
      return rest.length === 1
        ? { kind: 'ack', alarmId: normalizeAlarmId(rest[0], options.alarmPrefix) }
        : usage('ack <alarm>');
    default:
      return { kind: 'error', message: `Unknown command: ${first}. Type help for the list.` };
  }
}
