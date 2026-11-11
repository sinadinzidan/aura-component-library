import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DrawingSheet, type SheetHotspot } from './DrawingSheet';

const HOTSPOTS: SheetHotspot[] = [
  { tag: '23-KA-9103', name: 'Recompressor', x: 47, y: 52 },
  { tag: '23-VT-92740', name: 'Drive-end vibration', x: 38, y: 17 },
];

describe(DrawingSheet.name, () => {
  it('names the sheet and writes each detected tag at its position', () => {
    const { container } = render(<DrawingSheet label="P&ID of the recompressor" hotspots={HOTSPOTS} />);

    expect(screen.getByRole('group', { name: 'P&ID of the recompressor' })).toBeInTheDocument();
    const tag = container.querySelector<HTMLElement>('[data-tag="23-KA-9103"]');
    expect(tag).toHaveTextContent('23-KA-9103');
    expect(tag?.style.left).toBe('47%');
    expect(tag?.style.top).toBe('52%');
  });

  it('hides tags and shows pins on request', () => {
    const { container } = render(<DrawingSheet label="Sheet" hotspots={HOTSPOTS} showTags={false} showPins pins={[{ id: 1, x: 10, y: 10 }, { id: 2, x: 20, y: 20, resolved: true }]} />);

    expect(container.querySelectorAll('[data-tag]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-pin]')).toHaveLength(2);
  });

  it('reports the picked tag, marks the selected one and names changed tags', async () => {
    const onSelect = vi.fn();
    render(<DrawingSheet label="Sheet" hotspots={HOTSPOTS} selected="23-KA-9103" changed={['23-VT-92740']} onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: '23-KA-9103, Recompressor' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: '23-VT-92740, Drive-end vibration, changed' }));
    expect(onSelect).toHaveBeenCalledWith('23-VT-92740');
  });

  it('carries the zoom and writes the title block', () => {
    render(<DrawingSheet label="Sheet" hotspots={[]} zoom={150} titleBlock={{ number: 'NK-23-PID-0103', title: 'Gas compression, recompressor', revision: 'D' }} />);

    expect(screen.getByRole('group', { name: 'Sheet' })).toHaveAttribute('data-zoom', '150');
    expect(screen.getByText('NK-23-PID-0103')).toBeInTheDocument();
    expect(screen.getByText('Gas compression, recompressor')).toBeInTheDocument();
  });
});
