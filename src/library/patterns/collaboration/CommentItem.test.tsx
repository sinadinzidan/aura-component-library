import { render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';

import { CommentItem } from './CommentItem';

describe(CommentItem.name, () => {
  it('shows the author, time and text', () => {
    renderComment({});

    const comment = screen.getByRole('article', { name: 'Comment by Aisha Khan' });
    expect(within(comment).getByText('Aisha Khan')).toBeInTheDocument();
    expect(within(comment).getByText('14 min ago')).toBeInTheDocument();
    expect(within(comment).getByText('Vibration is back under the limit.')).toBeInTheDocument();
  });

  it('says when a comment was edited', () => {
    renderComment({ edited: true });

    expect(screen.getByText('14 min ago · Edited')).toBeInTheDocument();
  });

  it('replaces a deleted comment with a tombstone and hides its content', () => {
    renderComment({ deleted: true, footer: <button type="button">Reply</button>, attachments: <span>file.pdf</span> });

    expect(screen.getByRole('article', { name: 'Deleted comment' })).toBeInTheDocument();
    expect(screen.getByText(/This comment was deleted/)).toBeInTheDocument();
    expect(screen.queryByText('Vibration is back under the limit.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
    expect(screen.queryByText('file.pdf')).not.toBeInTheDocument();
  });

  it('keeps the replies of a deleted comment', () => {
    renderComment({
      deleted: true,
      replies: (
        <CommentItem author="Tomás Barros" time="5 min ago" size="compact">
          Agreed.
        </CommentItem>
      ),
    });

    expect(screen.getByRole('article', { name: 'Comment by Tomás Barros' })).toBeInTheDocument();
  });

  it('nests replies inside the comment they answer', () => {
    renderComment({
      replies: (
        <CommentItem author="Tomás Barros" time="5 min ago" size="compact">
          Agreed.
        </CommentItem>
      ),
    });

    const parent = screen.getByRole('article', { name: 'Comment by Aisha Khan' });
    expect(within(parent).getByRole('article', { name: 'Comment by Tomás Barros' })).toBeInTheDocument();
  });

  it('renders the badge, attachments and footer', () => {
    renderComment({
      badge: <span>Pinned</span>,
      attachments: <span>Borescope.jpg</span>,
      footer: <button type="button">Reply</button>,
    });

    expect(screen.getByText('Pinned')).toBeInTheDocument();
    expect(screen.getByText('Borescope.jpg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reply' })).toBeInTheDocument();
  });
});

function renderComment(props: Partial<ComponentProps<typeof CommentItem>>) {
  return render(
    <CommentItem author="Aisha Khan" time="14 min ago" {...props}>
      Vibration is back under the limit.
    </CommentItem>
  );
}
