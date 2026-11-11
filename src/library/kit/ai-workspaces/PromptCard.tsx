import type { ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

const SURFACE: Record<LookId, string> = {
  studio: 'rounded-(--kit-radius) border border-(--kit-rule) bg-(--kit-surface) shadow-(--kit-panel-shadow) hover:border-(--kit-rule-strong)',
  console: 'border-l-4 border-(--t-line) bg-(--kit-surface) hover:bg-(--kit-well)',
  poster: 'border-2 border-(--kit-rule-strong) bg-(--t-pop) text-(color:--t-on-pop) shadow-(--kit-panel-shadow)',
  glass: 'rounded-(--kit-radius) border border-(--kit-rule) bg-(--kit-surface) backdrop-blur-xl hover:border-(--kit-rule-strong)',
  editorial: 'border-t-2 border-(--kit-rule-strong) pt-3',
  soft: 'rounded-(--kit-radius) bg-[color-mix(in_oklab,var(--t-soft)_72%,var(--kit-surface))]',
  blueprint: 'border border-(--kit-rule-strong) bg-(--kit-surface)',
  signal: 'rounded-(--kit-radius) bg-(--t-solid) text-(color:--t-on-solid)',
};

type PromptCardProps = {
  /** The suggestion in a few words: "Explain the 13:46 trip". */
  title: string;
  /** What the assistant will do with it, in one line. */
  detail?: string;
  /** Icon element for the kind of task. */
  icon?: ReactNode;
  tone?: Tone;
  onSelect: () => void;
  className?: string;
};

/**
 * A suggested prompt as a card that can be clicked to start with it. An elevated card in
 * studio, a pastel tile in soft, a solid colour block in poster, a ruled entry in editorial.
 */
export function PromptCard({ title, detail, icon, tone = 'accent', onSelect, className }: PromptCardProps) {
  const look = useLook();
  const plain = look === 'editorial';
  const solid = look === 'poster' || look === 'signal';
  return (
    <button
      type="button"
      data-look={look}
      data-tone={tone}
      onClick={onSelect}
      className={cx('flex min-w-0 cursor-pointer flex-col gap-2 text-left outline-none focus-visible:shadow-(--shadow-focus-ring)', plain ? '' : 'p-4', SURFACE[look], className)}
    >
      {icon ? (
        <span aria-hidden="true" className={cx('[&>svg]:size-5', solid ? '' : 'text-(color:--t-ink)')}>
          {icon}
        </span>
      ) : null}
      <span className={cx('font-semibold', look === 'poster' || look === 'editorial' ? 'text-lg leading-snug' : 'text-sm', solid ? '' : 'text-(color:--kit-text)')}>{title}</span>
      {detail ? <span className={cx('text-sm', solid ? '' : 'text-(color:--kit-text-2)')}>{detail}</span> : null}
    </button>
  );
}
