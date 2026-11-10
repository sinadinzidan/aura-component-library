import { render, screen, within } from '@testing-library/react';

import { PumpingStationCard } from './PumpingStationCard';
import type { StationPump } from './PumpingStationCard';

const PUMPS: readonly StationPump[] = [
  { id: 'p1', tag: '61-PA-1001A', duty: 'duty', state: 'running', speed: 84 },
  { id: 'p2', tag: '61-PA-1001B', duty: 'assist', state: 'running', speed: 62 },
  { id: 'p3', tag: '61-PA-1001C', duty: 'standby', state: 'standby', speed: 0 },
];

const READINGS = [
  { label: 'Flow', value: 412, unit: 'L/s' },
  { label: 'Delivery pressure', value: 6.4, unit: 'bar', decimals: 1 },
];

describe(PumpingStationCard.name, () => {
  it('counts the running pumps in its name and header', () => {
    render(<PumpingStationCard name="Kvaløya booster station" tag="PS-61" pumps={PUMPS} readings={READINGS} />);

    expect(screen.getByRole('article', { name: 'Kvaløya booster station: 2 of 3 pumps running' })).toBeInTheDocument();
    expect(screen.getByText('2 of 3 running')).toBeInTheDocument();
  });

  it('prints the station readings', () => {
    render(<PumpingStationCard name="Kvaløya booster station" pumps={PUMPS} readings={READINGS} />);

    expect(screen.getByText('412')).toBeInTheDocument();
    expect(screen.getByText('6.4')).toBeInTheDocument();
    expect(screen.getByText('Delivery pressure')).toBeInTheDocument();
  });

  it('lists every pump with its duty and state', () => {
    render(<PumpingStationCard name="Kvaløya booster station" pumps={PUMPS} readings={READINGS} />);

    const rows = within(screen.getByRole('list', { name: 'Pumps' })).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('61-PA-1001ADuty84 %Running');
    expect(rows[2]).toHaveTextContent('61-PA-1001CStandbyStandby');
  });

  it('shows speed only for running pumps', () => {
    render(<PumpingStationCard name="Kvaløya booster station" pumps={PUMPS} readings={READINGS} />);

    expect(screen.queryByText('0 %')).not.toBeInTheDocument();
  });

  it('names the state of a duty pump that has tripped', () => {
    render(<PumpingStationCard name="Kvaløya booster station" pumps={[{ ...PUMPS[0], state: 'tripped' }]} readings={[]} />);

    expect(screen.getByText('Tripped')).toBeInTheDocument();
    expect(screen.getByText('0 of 1 running')).toBeInTheDocument();
  });
});
