import { fireEvent, screen } from '@testing-library/react';

import { PaneHandle } from './PaneHandle';
import { renderPanes } from './testUtils';

const handle = () => screen.getByRole('separator', { name: 'Resize Navigation' });

describe(PaneHandle.name, () => {
  it('is a focusable separator that reports the size and limits of the pane before it', () => {
    renderPanes();

    expect(handle()).toHaveAttribute('tabindex', '0');
    expect(handle()).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle()).toHaveAttribute('aria-valuenow', '30');
    expect(handle()).toHaveAttribute('aria-valuemin', '20');
    expect(handle()).toHaveAttribute('aria-valuemax', '50');
    expect(handle()).toHaveAttribute('aria-controls', screen.getByRole('group', { name: 'Navigation' }).id);
  });

  it('is a horizontal separator in a vertical group', () => {
    renderPanes({ group: { orientation: 'vertical' } });

    expect(handle()).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('resizes with the arrow keys', () => {
    renderPanes();

    fireEvent.keyDown(handle(), { key: 'ArrowRight' });
    expect(handle()).toHaveAttribute('aria-valuenow', '32');
    fireEvent.keyDown(handle(), { key: 'ArrowLeft' });
    fireEvent.keyDown(handle(), { key: 'ArrowLeft' });

    expect(handle()).toHaveAttribute('aria-valuenow', '28');
  });

  it('moves five steps with Shift', () => {
    renderPanes();

    fireEvent.keyDown(handle(), { key: 'ArrowRight', shiftKey: true });

    expect(handle()).toHaveAttribute('aria-valuenow', '40');
  });

  it('uses the up and down arrows in a vertical group', () => {
    renderPanes({ group: { orientation: 'vertical' } });

    fireEvent.keyDown(handle(), { key: 'ArrowRight' });
    expect(handle()).toHaveAttribute('aria-valuenow', '30');
    fireEvent.keyDown(handle(), { key: 'ArrowDown' });

    expect(handle()).toHaveAttribute('aria-valuenow', '32');
  });

  it('jumps to the limits with Home and End', () => {
    renderPanes();

    fireEvent.keyDown(handle(), { key: 'End' });
    expect(handle()).toHaveAttribute('aria-valuenow', '50');
    fireEvent.keyDown(handle(), { key: 'Home' });

    expect(handle()).toHaveAttribute('aria-valuenow', '20');
  });

  it('stops at the limits', () => {
    renderPanes({ handle: { step: 40 } });

    fireEvent.keyDown(handle(), { key: 'ArrowRight' });

    expect(handle()).toHaveAttribute('aria-valuenow', '50');
  });

  it('toggles a collapsible pane with Enter', () => {
    renderPanes({ first: { collapsible: true } });

    fireEvent.keyDown(handle(), { key: 'Enter' });
    expect(handle()).toHaveAttribute('aria-valuenow', '0');
    expect(handle()).toHaveAttribute('aria-valuetext', 'Navigation collapsed');
    fireEvent.keyDown(handle(), { key: 'Enter' });

    expect(handle()).toHaveAttribute('aria-valuenow', '30');
  });

  it('ignores Enter when no neighbour collapses', () => {
    renderPanes();

    fireEvent.keyDown(handle(), { key: 'Enter' });

    expect(handle()).toHaveAttribute('aria-valuenow', '30');
  });

  it('resets the group on double-click', () => {
    renderPanes();
    fireEvent.keyDown(handle(), { key: 'End' });

    fireEvent.doubleClick(handle());

    expect(handle()).toHaveAttribute('aria-valuenow', '30');
  });

  it('resizes while dragged and marks itself as dragging', () => {
    renderPanes();
    stubGroupWidth(1000);

    fireEvent.pointerDown(handle(), { button: 0, pointerId: 1, clientX: 300 });
    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 400 });

    expect(handle()).toHaveAttribute('aria-valuenow', '40');
    expect(handle()).toHaveAttribute('data-dragging');
    fireEvent.pointerUp(handle(), { pointerId: 1 });
    expect(handle()).not.toHaveAttribute('data-dragging');
  });

  it('does not resize on pointer movement without a press', () => {
    renderPanes();
    stubGroupWidth(1000);

    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 400 });

    expect(handle()).toHaveAttribute('aria-valuenow', '30');
  });

  it('cancels a drag with Escape', () => {
    renderPanes();
    stubGroupWidth(1000);
    fireEvent.pointerDown(handle(), { button: 0, pointerId: 1, clientX: 300 });
    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 450 });

    fireEvent.keyDown(handle(), { key: 'Escape' });

    expect(handle()).toHaveAttribute('aria-valuenow', '30');
  });

  it('snaps a collapsible pane shut when dragged below half its minimum', () => {
    renderPanes({ first: { collapsible: true } });
    stubGroupWidth(1000);

    fireEvent.pointerDown(handle(), { button: 0, pointerId: 1, clientX: 300 });
    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 60 });

    expect(handle()).toHaveAttribute('aria-valuenow', '0');
  });

  it('takes a custom label and the grip variant', () => {
    renderPanes({ handle: { 'aria-label': 'Resize asset tree', variant: 'grip' } });

    expect(screen.getByRole('separator', { name: 'Resize asset tree' })).toHaveAttribute('data-variant', 'grip');
  });
});

function stubGroupWidth(width: number) {
  const group = document.querySelector('[data-slot="resizable-panes"]');
  if (!(group instanceof HTMLElement)) throw new Error('Group not rendered');
  group.getBoundingClientRect = () => new DOMRect(0, 0, width, 400);
}
