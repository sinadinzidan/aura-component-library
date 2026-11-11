import { render, screen } from '@testing-library/react';

import { StepTrack, type TrackStep } from './StepTrack';

const STEPS: TrackStep[] = [
  { id: 'request', label: 'Requested', detail: 'Tomás Barros, 06:40', state: 'done' },
  { id: 'approve', label: 'Approved', state: 'current' },
  { id: 'close', label: 'Closed', state: 'pending' },
];

describe(StepTrack.name, () => {
  it('lists the steps and marks the current one', () => {
    render(<StepTrack label="Permit life cycle" steps={STEPS} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Tomás Barros, 06:40')).toBeInTheDocument();
  });

  it('stands up as a chain with extra content per step', () => {
    render(<StepTrack label="Approvals" orientation="vertical" steps={[{ ...STEPS[0], extra: <span>Signed</span> }]} />);

    expect(screen.getByRole('list', { name: 'Approvals' })).toHaveAttribute('data-orientation', 'vertical');
    expect(screen.getByText('Signed')).toBeInTheDocument();
  });
});
