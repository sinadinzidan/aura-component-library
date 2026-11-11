import { fireEvent, render, screen } from '@testing-library/react';

import { DashboardCanvas } from './DashboardCanvas';
import type { EditorWidget } from './editorReducer';

const widget = (id: string, x: number, y: number, w: number, h: number, title: string): EditorWidget => ({ id, x, y, w, h, type: 'kpi', title, range: '24h' });

const WIDGETS = [widget('a', 0, 0, 4, 2, 'Availability'), widget('b', 4, 0, 4, 2, 'Gas export')];

// 12 columns of 84 px with 16 px gaps; a column step is 100 px and a row step 88 px.
const GRID_WIDTH = 1184;

function setup(props: Partial<Parameters<typeof DashboardCanvas>[0]> = {}) {
  const onAction = vi.fn();
  const view = render(
    <DashboardCanvas label="Compression dashboard" widgets={WIDGETS} editing onAction={onAction} renderWidget={(entry) => <p>{entry.title} body</p>} {...props} />,
  );
  const grid = screen.getByRole('group', { name: 'Compression dashboard' });
  vi.spyOn(grid, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, GRID_WIDTH, 600));
  return { onAction, grid, ...view };
}

const tile = (title: string) => screen.getByRole('group', { name: new RegExp(`^${title}`) });

