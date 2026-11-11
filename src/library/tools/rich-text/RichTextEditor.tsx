import { Label } from '@cognite/aura/components/label';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { IconAlertTriangle, IconLock } from '@cognite/aura/icons';
import { useId, useLayoutEffect, useReducer, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { MarkdownPreview } from '../../patterns/content/MarkdownPreview';

import { applyCommand, commandForShortcut } from './commands';
import type { RichCommand } from './commands';
import { countCharacters, lengthStatus } from './counts';
import { createEditorState, editorReducer } from './editorReducer';
import { activeFormats, continueList, indentLines, insertLink, listKindOf, outdentLines } from './formatting';
import type { LinkInput } from './formatting';
import { FormatToolbar } from './FormatToolbar';
import type { ToolbarVariant } from './FormatToolbar';
import { canRedo, canUndo } from './history';
import { LengthCounter } from './LengthCounter';
import { RichTextPreview } from './RichTextPreview';
import { SuggestionList } from './SuggestionList';
import { lineBounds } from './textState';
import type { TextState } from './textState';
import { applySuggestion, filterSuggestions, findTrigger, moveActive, suggestionOptionId } from './triggers';
import type { Suggestion } from './triggers';

export type ViewMode = 'write' | 'preview' | 'split';

const MODE_LABEL: Readonly<Record<ViewMode, string>> = { write: 'Write', preview: 'Preview', split: 'Split' };

function isViewMode(value: unknown): value is ViewMode {
  return value === 'write' || value === 'preview' || value === 'split';
}

/** What the footer actions get: the text, whether it can be saved, and a way to clear the field. */
export type EditorSnapshot = { value: string; valid: boolean; empty: boolean; reset: (value?: string) => void };

type RichTextEditorProps = {
  /** Visible label of the text field. */
  label: string;
  /** Hide the label visually where a heading already names the field. It stays the accessible name. */
  hideLabel?: boolean;
  /** Markdown the editor starts with. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  defaultMode?: ViewMode;
  /** View modes on offer. One mode hides the switch. */
  modes?: readonly ViewMode[];
  toolbar?: ToolbarVariant | 'none';
  /** People `@` can mention. Leave out to turn mentions off. */
  people?: readonly Suggestion[];
  /** Tags `#` can insert. Leave out to turn tags off. */
  tags?: readonly Suggestion[];
  /** Leading mark for a person in the picker, for example an avatar. */
  renderPerson?: (person: Suggestion) => ReactNode;
  placeholder?: string;
  /** Shown in the preview while the note is empty: what a good note contains. */
  guidance?: ReactNode;
  /** Length where the counter starts warning. */
  softLimit?: number;
  /** Longest text that can be saved. Longer text is kept but marked invalid. */
  maxLength?: number;
  /** The text can be read and copied but not changed. */
  readOnly?: boolean;
  /** Why it is read-only: "Signed off by Liv Wold". */
  readOnlyReason?: string;
  /** Set to turn the editor off, with the reason shown. */
  disabledReason?: string;
  /** An error from outside the editor, for example a failed save. */
  error?: string;
  /** `rich` knows links, check lists, mentions and tags; `basic` is the shared note preview. */
  preview?: 'rich' | 'basic';
  /** Height utility for the editing area, for example `h-96`. */
  heightClassName?: string;
  /** Leave out the word count where space is tight. */
  words?: boolean;
  /** Buttons at the end of the footer, for example "Post comment". */
  actions?: (snapshot: EditorSnapshot) => ReactNode;
  /** `⌘` on Apple keyboards. */
  modifier?: string;
};

const FIELD =
  'block size-full resize-none bg-transparent p-3 font-mono text-sm leading-6 text-base-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ring-default)] disabled:cursor-not-allowed disabled:text-muted-foreground';

/**
 * A Markdown editor without `contentEditable`: the document is the text in a labelled textarea,
 * a toolbar and shortcuts rewrite the selection through pure functions, lists continue on Enter,
 * `@` and `#` open pickers, and a preview renders beside or instead of the text. It keeps its own
 * undo history, counts words and characters against a soft and a hard limit, and has read-only
 * and disabled states that say why.
 */
export function RichTextEditor({
  label,
  hideLabel = false,
  defaultValue = '',
  onChange,
  defaultMode = 'write',
  modes = ['write', 'preview', 'split'],
  toolbar = 'full',
  people,
  tags,
  renderPerson,
  placeholder,
  guidance,
  softLimit,
  maxLength,
  readOnly = false,
  readOnlyReason,
  disabledReason,
  error,
  preview = 'rich',
  heightClassName = 'h-80',
  words = true,
  actions,
  modifier = 'Ctrl',
}: RichTextEditorProps) {
  const id = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [state, dispatch] = useReducer(editorReducer, defaultValue, createEditorState);
  const [mode, setMode] = useState<ViewMode>(modes.includes(defaultMode) ? defaultMode : modes[0]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [lookup, setLookup] = useState<{ key: string; index: number; dismissed: boolean }>({ key: '', index: 0, dismissed: false });
  const [announcement, setAnnouncement] = useState('');
  const pendingSelection = useRef<TextState | null>(null);

  const present = state.history.present;
  const disabled = disabledReason !== undefined;
  const locked = disabled || readOnly;
  const length = countCharacters(present.value);
  const status = lengthStatus(length, { soft: softLimit, max: maxLength });
  const tooLong = status === 'over';
  const empty = present.value.trim() === '';

  // Programmatic changes (commands, undo, picks) move the caret; typing leaves it to the browser.
  // The target is kept in a ref because the browser reports the old caret in a select event
  // between the new text and this effect, which would otherwise overwrite it.
  useLayoutEffect(() => {
    const field = fieldRef.current;
    const target = pendingSelection.current;
    pendingSelection.current = null;
    if (!field || state.revision === 0 || !target) return;
    field.focus();
    field.setSelectionRange(target.selectionStart, target.selectionEnd);
    dispatch({ type: 'select', selectionStart: target.selectionStart, selectionEnd: target.selectionEnd });
  }, [state.revision]);

  const apply = (next: TextState, spoken?: string) => {
    pendingSelection.current = next;
    dispatch({ type: 'apply', state: next });
    onChange?.(next.value);
    if (spoken) setAnnouncement(spoken);
  };

  const run = (command: RichCommand) => {
    if (locked) return;
    apply(applyCommand(present, command));
  };

  const insert = (link: LinkInput) => apply(insertLink(present, link), 'Link inserted');

  const step = (direction: 'undo' | 'redo') => {
    const possible = direction === 'undo' ? canUndo(state.history) : canRedo(state.history);
    if (!possible) return;
    const target = direction === 'undo' ? state.history.past[state.history.past.length - 1] : state.history.future[0];
    pendingSelection.current = target;
    dispatch({ type: direction });
    onChange?.(target.value);
    setAnnouncement(direction === 'undo' ? 'Undone' : 'Redone');
  };

  // The open lookup, if the caret is in one and its list has not been dismissed.
  const trigger = locked ? null : findTrigger(present);
  const source = trigger?.char === '@' ? people : trigger?.char === '#' ? tags : undefined;
  const lookupKey = trigger ? `${trigger.char}:${trigger.start}:${trigger.query}` : '';
  const matches = trigger && source ? filterSuggestions(source, trigger.query) : [];
  const open = trigger !== null && source !== undefined && !(lookup.dismissed && lookup.key === lookupKey);
  const activeIndex = lookup.key === lookupKey ? Math.min(lookup.index, Math.max(0, matches.length - 1)) : 0;
  const listId = `${id}-suggestions`;

  const pick = (suggestion: Suggestion) => {
    if (!trigger) return;
    apply(applySuggestion(present, trigger, suggestion), `${suggestion.label} inserted`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (locked) return;
    const command = event.ctrlKey || event.metaKey;

    if (open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setLookup({ key: lookupKey, index: moveActive(activeIndex, event.key === 'ArrowDown' ? 1 : -1, matches.length), dismissed: false });
        return;
      }
      if ((event.key === 'Enter' || event.key === 'Tab') && matches.length > 0) {
        event.preventDefault();
        pick(matches[activeIndex]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setLookup({ key: lookupKey, index: 0, dismissed: true });
        return;
      }
    }

    if (command && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      step(event.shiftKey ? 'redo' : 'undo');
      return;
    }
    if (command && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      step('redo');
      return;
    }
    if (command && event.key.toLowerCase() === 'k' && toolbar !== 'none') {
      event.preventDefault();
      setLinkOpen(true);
      return;
    }
    if (command && !event.altKey) {
      const shortcut = commandForShortcut(event.key, event.shiftKey);
      if (shortcut) {
        event.preventDefault();
        run(shortcut);
      }
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey && !event.altKey) {
      const continued = continueList(present);
      if (continued) {
        event.preventDefault();
        apply(continued);
      }
      return;
    }
    if (event.key === 'Tab' && !event.altKey) {
      // Tab only indents inside a list; anywhere else it moves focus, so the field is no keyboard trap.
      const { start, end } = lineBounds(present);
      const inList = present.value
        .slice(start, end)
        .split('\n')
        .some((line) => listKindOf(line) !== null);
      if (inList) {
        event.preventDefault();
        apply(event.shiftKey ? outdentLines(present) : indentLines(present));
      }
    }
  };

  const snapshot: EditorSnapshot = {
    value: present.value,
    valid: !tooLong && !empty,
    empty,
    reset: (value = '') => {
      dispatch({ type: 'reset', value });
      onChange?.(value);
    },
  };

  const showWrite = mode !== 'preview';
  const showPreview = mode !== 'write';
  const selectedText = present.value.slice(present.selectionStart, present.selectionEnd);
  const message = error ?? (tooLong && maxLength !== undefined ? `Shorten the text to ${maxLength.toLocaleString('en-US')} characters to save it.` : undefined);
  const mentions = people?.map((person) => person.label);

  const previewBody =
    empty && guidance ? (
      <div className="text-sm text-muted-foreground">{guidance}</div>
    ) : preview === 'rich' ? (
      <RichTextPreview source={present.value} mentions={mentions} />
    ) : (
      <MarkdownPreview source={present.value} />
    );

  return (
    <div className="flex w-full min-w-0 flex-col" data-slot="rich-text-editor" data-mode={mode}>
      {hideLabel ? null : <Label htmlFor={`${id}-field`}>{label}</Label>}
      <div
        className={`@container flex min-w-0 flex-col overflow-hidden rounded-lg border bg-base-background ${message ? 'border-critical-foreground-strong' : 'border-default'}`}
      >
        {toolbar !== 'none' || modes.length > 1 ? (
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-default px-2 py-1.5">
            {toolbar !== 'none' && !readOnly ? (
              <FormatToolbar
                variant={toolbar}
                active={activeFormats(present)}
                onCommand={run}
                link={{ selectedText, onInsert: insert, open: linkOpen, onOpenChange: setLinkOpen }}
                onUndo={() => step('undo')}
                onRedo={() => step('redo')}
                canUndo={canUndo(state.history)}
                canRedo={canRedo(state.history)}
                lookups={people !== undefined || tags !== undefined}
                disabled={disabled || mode === 'preview'}
                modifier={modifier}
              />
            ) : (
              <span className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                {readOnly ? <IconLock className="size-3.5" aria-hidden="true" /> : null}
                {readOnly ? 'Read only' : 'Markdown'}
              </span>
            )}
            {modes.length > 1 ? (
              <SegmentedControl
                className="ml-auto"
                value={mode}
                onValueChange={(next) => {
                  if (isViewMode(next)) setMode(next);
                }}
              >
                <SegmentedControlList size="small" aria-label="View">
                  {modes.map((option) => (
                    <SegmentedControlButton key={option} value={option}>
                      {MODE_LABEL[option]}
                    </SegmentedControlButton>
                  ))}
                </SegmentedControlList>
              </SegmentedControl>
            ) : null}
          </div>
        ) : null}

        <div className={`grid min-h-0 ${heightClassName} ${mode === 'split' ? 'grid-rows-2 @2xl:grid-cols-2 @2xl:grid-rows-1' : 'grid-cols-1'}`}>
          {showWrite ? (
            <div className="relative min-h-0 min-w-0">
              <textarea
                ref={fieldRef}
                id={`${id}-field`}
                aria-label={hideLabel ? label : undefined}
                className={FIELD}
                value={present.value}
                placeholder={placeholder}
                readOnly={readOnly}
                disabled={disabled}
                spellCheck
                aria-invalid={message ? true : undefined}
                aria-describedby={`${id}-status`}
                aria-autocomplete={people || tags ? 'list' : undefined}
                aria-controls={open && matches.length > 0 ? listId : undefined}
                aria-activedescendant={open && matches.length > 0 ? suggestionOptionId(listId, activeIndex) : undefined}
                onChange={(event) => {
                  const field = event.currentTarget;
                  dispatch({ type: 'input', state: { value: field.value, selectionStart: field.selectionStart, selectionEnd: field.selectionEnd } });
                  onChange?.(field.value);
                }}
                onSelect={(event) => {
                  const field = event.currentTarget;
                  if (pendingSelection.current) return;
                  dispatch({ type: 'select', selectionStart: field.selectionStart, selectionEnd: field.selectionEnd });
                }}
                onKeyDown={onKeyDown}
              />
              {open ? (
                <div className="absolute bottom-2 left-2 z-10 max-w-[calc(100%-1rem)]">
                  <SuggestionList
                    id={listId}
                    label={trigger?.char === '@' ? 'People' : 'Asset tags'}
                    suggestions={matches}
                    activeIndex={activeIndex}
                    onPick={pick}
                    onActiveChange={(index) => setLookup({ key: lookupKey, index, dismissed: false })}
                    renderLeading={trigger?.char === '@' ? renderPerson : undefined}
                    monoLabel={trigger?.char === '#'}
                    emptyText={trigger?.char === '@' ? 'No one by that name' : 'No tag matches'}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
          {showPreview ? (
            <div
              role="region"
              aria-label={`${label} preview`}
              tabIndex={0}
              className={`min-h-0 min-w-0 overflow-y-auto p-3 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ring-default)] ${mode === 'split' ? 'border-t border-default bg-muted-background @2xl:border-t-0 @2xl:border-l' : ''}`}
            >
              {previewBody}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-default px-3 py-2">
          <span
            id={`${id}-status`}
            className={`flex min-w-0 flex-1 items-center gap-1.5 text-xs ${message ? 'text-critical-foreground-strong' : 'text-muted-foreground'}`}
          >
            {message ? <IconAlertTriangle className="size-3.5 shrink-0" aria-hidden="true" /> : null}
            {disabled || (readOnly && readOnlyReason) ? <IconLock className="size-3.5 shrink-0" aria-hidden="true" /> : null}
            <span className="min-w-0">
              {message ?? disabledReason ?? (readOnly ? (readOnlyReason ?? 'Read only') : people || tags ? 'Markdown · @ person · # tag' : 'Markdown')}
            </span>
          </span>
          <LengthCounter text={present.value} soft={softLimit} max={maxLength} words={words} />
          {actions ? <span className="flex shrink-0 items-center gap-2">{actions(snapshot)}</span> : null}
        </div>
      </div>
      <span aria-live="polite" className="sr-only">
        {open ? `${matches.length} ${matches.length === 1 ? 'suggestion' : 'suggestions'}${matches[activeIndex] ? `, ${matches[activeIndex].label}` : ''}` : announcement}
      </span>
    </div>
  );
}
