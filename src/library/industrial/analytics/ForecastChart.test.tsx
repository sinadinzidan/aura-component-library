import { render, screen } from '@testing-library/react';

import { ForecastChart } from './ForecastChart';

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 2, 12, 14, 0, 0);
const HISTORY = [140, 141, 142, 143].map((v, index) => ({ t: NOW - (3 - index) * HOUR, v }));
const FORECAST = [144, 145, 146].map((v, index) => ({ t: NOW + (index + 1) * HOUR, v }));
const BAND = FORECAST.map((point) => ({ t: point.t, low: point.v - 1, high: point.v + 1 }));

describe(ForecastChart.name, () => {
  it('exposes the chart as an image named by its label', () => {
    render(<ForecastChart label="Discharge temperature with a 3 hour forecast" history={HISTORY} forecast={FORECAST} now={NOW} />);

    expect(screen.getByRole('img', { name: 'Discharge temperature with a 3 hour forecast' })).toBeInTheDocument();
  });

  it('lists measured values, the forecast and its range in the legend', () => {
    render(<ForecastChart label="Forecast" history={HISTORY} forecast={FORECAST} band={BAND} now={NOW} />);

    expect(screen.getByText('Measured')).toBeInTheDocument();
    expect(screen.getByText('Forecast')).toBeInTheDocument();
    expect(screen.getByText('P10–P90 range')).toBeInTheDocument();
  });

  it('adds the actual series of a backtest', () => {
    render(<ForecastChart label="Backtest" history={HISTORY} forecast={FORECAST} actual={FORECAST} actualLabel="What happened" now={NOW} />);

    expect(screen.getByText('What happened')).toBeInTheDocument();
  });

  it('lists every scenario instead of a single forecast', () => {
    render(
      <ForecastChart
        label="Scenarios"
        history={HISTORY}
        now={NOW}
        scenarios={[
          { key: 'low', label: 'Low case', points: FORECAST },
          { key: 'high', label: 'High case', points: FORECAST },
        ]}
      />
    );

    expect(screen.getByText('Low case')).toBeInTheDocument();
    expect(screen.getByText('High case')).toBeInTheDocument();
    expect(screen.queryByText('Forecast')).not.toBeInTheDocument();
  });

  it('can hide the legend and print a summary', () => {
    render(<ForecastChart label="Forecast" history={HISTORY} forecast={FORECAST} now={NOW} legend={false} summary="Reaches 145 °C in about 2 h." />);

    expect(screen.queryByText('Measured')).not.toBeInTheDocument();
    expect(screen.getByText('Reaches 145 °C in about 2 h.')).toBeInTheDocument();
  });
});
