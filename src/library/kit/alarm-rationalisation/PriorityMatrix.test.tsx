import { fireEvent, render, screen, within } from '@testing-library/react';

import { PriorityMatrix, type MatrixCell } from './PriorityMatrix';

const ROWS = [
  { id: 'minor', label: 'Minor' },
  { id: 'major', label: 'Major' },
];
const COLUMNS = [
  { id: 'slow', label: 'Over 30 min' },
  { id: 'fast', label: 'Under 3 min' },
];

function cell(row: string, column: string): MatrixCell {
  if (row === 'major' && column === 'fast') return { label: 'High', tone: 'critical', count: 14 };
  return { label: 'Low', tone: 'info', count: 3 };
}

function renderMatrix(onSelect?: (row: string, column: string) => void) {
  render(
    <PriorityMatrix label="Priority matrix" rows={ROWS} columns={COLUMNS} rowHeader="Consequence" columnHeader="Time to respond" cell={cell} selected={{ row: 'major', column: 'fast' }} onSelect={onSelect} />
  );
  return screen.getByRole('group', { name: 'Priority matrix' });
}

describe(PriorityMatrix.name, () => {
  it('renders a cell per combination with the outcome, the count and the axes', () => {
    const matrix = renderMatrix();

    expect(within(matrix).getAllByRole('button')).toHaveLength(4);
    expect(matrix).toHaveTextContent('Consequence');
    expect(matrix).toHaveTextContent('Time to respond');
    expect(screen.getByRole('button', { name: 'Major, Under 3 min: High, 14 alarms' })).toHaveAttribute('data-tone', 'critical');
  });

  it('draws the most severe row first', () => {
    const matrix = renderMatrix();

    const labels = within(matrix)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'));
    expect(labels[0]).toContain('Major');
    expect(labels[3]).toContain('Minor');
  });

  it('marks the selected cell and reports a new selection', () => {
    const onSelect = vi.fn();
    renderMatrix(onSelect);

    expect(screen.getByRole('button', { name: /Major, Under 3 min/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Minor, Over 30 min/ }));
    expect(onSelect).toHaveBeenCalledWith('minor', 'slow');
  });

  it('is not pressable without a handler', () => {
    renderMatrix();

    expect(screen.getByRole('button', { name: /Major, Under 3 min/ })).not.toHaveAttribute('aria-pressed');
  });
});
