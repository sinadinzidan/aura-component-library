import { fireEvent, render, screen } from '@testing-library/react';

import { PinList } from './PinList';
import { createPinState } from './pins';

const items = [
  { id: 'n1', position: [0, 1, 0] as const, text: 'Check weld', partId: 'compressor' },
  { id: 'n2', position: [1, 1, 0] as const, text: 'Insulation damaged', partId: null },
];

function setup(selectedId: string | null = null, list = items) {
  const handlers = { onSelect: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  const state = { ...createPinState(list), selectedId };
  render(<PinList state={state} {...handlers} />);
  return handlers;
}

describe(PinList.name, () => {
  it('explains how to add a pin when there are none', () => {
    setup(null, []);

    expect(screen.getByText(/No pins/)).toBeInTheDocument();
  });

  it('numbers pins and names the part they sit on', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Pin 1, Check weld, on 1st stage compressor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pin 2, Insulation damaged' })).toBeInTheDocument();
  });

  it('selects and deselects', () => {
    const { onSelect } = setup('n2');

    fireEvent.click(screen.getByRole('button', { name: /Pin 1/ }));
    fireEvent.click(screen.getByRole('button', { name: /Pin 2/ }));

    expect(onSelect).toHaveBeenNthCalledWith(1, 'n1');
    expect(onSelect).toHaveBeenNthCalledWith(2, null);
  });

  it('edits the selected pin on blur', () => {
    const { onEdit } = setup('n1');
    const field = screen.getByRole('textbox', { name: 'Text of pin 1' });

    fireEvent.change(field, { target: { value: 'Weld cracked' } });
    fireEvent.blur(field);

    expect(onEdit).toHaveBeenCalledWith('n1', 'Weld cracked');
  });

  it('deletes a pin', () => {
    const { onDelete } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Delete pin 2' }));

    expect(onDelete).toHaveBeenCalledWith('n2');
  });
});
