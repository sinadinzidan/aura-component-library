import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SheetColumn } from './columns';
import { SheetGrid } from './SheetGrid';
import type { SheetClipboard, SheetGridProps } from './SheetGrid';

const COLUMNS: readonly SheetColumn[] = [
  { id: 'tag', title: 'Tag', type: 'text', readOnly: true, mono: true },
  { id: 'low', title: 'Low', type: 'number', decimals: 1 },
  { id: 'high', title: 'High', type: 'number', decimals: 1, max: 200 },
  { id: 'priority', title: 'Priority', type: 'select', options: ['Low', 'High'] },
  { id: 'enabled', title: 'Enabled', type: 'checkbox' },
];

const ROWS = [
  ['23-PT-92531', '40', '52', 'High', 'true'],
  ['23-PT-92530', '10', '15', 'Low', 'true'],
  ['23-TT-92532', '90', '145', 'High', 'false'],
];

function renderGrid(props: Partial<SheetGridProps> = {}) {
  return render(
    <TooltipProvider>
      <SheetGrid label="Alarm limits" columns={COLUMNS} rows={ROWS} {...props} />
    </TooltipProvider>
  );
}

function cell(row: number, col: number): HTMLElement {
  const found = document.querySelector<HTMLElement>(`[data-sheet-cell][data-row="${row}"][data-col="${col}"]`);
  if (!found) throw new Error(`No cell ${row}:${col}`);
  return found;
}

function selectedCount(): number {
  return document.querySelectorAll('[data-sheet-cell][aria-selected="true"]').length;
}

function stubCellAtPoint(target: () => HTMLElement) {
  const original = document.elementFromPoint;
  document.elementFromPoint = () => target();
  return () => {
    document.elementFromPoint = original;
  };
}

