import { applyCommand, commandForShortcut } from './commands';
import type { RichCommand } from './commands';
import { caretAt } from './textState';

describe(applyCommand.name, () => {
  it.each<[RichCommand, string]>([
    ['bold', '**Seal gas**'],
    ['italic', '_Seal gas_'],
    ['code', '`Seal gas`'],
    ['heading-1', '# Seal gas'],
    ['heading-2', '## Seal gas'],
    ['heading-3', '### Seal gas'],
    ['bullet', '- Seal gas'],
    ['numbered', '1. Seal gas'],
    ['check', '- [ ] Seal gas'],
    ['quote', '> Seal gas'],
    ['indent', '  Seal gas'],
    ['code-block', '```\nSeal gas\n```\n'],
    ['rule', 'Seal gas\n\n---\n'],
  ])('%s turns the selected line into the right Markdown', (command, expected) => {
    expect(applyCommand({ value: 'Seal gas', selectionStart: 0, selectionEnd: 8 }, command).value).toBe(expected);
  });

  it('outdent removes one indent step', () => {
    expect(applyCommand(caretAt('  - a', 5), 'outdent').value).toBe('- a');
  });

  it('mention types an @ with a space before it when needed', () => {
    expect(applyCommand(caretAt('Ask', 3), 'mention')).toEqual(caretAt('Ask @', 5));
    expect(applyCommand(caretAt('Ask ', 4), 'mention')).toEqual(caretAt('Ask @', 5));
  });

  it('tag types a # at the start of an empty note', () => {
    expect(applyCommand(caretAt('', 0), 'tag')).toEqual(caretAt('#', 1));
  });
});

describe(commandForShortcut.name, () => {
  it.each([
    ['b', false, 'bold'],
    ['B', false, 'bold'],
    ['i', false, 'italic'],
    ['e', false, 'code'],
    ['8', true, 'bullet'],
    ['7', true, 'numbered'],
    ['9', true, 'check'],
    ['b', true, null],
    ['s', false, null],
  ])('maps %s (shift %s) to %s', (key, shift, command) => {
    expect(commandForShortcut(key, shift)).toBe(command);
  });
});
