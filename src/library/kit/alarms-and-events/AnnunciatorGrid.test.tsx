import { fireEvent, render, screen, within } from '@testing-library/react';

import { AnnunciatorGrid, type AnnunciatorWindow } from './AnnunciatorGrid';

const WINDOWS: AnnunciatorWindow[] = [
  { id: 'a', tag: '23-VT-92740', label: 'Vibration high-high', tone: 'critical', state: 'new', stateLabel: 'Unacknowledged', firstOut: true },
  { id: 'b', tag: '23-VT-92540', label: 'Vibration high', tone: 'warning', state: 'held', stateLabel: 'Acknowledged' },
  { id: 'c', tag: '23-PT-92531', label: 'Discharge pressure', tone: 'neutral', state: 'normal', stateLabel: 'Normal' },
];

describe(AnnunciatorGrid.name, () => {
  it('renders one named window per alarm point with its state in words', () => {
    render(<AnnunciatorGrid label="Train annunciator" windows={WINDOWS} columns={3} />);

    const list = screen.getByRole('list', { name: 'Train annunciator' });
    const buttons = within(list).getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveTextContent('23-VT-92740');
    expect(buttons[0]).toHaveTextContent('Unacknowledged');
    expect(buttons[0]).toHaveAttribute('data-state', 'new');
    expect(buttons[1]).toHaveAttribute('data-tone', 'warning');
  });

  it('flags the first-out window', () => {
    render(<AnnunciatorGrid label="Train annunciator" windows={WINDOWS} />);

    expect(screen.getAllByText('First out')).toHaveLength(1);
  });

  it('lays the windows out in the given number of columns', () => {
    render(<AnnunciatorGrid label="Train annunciator" windows={WINDOWS} columns={3} />);

    expect(screen.getByRole('list').style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
  });

  it('reports the selected window and marks it pressed', () => {
    const onSelect = vi.fn();
    render(<AnnunciatorGrid label="Train annunciator" windows={WINDOWS} selected="b" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: /Vibration high Acknowledged/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Discharge pressure/ }));
    expect(onSelect).toHaveBeenCalledWith('c');
  });
});
