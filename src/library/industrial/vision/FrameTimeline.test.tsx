import { fireEvent, render, screen } from '@testing-library/react';

import { FrameTimeline } from './FrameTimeline';

const marks = [
  { id: 'm1', at: 2500, label: 'Motion', tone: 'info' as const },
  { id: 'm2', at: 7500, label: 'Alarm', tone: 'critical' as const },
];
const format = (time: number) => `t${time}`;

describe(FrameTimeline.name, () => {
  it('shows the range and the current time', () => {
    render(<FrameTimeline from={0} to={10000} value={5000} onValueChange={() => undefined} format={format} />);

    expect(screen.getByText('t0')).toBeInTheDocument();
    expect(screen.getByText('t5000')).toBeInTheDocument();
    expect(screen.getByText('t10000')).toBeInTheDocument();
  });

  it('exposes the scrubber as a slider', () => {
    render(<FrameTimeline from={0} to={10000} value={2500} onValueChange={() => undefined} format={format} />);

    expect(screen.getByRole('slider', { hidden: true })).toHaveAttribute('aria-valuenow', '250');
  });

  it('jumps to an event from its mark', () => {
    const onValueChange = vi.fn();
    render(<FrameTimeline from={0} to={10000} value={0} onValueChange={onValueChange} format={format} marks={marks} />);

    fireEvent.click(screen.getByRole('button', { name: 'Alarm, t7500' }));

    expect(onValueChange).toHaveBeenCalledWith(7500);
  });

  it('positions marks along the range', () => {
    render(<FrameTimeline from={0} to={10000} value={0} onValueChange={() => undefined} format={format} marks={marks} />);

    expect(screen.getByRole('button', { name: 'Motion, t2500' })).toHaveStyle({ left: '25%' });
  });
});
