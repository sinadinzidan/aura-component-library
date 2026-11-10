import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LossWaterfall } from './LossWaterfall';
import type { LossWaterfallProps } from './LossWaterfall';

const PROPS: LossWaterfallProps = {
  start: { label: 'Plan', value: 54 },
  losses: [
    { id: 'trips', label: 'Compressor trips', value: 1.2 },
    { id: 'fouling', label: 'Cooler fouling', value: 0.8 },
  ],
  endLabel: 'Actual',
  unit: 'MSm³',
  label: 'Plan to actual',
};

describe(LossWaterfall.name, () => {
  it('draws a bar per step with its value and label', () => {
    const { container } = render(<LossWaterfall {...PROPS} />);

    expect(container.querySelectorAll('[data-slot="waterfall-bar"]')).toHaveLength(4);
    expect(screen.getByText('54.0')).toBeInTheDocument();
    expect(screen.getByText('−1.2')).toBeInTheDocument();
    expect(screen.getByText('52.0')).toBeInTheDocument();
    expect(screen.getByText('Cooler fouling')).toBeInTheDocument();
  });

  it('summarises the bridge in its accessible name', () => {
    render(<LossWaterfall {...PROPS} />);

    expect(screen.getByRole('list')).toHaveAccessibleName(
      'Plan to actual, in MSm³: Plan 54.0, Compressor trips minus 1.2, Cooler fouling minus 0.8, Actual 52.0'
    );
  });

  it('says when the axis does not start at zero', () => {
    const { container } = render(<LossWaterfall {...PROPS} floorStep={5} />);

    expect(container.querySelector('[data-slot="waterfall-axis-note"]')).toHaveTextContent('Axis starts at 50.0 MSm³');
  });

  it('has no axis note when the axis starts at zero', () => {
    const { container } = render(<LossWaterfall {...PROPS} losses={[{ id: 'outage', label: 'Outage', value: 30 }]} />);

    expect(container.querySelector('[data-slot="waterfall-axis-note"]')).toBeNull();
  });

  it('is static without a select handler', () => {
    render(<LossWaterfall {...PROPS} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('makes only the losses selectable and reports the choice', async () => {
    const onSelect = vi.fn();
    render(<LossWaterfall {...PROPS} selectedId="trips" onSelect={onSelect} />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Compressor trips/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Cooler fouling/ }));

    expect(onSelect).toHaveBeenCalledWith('fouling');
  });
});
