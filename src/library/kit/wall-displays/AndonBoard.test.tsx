import { fireEvent, render, screen } from '@testing-library/react';

import { AndonBoard } from './AndonBoard';

const STATIONS = [
  { id: 'st1', code: 'ST 1', name: 'Decant', state: 'Running', tone: 'success', detail: '412 units' },
  { id: 'st2', code: 'ST 2', name: 'Fill', state: 'Blocked', tone: 'critical', detail: '6 min' },
] as const;

describe(AndonBoard.name, () => {
  it('fills only the stations that need attention', () => {
    render(<AndonBoard label="Line 2 andon" stations={STATIONS} />);

    expect(screen.getByRole('list', { name: 'Line 2 andon' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fill/ })).toHaveAttribute('data-solid', 'true');
    expect(screen.getByRole('button', { name: /Decant/ })).toHaveAttribute('data-solid', 'false');
  });

  it('reports the picked station', () => {
    const onSelect = vi.fn();
    render(<AndonBoard label="Line 2 andon" stations={STATIONS} selected="st1" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /Fill/ }));

    expect(onSelect).toHaveBeenCalledWith('st2');
    expect(screen.getByRole('button', { name: /Decant/ })).toHaveAttribute('aria-pressed', 'true');
  });
});
