import { render, screen, within } from '@testing-library/react';

import { StageFlow } from './StageFlow';

const STAGES = [
  { id: 'taken', label: 'Taken', detail: '09:40' },
  { id: 'lab', label: 'In lab', detail: 'Since 10:15' },
  { id: 'approved', label: 'Approved' },
];

describe(StageFlow.name, () => {
  it('renders the stages in order as a named list', () => {
    render(<StageFlow label="Sample status" stages={STAGES} current="lab" />);

    const items = within(screen.getByRole('list', { name: 'Sample status' })).getAllByRole('listitem');
    expect(items.map((item) => item.dataset.state)).toEqual(['done', 'current', 'upcoming']);
  });

  it('marks the current stage for assistive technology', () => {
    render(<StageFlow label="Sample status" stages={STAGES} current="lab" />);

    expect(screen.getByText('In lab').closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('says each stage state in words', () => {
    render(<StageFlow label="Sample status" stages={STAGES} current="lab" />);

    expect(screen.getByText('Taken')).toHaveTextContent('Taken, done');
    expect(screen.getByText('Approved')).toHaveTextContent('Approved, not started');
  });

  it('treats every stage as upcoming when nothing has started', () => {
    render(<StageFlow label="Sample status" stages={STAGES} current={null} />);

    expect(screen.getAllByRole('listitem').every((item) => item.dataset.state === 'upcoming')).toBe(true);
  });

  it('marks every stage done when complete', () => {
    render(<StageFlow label="Sample status" stages={STAGES} current="approved" complete />);

    expect(screen.getAllByRole('listitem').every((item) => item.dataset.state === 'done')).toBe(true);
  });

  it('replaces the current stage detail with the note', () => {
    render(<StageFlow label="Sample status" stages={STAGES} current="lab" currentTone="warning" currentNote="Retest requested" />);

    expect(screen.getByText('Retest requested')).toBeInTheDocument();
    expect(screen.queryByText('Since 10:15')).not.toBeInTheDocument();
  });
});
