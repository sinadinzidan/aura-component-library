import { render, screen, within } from '@testing-library/react';

import { DurationBars } from './DurationBars';

const T0 = Date.UTC(2026, 2, 12, 8, 0, 0);
const HOUR = 60 * 60 * 1000;

const PHASES = [
  { id: 'detect', label: 'Detect', start: T0, end: T0 + HOUR },
  { id: 'repair', label: 'Repair', start: T0 + HOUR, end: T0 + 4 * HOUR },
  { id: 'restart', label: 'Restart', start: T0 + 4 * HOUR },
];

describe(DurationBars.name, () => {
  it('lists every phase with its duration in words', () => {
    render(<DurationBars label="Time in each phase" phases={PHASES} now={T0 + 5 * HOUR} />);

    const rows = within(screen.getByRole('list', { name: 'Time in each phase' })).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Detect1 h');
    expect(rows[1]).toHaveTextContent('Repair3 h');
  });

  it('says that an unfinished phase is still running', () => {
    render(<DurationBars label="Phases" phases={PHASES} now={T0 + 5 * HOUR} />);

    expect(screen.getByText('1 h so far')).toBeInTheDocument();
  });

  it('positions each bar on the shared scale', () => {
    const { container } = render(<DurationBars label="Phases" phases={PHASES} now={T0 + 5 * HOUR} />);

    const bars = container.querySelectorAll<HTMLElement>('[data-slot="duration-bar"]');
    expect(bars[1].style.left).toBe('20%');
    expect(bars[1].style.width).toBe('60%');
  });

  it('labels the ends of the scale when given', () => {
    render(<DurationBars label="Phases" phases={PHASES} now={T0 + 5 * HOUR} scaleStart="08:00" scaleEnd="13:00" />);

    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('13:00')).toBeInTheDocument();
  });
});
