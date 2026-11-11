import type { ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

type Anatomy = 'bubble' | 'row' | 'column' | 'sheet';

const ANATOMY: Record<LookId, Anatomy> = {
  studio: 'bubble',
  console: 'row',
  poster: 'bubble',
  glass: 'bubble',
  editorial: 'column',
  soft: 'bubble',
  blueprint: 'sheet',
  signal: 'bubble',
};

const ASSISTANT_BUBBLE: Record<LookId, string> = {
  studio: 'rounded-(--kit-radius) rounded-tl-[4px] border border-(--kit-rule) bg-(--kit-surface) shadow-(--kit-panel-shadow)',
  console: '',
  poster: 'border-2 border-(--kit-rule-strong) bg-(--kit-surface) shadow-(--kit-panel-shadow)',
  glass: 'rounded-(--kit-radius) rounded-tl-[6px] border border-(--kit-rule) bg-(--kit-surface) backdrop-blur-xl',
  editorial: '',
  soft: 'rounded-(--kit-radius) rounded-tl-[8px] bg-(--kit-surface) shadow-(--kit-panel-shadow)',
  blueprint: '',
  signal: 'rounded-(--kit-radius) bg-(--kit-surface)',
};

const USER_BUBBLE: Record<LookId, string> = {
  studio: 'rounded-(--kit-radius) rounded-tr-[4px] bg-(--kit-accent) text-(color:--kit-on-accent)',
  console: '',
  poster: 'border-2 border-(--kit-rule-strong) bg-(--kit-text) text-(color:--kit-surface)',
  glass: 'rounded-(--kit-radius) rounded-tr-[6px] border border-(--kit-rule-strong) bg-[color-mix(in_oklab,var(--kit-line-accent)_28%,transparent)] backdrop-blur-xl',
  editorial: '',
  soft: 'rounded-(--kit-radius) rounded-tr-[8px] bg-(--kit-accent) text-(color:--kit-on-accent)',
  blueprint: '',
  signal: 'rounded-(--kit-radius) bg-(--kit-line-info) text-(color:--base-background)',
};

type ChatMessageProps = {
  /** Who is speaking. It decides the side, the fill and the label. */
  role: 'user' | 'assistant';
  /** Name shown with the message: the person, or the assistant's name. */
  author: string;
  time?: string;
  /** Avatar or icon chip of the author. */
  avatar?: ReactNode;
  /** Under an answer: copy, rate, regenerate. */
  actions?: ReactNode;
  className?: string;
  /** The message: text, and for answers also charts, tables, sources and tool steps. */
  children: ReactNode;
};

/**
 * One turn of a conversation. The look decides its anatomy: bubbles on two sides in studio, soft
 * and glass; full-width log rows with an edge bar on a console; a typeset question and answer in
 * editorial; a framed sheet with a title block on a blueprint.
 */
export function ChatMessage({ role, author, time, avatar, actions, className, children }: ChatMessageProps) {
  const look = useLook();
  const anatomy = ANATOMY[look];
  const user = role === 'user';
  const byline = (
    <span className="flex items-baseline gap-2 text-sm">
      <span className="font-semibold text-(color:--kit-text)">{author}</span>
      {time ? <span className="text-xs text-(color:--kit-text-3) tabular-nums">{time}</span> : null}
    </span>
  );

  if (anatomy === 'row') {
    return (
      <article data-look={look} data-role={role} className={cx('flex min-w-0 gap-3 border-b border-(--kit-rule) py-3 pr-3.5', className)}>
        <span aria-hidden="true" className={cx('w-1 shrink-0 self-stretch', user ? 'bg-(--kit-rule-strong)' : 'bg-(--kit-line-accent)')} />
        <div className="flex w-24 shrink-0 flex-col text-sm">
          <span className="font-semibold text-(color:--kit-text)">{author}</span>
          {time ? <span className="text-xs text-(color:--kit-text-3) tabular-nums">{time}</span> : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 text-sm text-(color:--kit-text)">
          {children}
          {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
        </div>
      </article>
    );
  }

  if (anatomy === 'column') {
    return (
      <article data-look={look} data-role={role} className={cx('flex min-w-0 flex-col gap-3', user ? 'border-t-2 border-(--kit-rule-strong) pt-4' : '', className)}>
        {user ? (
          <>
            <span className="text-sm text-(color:--kit-text-3)">
              {author}
              {time ? ` · ${time}` : ''}
            </span>
            <div className="max-w-[32ch] text-3xl leading-tight font-medium tracking-tight text-balance text-(color:--kit-text)">{children}</div>
          </>
        ) : (
          <>
            {byline}
            <div className="flex flex-col gap-4 text-base leading-relaxed text-(color:--kit-text)">{children}</div>
            {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
          </>
        )}
      </article>
    );
  }

  if (anatomy === 'sheet') {
    return (
      <article data-look={look} data-role={role} className={cx('flex min-w-0 flex-col border border-(--kit-rule-strong) bg-(--kit-surface)', user ? 'ml-16' : 'mr-16', className)}>
        <header className="flex items-stretch border-b border-(--kit-rule-strong) text-sm">
          <span className="flex w-10 items-center justify-center border-r border-(--kit-rule-strong) font-semibold">{user ? 'Q' : 'A'}</span>
          <span className="flex-1 px-3 py-1.5 font-semibold">{author}</span>
          {time ? <span className="border-l border-(--kit-rule-strong) px-3 py-1.5 text-(color:--kit-text-2) tabular-nums">{time}</span> : null}
        </header>
        <div className="flex flex-col gap-3 p-3.5 text-sm text-(color:--kit-text)">
          {children}
          {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
        </div>
      </article>
    );
  }

  return (
    <article data-look={look} data-role={role} className={cx('flex min-w-0 gap-3', user ? 'flex-row-reverse' : '', className)}>
      {avatar ? <span className="mt-6 shrink-0">{avatar}</span> : null}
      <div className={cx('flex max-w-[85%] min-w-0 flex-col gap-1.5', user ? 'items-end' : 'flex-1 items-start')}>
        {byline}
        <div className={cx('flex min-w-0 flex-col gap-3 px-4 py-3 text-sm leading-relaxed', user ? USER_BUBBLE[look] : cx('w-full', ASSISTANT_BUBBLE[look]))}>{children}</div>
        {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
      </div>
    </article>
  );
}
