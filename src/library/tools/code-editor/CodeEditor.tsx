import { Label } from '@cognite/aura/components/label';
import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useReducer, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { createEditorState, editorReducer } from '../rich-text/editorReducer';
import { canRedo, canUndo } from '../rich-text/history';
import { caretAt, replaceSelection } from '../rich-text/textState';
import type { TextState } from '../rich-text/textState';

import { backspacePair, caretLine, caretPosition, commentPrefix, enterWithIndent, indentSelection, outdentSelection, toggleComment, typeCharacter } from './editing';
import type { CodeLanguage } from './editing';
import { auraHighlighter, useHighlightedCode } from './useHighlightedCode';
import type { Highlighter } from './useHighlightedCode';

export type CodeRange = { start: number; end: number };

export type CodeEditorHandle = {
  /** Types text at the caret, replacing the selection, and keeps focus in the editor. */
  insertText: (text: string) => void;
  focus: () => void;
};

type CodeEditorProps = {
  /** Visible label of the field. */
  label: string;
  hideLabel?: boolean;
  value: string;
  /** Called with the new text after every edit. */
  onChange?: (value: string) => void;
  language?: CodeLanguage;
  readOnly?: boolean;
  /** Why the field is read-only or disabled, announced with the field. */
  description?: string;
  disabled?: boolean;
  /** Ctrl/⌘+Enter. */
  onRun?: () => void;
  /** The text range to underline as an error. */
  error?: CodeRange | null;
  placeholder?: string;
  /** Height utility for the editing area, for example `h-64`. Ignored for a single line and with `fill`. */
  heightClassName?: string;
  /** Take all the height of the parent instead of a fixed one; the parent must have a height. */
  fill?: boolean;
  /** One line, no gutter; Enter runs instead of adding a line. */
  singleLine?: boolean;
  lineNumbers?: boolean;
  /** Replaces the highlighter, for tests. */
  highlighter?: Highlighter;
  /** Called with the caret position as it moves, for a status line. */
  onCaretChange?: (position: { line: number; column: number }) => void;
};

const TEXT_METRICS = 'font-mono text-sm leading-6 whitespace-pre';

const MIRROR_HTML =
  '[&_pre]:m-0 [&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-6 [&_code]:bg-transparent [&_code]:p-0 [&_code]:font-mono [&_code]:text-sm [&_code]:leading-6';

/**
 * A code field built from a plain labelled textarea laid over a highlighted copy of its text, so
 * the browser keeps selection, caret, IME and accessibility while colours come from Shiki. It
 * adds line numbers, a current-line highlight, Tab and Shift+Tab indent, bracket and quote
 * pairing, Ctrl/⌘+/ comments, Ctrl/⌘+Enter to run and its own undo history. Tab moves focus
 * after Escape, so the field never traps the keyboard. The highlighter loads lazily; until it
 * arrives the text shows unhighlighted.
 */
