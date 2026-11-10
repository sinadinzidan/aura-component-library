import { render, screen } from '@testing-library/react';

import { ScatterPlot } from './ScatterPlot';
import type { ScatterGroup } from './ScatterPlot';

const GROUPS: readonly ScatterGroup[] = [
  { key: 'history', label: 'Last 7 days', points: [{ x: 160, y: 46 }, { x: 180, y: 48 }, { x: 200, y: 50 }] },
  { key: 'now', label: 'Now', points: [{ x: 182, y: 48.6 }], emphasis: true },
];

describe(ScatterPlot.name, () => {
  it('exposes the chart as an image named by its label', () => {
    render(<ScatterPlot label="Discharge pressure against gas flow" groups={GROUPS} xLabel="Flow (kSm³/h)" yLabel="Pressure (barg)" />);

    expect(screen.getByRole('img', { name: 'Discharge pressure against gas flow' })).toBeInTheDocument();
  });

  it('prints both axis titles', () => {
    render(<ScatterPlot label="Pressure against flow" groups={GROUPS} xLabel="Flow (kSm³/h)" yLabel="Pressure (barg)" />);

    expect(screen.getByText('Flow (kSm³/h)')).toBeInTheDocument();
    expect(screen.getByText('Pressure (barg)')).toBeInTheDocument();
  });

  it('lists the groups in the legend and prints the summary', () => {
    render(
      <ScatterPlot label="Pressure against flow" groups={GROUPS} xLabel="Flow" yLabel="Pressure" legend summary="All points inside the envelope." />
    );

    const legend = screen.getByRole('list', { name: 'Legend' });
    expect(legend).toHaveTextContent('Last 7 days');
    expect(legend).toHaveTextContent('Now');
    expect(screen.getByText('All points inside the envelope.')).toBeInTheDocument();
  });

  it('renders with an envelope, references, bubbles and no points', () => {
    render(
      <ScatterPlot
        label="Empty bubble chart"
        groups={[{ key: 'assets', label: 'Assets', points: [] }]}
        xLabel="Age"
        yLabel="Health"
        envelope={{ x1: 0, x2: 10, y1: 0, y2: 10, label: 'Envelope' }}
        references={[{ axis: 'y', value: 5, label: 'Limit' }]}
        sizeRange={[40, 400]}
      />
    );

    expect(screen.getByRole('img', { name: 'Empty bubble chart' })).toBeInTheDocument();
  });
});
