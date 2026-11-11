import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FormCanvas } from './FormCanvas';
import type { FormSchema } from './formSchema';

const SCHEMA: FormSchema = {
  title: 'Inspection checkpoint',
  fields: [
    { id: 'tag', type: 'text', label: 'Equipment tag', required: true },
    { id: 'cond', type: 'radio', label: 'Condition', options: [{ value: 'a', label: 'Good' }, { value: 'b', label: 'Worn' }] },
    { id: 'note', type: 'textarea', label: 'Findings', showWhen: { fieldId: 'cond', equals: 'b' } },
  ],
};

function setup(props: Partial<Parameters<typeof FormCanvas>[0]> = {}) {
  const handlers = { onSelect: vi.fn(), onMove: vi.fn(), onMoveBy: vi.fn(), onRemove: vi.fn(), onDuplicate: vi.fn() };
  render(<FormCanvas schema={SCHEMA} selectedId={null} {...handlers} {...props} />);
  return handlers;
}

describe(FormCanvas.name, () => {
  it('draws every field with its real control', () => {
    setup();

    expect(screen.getByRole('list', { name: 'Inspection checkpoint fields' })).toBeInTheDocument();
    expect(screen.getByText('Equipment tag')).toBeInTheDocument();
    expect(screen.getByText('Findings')).toBeInTheDocument();
  });

  it('selects a field when its row is activated', async () => {
    const { onSelect } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Edit Condition, Radio group field 2 of 3' }));

    expect(onSelect).toHaveBeenCalledWith('cond');
  });

  it('selects with the keyboard', () => {
    const { onSelect } = setup();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Edit Findings, Text area field 3 of 3' }), { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('note');
  });

  it('moves a field up and down with the buttons', async () => {
    const { onMoveBy } = setup({ selectedId: 'cond' });

    await userEvent.click(screen.getByRole('button', { name: 'Move Condition up' }));
    await userEvent.click(screen.getByRole('button', { name: 'Move Condition down' }));

    expect(onMoveBy.mock.calls).toEqual([['cond', -1], ['cond', 1]]);
  });

  it('disables moving the first field up', () => {
    setup();

    expect(screen.getAllByRole('button', { name: 'Already first' })[0]).toBeDisabled();
  });

  it('moves a field with the arrow keys on its grip', () => {
    const { onMoveBy } = setup();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Reorder Condition. Arrow keys move it.' }), { key: 'ArrowDown' });

    expect(onMoveBy).toHaveBeenCalledWith('cond', 1);
  });

  it('reorders by dragging the grip past another row', () => {
    const { onMove } = setup();
    const rows = document.querySelectorAll<HTMLElement>('[data-field-row]');
    rows.forEach((row, index) => {
      vi.spyOn(row, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, index * 100, 400, 80));
    });
    const grip = screen.getByRole('button', { name: 'Reorder Equipment tag. Arrow keys move it.' });

    fireEvent.pointerDown(grip, { button: 0, pointerId: 1 });
    fireEvent.pointerMove(grip, { pointerId: 1, clientY: 150 });

    expect(onMove).toHaveBeenCalledWith('tag', 1);
  });

  it('duplicates and deletes the field', async () => {
    const { onDuplicate, onRemove } = setup({ selectedId: 'tag' });

    await userEvent.click(screen.getByRole('button', { name: 'Duplicate Equipment tag' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete Equipment tag' }));

    expect(onDuplicate).toHaveBeenCalledWith('tag');
    expect(onRemove).toHaveBeenCalledWith('tag');
  });

  it('shows the visibility rule under a conditional field', () => {
    setup();

    expect(screen.getByText('Shown when Condition is Worn')).toBeInTheDocument();
  });

  it('says what is wrong with a field', () => {
    setup({ problems: { cond: 'Add at least two options.' } });

    expect(screen.getByRole('alert')).toHaveTextContent('Add at least two options.');
  });

  it('shows an empty state with a way forward', () => {
    setup({ schema: { title: 'New form', fields: [] } });

    expect(screen.getByText('This form has no fields')).toBeInTheDocument();
    expect(screen.getByText('Add a field from the palette to start.')).toBeInTheDocument();
  });
});
