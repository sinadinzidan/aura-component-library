import { render, screen, within } from '@testing-library/react';

import { LineStatusStrip } from './LineStatusStrip';
import type { LineStation } from './LineStatusStrip';

const STATIONS: readonly LineStation[] = [
  { id: 'op10', name: 'OP 10', state: 'running', operation: 'Load' },
  { id: 'op20', name: 'OP 20', state: 'running' },
  { id: 'op30', name: 'OP 30', state: 'blocked' },
  { id: 'op40', name: 'OP 40', state: 'down' },
  { id: 'op50', name: 'OP 50', state: 'starved' },
];

describe(LineStatusStrip.name, () => {
  it('lists the stations in flow order', () => {
    render(<LineStatusStrip label="Line 3" stations={STATIONS} />);

    const stations = within(screen.getByRole('list', { name: 'Line 3 stations in flow order' })).getAllByRole('listitem');
    expect(stations.map((station) => station.getAttribute('data-state'))).toEqual(['running', 'running', 'blocked', 'down', 'starved']);
  });

  it('writes every state in words', () => {
    render(<LineStatusStrip label="Line 3" stations={STATIONS} showSummary={false} />);

    expect(screen.getAllByText('Running')).toHaveLength(2);
    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('Down')).toBeInTheDocument();
    expect(screen.getByText('Starved')).toBeInTheDocument();
  });

  it('tints only the stations that are not running', () => {
    render(<LineStatusStrip label="Line 3" stations={STATIONS} showSummary={false} />);

    expect(screen.getByText('OP 10').parentElement).toHaveClass('bg-muted-background');
    expect(screen.getByText('OP 40').parentElement).toHaveClass('bg-critical-background');
  });

  it('shows what a station does when given', () => {
    render(<LineStatusStrip label="Line 3" stations={STATIONS} />);

    expect(screen.getByText('Load')).toBeInTheDocument();
  });

  it('counts stations per state, leaving out empty states', () => {
    render(<LineStatusStrip label="Line 3" stations={STATIONS} />);

    const summary = within(screen.getByRole('list', { name: 'Line 3 stations by state' })).getAllByRole('listitem');
    expect(summary.map((item) => item.textContent)).toEqual(['Running2', 'Blocked1', 'Starved1', 'Down1']);
  });
});
