import { render, screen, within } from '@testing-library/react';

import { RouteStepper, type RouteStop } from './RouteStepper';

const STOPS: RouteStop[] = [
  { id: 'a', name: 'Inlet', detail: '4 of 4', state: 'done' },
  { id: 'b', name: 'Compressor hall', detail: '3 of 5', state: 'issue' },
  { id: 'c', name: 'Cooler deck', detail: '1 of 3', state: 'current' },
  { id: 'd', name: 'Export', detail: '0 of 2', state: 'upcoming' },
];

describe(RouteStepper.name, () => {
  it('lists the stops in order with their state in words', () => {
    render(<RouteStepper label="Route progress" stops={STOPS} />);

    const items = within(screen.getByRole('list', { name: 'Route progress' })).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(within(items[0]).getByText('Done')).toBeInTheDocument();
    expect(within(items[1]).getByText('Finding')).toBeInTheDocument();
    expect(within(items[2]).getByText('Here now')).toBeInTheDocument();
    expect(within(items[3]).getByText('Ahead')).toBeInTheDocument();
  });

  it('marks the current stop and tones each one', () => {
    render(<RouteStepper label="Route progress" stops={STOPS} />);

    const items = screen.getAllByRole('listitem');
    expect(items[2]).toHaveAttribute('aria-current', 'step');
    expect(items[1]).toHaveAttribute('data-tone', 'critical');
    expect(items[3]).toHaveAttribute('data-tone', 'neutral');
  });
});
