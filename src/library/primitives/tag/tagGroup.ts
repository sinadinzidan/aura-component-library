export type TagGroupSelection = 'single' | 'multiple';

/**
 * The selected values after `toggled` is clicked. `single` replaces the selection; clicking the
 * selected tag clears it unless `allowEmpty` is off. `multiple` adds or removes.
 */
export function nextTagGroupValue(
  value: readonly string[],
  toggled: string,
  selection: TagGroupSelection,
  allowEmpty: boolean = true
): string[] {
  const isOn = value.includes(toggled);
  if (selection === 'single') {
    if (!isOn) return [toggled];
    return allowEmpty ? [] : [toggled];
  }
  if (!isOn) return [...value, toggled];
  if (!allowEmpty && value.length === 1) return [...value];
  return value.filter((other) => other !== toggled);
}

/**
 * The index focus moves to for a key press in a roving-focus row, skipping disabled entries and
 * wrapping at the ends. Returns `current` when the key does not move focus.
 */
export function rovingIndex(current: number, key: string, enabled: readonly boolean[]): number {
  const count = enabled.length;
  if (!enabled.some(Boolean)) return current;

  const seek = (start: number, step: 1 | -1): number => {
    for (let offset = 0; offset < count; offset += 1) {
      const index = (((start + step * offset) % count) + count) % count;
      if (enabled[index]) return index;
    }
    return current;
  };

  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return seek(current + 1, 1);
    case 'ArrowLeft':
    case 'ArrowUp':
      return seek(current - 1, -1);
    case 'Home':
      return seek(0, 1);
    case 'End':
      return seek(count - 1, -1);
    default:
      return current;
  }
}
