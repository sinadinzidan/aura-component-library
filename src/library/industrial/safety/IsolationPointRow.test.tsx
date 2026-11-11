import { render, screen } from '@testing-library/react';

import { IsolationPointRow } from './IsolationPointRow';
import type { IsolationPointRowProps } from './IsolationPointRow';

const BASE: IsolationPointRowProps = {
  step: 2,
  tag: '23-HV-9106',
  description: 'Suction block valve',
  device: 'Valve',
  requiredPosition: 'Closed',
  energy: 'pressure',
  lock: 'L-0431',
  tagNo: 'DT-1182',
  state: 'verified',
  appliedBy: 'Ingrid Haugen',
  verifiedBy: 'Liv Wold',
};

describe(IsolationPointRow.name, () => {
  it('prints the step, the point and its tag', () => {
    const { container } = render(<IsolationPointRow {...BASE} />);

    expect(container.querySelector('[data-slot="isolation-step"]')).toHaveTextContent('2');
    expect(screen.getByText('Suction block valve')).toBeVisible();
    expect(screen.getByText('23-HV-9106')).toBeVisible();
  });

  it('states the required position, device and energy type', () => {
    render(<IsolationPointRow {...BASE} />);

    expect(screen.getByText('Closed')).toBeVisible();
    expect(screen.getByText(/Valve ·/)).toHaveTextContent('Valve · Closed · Pressure');
  });

  it('prints the lock and tag numbers', () => {
    render(<IsolationPointRow {...BASE} />);

    expect(screen.getByText('L-0431')).toBeVisible();
    expect(screen.getByText('DT-1182')).toBeVisible();
  });

  it('writes out the state', () => {
    const { container } = render(<IsolationPointRow {...BASE} />);

    expect(screen.getByText('Locked and verified')).toBeVisible();
    expect(container.querySelector('[data-slot="isolation-point"]')).toHaveAttribute('data-state', 'verified');
  });

  it('names who applied and who verified', () => {
    const { container } = render(<IsolationPointRow {...BASE} />);

    expect(container.querySelector('[data-slot="isolation-people"]')).toHaveTextContent('Applied Ingrid Haugen · verified Liv Wold');
  });

  it('says a second person is awaited when applied but not verified', () => {
    const { container } = render(<IsolationPointRow {...BASE} state="applied" verifiedBy={undefined} />);

    expect(screen.getByText('Applied, not verified')).toBeVisible();
    expect(container.querySelector('[data-slot="isolation-people"]')).toHaveTextContent('Applied Ingrid Haugen · awaiting second person');
  });

  it('shows no lock, tag or people on a planned point', () => {
    const { container } = render(<IsolationPointRow step={1} tag="23-XV-9105" description="Suction shutdown valve" device="Valve" requiredPosition="Closed" state="planned" />);

    expect(screen.getByText('Planned')).toBeVisible();
    expect(container.querySelector('[data-slot="isolation-people"]')).toBeNull();
    expect(screen.queryByText('Lock')).not.toBeInTheDocument();
  });

  it('renders the actions it is given', () => {
    render(<IsolationPointRow {...BASE} state="applied" actions={<button type="button">Verify point</button>} />);

    expect(screen.getByRole('button', { name: 'Verify point' })).toBeVisible();
  });
});