describe(SheetGrid.name, () => {
  it('is a grid named by its label with column and row headers', () => {
    renderGrid();

    const grid = screen.getByRole('grid', { name: 'Alarm limits' });
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(6);
    expect(within(grid).getAllByRole('rowheader')).toHaveLength(3);
    expect(cell(0, 2)).toHaveTextContent('52.0');
  });

  it('keeps one cell in the tab order', () => {
    renderGrid();

    expect(document.querySelectorAll('[data-sheet-cell][tabindex="0"]')).toHaveLength(1);
    expect(cell(0, 0)).toHaveAttribute('tabindex', '0');
  });

  it('moves the active cell with the arrow keys', async () => {
    renderGrid();

    await userEvent.click(cell(0, 1));
    await userEvent.keyboard('{ArrowDown}{ArrowRight}');

    expect(cell(1, 2)).toHaveAttribute('tabindex', '0');
    expect(cell(1, 2)).toHaveFocus();
  });

  it('jumps to the edges with Home, End and Ctrl+arrows', async () => {
    renderGrid();

    await userEvent.click(cell(1, 2));
    await userEvent.keyboard('{End}');
    expect(cell(1, 4)).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(cell(1, 0)).toHaveFocus();
    await userEvent.keyboard('{Control>}{ArrowDown}{/Control}');
    expect(cell(2, 0)).toHaveFocus();
    await userEvent.keyboard('{Control>}{End}{/Control}');
    expect(cell(2, 4)).toHaveFocus();
  });

  it('moves with Tab and wraps to the next row', async () => {
    renderGrid();

    await userEvent.click(cell(0, 3));
    await userEvent.keyboard('{Tab}{Tab}');

    expect(cell(1, 0)).toHaveFocus();
  });

  it('extends the selection with Shift+arrows and sums it in the status bar', async () => {
    renderGrid();

    await userEvent.click(cell(0, 1));
    await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}');

    expect(selectedCount()).toBe(3);
    expect(screen.getByText('B1:B3')).toBeInTheDocument();
    expect(screen.getByText('Sum').nextElementSibling).toHaveTextContent('140');
    expect(screen.getByText('Average').nextElementSibling).toHaveTextContent('46.67');
  });

  it('starts an edit by typing and commits with Enter, moving down', async () => {
    renderGrid();

    await userEvent.click(cell(0, 1));
    await userEvent.keyboard('41{Enter}');

    expect(cell(0, 1)).toHaveTextContent('41.0');
    expect(cell(1, 1)).toHaveFocus();
  });

  it('edits the existing text with F2', async () => {
    renderGrid();

    await userEvent.click(cell(0, 1));
    await userEvent.keyboard('{F2}');

    expect(screen.getByRole('textbox', { name: 'Low, row 1' })).toHaveValue('40');
  });

  it('cancels an edit with Escape', async () => {
    renderGrid();

    await userEvent.click(cell(0, 1));
    await userEvent.keyboard('999{Escape}');

    expect(cell(0, 1)).toHaveTextContent('40.0');
    expect(cell(0, 1)).toHaveFocus();
  });

  it('opens an edit on double click', async () => {
    renderGrid();

    await userEvent.dblClick(cell(1, 2));

    expect(screen.getByRole('textbox', { name: 'High, row 2' })).toHaveValue('15');
  });

  it('does not edit a read-only column and says so', async () => {
    renderGrid();

    await userEvent.click(cell(0, 0));
    await userEvent.keyboard('x');

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="sheet-announcer"]')).toHaveTextContent('Tag is read-only');
    expect(screen.getByText('Read-only')).toBeInTheDocument();
  });

  it('marks an invalid cell and gives the reason', async () => {
    renderGrid();

    await userEvent.click(cell(0, 2));
    await userEvent.keyboard('high{Enter}{ArrowUp}');

    expect(cell(0, 2)).toHaveAttribute('aria-invalid', 'true');
    expect(within(document.querySelector<HTMLElement>('[data-slot="sheet-status-bar"]')!).getByText('Must be a number')).toBeInTheDocument();
  });

  it('edits a select column with a list of its options', async () => {
    renderGrid();

    await userEvent.click(cell(1, 3));
    await userEvent.keyboard('{Enter}');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Priority, row 2' }), 'High');
    await userEvent.keyboard('{Enter}');

    expect(cell(1, 3)).toHaveTextContent('High');
  });

  it('toggles a checkbox cell with Space', async () => {
    renderGrid();

    await userEvent.click(cell(2, 4));
    await userEvent.keyboard(' ');

    expect(within(cell(2, 4)).getByRole('checkbox')).toBeChecked();
  });

  it('clears the selection with Delete', async () => {
    renderGrid();

    await userEvent.click(cell(0, 1));
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}{Delete}');

    expect(cell(0, 1)).toHaveTextContent(/^$/);
    expect(cell(0, 2)).toHaveTextContent(/^$/);
  });

  it('evaluates a formula and shows the source in the formula bar', async () => {
    renderGrid();

    await userEvent.click(cell(2, 2));
    await userEvent.keyboard('=SUM(C1:C2){Enter}');

    expect(cell(2, 2)).toHaveTextContent('67.0');
    expect(screen.getByLabelText('Content of C3')).toHaveTextContent('=SUM(C1:C2)');
  });

  it('shows a formula error with its reason', async () => {
    renderGrid();

    await userEvent.click(cell(2, 2));
    await userEvent.keyboard('=C1/0{Enter}');

    expect(cell(2, 2)).toHaveTextContent('#DIV/0!');
    expect(cell(2, 2)).toHaveAttribute('aria-invalid', 'true');
    expect(within(document.querySelector<HTMLElement>('[data-slot="sheet-status-bar"]')!).getByText('#DIV/0! Divides by zero')).toBeInTheDocument();
  });

  it('pastes tab-separated text from a paste event', async () => {
    renderGrid();

    await userEvent.click(cell(0, 1));
    fireEvent.paste(screen.getByRole('grid'), { clipboardData: { getData: () => '1\t2\n3\t4' } });

    expect(cell(0, 1)).toHaveTextContent('1.0');
    expect(cell(1, 2)).toHaveTextContent('4.0');
    expect(selectedCount()).toBe(4);
  });

  it('puts the selection on the clipboard as tab-separated text on a copy event', async () => {
    renderGrid();
    const setData = vi.fn();

    await userEvent.click(cell(0, 0));
    await userEvent.keyboard('{Shift>}{ArrowRight}{ArrowDown}{/Shift}');
    fireEvent.copy(screen.getByRole('grid'), { clipboardData: { setData } });

    expect(setData).toHaveBeenCalledWith('text/plain', '23-PT-92531\t40\n23-PT-92530\t10');
  });

  it('copies and pastes through the injected clipboard from the toolbar', async () => {
    let held = '';
    const clipboard: SheetClipboard = {
      writeText: vi.fn(async (text: string) => {
        held = text;
      }),
      readText: vi.fn(async () => held),
    };
    renderGrid({ clipboard });

    await userEvent.click(cell(0, 1));
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    await userEvent.click(screen.getByRole('button', { name: 'Copy selection' }));
    await userEvent.click(cell(2, 1));
    await userEvent.click(screen.getByRole('button', { name: 'Paste' }));

    expect(clipboard.writeText).toHaveBeenCalledWith('40\t52');
    await waitFor(() => expect(cell(2, 1)).toHaveTextContent('40.0'));
    expect(cell(2, 2)).toHaveTextContent('52.0');
  });

  it('falls back to its own copy when the clipboard cannot be read', async () => {
    const clipboard: SheetClipboard = { writeText: () => Promise.reject(new Error('denied')), readText: () => Promise.reject(new Error('denied')) };
    renderGrid({ clipboard });

    await userEvent.click(cell(0, 1));
    await userEvent.click(screen.getByRole('button', { name: 'Copy selection' }));
    await userEvent.click(cell(1, 1));
    await userEvent.click(screen.getByRole('button', { name: 'Paste' }));

    await waitFor(() => expect(cell(1, 1)).toHaveTextContent('40.0'));
  });

  it('fills down with Ctrl+D', async () => {
    renderGrid();

    await userEvent.click(cell(0, 1));
    await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}{Control>}d{/Control}');

    expect(cell(1, 1)).toHaveTextContent('40.0');
    expect(cell(2, 1)).toHaveTextContent('40.0');
  });

  it('undoes and redoes from the keyboard and the toolbar', async () => {
    renderGrid();

    await userEvent.click(cell(0, 1));
    await userEvent.keyboard('41{Enter}{Control>}z{/Control}');
    expect(cell(0, 1)).toHaveTextContent('40.0');

    await userEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(cell(0, 1)).toHaveTextContent('41.0');

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(cell(0, 1)).toHaveTextContent('40.0');
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('selects a whole row and a whole column from the headers', async () => {
    renderGrid();

    await userEvent.click(screen.getByRole('button', { name: 'Select row 2' }));
    expect(selectedCount()).toBe(5);

    await userEvent.click(screen.getByRole('button', { name: 'Select column High' }));
    expect(selectedCount()).toBe(3);
    expect(screen.getByText('C1:C3')).toBeInTheDocument();
  });

  it('selects everything from the corner and with Ctrl+A', async () => {
    renderGrid();

    await userEvent.click(screen.getByRole('button', { name: 'Select all cells' }));

    expect(selectedCount()).toBe(15);
  });

  it('selects a range by dragging', () => {
    renderGrid();
    const restore = stubCellAtPoint(() => cell(2, 2));
    const grid = screen.getByRole('grid');

    fireEvent.pointerDown(cell(0, 1), { button: 0, pointerId: 1 });
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(grid, { pointerId: 1 });
    restore();

    expect(selectedCount()).toBe(6);
    expect(screen.getByText('B1:C3')).toBeInTheDocument();
  });

  it('fills down by dragging the fill handle', () => {
    renderGrid();
    const restore = stubCellAtPoint(() => cell(2, 1));
    const grid = screen.getByRole('grid');

    fireEvent.pointerDown(cell(0, 1), { button: 0, pointerId: 1 });
    fireEvent.pointerUp(grid, { pointerId: 1 });
    const handle = document.querySelector<HTMLElement>('[data-sheet-fill]');
    fireEvent.pointerDown(handle!, { button: 0, pointerId: 2 });
    fireEvent.pointerMove(grid, { pointerId: 2, clientX: 10, clientY: 10 });
    expect(document.querySelectorAll('[data-slot="sheet-fill-preview"]')).toHaveLength(2);
    fireEvent.pointerUp(grid, { pointerId: 2 });
    restore();

    expect(cell(1, 1)).toHaveTextContent('40.0');
    expect(cell(2, 1)).toHaveTextContent('40.0');
    expect(screen.getByText('B1:B3')).toBeInTheDocument();
  });

  it('reports every change', async () => {
    const onCellsChange = vi.fn();
    renderGrid({ onCellsChange });

    await userEvent.click(cell(0, 1));
    await userEvent.keyboard('41{Enter}');

    expect(onCellsChange).toHaveBeenCalledTimes(1);
    expect(onCellsChange.mock.calls[0][0][0][1]).toBe('41');
  });

  it('cannot be edited when read-only, but can still be selected', async () => {
    renderGrid({ readOnly: true });

    await userEvent.click(cell(0, 1));
    await userEvent.keyboard('5{Shift>}{ArrowDown}{/Shift}');

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-readonly', 'true');
    expect(screen.getByRole('button', { name: 'Paste' })).toBeDisabled();
    expect(selectedCount()).toBe(2);
  });

  it('starts with a selection and an open draft when asked', () => {
    renderGrid({ initialSelection: { active: { row: 1, col: 2 } }, initialDraft: '15,5' });

    expect(screen.getByRole('textbox', { name: 'High, row 2' })).toHaveValue('15,5');
  });

  it('shows placeholder rows while loading', () => {
    renderGrid({ loading: true });

    expect(screen.getByRole('grid')).toHaveAttribute('aria-busy', 'true');
    expect(document.querySelectorAll('[data-sheet-cell]')).toHaveLength(0);
  });

  it('shows the empty message when there are no rows', () => {
    renderGrid({ rows: [], empty: 'No sensors in this area' });

    expect(screen.getByText('No sensors in this area')).toBeInTheDocument();
  });

  it('hides the toolbar and the status bar when asked', () => {
    renderGrid({ toolbar: false, statusBar: false });

    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="sheet-status-bar"]')).not.toBeInTheDocument();
  });
});
