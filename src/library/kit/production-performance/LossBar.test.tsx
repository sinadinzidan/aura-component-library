import { fireEvent, render, screen } from '@testing-library/react';

import { LossBar, type LossSegment } from './LossBar';

const SEGMENTS: LossSegment[] = [
  { id: 'trips', label: 'Compressor trips', value: 2.2, tone: 'teal', note: 'Availability' },
  { id: 'cooler', label: 'Cooler capacity', value: 4.6, tone: 'blue' },
];

describe(LossBar.name, () => {
  it('names the bar and offers one button per loss with its size', () => {
    render(<LossBar label="OEE losses this month" segments={SEGMENTS} selected={null} onSelect={vi.fn()} unit="pts" />);

    expect(screen.getByRole('group', { name: 'OEE losses this month' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Compressor trips/ })).toHaveTextContent('−2.2pts');
    expect(screen.getByRole('button', { name: /Compressor trips/ })).toHaveTextContent('Availability');
  });

  it('sizes each block by its value', () => {
    render(<LossBar label="Losses" segments={SEGMENTS} selected={null} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Compressor trips/ })).toHaveStyle({ flexGrow: '2.2' });
    expect(screen.getByRole('button', { name: /Cooler capacity/ })).toHaveStyle({ flexGrow: '4.6' });
  });

  it('marks the opened block and reports a tap', () => {
    const onSelect = vi.fn();
    render(<LossBar label="Losses" segments={SEGMENTS} selected="cooler" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: /Cooler capacity/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Compressor trips/ })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: /Compressor trips/ }));
    expect(onSelect).toHaveBeenCalledWith('trips');
  });

  it('draws the true-scale strip only when the whole is given', () => {
    const { rerender } = render(<LossBar label="Losses" segments={SEGMENTS} selected={null} onSelect={vi.fn()} />);
    expect(screen.queryByText('82.7 delivered')).not.toBeInTheDocument();

    rerender(<LossBar label="Losses" segments={SEGMENTS} selected={null} onSelect={vi.fn()} whole={{ total: 100, keptLabel: '82.7 delivered', lostLabel: '6.8 lost' }} />);
    expect(parseFloat(screen.getByText('82.7 delivered').style.width)).toBeCloseTo(93.2);
    expect(screen.getByText('6.8 lost')).toBeInTheDocument();
  });
});
