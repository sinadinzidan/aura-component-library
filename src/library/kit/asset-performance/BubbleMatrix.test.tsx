import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BubbleMatrix, type MatrixAxis, type MatrixPoint } from './BubbleMatrix';

const X: MatrixAxis = { label: 'Health score', min: 0, max: 100, ticks: [0, 50, 100] };
const Y: MatrixAxis = { label: 'Criticality', min: 0, max: 100, ticks: [0, 50, 100], bands: [{ from: 66, to: 100, label: 'Class A' }] };

const POINTS: MatrixPoint[] = [
  { id: 'a', label: '23-KA-9103', name: 'Recompressor', x: 25, y: 75, size: 100, tone: 'critical' },
  { id: 'b', label: '27-PA-2001A', name: 'Export pump A', x: 90, y: 40, size: 4, tone: 'neutral' },
];

function renderMatrix(selectedId: string | null = null, onSelect = vi.fn()) {
  render(
    <BubbleMatrix
      label="Criticality against condition"
      points={POINTS}
      xAxis={X}
      yAxis={Y}
      split={{ x: 75, y: 66 }}
      quadrants={[{ corner: 'top-left', title: 'Act now', note: 'Critical and in poor condition.', tone: 'critical' }]}
      sizeLabel="Downtime, h"
      selectedId={selectedId}
      onSelect={onSelect}
    />
  );
  return onSelect;
}

describe(BubbleMatrix.name, () => {
  it('draws a button per asset that reads out all three values', () => {
    renderMatrix();

    expect(screen.getByRole('group', { name: 'Criticality against condition' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recompressor, health score 25, criticality 75, downtime, h 100' })).toBeInTheDocument();
  });

  it('places bubbles by their two scores', () => {
    renderMatrix();

    const holder = screen.getByRole('button', { name: /Recompressor/ }).parentElement;
    expect(holder?.style.left).toBe('25%');
    expect(holder?.style.top).toBe('25%');
  });

  it('sizes bubbles by area and keeps the largest at the upper diameter', () => {
    renderMatrix();

    expect(screen.getByRole('button', { name: /Recompressor/ }).style.width).toBe('64px');
    expect(parseFloat(screen.getByRole('button', { name: /Export pump A/ }).style.width)).toBeCloseTo(27.2, 1);
  });

  it('shows quadrant instructions, bands and the size key', () => {
    renderMatrix();

    expect(screen.getByText('Act now')).toBeInTheDocument();
    expect(screen.getByText('Class A')).toBeInTheDocument();
    expect(screen.getByText(/Bubble area: Downtime, h/)).toBeInTheDocument();
  });

  it('marks the selection and reports clicks', async () => {
    const onSelect = renderMatrix('a');

    expect(screen.getByRole('button', { name: /Recompressor/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Export pump A/ }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });
});
