import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReactionBar } from './ReactionBar';
import type { Reaction } from './reactions';

const REACTIONS: readonly Reaction[] = [
  { id: 'agree', label: 'Agree', count: 3, reacted: false },
  { id: 'seen', label: 'Seen', count: 1, reacted: true },
  { id: 'thanks', label: 'Thanks', count: 0, reacted: false },
];

describe(ReactionBar.name, () => {
  it('names each toggle with its label and count', () => {
    render(<ReactionBar reactions={REACTIONS} onToggle={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Agree, 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thanks, 0' })).toBeInTheDocument();
  });

  it('shows the viewer’s own reaction as pressed', () => {
    render(<ReactionBar reactions={REACTIONS} onToggle={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Seen, 1' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Agree, 3' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports which reaction was toggled', async () => {
    const onToggle = vi.fn();
    render(<ReactionBar reactions={REACTIONS} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('button', { name: 'Agree, 3' }));

    expect(onToggle).toHaveBeenCalledWith('agree');
  });

  it('cannot be toggled while disabled', async () => {
    const onToggle = vi.fn();
    render(<ReactionBar reactions={REACTIONS} onToggle={onToggle} disabled />);

    await userEvent.click(screen.getByRole('button', { name: 'Agree, 3' }));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('groups the toggles under one name', () => {
    render(<ReactionBar reactions={REACTIONS} onToggle={vi.fn()} label="Reactions to Aisha’s comment" />);

    expect(screen.getByRole('group', { name: 'Reactions to Aisha’s comment' })).toBeInTheDocument();
  });
});
