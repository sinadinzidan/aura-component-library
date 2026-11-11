import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './shells.css';

type ChatBubbleProps = {
  /** Who wrote it. The user's messages sit at the end of the row in the accent colour. */
  from: 'assistant' | 'user';
  /** Name shown above the message. */
  name: string;
  time?: string;
  /** Under the message: sources, suggested actions. */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** One message in a docked assistant panel or a comment thread. */
export function ChatBubble({ from, name, time, footer, className, children }: ChatBubbleProps) {
  const look = useLook();
  return (
    <div data-look={look} data-from={from} className={cx('shell-chat', className)}>
      <div className="shell-chat-meta">
        <span className="shell-chat-name">{name}</span>
        {time ? <span>{time}</span> : null}
      </div>
      <div className="shell-chat-body">{children}</div>
      {footer}
    </div>
  );
}
