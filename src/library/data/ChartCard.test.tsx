import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChartCard } from './ChartCard';
import type { ChartCardSeries } from './ChartCard';

const SERIES: readonly ChartCardSeries[] = [
  { key: 'suction', label: 'Suction pressure', color: 'var(--color-chart-1-450)' },
  { key: 'discharge', label: 'Discharge pressure', color: 'var(--color-chart-2-450)' },
];

describe(ChartCard.name, () => {
  it('shows the title, description, chart and summary', () => {
    render(
      <ChartCard title="Compressor pressure" description="Last 24 hours" summary="Stable around 48.6 barg.">
        <div>plot</div>
      </ChartCard>
    );

    expect(screen.getByRole('heading', { name: 'Compressor pressure' })).toBeInTheDocument();
    expect(screen.getByText('Last 24 hours')).toBeInTheDocument();
    expect(screen.getByText('plot')).toBeInTheDocument();
    expect(screen.getByText('Stable around 48.6 barg.')).toBeInTheDocument();
  });

  it('lists every series in a legend', () => {
    render(
      <ChartCard title="Compressor pressure" summary="Stable." series={SERIES}>
        <div>plot</div>
      </ChartCard>
    );

    const legend = screen.getByRole('list', { name: 'Legend' });
    expect(legend).toHaveTextContent('Suction pressure');
    expect(legend).toHaveTextContent('Discharge pressure');
  });

  it('has no legend without series and no legend buttons unless toggleable', () => {
    const { rerender } = render(
      <ChartCard title="Compressor pressure" summary="Stable.">
        <div>plot</div>
      </ChartCard>
    );
    expect(screen.queryByRole('list', { name: 'Legend' })).not.toBeInTheDocument();

    rerender(
      <ChartCard title="Compressor pressure" summary="Stable." series={SERIES}>
        <div>plot</div>
      </ChartCard>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('hides a series when its legend entry is pressed, and shows it again', async () => {
    renderToggleable();
    const suction = screen.getByRole('button', { name: 'Suction pressure' });

    await userEvent.click(suction);
    expect(suction).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('visible')).toHaveTextContent('discharge');

    await userEvent.click(suction);
    expect(suction).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('visible')).toHaveTextContent('suction,discharge');
  });

  it('keeps the last visible series on', async () => {
    renderToggleable();

    await userEvent.click(screen.getByRole('button', { name: 'Suction pressure' }));
    await userEvent.click(screen.getByRole('button', { name: 'Discharge pressure' }));

    expect(screen.getByRole('button', { name: 'Discharge pressure' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('visible')).toHaveTextContent('discharge');
  });

  it('renders header actions', () => {
    render(
      <ChartCard title="Compressor pressure" summary="Stable." actions={<button type="button">Last 24 hours</button>}>
        <div>plot</div>
      </ChartCard>
    );

    expect(screen.getByRole('button', { name: 'Last 24 hours' })).toBeInTheDocument();
  });
});

function renderToggleable() {
  return render(
    <ChartCard title="Compressor pressure" summary="Stable." series={SERIES} toggleable>
      {(isVisible) => (
        <div data-testid="visible">
          {SERIES.filter((entry) => isVisible(entry.key))
            .map((entry) => entry.key)
            .join(',')}
        </div>
      )}
    </ChartCard>
  );
}
