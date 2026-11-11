import { fireEvent, render, screen } from '@testing-library/react';

import { ChoiceRow } from './ChoiceRow';

describe(ChoiceRow.name, () => {
  it('is a radio that says whether it is selected', () => {
    render(
      <div role="radiogroup" aria-label="Project">
        <ChoiceRow title="Nordkapp production" meta="Operator" selected onSelect={vi.fn()} />
        <ChoiceRow title="Nordkapp test" selected={false} onSelect={vi.fn()} />
      </div>,
    );

    expect(screen.getByRole('radio', { name: /Nordkapp production/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Nordkapp test/ })).not.toBeChecked();
  });

  it('reports a click on the row', () => {
    const onSelect = vi.fn();
    render(<ChoiceRow title="Nordkapp test" selected={false} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('radio'));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
