/**
 * Command matching and history for a command-first workspace: typed text is matched against a
 * fixed set of commands, and every run is kept, newest first, so it can be run again.
 */

export type CommandSpec = {
  id: string;
  /** The canonical text, for example `trend 23-PT-92531 24h`. */
  text: string;
  /** Extra words that also find the command. */
  keywords?: readonly string[];
};

export type HistoryEntry = { id: string; text: string; at: number };

const words = (text: string): string[] => text.toLowerCase().split(/\s+/).filter(Boolean);

/**
 * Finds the command typed text means: an exact match, then a prefix of the canonical text, then
 * the command sharing the most words with the input. `undefined` when nothing overlaps.
 */
export function matchCommand<Command extends CommandSpec>(input: string, commands: readonly Command[]): Command | undefined {
  const typed = words(input);
  if (typed.length === 0) return undefined;
  const joined = typed.join(' ');
  const exact = commands.find((command) => command.text.toLowerCase() === joined);
  if (exact) return exact;
  const prefix = commands.find((command) => command.text.toLowerCase().startsWith(joined));
  if (prefix) return prefix;
  let best: Command | undefined;
  let bestScore = 0;
  for (const command of commands) {
    const pool = [...words(command.text), ...(command.keywords ?? []).map((keyword) => keyword.toLowerCase())];
    const score = typed.filter((word) => pool.some((candidate) => candidate.startsWith(word))).length;
    if (score > bestScore) {
      best = command;
      bestScore = score;
    }
  }
  return best;
}

/** Commands whose text or keywords contain the typed text, for a palette list. Everything when empty. */
export function filterCommands<Command extends CommandSpec>(input: string, commands: readonly Command[]): Command[] {
  const typed = input.trim().toLowerCase();
  if (typed === '') return [...commands];
  return commands.filter((command) => [command.text, ...(command.keywords ?? [])].some((candidate) => candidate.toLowerCase().includes(typed)));
}

/** Adds a run to the top of the history, keeping at most `limit` entries. */
export function pushHistory(history: readonly HistoryEntry[], entry: HistoryEntry, limit = 8): HistoryEntry[] {
  return [entry, ...history].slice(0, limit);
}
