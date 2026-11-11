import { render, screen } from '@testing-library/react';

import { SafetyCalendar } from './SafetyCalendar';

describe(SafetyCalendar.name, () => {
  it('names every day with what happened on it', () => {
    render(<SafetyCalendar label="March 2026" days={['safe', 'near-miss', 'incident', 'ahead']} offset={6} />);

    const month = screen.getByRole('list', { name: 'March 2026' });
    expect(month.querySelectorAll('[data-state]')).toHaveLength(4);
    expect(screen.getByLabelText('2: near miss')).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByLabelText('3: incident')).toHaveTextContent('3×');
  });
});
