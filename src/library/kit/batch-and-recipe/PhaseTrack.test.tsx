import { fireEvent, render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { phaseTone, type TrackPhase } from './phases';
import { PhaseTrack } from './PhaseTrack';

const PHASES: TrackPhase[] = [
  { id: 'charge', label: 'Charge', expected: 20, actual: 18, state: 'done' },
  { id: 'heat', label: 'Heat', expected: 40, actual: 46, state: 'done' },
  { id: 'react', label: 'React', expected: 90, actual: 54, state: 'current' },
  { id: 'cool', label: 'Cool', expected: 50, actual: null, state: 'upcoming' },
];

describe(phaseTone.name, () => {
  it('judges a phase by its state and its overrun', () => {
    expect(PHASES.map(phaseTone)).toEqual(['success', 'warning', 'info', 'neutral']);
    expect(phaseTone({ ...PHASES[2], state: 'held' })).toBe('warning');
  });
});

describe(PhaseTrack.name, () => {
  it('shows minutes against the recipe and the overrun', () => {
    render(<PhaseTrack label="Phases" phases={PHASES} />);

    const track = screen.getByRole('group', { name: 'Phases' });
    expect(track).toHaveTextContent('18 / 20 min');
    expect(track).toHaveTextContent('+6');
    expect(track).toHaveTextContent('Running');
    expect(track).toHaveTextContent('50 min');
  });

  it('writes the state of every phase in the block anatomy', () => {
    render(
      <LookScope look="console">
        <PhaseTrack label="Phases" phases={PHASES} />
      </LookScope>
    );

    const track = screen.getByRole('group', { name: 'Phases' });
    expect(track).toHaveAttribute('data-anatomy', 'block');
    expect(track).toHaveTextContent('Not started');
    expect(track).toHaveTextContent('46 / 40 min · +6');
  });

  it('reports the selected phase', () => {
    const onSelect = vi.fn();
    render(<PhaseTrack label="Phases" phases={PHASES} selectedId="heat" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: /Heat/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /React/ }));

    expect(onSelect).toHaveBeenCalledWith('react');
  });
});
