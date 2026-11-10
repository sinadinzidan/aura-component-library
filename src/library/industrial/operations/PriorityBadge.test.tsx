import { render, screen } from '@testing-library/react';

import { PriorityBadge, priorityMeaning } from './PriorityBadge';

describe(PriorityBadge.name, () => {
  it('shows the priority code', () => {
    render(<PriorityBadge priority="P1" />);

    expect(screen.getByText('P1')).toHaveAttribute('data-priority', 'P1');
  });

  it('says what the code means to assistive technology', () => {
    render(<PriorityBadge priority="P2" />);

    expect(screen.getByLabelText('Priority P2, urgent')).toBeInTheDocument();
  });

  it('spells out the meaning when asked', () => {
    render(<PriorityBadge priority="P3" showMeaning />);

    expect(screen.getByText('P3 · Normal')).toBeInTheDocument();
  });

  it('exposes the meaning of each code', () => {
    expect(priorityMeaning('P4')).toBe('Low');
  });
});
