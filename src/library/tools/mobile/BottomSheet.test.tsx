import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { BottomSheet } from './BottomSheet';
import type { SheetSnap } from './bottomSheet';

function Harness({ initial = 'half' as SheetSnap, onChange = (_snap: SheetSnap) => undefined }) {
  const [snap, setSnap] = useState<SheetSnap>(initial);
  return (
    <div>
      <BottomSheet
        snap={snap}
        title="Filter work orders"
        footer={<button type="button">Apply filters</button>}
        onSnapChange={(next) => {
          onChange(next);
          setSnap(next);
        }}
      >
        <p>Priority</p>
      </BottomSheet>
    </div>
  );
}

function handle() {
  return screen.getByRole('slider', { name: 'Sheet height' });
}

describe(BottomSheet.name, () => {
  it('renders nothing while closed', () => {
    render(<Harness initial="closed" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a dialog with its title, content, footer and a handle that reports the height', () => {
    render(<Harness />);

    expect(screen.getByRole('dialog', { name: 'Filter work orders' })).toHaveFocus();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply filters' })).toBeInTheDocument();
    expect(handle()).toHaveAttribute('aria-valuetext', 'Half height');
    expect(handle()).toHaveAttribute('aria-valuenow', '1');
  });

  it('expands with Up and collapses with Down, then closes', async () => {
    render(<Harness />);

    handle().focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(handle()).toHaveAttribute('aria-valuetext', 'Full height');

    await userEvent.keyboard('{ArrowDown}');
    expect(handle()).toHaveAttribute('aria-valuetext', 'Half height');

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('jumps to the ends with End and Home', async () => {
    render(<Harness />);

    handle().focus();
    await userEvent.keyboard('{End}');
    expect(handle()).toHaveAttribute('aria-valuetext', 'Full height');
    await userEvent.keyboard('{Home}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes with Escape and with the scrim', async () => {
    const { unmount } = render(<Harness />);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();

    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Close sheet' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('toggles between half and full when the handle is tapped', async () => {
    render(<Harness />);

    await userEvent.click(handle());
    expect(handle()).toHaveAttribute('aria-valuetext', 'Full height');
    await userEvent.click(handle());
    expect(handle()).toHaveAttribute('aria-valuetext', 'Half height');
  });

  it('snaps to full when the handle is dragged up and closes when dragged far down', () => {
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, width: 300, height: 600, top: 0, right: 300, bottom: 600, left: 0, toJSON: () => ({}) });
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    fireEvent.pointerDown(handle(), { button: 0, pointerId: 1, clientY: 300 });
    fireEvent.pointerMove(handle(), { pointerId: 1, clientY: 100 });
    fireEvent.pointerUp(handle(), { pointerId: 1, clientY: 100 });
    expect(onChange).toHaveBeenLastCalledWith('full');

    fireEvent.pointerDown(handle(), { button: 0, pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(handle(), { pointerId: 1, clientY: 590 });
    fireEvent.pointerUp(handle(), { pointerId: 1, clientY: 590 });
    expect(onChange).toHaveBeenLastCalledWith('closed');

    Element.prototype.getBoundingClientRect = original;
  });

  it('follows the pointer while dragging', () => {
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, width: 300, height: 600, top: 0, right: 300, bottom: 600, left: 0, toJSON: () => ({}) });
    render(<Harness />);

    fireEvent.pointerDown(handle(), { button: 0, pointerId: 1, clientY: 300 });
    fireEvent.pointerMove(handle(), { pointerId: 1, clientY: 240 });

    expect(screen.getByRole('dialog').style.height).toBe('60%');
    Element.prototype.getBoundingClientRect = original;
  });
});
