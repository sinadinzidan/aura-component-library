import { fireEvent, render, screen } from '@testing-library/react';

import { ViewpointList } from './ViewpointList';

const viewpoints = [
  { id: 'v1', name: 'Pump side', target: { position: [0, 2, 10], lookAt: [0, 0, 0] } as const },
  { id: 'v2', name: 'From above', target: { position: [0, 20, 0.2], lookAt: [0, 0, 0] } as const },
];

function setup(items = viewpoints) {
  const handlers = { onRestore: vi.fn(), onDelete: vi.fn(), onSave: vi.fn() };
  render(<ViewpointList viewpoints={items} {...handlers} />);
  return handlers;
}

describe(ViewpointList.name, () => {
  it('says when there are none', () => {
    setup([]);

    expect(screen.getByText(/No saved views yet/)).toBeInTheDocument();
  });

  it('lists each viewpoint with a description of the view', () => {
    setup();

    expect(screen.getByRole('button', { name: /^Pump side/ })).toHaveTextContent('From the front');
    expect(screen.getByRole('button', { name: /^From above/ })).toHaveTextContent('From the top');
  });

  it('restores and deletes', () => {
    const { onRestore, onDelete } = setup();

    fireEvent.click(screen.getByRole('button', { name: /^Pump side/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete From above' }));

    expect(onRestore).toHaveBeenCalledWith('v1');
    expect(onDelete).toHaveBeenCalledWith('v2');
  });

  it('saves under the typed name and clears the field', () => {
    const { onSave } = setup([]);
    const input = screen.getByRole('textbox', { name: 'Viewpoint name' });

    fireEvent.change(input, { target: { value: 'Lube oil side' } });
    fireEvent.click(screen.getByRole('button', { name: /Save view/ }));

    expect(onSave).toHaveBeenCalledWith('Lube oil side');
    expect(input).toHaveValue('');
  });

  it('saves with an empty name when the field is blank', () => {
    const { onSave } = setup([]);

    fireEvent.click(screen.getByRole('button', { name: /Save view/ }));

    expect(onSave).toHaveBeenCalledWith('');
  });
});
