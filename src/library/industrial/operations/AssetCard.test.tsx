import { fireEvent, render, screen } from '@testing-library/react';

import { AssetCard } from './AssetCard';

const BASE = { tag: '23-KA-9101', name: '1st stage compressor', state: 'running' } as const;

describe(AssetCard.name, () => {
  it('shows the tag in monospace, the name and the run state in words', () => {
    render(<AssetCard {...BASE} />);

    expect(screen.getByText('23-KA-9101')).toHaveClass('font-mono');
    expect(screen.getByText('1st stage compressor')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('draws the health score as a ring that is coloured only when not good', () => {
    const { rerender } = render(<AssetCard {...BASE} health={{ score: 72, health: 'watch' }} />);
    expect(screen.getByRole('img', { name: 'Health score: 72, warning' })).toBeInTheDocument();

    rerender(<AssetCard {...BASE} health={{ score: 93, health: 'good' }} />);

    expect(screen.getByRole('img', { name: 'Health score: 93' })).toBeInTheDocument();
  });

  it('lists key readings with their units', () => {
    render(<AssetCard {...BASE} readings={[{ label: 'Discharge pressure', value: 48.6, unit: 'barg', decimals: 1 }]} />);

    expect(screen.getByText('Discharge pressure')).toBeInTheDocument();
    expect(screen.getByText('48.6')).toBeInTheDocument();
    expect(screen.getByText('barg')).toBeInTheDocument();
  });

  it('prints an em dash and no unit for a reading without a value', () => {
    render(<AssetCard {...BASE} readings={[{ label: 'Bearing temperature', value: null, unit: '°C' }]} />);

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('°C')).not.toBeInTheDocument();
  });

  it('describes its trend', () => {
    render(<AssetCard {...BASE} trend={{ values: [47, 48, 48.6], label: 'Discharge pressure, last 24 hours', unit: 'barg' }} />);

    expect(screen.getByRole('img', { name: /Discharge pressure, last 24 hours: latest 48.6/ })).toBeInTheDocument();
  });

  it('counts open alarms and work orders', () => {
    render(<AssetCard {...BASE} alarms={{ count: 2, severity: 'high' }} workOrders={1} />);

    expect(screen.getByText('2 alarms')).toHaveAttribute('data-severity', 'high');
    expect(screen.getByText('1 work order')).toBeInTheDocument();
  });

  it('says so explicitly when there are no alarms', () => {
    render(<AssetCard {...BASE} alarms={{ count: 0 }} workOrders={0} />);

    expect(screen.getByText('No alarms')).toBeInTheDocument();
    expect(screen.getByText('No work orders')).toBeInTheDocument();
  });

  it('shows criticality and a notice', () => {
    render(<AssetCard {...BASE} state="tripped" criticality="A" notice={{ tone: 'critical', text: 'Tripped on high vibration' }} />);

    expect(screen.getByLabelText('Criticality A')).toBeInTheDocument();
    expect(screen.getByText('Tripped on high vibration')).toHaveClass('bg-critical-background');
  });

  it('becomes a toggle button when selectable', () => {
    const onSelect = vi.fn();
    render(<AssetCard {...BASE} onSelect={onSelect} selected />);

    const button = screen.getByRole('button', { name: '23-KA-9101 1st stage compressor' });
    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('shows a named skeleton while loading', () => {
    render(<AssetCard {...BASE} loading readings={[{ label: 'Discharge pressure', value: 48.6 }]} />);

    expect(screen.getByRole('status', { name: '1st stage compressor, loading' })).toBeInTheDocument();
    expect(screen.queryByText('Discharge pressure')).not.toBeInTheDocument();
  });

  it('lays the same parts out as a row', () => {
    const { container } = render(<AssetCard {...BASE} layout="row" readings={[{ label: 'Flow', value: 412, unit: 'm³/h' }]} />);

    expect(container.querySelector('[data-layout="row"]')).toBeInTheDocument();
    expect(screen.getByText('Flow')).toBeInTheDocument();
  });
});
