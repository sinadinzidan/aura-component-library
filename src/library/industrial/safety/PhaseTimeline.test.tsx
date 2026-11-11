import { render, screen, within } from '@testing-library/react';

import { PhaseTimeline } from './PhaseTimeline';
import type { TimelinePhase } from './PhaseTimeline';

const PHASES: TimelinePhase[] = [
  { id: 'charge', label: 'Charge', expected: 20, actual: 18, state: 'done' },
  { id: 'heat', label: 'Heat', expected: 40, actual: 46, state: 'done' },
  { id: 'react', label: 'React', expected: 90, actual: 45, state: 'current' },
  { id: 'cool', label: 'Cool', expected: 40, actual: null, state: 'upcoming' },
];

describe(PhaseTimeline.name, () => {
  it('names the list and shows every phase in order', () => {
    render(<PhaseTimeline label="Phases of batch B-118" phases={PHASES} />);

    const list = screen.getByRole('list', { name: 'Phases of batch B-118' });
    expect(within(list).getAllByRole('listitem').map((item) => item.getAttribute('data-state'))).toEqual(['done', 'done', 'current', 'upcoming']);
  });

  it('marks the current phase for assistive technology and in words', () => {
    render(<PhaseTimeline label="Phases" phases={PHASES} />);

    const current = screen.getByText('React').closest('li');
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(current?.querySelector('[data-slot="phase-state"]')).toHaveTextContent('Current');
  });

  it('prints time so far against expected time for started phases, and expected time for the rest', () => {
    render(<PhaseTimeline label="Phases" phases={PHASES} />);

    expect(screen.getByText('React').closest('li')).toHaveTextContent('45 of 90');
    expect(screen.getByText('Cool').closest('li')).toHaveTextContent('40');
    expect(screen.getByText('Cool').closest('li')).not.toHaveTextContent('of');
  });

  it('states an overrun in words', () => {
    render(<PhaseTimeline label="Phases" phases={PHASES} />);

    expect(screen.getByText('Heat').closest('li')?.querySelector('[data-slot="phase-overrun"]')).toHaveTextContent('6 min over');
    expect(screen.getByText('Charge').closest('li')?.querySelector('[data-slot="phase-overrun"]')).toBeNull();
  });

  it('fills the current phase by its progress and finished phases completely', () => {
    render(<PhaseTimeline label="Phases" phases={PHASES} />);

    expect(screen.getByText('React').closest('li')?.querySelector('[data-slot="phase-fill"]')).toHaveStyle({ width: '50%' });
    expect(screen.getByText('Charge').closest('li')?.querySelector('[data-slot="phase-fill"]')).toHaveStyle({ width: '100%' });
    expect(screen.getByText('Cool').closest('li')?.querySelector('[data-slot="phase-fill"]')).toHaveStyle({ width: '0%' });
  });

  it('says a held phase is on hold', () => {
    render(<PhaseTimeline label="Phases" phases={[{ id: 'react', label: 'React', expected: 90, actual: 30, state: 'held' }]} />);

    expect(screen.getByRole('listitem').querySelector('[data-slot="phase-state"]')).toHaveTextContent('On hold');
  });

  it('gives each phase a column as wide as its expected duration', () => {
    render(<PhaseTimeline label="Phases" phases={PHASES} />);

    expect(screen.getByRole('list').style.gridTemplateColumns).toBe('minmax(0, 20fr) minmax(0, 40fr) minmax(0, 90fr) minmax(0, 40fr)');
  });
});
