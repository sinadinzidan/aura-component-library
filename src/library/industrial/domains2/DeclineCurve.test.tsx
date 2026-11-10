import { render, screen } from '@testing-library/react';

import { declineSeries } from './decline';
import { DeclineCurve } from './DeclineCurve';

const MONTH = 30 * 24 * 60 * 60 * 1000;
const START = Date.UTC(2025, 2, 12);
const FIT = { initialRate: 900, declineRate: 0.04, exponent: 0.4 };
const HISTORY = declineSeries({ ...FIT, months: 13, start: START });
const FORECAST = declineSeries({ ...FIT, months: 25, start: START + 12 * MONTH, offsetMonths: 12 });

describe(DeclineCurve.name, () => {
  it('exposes the chart as an image named by its label', () => {
    render(<DeclineCurve label="Oil rate of NK A-12 H with forecast" history={HISTORY} forecast={FORECAST} />);

    expect(screen.getByRole('img', { name: 'Oil rate of NK A-12 H with forecast' })).toBeInTheDocument();
  });

  it('names the measured and forecast series in the legend', () => {
    render(<DeclineCurve label="Oil rate" history={HISTORY} forecast={FORECAST} historyLabel="Allocated oil" forecastLabel="Arps fit" />);

    expect(screen.getByText('Allocated oil')).toBeInTheDocument();
    expect(screen.getByText('Arps fit')).toBeInTheDocument();
  });

  it('prints the summary and the unit', () => {
    render(<DeclineCurve label="Oil rate" history={HISTORY} forecast={FORECAST} unit="Sm³/d" summary="Reaches the economic limit in 2028." />);

    expect(screen.getByText('Sm³/d')).toBeInTheDocument();
    expect(screen.getByText('Reaches the economic limit in 2028.')).toBeInTheDocument();
  });

  it('renders without a forecast', () => {
    render(<DeclineCurve label="Oil rate" history={HISTORY} forecast={[]} economicLimit={150} />);

    expect(screen.getByRole('img', { name: 'Oil rate' })).toBeInTheDocument();
  });
});
