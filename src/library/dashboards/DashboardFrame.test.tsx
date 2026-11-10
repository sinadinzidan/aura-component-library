import { render, screen, within } from '@testing-library/react';

import { DashboardFrame } from './DashboardFrame';

describe(DashboardFrame.name, () => {
  it('names the region after the dashboard and shows its scope', () => {
    render(
      <DashboardFrame title="Plant overview" subtitle="Nordkapp · last 24 hours">
        <p>Grid</p>
      </DashboardFrame>
    );

    const region = screen.getByRole('region', { name: 'Plant overview' });
    expect(within(region).getByRole('heading', { name: 'Plant overview' })).toBeInTheDocument();
    expect(within(region).getByText('Nordkapp · last 24 hours')).toBeInTheDocument();
    expect(within(region).getByText('Grid')).toBeInTheDocument();
  });

  it('renders status, actions and toolbar slots when given', () => {
    render(
      <DashboardFrame
        title="Alarms"
        status={<span>Live</span>}
        actions={<button type="button">Refresh</button>}
        toolbar={<span>Severity filter</span>}
      >
        <p>Grid</p>
      </DashboardFrame>
    );

    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    expect(screen.getByText('Severity filter')).toBeInTheDocument();
  });

  it('omits the subtitle when there is none', () => {
    render(
      <DashboardFrame title="Alarms">
        <p>Grid</p>
      </DashboardFrame>
    );

    expect(screen.getByRole('region', { name: 'Alarms' }).querySelector('p.text-muted-foreground')).toBeNull();
  });
});
