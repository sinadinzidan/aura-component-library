import { render, screen, within } from '@testing-library/react';

import { StageTrack, type Stage } from './StageTrack';

const STAGES: Stage[] = [
  { id: 'draft', label: 'Drafted', detail: 'Aisha Khan · 4 Mar', state: 'done' },
  { id: 'approve', label: 'Approved', state: 'current' },
  { id: 'verify', label: 'Verified', state: 'todo' },
];

describe(StageTrack.name, () => {
  it('renders the stages in order with their detail', () => {
    render(<StageTrack label="Change status" stages={STAGES} />);

    const items = within(screen.getByRole('list', { name: 'Change status' })).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Drafted');
    expect(items[0]).toHaveTextContent('Aisha Khan · 4 Mar');
  });

  it('marks the current stage and numbers the ones not done', () => {
    render(<StageTrack label="Change status" stages={STAGES} />);

    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[1]).toHaveTextContent('2');
    expect(items[2]).toHaveAttribute('data-state', 'todo');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });

  it('says the state in words when no detail is given', () => {
    render(<StageTrack label="Change status" stages={STAGES} />);

    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveTextContent('In progress');
    expect(items[2]).toHaveTextContent('Not started');
  });
});
