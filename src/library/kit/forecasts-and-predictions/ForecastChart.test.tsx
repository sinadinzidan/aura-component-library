import { render, screen } from '@testing-library/react';

import { ForecastChart } from './ForecastChart';

const LABELS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

describe(ForecastChart.name, () => {
  it('names the plot and lists measured, forecast and range in the legend', () => {
    render(<ForecastChart label="Vibration forecast" labels={LABELS} history={[5, 5.5, 6]} forecast={[6.4, 6.8, 7.2]} range={[{ low: 6, high: 7 }, { low: 6, high: 7.6 }, { low: 6.2, high: 8.2 }]} rangeLabel="80 % range" />);

    expect(screen.getByRole('img', { name: 'Vibration forecast' })).toBeInTheDocument();
    expect(screen.getByText('Measured')).toBeInTheDocument();
    expect(screen.getByText('Forecast')).toBeInTheDocument();
    expect(screen.getByText('80 % range')).toBeInTheDocument();
  });

  it('adds the limit, scenarios and the backtest to the legend', () => {
    render(
      <ForecastChart
        label="Export outlook"
        labels={LABELS}
        history={[4.2, 4.3, 4.4]}
        forecast={[4.4, 4.5, 4.5]}
        actual={[4.4, 4.4, 4.6]}
        scenarios={[{ id: 'low', label: 'Recompressor stays down', values: [4.3, 4.2, 4.1], tone: 'warning' }]}
        limit={{ value: 4.5, label: 'Plan' }}
        unit="MSm³/d"
      />
    );

    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Actual')).toBeInTheDocument();
    expect(screen.getByText('Recompressor stays down')).toBeInTheDocument();
    expect(screen.getByText('MSm³/d')).toBeInTheDocument();
  });

  it('can drop the legend', () => {
    render(<ForecastChart label="Outlook" labels={LABELS} history={[1, 2, 3]} forecast={[4, 5, 6]} showLegend={false} />);

    expect(screen.queryByText('Measured')).not.toBeInTheDocument();
  });
});
