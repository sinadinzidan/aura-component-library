export type ShortcutEntry = {
  id: string;
  /** What the shortcut does: "Open command palette". */
  label: string;
  /** Keys in press order, as `ShortcutHint` takes them: `mod`, `shift`, `K`. */
  keys: readonly string[];
  /** `sequence` for keys pressed one after the other ("G then A"). */
  mode?: 'chord' | 'sequence';
};

export type ShortcutGroup = {
  title: string;
  shortcuts: readonly ShortcutEntry[];
};

/** Keeps the shortcuts whose label contains the query, and drops groups left empty. */
export function filterShortcuts(groups: readonly ShortcutGroup[], query: string): ShortcutGroup[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [...groups];
  return groups
    .map((group) => ({
      ...group,
      shortcuts: group.shortcuts.filter((entry) => entry.label.toLowerCase().includes(needle)),
    }))
    .filter((group) => group.shortcuts.length > 0);
}
