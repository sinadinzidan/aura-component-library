import { render, screen, within } from '@testing-library/react';

import { DeliveryTrack, type DeliveryStage } from './DeliveryTrack';

const STAGES: DeliveryStage[] = [
  { id: 'a', name: 'Ordered', when: '3 Mar', detail: 'PO 4500128841', state: 'done' },
  { id: 'b', name: 'Customs clearance', when: 'Since 9 Mar', detail: 'Held for a missing certificate', state: 'delayed' },
  { id: 'c', name: 'Received at warehouse', when: 'Expected 19 Mar', state: 'upcoming' },
];

describe(DeliveryTrack.name, () => {
  it('lists the stages with when and the state in words', () => {
    render(<DeliveryTrack label="Delivery of bearings" stages={STAGES} />);

    const items = within(screen.getByRole('list', { name: 'Delivery of bearings' })).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByText('3 Mar')).toBeInTheDocument();
    expect(within(items[0]).getByText('Done')).toBeInTheDocument();
    expect(within(items[1]).getByText('Delayed')).toBeInTheDocument();
    expect(within(items[1]).getByText('Held for a missing certificate')).toBeInTheDocument();
    expect(within(items[2]).getByText('To come')).toBeInTheDocument();
  });

  it('marks the stage the delivery is at and tones each stage', () => {
    render(<DeliveryTrack label="Delivery" stages={STAGES} />);

    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[1]).toHaveAttribute('data-tone', 'critical');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });
});