export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  {
    label,
    hideLabel = false,
    value,
    onChange,
    language = 'text',
    readOnly = false,
    description,
    disabled = false,
    onRun,
    error = null,
    placeholder,
    heightClassName = 'h-64',
    fill = false,
    singleLine = false,
    lineNumbers = !singleLine,
    highlighter = auraHighlighter,
    onCaretChange,
  },
  ref
) {
  const id = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelection = useRef<TextState | null>(null);
  const releaseTab = useRef(false);
  const [state, dispatch] = useReducer(editorReducer, value, createEditorState);
  const [scroll, setScroll] = useState({ top: 0, left: 0 });
  const [announcement, setAnnouncement] = useState('');
  const present = state.history.present;
  const highlighted = useHighlightedCode(present.value, language, highlighter);
  const locked = readOnly || disabled;
  const lineCount = present.value.split('\n').length;
  const current = caretLine(present);

  // The parent owns the text: when it changes it from outside (a snippet, a format, a history
  // entry) the editor takes it as one undo step and puts the caret at the end.
  const lastValue = useRef(present.value);
  lastValue.current = present.value;
  useEffect(() => {
    if (value === lastValue.current) return;
    const next = caretAt(value, value.length);
    pendingSelection.current = next;
    dispatch({ type: 'apply', state: next });
  }, [value]);

  useLayoutEffect(() => {
    const field = fieldRef.current;
    const target = pendingSelection.current;
    pendingSelection.current = null;
    if (!field || state.revision === 0 || !target) return;
    field.setSelectionRange(target.selectionStart, target.selectionEnd);
    dispatch({ type: 'select', selectionStart: target.selectionStart, selectionEnd: target.selectionEnd });
  }, [state.revision]);

  useEffect(() => {
    onCaretChange?.(caretPosition(present));
    // Report the caret, not the callback's identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [present.selectionStart, present.value]);

  const apply = (next: TextState) => {
    pendingSelection.current = next;
    dispatch({ type: 'apply', state: next });
    onChange?.(next.value);
  };

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      if (locked) return;
      fieldRef.current?.focus();
      apply(replaceSelection(present, text));
    },
    focus: () => fieldRef.current?.focus(),
  }));

  const step = (direction: 'undo' | 'redo') => {
    const possible = direction === 'undo' ? canUndo(state.history) : canRedo(state.history);
    if (!possible) return;
    const target = direction === 'undo' ? state.history.past[state.history.past.length - 1] : state.history.future[0];
    pendingSelection.current = target;
    dispatch({ type: direction });
    onChange?.(target.value);
    setAnnouncement(direction === 'undo' ? 'Undone' : 'Redone');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const command = event.ctrlKey || event.metaKey;
    const key = event.key;

    if (key === 'Escape') {
      // The next Tab leaves the field instead of indenting.
      releaseTab.current = true;
      setAnnouncement('Tab moves focus');
      return;
    }
    if (command && key === 'Enter') {
      event.preventDefault();
      onRun?.();
      return;
    }
    if (key === 'Tab' && releaseTab.current) {
      releaseTab.current = false;
      return;
    }
    if (key !== 'Tab' && key !== 'Shift') releaseTab.current = false;
    if (locked) return;

    if (command && key.toLowerCase() === 'z') {
      event.preventDefault();
      step(event.shiftKey ? 'redo' : 'undo');
    } else if (command && key.toLowerCase() === 'y') {
      event.preventDefault();
      step('redo');
    } else if (command && key === '/') {
      const prefix = commentPrefix(language);
      if (prefix && !singleLine) {
        event.preventDefault();
        apply(toggleComment(present, prefix));
      }
    } else if (key === 'Tab' && !singleLine && !command && !event.altKey) {
      event.preventDefault();
      apply(event.shiftKey ? outdentSelection(present) : indentSelection(present));
    } else if (key === 'Enter' && !command && !event.shiftKey) {
      event.preventDefault();
      if (singleLine) onRun?.();
      else apply(enterWithIndent(present) ?? replaceSelection(present, '\n'));
    } else if (key === 'Backspace' && !command) {
      const next = backspacePair(present);
      if (next) {
        event.preventDefault();
        apply(next);
      }
    } else if (key.length === 1 && !command && !event.altKey && language !== 'text') {
      const next = typeCharacter(present, key);
      if (next) {
        event.preventDefault();
        apply(next);
      }
    }
  };

  const range = error ? { start: Math.min(error.start, present.value.length), end: Math.min(Math.max(error.end, error.start + 1), present.value.length + 1) } : null;
  const errorLine = range ? present.value.slice(0, range.start).split('\n').length - 1 : -1;

  return (
    <div className={`flex w-full min-w-0 flex-col ${fill ? 'h-full' : ''}`} data-slot="code-editor" data-language={language}>
      {hideLabel ? null : <Label htmlFor={`${id}-field`}>{label}</Label>}
      <div
        className={`flex min-w-0 overflow-hidden rounded-lg border bg-base-background focus-within:shadow-focus-ring ${error ? 'border-critical-foreground-strong' : 'border-default'} ${singleLine ? 'h-9' : fill ? 'min-h-0 flex-1' : heightClassName}`}
      >
        {lineNumbers ? (
          <div aria-hidden="true" className="relative w-12 shrink-0 overflow-hidden border-r border-default bg-muted-background">
            <div className={`${TEXT_METRICS} pr-2 pt-3 text-right tabular-nums text-muted-foreground`} style={{ transform: `translateY(${-scroll.top}px)` }}>
              {Array.from({ length: lineCount }, (_, index) => (
                <div key={index} className={index === current ? 'font-medium text-base-foreground' : index === errorLine ? 'font-medium text-critical-foreground-strong underline decoration-wavy' : undefined}>
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          {!singleLine && !locked ? (
            <div
              aria-hidden="true"
              data-slot="current-line"
              className="absolute inset-x-0 h-6 bg-muted-background"
              style={{ top: `calc(var(--spacing) * ${3 + 6 * current} - ${scroll.top}px)` }}
            />
          ) : null}
          <div aria-hidden="true" data-slot="mirror" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className={`${singleLine ? 'px-3 py-1.5' : 'p-3'} ${TEXT_METRICS} min-w-max text-base-foreground ${MIRROR_HTML}`} style={{ transform: `translate(${-scroll.left}px, ${-scroll.top}px)` }}>
              {highlighted ? (
                <>
                  <div className="dark:hidden" dangerouslySetInnerHTML={{ __html: highlighted.light }} />
                  <div className="hidden dark:block" dangerouslySetInnerHTML={{ __html: highlighted.dark }} />
                </>
              ) : (
                present.value + (present.value.endsWith('\n') ? ' ' : '')
              )}
            </div>
          </div>
          {range ? (
            <div aria-hidden="true" data-slot="error-marker" className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className={`${singleLine ? 'px-3 py-1.5' : 'p-3'} ${TEXT_METRICS} min-w-max text-transparent`} style={{ transform: `translate(${-scroll.left}px, ${-scroll.top}px)` }}>
                {present.value.slice(0, range.start)}
                <span className="underline decoration-critical-foreground-strong decoration-wavy decoration-2 underline-offset-4">
                  {present.value.slice(range.start, range.end) || ' '}
                  {range.end > present.value.length ? ' ' : ''}
                </span>
                {present.value.slice(range.end)}
              </div>
            </div>
          ) : null}
          <textarea
            ref={fieldRef}
            id={`${id}-field`}
            aria-label={hideLabel ? label : undefined}
            className={`absolute inset-0 block size-full resize-none overflow-auto bg-transparent ${singleLine ? 'px-3 py-1.5 overflow-y-hidden' : 'p-3'} ${TEXT_METRICS} text-transparent caret-base-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed`}
            value={present.value}
            placeholder={placeholder}
            readOnly={readOnly}
            disabled={disabled}
            rows={singleLine ? 1 : undefined}
            wrap="off"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={description ? `${id}-description` : undefined}
            onChange={(event) => {
              const field = event.currentTarget;
              const text = singleLine ? field.value.replace(/\n/g, ' ') : field.value;
              dispatch({ type: 'input', state: { value: text, selectionStart: field.selectionStart, selectionEnd: field.selectionEnd } });
              onChange?.(text);
            }}
            onSelect={(event) => {
              if (pendingSelection.current) return;
              const field = event.currentTarget;
              dispatch({ type: 'select', selectionStart: field.selectionStart, selectionEnd: field.selectionEnd });
            }}
            onScroll={(event) => setScroll({ top: event.currentTarget.scrollTop, left: event.currentTarget.scrollLeft })}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
      {description ? (
        <span id={`${id}-description`} className="sr-only">
          {description}
        </span>
      ) : null}
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
});