describe(DashboardCanvas.name, () => {
  it('places each widget on the grid by column and row', () => {
    setup();

    expect(tile('Gas export').style.gridColumn).toBe('5 / span 4');
    expect(tile('Gas export').style.gridRow).toBe('1 / span 2');
  });

  it('names a widget with its position while editing', () => {
    setup();

    expect(screen.getByRole('group', { name: 'Availability widget, column 1, row 1, 4 wide by 2 tall' })).toHaveAttribute('tabindex', '0');
  });

  it('is not focusable or draggable in view mode', () => {
    const { onAction } = setup({ editing: false });
    const item = screen.getByRole('group', { name: 'Availability' });

    fireEvent.pointerDown(item, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(item, { pointerId: 1, clientX: 300, clientY: 10 });
    fireEvent.keyDown(item, { key: 'ArrowRight' });

    expect(item).not.toHaveAttribute('tabindex');
    expect(onAction).not.toHaveBeenCalled();
  });

  it('shows the empty slot when there are no widgets', () => {
    setup({ widgets: [], empty: <p>No widgets yet</p> });

    expect(screen.getByText('No widgets yet')).toBeInTheDocument();
  });

  describe('keyboard', () => {
    it('moves the focused widget with the arrow keys', () => {
      const { onAction } = setup();

      fireEvent.keyDown(tile('Availability'), { key: 'ArrowRight' });
      fireEvent.keyDown(tile('Availability'), { key: 'ArrowDown' });

      expect(onAction).toHaveBeenCalledWith({ type: 'nudge', id: 'a', dx: 1, dy: 0 });
      expect(onAction).toHaveBeenCalledWith({ type: 'nudge', id: 'a', dx: 0, dy: 1 });
    });

    it('resizes with Shift and the arrow keys', () => {
      const { onAction } = setup();

      fireEvent.keyDown(tile('Availability'), { key: 'ArrowLeft', shiftKey: true });

      expect(onAction).toHaveBeenCalledWith({ type: 'grow', id: 'a', dw: -1, dh: 0 });
    });

    it('removes the widget with Delete', () => {
      const { onAction } = setup();

      fireEvent.keyDown(tile('Gas export'), { key: 'Delete' });

      expect(onAction).toHaveBeenCalledWith({ type: 'remove', id: 'b' });
    });

    it('picks the widget up with Enter', () => {
      const { onAction } = setup();

      fireEvent.keyDown(tile('Availability'), { key: 'Enter' });

      expect(onAction).toHaveBeenCalledWith({ type: 'dragStart', id: 'a', kind: 'move' });
    });

    it('moves, drops and cancels a picked-up widget', () => {
      const { onAction } = setup({ drag: { id: 'a', kind: 'move', origin: WIDGETS } });

      fireEvent.keyDown(tile('Availability'), { key: 'ArrowRight' });
      fireEvent.keyDown(tile('Availability'), { key: ' ' });
      fireEvent.keyDown(tile('Availability'), { key: 'Escape' });

      expect(onAction.mock.calls.map(([action]) => action)).toEqual([{ type: 'dragNudge', dx: 1, dy: 0 }, { type: 'dragEnd' }, { type: 'dragCancel' }]);
    });

    it('ignores keys pressed inside a widget action', () => {
      const { onAction } = setup({ renderActions: () => <button type="button">Settings</button> });

      fireEvent.keyDown(screen.getAllByRole('button', { name: 'Settings' })[0], { key: 'Delete' });

      expect(onAction).not.toHaveBeenCalled();
    });
  });

  describe('pointer', () => {
    it('selects on press without starting a drag', () => {
      const { onAction } = setup();

      fireEvent.pointerDown(tile('Availability'), { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
      fireEvent.pointerUp(tile('Availability'), { pointerId: 1, clientX: 11, clientY: 10 });

      expect(onAction.mock.calls.map(([action]) => action)).toEqual([{ type: 'select', id: 'a' }]);
    });

    it('snaps a drag to whole cells', () => {
      const { onAction } = setup();
      const item = tile('Availability');

      fireEvent.pointerDown(item, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
      fireEvent.pointerMove(item, { pointerId: 1, clientX: 10 + 260, clientY: 10 + 80 });
      fireEvent.pointerUp(item, { pointerId: 1, clientX: 270, clientY: 90 });

      expect(onAction.mock.calls.map(([action]) => action)).toEqual([
        { type: 'select', id: 'a' },
        { type: 'dragStart', id: 'a', kind: 'move' },
        { type: 'dragMove', x: 3, y: 1 },
        { type: 'dragEnd' },
      ]);
    });

    it('cancels the drag when the pointer is cancelled', () => {
      const { onAction } = setup();
      const item = tile('Availability');

      fireEvent.pointerDown(item, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
      fireEvent.pointerMove(item, { pointerId: 1, clientX: 210, clientY: 10 });
      fireEvent.pointerCancel(item, { pointerId: 1 });

      expect(onAction).toHaveBeenLastCalledWith({ type: 'dragCancel' });
    });

    it('resizes from the corner handle', () => {
      const { onAction, container } = setup();
      const item = tile('Availability');
      const handle = item.querySelector('[data-resize="both"]');
      if (!handle) throw new Error('No handle');

      fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientX: 400, clientY: 160 });
      fireEvent.pointerMove(item, { pointerId: 1, clientX: 600, clientY: 250 });

      expect(container).toBeTruthy();
      expect(onAction).toHaveBeenCalledWith({ type: 'dragStart', id: 'a', kind: 'resize' });
      expect(onAction).toHaveBeenLastCalledWith({ type: 'dragResize', w: 6, h: 3 });
    });

    it('changes only the width from the right-edge handle', () => {
      const { onAction } = setup();
      const item = tile('Availability');
      const handle = item.querySelector('[data-resize="width"]');
      if (!handle) throw new Error('No handle');

      fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientX: 400, clientY: 80 });
      fireEvent.pointerMove(item, { pointerId: 1, clientX: 500, clientY: 300 });

      expect(onAction).toHaveBeenLastCalledWith({ type: 'dragResize', w: 5, h: 2 });
    });

    it('does not start a drag from a widget action', () => {
      const { onAction } = setup({ renderActions: () => <button type="button">Settings</button> });

      fireEvent.pointerDown(screen.getAllByRole('button', { name: 'Settings' })[0], { button: 0, pointerId: 1, clientX: 10, clientY: 10 });

      expect(onAction).not.toHaveBeenCalled();
    });
  });

  it('shows a drop placeholder in the cell the dragged widget will take', () => {
    const { container } = setup({ drag: { id: 'b', kind: 'move', origin: WIDGETS } });

    const placeholder = container.querySelector<HTMLElement>('[data-slot="drop-placeholder"]');
    expect(placeholder?.style.gridColumn).toBe('5 / span 4');
    expect(container.querySelectorAll('[data-slot="grid-guide"]')).toHaveLength(12);
  });
});
