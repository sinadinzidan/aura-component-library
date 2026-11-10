import { render, screen } from '@testing-library/react';

import { TrendCard } from './TrendCard';

describe(TrendCard.name, () => {
  it('shows the title, description, chart and summary', () => {
    render(
      <TrendCard title="Discharge pressure" description="23-PT-92531" summary="Stable around 48.6 barg.">
        <div>plot</div>
      </TrendCard>
    );

    expect(screen.getByRole('heading', { name: 'Discharge pressure' })).toBeInTheDocument();
    expect(screen.getByText('23-PT-92531')).toBeInTheDocument();
    expect(screen.getByText('plot')).toBeInTheDocument();
    expect(screen.getByText('Stable around 48.6 barg.')).toBeInTheDocument();
  });

  it('prints the reading with its change and state', () => {
    render(
      <TrendCard
        title="Discharge temperature"
        reading={{ value: 146.3, unit: '°C', decimals: 1, tone: 'warning' }}
        delta={{ reference: 141.2, caption: 'in 1 h', goodDirection: 'down' }}
        status={{ tone: 'warning', label: 'Above high limit' }}
      >
        <div>plot</div>
      </TrendCard>
    );

    expect(screen.getByText('146.3')).toHaveClass('text-warning-foreground-strong');
    expect(screen.getByText('+5.1', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('in 1 h')).toBeInTheDocument();
    expect(screen.getByText('Above high limit')).toBeInTheDocument();
  });

  it('prints an em dash and no change when there is no value', () => {
    const { container } = render(
      <TrendCard title="Bearing temperature" reading={{ value: null, unit: '°C' }} delta={{ reference: 61 }}>
        <div>plot</div>
      </TrendCard>
    );

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="trend-delta"]')).not.toBeInTheDocument();
  });

  it('renders header actions and the footer', () => {
    render(
      <TrendCard title="Discharge pressure" actions={<button type="button">24 h</button>} footer={<p>Legend</p>}>
        <div>plot</div>
      </TrendCard>
    );

    expect(screen.getByRole('button', { name: '24 h' })).toBeInTheDocument();
    expect(screen.getByText('Legend')).toBeInTheDocument();
  });

  it('leaves out the reading row when no reading is given', () => {
    const { container } = render(
      <TrendCard title="Discharge pressure">
        <div>plot</div>
      </TrendCard>
    );

    expect(container.querySelector('[data-slot="trend-card-reading"]')).not.toBeInTheDocument();
  });
});
