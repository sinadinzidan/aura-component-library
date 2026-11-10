import { render, screen } from '@testing-library/react';

import { StepList } from './StepList';
import type { StepListItem } from './StepList';

const STEPS: readonly StepListItem[] = [
  { id: 'purge', label: 'Purge casing', state: 'done' },
  { id: 'seal', label: 'Pressurise seal gas', detail: 'Waiting for 23-PT-92560', state: 'active' },
  { id: 'crank', label: 'Crank to idle', state: 'pending' },
];

describe(StepList.name, () => {
  it('names the sequence and lists every step', () => {
    render(<StepList label="Start-up sequence" steps={STEPS} />);
    expect(screen.getByRole('list', { name: 'Start-up sequence' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('marks the step in progress as the current one', () => {
    render(<StepList label="Start-up sequence" steps={STEPS} />);
    expect(screen.getByText('Pressurise seal gas').closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Purge casing').closest('li')).not.toHaveAttribute('aria-current');
  });

  it('says each state in words', () => {
    render(<StepList label="Start-up sequence" steps={STEPS} />);
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
  });

  it('numbers steps that have not started', () => {
    render(<StepList label="Start-up sequence" steps={STEPS} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows detail and meta in the vertical layout', () => {
    render(<StepList label="Start-up sequence" steps={[{ ...STEPS[1], meta: <button type="button">Hold</button> }]} />);
    expect(screen.getByText('Waiting for 23-PT-92560')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hold' })).toBeInTheDocument();
  });

  it('renders the same steps horizontally', () => {
    render(<StepList label="Round progress" orientation="horizontal" steps={STEPS} />);
    expect(screen.getByRole('list', { name: 'Round progress' })).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.getByText('Crank to idle')).toBeInTheDocument();
  });
});
