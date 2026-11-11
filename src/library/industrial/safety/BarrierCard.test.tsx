import { render, screen, within } from '@testing-library/react';

import { BarrierCard } from './BarrierCard';

describe(BarrierCard.name, () => {
  it('names the barrier and writes out its type and state', () => {
    render(<BarrierCard name="Relief valve" type="engineered" state="healthy" />);

    const card = screen.getByRole('region', { name: 'Barrier: Relief valve' });
    expect(within(card).getByText('Engineered')).toBeVisible();
    expect(within(card).getByText('Healthy')).toBeVisible();
  });

  it('lists what is wrong with a weakened barrier', () => {
    render(<BarrierCard name="Gas detection" type="engineered" state="degraded" impairments={['2 of 14 detectors inhibited']} />);

    expect(within(screen.getByRole('list', { name: 'Impairments' })).getByText('2 of 14 detectors inhibited')).toBeVisible();
  });

  it('shows no impairment strip on a healthy barrier', () => {
    render(<BarrierCard name="Relief valve" type="engineered" state="healthy" impairments={['Old note']} />);

    expect(screen.queryByRole('list', { name: 'Impairments' })).not.toBeInTheDocument();
  });

  it('shows owner, tests and performance standard when given', () => {
    render(<BarrierCard name="Relief valve" type="engineered" state="healthy" owner="Aisha Khan" lastTest="30 Mar 2024" nextTest="30 Mar 2026" performanceStandard="Lifts at 55 barg ± 3%" />);

    expect(screen.getByText('Aisha Khan')).toBeVisible();
    expect(screen.getByText('30 Mar 2024')).toBeVisible();
    expect(screen.getByText('30 Mar 2026')).toBeVisible();
    expect(screen.getByText('Lifts at 55 barg ± 3%')).toBeVisible();
  });

  it('lists linked work orders with their numbers', () => {
    render(<BarrierCard name="Deluge" type="engineered" state="impaired" workOrders={[{ id: 'WO-104490', title: 'Repair fire pump B' }]} />);

    expect(screen.getByText('WO-104490')).toBeVisible();
    expect(screen.getByText('Repair fire pump B')).toBeVisible();
  });

  it('carries the state on the element', () => {
    const { container } = render(<BarrierCard name="Deluge" type="engineered" state="impaired" />);

    expect(container.querySelector('[data-slot="barrier-card"]')).toHaveAttribute('data-state', 'impaired');
  });

  it('renders the actions it is given', () => {
    render(<BarrierCard name="Deluge" type="engineered" state="impaired" actions={<button type="button">Open work order</button>} />);

    expect(screen.getByRole('button', { name: 'Open work order' })).toBeVisible();
  });
});
