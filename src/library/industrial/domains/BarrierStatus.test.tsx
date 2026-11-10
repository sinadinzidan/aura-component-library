import { render, screen, within } from '@testing-library/react';

import { BarrierStatus } from './BarrierStatus';

const BARRIERS = [
  { id: 'psv', name: 'Pressure safety valves', state: 'healthy', kind: 'Prevention' },
  { id: 'gas', name: 'Gas detection', state: 'degraded', note: '2 of 14 detectors inhibited' },
  { id: 'deluge', name: 'Deluge', state: 'impaired', note: 'Fire pump B out of service' },
] as const;

describe(BarrierStatus.name, () => {
  it('names the panel after the hazard', () => {
    render(<BarrierStatus title="Loss of containment" barriers={BARRIERS} />);

    expect(screen.getByRole('region', { name: 'Loss of containment' })).toBeInTheDocument();
  });

  it('writes out the state of every barrier', () => {
    render(<BarrierStatus title="Loss of containment" barriers={BARRIERS} />);

    const rows = screen.getAllByRole('listitem');
    expect(within(rows[0]).getByText('Healthy')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Degraded')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Impaired')).toBeInTheDocument();
  });

  it('carries the worst state in the header', () => {
    const { container } = render(<BarrierStatus title="Loss of containment" barriers={BARRIERS} />);

    expect(container.querySelector('[data-slot="barrier-status"]')).toHaveAttribute('data-state', 'impaired');
  });

  it('counts the barriers per state, leaving out empty states', () => {
    const { container } = render(<BarrierStatus title="Loss of containment" barriers={BARRIERS.slice(0, 2)} />);

    expect(container.querySelector('[data-slot="barrier-summary"]')).toHaveTextContent('1 healthy · 1 degraded');
  });

  it('shows the note that explains a weakened barrier', () => {
    render(<BarrierStatus title="Loss of containment" barriers={BARRIERS} />);

    expect(screen.getByText('Fire pump B out of service')).toBeInTheDocument();
  });

  it('draws one strip segment per barrier, or none when turned off', () => {
    const { container, rerender } = render(<BarrierStatus title="Loss of containment" barriers={BARRIERS} />);
    expect(container.querySelectorAll('[data-slot="barrier-segment"]')).toHaveLength(3);

    rerender(<BarrierStatus title="Loss of containment" barriers={BARRIERS} showStrip={false} />);
    expect(container.querySelectorAll('[data-slot="barrier-segment"]')).toHaveLength(0);
  });
});
