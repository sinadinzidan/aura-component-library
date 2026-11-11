import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconAt,
  IconBlockquote,
  IconBold,
  IconCode,
  IconH1,
  IconH2,
  IconH3,
  IconHash,
  IconIndentDecrease,
  IconIndentIncrease,
  IconItalic,
  IconList,
  IconListCheck,
  IconListNumbers,
  IconSeparatorHorizontal,
  IconSourceCode,
} from '@cognite/aura/icons';
import { Fragment, useState } from 'react';
import type { FocusEvent, KeyboardEvent, ReactNode } from 'react';

import type { RichCommand } from './commands';
import type { ActiveFormats, LinkInput } from './formatting';
import { LinkPopover } from './LinkPopover';
import { ToolButton } from './ToolButton';

export type ToolbarVariant = 'full' | 'compact';

type ToolbarLink = {
  /** Selected text, offered as the link text. */
  selectedText: string;
  onInsert: (link: LinkInput) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type FormatToolbarProps = {
  /** `full` for documents; `compact` leaves out headings, check lists, code blocks, rules and indent. */
  variant?: ToolbarVariant;
  /** Formats in effect at the selection; their buttons show as pressed. */
  active?: ActiveFormats;
  onCommand: (command: RichCommand) => void;
  /** Leave out to hide the link button. */
  link?: ToolbarLink;
  /** Leave both out to hide undo and redo. */
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  /** Show the `@` and `#` buttons. */
  lookups?: boolean;
  disabled?: boolean;
  /** `⌘` on Apple keyboards, `Ctrl` elsewhere. */
  modifier?: string;
  /** Accessible name of the toolbar. */
  label?: string;
};

type Tool = { command: RichCommand; label: string; icon: ReactNode; shortcut?: string; pressed?: boolean };

const NONE: ActiveFormats = { bold: false, italic: false, code: false, heading: 0, list: null, quote: false };

/**
 * The formatting toolbar of a Markdown editor. It is one tab stop: arrow keys, Home and End
 * move between buttons. Buttons never take focus from the text on a click, and toggles show
 * which formats apply at the caret.
 */
export function FormatToolbar({
  variant = 'full',
  active = NONE,
  onCommand,
  link,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  lookups = true,
  disabled = false,
  modifier = 'Ctrl',
  label = 'Formatting',
}: FormatToolbarProps) {
  const [current, setCurrent] = useState(0);
  const full = variant === 'full';

  const inline: Tool[] = [
    { command: 'bold', label: 'Bold', icon: <IconBold />, shortcut: `${modifier}+B`, pressed: active.bold },
    { command: 'italic', label: 'Italic', icon: <IconItalic />, shortcut: `${modifier}+I`, pressed: active.italic },
    { command: 'code', label: 'Inline code', icon: <IconCode />, shortcut: `${modifier}+E`, pressed: active.code },
  ];
  const headings: Tool[] = [
    { command: 'heading-1', label: 'Heading 1', icon: <IconH1 />, pressed: active.heading === 1 },
    { command: 'heading-2', label: 'Heading 2', icon: <IconH2 />, pressed: active.heading === 2 },
    { command: 'heading-3', label: 'Heading 3', icon: <IconH3 />, pressed: active.heading === 3 },
  ];
  const lists: Tool[] = [
    { command: 'bullet', label: 'Bullet list', icon: <IconList />, pressed: active.list === 'bullet' },
    { command: 'numbered', label: 'Numbered list', icon: <IconListNumbers />, pressed: active.list === 'numbered' },
    ...(full ? [{ command: 'check', label: 'Check list', icon: <IconListCheck />, pressed: active.list === 'check' } satisfies Tool] : []),
    { command: 'quote', label: 'Quote', icon: <IconBlockquote />, pressed: active.quote },
  ];
  const blocks: Tool[] = [
    { command: 'code-block', label: 'Code block', icon: <IconSourceCode /> },
    { command: 'rule', label: 'Horizontal rule', icon: <IconSeparatorHorizontal /> },
    { command: 'outdent', label: 'Outdent', icon: <IconIndentDecrease />, shortcut: 'Shift+Tab' },
    { command: 'indent', label: 'Indent', icon: <IconIndentIncrease />, shortcut: 'Tab' },
  ];
  const insert: Tool[] = [
    { command: 'mention', label: 'Mention person', icon: <IconAt />, shortcut: '@' },
    { command: 'tag', label: 'Insert asset tag', icon: <IconHash />, shortcut: '#' },
  ];

  const groups: { id: string; tools: Tool[]; link?: boolean }[] = [
    ...(full ? [{ id: 'headings', tools: headings }] : []),
    { id: 'inline', tools: inline, link: link !== undefined },
    { id: 'lists', tools: lists },
    ...(full ? [{ id: 'blocks', tools: blocks }] : []),
    ...(lookups ? [{ id: 'insert', tools: insert }] : []),
  ];

  const hasHistory = onUndo !== undefined || onRedo !== undefined;
  // Every button gets a running position, which is what roving focus keys on.
  const offsets = groups.map((_, groupIndex) =>
    groups.slice(0, groupIndex).reduce((total, group) => total + group.tools.length + (group.link ? 1 : 0), hasHistory ? 2 : 0)
  );

  const buttons = (toolbar: HTMLElement): HTMLButtonElement[] =>
    Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button[data-tool]')).filter((button) => !button.disabled);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const enabled = buttons(event.currentTarget);
    const index = enabled.findIndex((button) => button === document.activeElement);
    if (index === -1) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length;
    enabled[next]?.focus();
  };

  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const all = Array.from(event.currentTarget.querySelectorAll('button[data-tool]'));
    const index = all.findIndex((button) => button === event.target);
    if (index !== -1) setCurrent(index);
  };

  const tab = (index: number) => (index === current ? 0 : -1);

  return (
    <div role="toolbar" aria-label={label} aria-orientation="horizontal" className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1" onKeyDown={onKeyDown} onFocus={onFocus}>
      {hasHistory ? (
        <>
          <ToolButton label="Undo" shortcut={`${modifier}+Z`} disabled={disabled || !canUndo} tabIndex={tab(0)} onClick={onUndo}>
            <IconArrowBackUp />
          </ToolButton>
          <ToolButton label="Redo" shortcut={`${modifier}+Shift+Z`} disabled={disabled || !canRedo} tabIndex={tab(1)} onClick={onRedo}>
            <IconArrowForwardUp />
          </ToolButton>
        </>
      ) : null}
      {groups.map((group, groupIndex) => (
        <Fragment key={group.id}>
          {groupIndex > 0 || hasHistory ? <span aria-hidden="true" className="mx-1 h-4 shrink-0 border-l border-default" /> : null}
          {group.tools.map((tool, toolIndex) => (
            <ToolButton
              key={tool.command}
              label={tool.label}
              shortcut={tool.shortcut}
              pressed={tool.pressed}
              disabled={disabled}
              tabIndex={tab(offsets[groupIndex] + toolIndex)}
              onClick={() => onCommand(tool.command)}
            >
              {tool.icon}
            </ToolButton>
          ))}
          {group.link && link ? (
            <LinkPopover
              shortcut={`${modifier}+K`}
              disabled={disabled}
              tabIndex={tab(offsets[groupIndex] + group.tools.length)}
              selectedText={link.selectedText}
              onInsert={link.onInsert}
              open={link.open}
              onOpenChange={link.onOpenChange}
            />
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
