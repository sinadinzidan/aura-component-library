import { Button } from '@cognite/aura/components/button';
import { IconArrowUp } from '@cognite/aura/icons';
import { useId } from 'react';
import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

type ComposerProps = {
  /** Names the field for assistive technology: "Ask about the plant". */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Called with the trimmed text when there is something to send. */
  onSend: (text: string) => void;
  placeholder?: string;
  /** What the question is asked about: assets, time ranges, documents. Shown as chips above the text. */
  context?: readonly string[];
  /** Leading controls under the text: attach, pick a data source, pick an agent. */
  tools?: ReactNode;
  /** A quiet line next to the send button: the model's scope or a keyboard hint. */
  hint?: string;
  /** `lg` for a prompt-first landing page, where the composer is the hero. */
  size?: 'md' | 'lg';
  /** When set, the composer is disabled and this sentence says why. */
  disabledReason?: string;
  className?: string;
};

/**
 * The prompt box of an AI workspace: context chips, a growing text area, tools and send. Enter
 * sends, Shift+Enter starts a new line. Its surface follows the look's panels.
 */
export function Composer({ label, value, onChange, onSend, placeholder, context = [], tools, hint, size = 'md', disabledReason, className }: ComposerProps) {
  const look = useLook();
  const id = useId();
  const disabled = Boolean(disabledReason);
  const text = value.trim();
  const send = () => {
    if (text && !disabled) onSend(text);
  };

  return (
    <form
      data-look={look}
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
      className={cx(
        'flex min-w-0 flex-col gap-2 rounded-(--kit-radius) border border-(--kit-rule-strong) bg-(--kit-surface) shadow-(--kit-panel-shadow) focus-within:border-(--kit-line-accent)',
        look === 'glass' && 'backdrop-blur-xl',
        look === 'poster' && 'border-2',
        size === 'lg' ? 'p-4' : 'p-3',
        className,
      )}
    >
      {context.length > 0 ? (
        <ul aria-label="Context" className="flex flex-wrap gap-1.5">
          {context.map((item) => (
            <li
              key={item}
              className="rounded-(--kit-radius-sm) bg-[color-mix(in_oklab,var(--kit-line-accent)_14%,transparent)] px-2 py-0.5 text-xs font-medium text-(color:--kit-text) tabular-nums"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        rows={size === 'lg' ? 3 : 2}
        disabled={disabled}
        placeholder={placeholder}
        aria-describedby={hint || disabledReason ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
        className={cx(
          'w-full resize-none bg-transparent px-1 text-(color:--kit-text) outline-none placeholder:text-(color:--kit-text-3) disabled:cursor-not-allowed',
          size === 'lg' ? 'text-lg leading-7' : 'text-sm leading-6',
        )}
      />
      <div className="flex items-center gap-2">
        {tools ? <div className="flex items-center gap-1">{tools}</div> : null}
        <span id={`${id}-hint`} className="ml-auto text-xs text-(color:--kit-text-3)">
          {disabledReason ?? hint}
        </span>
        <Button type="submit" size={size === 'lg' ? 'icon' : 'icon-sm'} aria-label="Send" disabled={disabled || !text}>
          <IconArrowUp />
        </Button>
      </div>
    </form>
  );
}
