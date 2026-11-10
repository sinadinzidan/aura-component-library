import { render, screen, within } from '@testing-library/react';

import { MilestoneTrack } from './MilestoneTrack';
import type { Milestone } from './MilestoneTrack';

const MILESTONES: readonly Milestone[] = [
  { id: 'requested', label: 'Requested', detail: '10 Mar', state: 'done' },
  { id: 'approved', label: 'Approved', detail: '11 Mar', state: 'done' },
  { id: 'progress', label: 'In progress', detail: 'Since 08:10', state: 'current' },
  { id: 'done', label: 'Done', state: 'pending' },
];

describe(MilestoneTrack.name, () => {
  it('lists every milestone in order under one name', () => {
    render(<MilestoneTrack label="Status of WO-104482" milestones={MILESTONES} />);

    const items = within(screen.getByRole('list', { name: 'Status of WO-104482' })).getAllByRole('listitem');
    expect(items.map((item) => item.getAttribute('data-state'))).toEqual(['done', 'done', 'current', 'pending']);
  });

  it('marks only the current milestone as the current step', () => {
    render(<MilestoneTrack label="Status" milestones={MILESTONES} />);

    const current = screen.getAllByRole('listitem').filter((item) => item.getAttribute('aria-current') === 'step');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('In progress');
  });

  it('writes each state out in words', () => {
    render(<MilestoneTrack label="Status" milestones={MILESTONES} />);

    expect(screen.getAllByText('(Completed)')).toHaveLength(2);
    expect(screen.getByText('(Current)')).toBeInTheDocument();
    expect(screen.getByText('(Not started)')).toBeInTheDocument();
  });

  it('shows the detail of a milestone', () => {
    render(<MilestoneTrack label="Status" milestones={MILESTONES} />);

    expect(screen.getByText('Since 08:10')).toBeInTheDocument();
  });

  it('numbers the steps that are not completed', () => {
    render(<MilestoneTrack label="Status" milestones={MILESTONES} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('drops the numbers with dot markers', () => {
    render(<MilestoneTrack label="Status" milestones={MILESTONES} markers="dot" />);

    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });
});
