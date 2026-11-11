import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FieldPalette } from './FieldPalette';
import { FIELD_TYPES } from './formSchema';

describe(FieldPalette.name, () => {
  it('lists every field type with an Add button', () => {
    render(<FieldPalette onAdd={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(FIELD_TYPES.length);
    expect(screen.getByRole('button', { name: 'Add Number with unit field' })).toBeInTheDocument();
  });

  it('adds the chosen type', async () => {
    const onAdd = vi.fn();
    render(<FieldPalette onAdd={onAdd} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add Radio group field' }));

    expect(onAdd).toHaveBeenCalledWith('radio');
  });

  it('locks every button and says why', () => {
    render(<FieldPalette onAdd={vi.fn()} disabledReason="This form is published and cannot change." />);

    expect(screen.getByText('This form is published and cannot change.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Text field' })).toBeDisabled();
  });
});
