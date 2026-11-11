import { fireEvent, render, screen } from '@testing-library/react';

import { MeasureReadout } from './MeasureReadout';

describe(MeasureReadout.name, () => {
  it('asks for the first point', () => {
    render(<MeasureReadout state={{ points: [] }} onUndo={() => undefined} onClear={() => undefined} />);

    expect(screen.getByText('Pick the first point on the model.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo point' })).toBeDisabled();
  });

  it('asks for the second point', () => {
    render(<MeasureReadout state={{ points: [[0, 0, 0]] }} onUndo={() => undefined} onClear={() => undefined} />);

    expect(screen.getByText('Pick the second point.')).toBeInTheDocument();
  });

  it('shows the distance and its parts once two points are picked', () => {
    render(<MeasureReadout state={{ points: [[0, 0, 0], [3, 4, 0]] }} onUndo={() => undefined} onClear={() => undefined} />);

    expect(screen.getAllByText('5.00 m').length).toBeGreaterThan(0);
    expect(screen.getByText('East–west').nextSibling).toHaveTextContent('3.00 m');
    expect(screen.getByText('Height').nextSibling).toHaveTextContent('4.00 m');
  });

  it('undoes and clears', () => {
    const onUndo = vi.fn();
    const onClear = vi.fn();
    render(<MeasureReadout state={{ points: [[0, 0, 0]] }} onUndo={onUndo} onClear={onClear} />);

    fireEvent.click(screen.getByRole('button', { name: 'Undo point' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onUndo).toHaveBeenCalled();
    expect(onClear).toHaveBeenCalled();
  });
});
