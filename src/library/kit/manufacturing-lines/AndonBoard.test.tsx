import { render, screen, within } from '@testing-library/react';

import { AndonBoard, type AndonTile } from './AndonBoard';

const TILES: AndonTile[] = [
  { id: 's4', code: 'S4', name: 'Leak test', state: 'Blocked', tone: 'warning', detail: 'Buffer full, 6 min' },
  { id: 's5', code: 'S5', name: 'Torque and seal', state: 'Down', tone: 'critical', detail: 'Tool fault E-217, 12 min' },
  { id: 's7', code: 'S7', name: 'Pack out', state: 'Running', tone: 'success' },
];

describe(AndonBoard.name, () => {
  it('shows one tile per station with code, name, state and detail', () => {
    render(<AndonBoard label="Andon board, line 3" tiles={TILES} />);

    const items = within(screen.getByRole('list', { name: 'Andon board, line 3' })).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(within(items[1]).getByText('S5')).toBeInTheDocument();
    expect(within(items[1]).getByText('Torque and seal')).toBeInTheDocument();
    expect(within(items[1]).getByText('Down')).toBeInTheDocument();
    expect(within(items[1]).getByText('Tool fault E-217, 12 min')).toBeInTheDocument();
  });

  it('tones each tile by its state', () => {
    render(<AndonBoard label="Board" tiles={TILES} />);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('data-tone', 'warning');
    expect(items[1]).toHaveAttribute('data-tone', 'critical');
    expect(items[2]).toHaveAttribute('data-tone', 'success');
  });

  it('lays the tiles out in the given number of columns', () => {
    render(<AndonBoard label="Board" tiles={TILES} columns={3} />);

    expect(screen.getByRole('list')).toHaveStyle({ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' });
  });
});
