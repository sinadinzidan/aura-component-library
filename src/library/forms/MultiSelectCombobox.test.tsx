import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MultiSelectCombobox } from './MultiSelectCombobox';
import type { MultiSelectOption } from './MultiSelectCombobox';

describe(MultiSelectCombobox.name, () => {
  it('shows the placeholder and stays closed until the trigger is used', () => {
    renderCombobox([]);

    expect(screen.getByRole('combobox', { name: 'Assets' })).toHaveTextContent('Select assets');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('shows one chip per selected option', () => {
    renderCombobox(['ka-9101', 'ka-9102']);

    const chips = screen.getAllByRole('listitem');
    expect(chips.map((chip) => chip.textContent)).toEqual(['1st stage compressor', '2nd stage compressor']);
  });

  it('adds an option picked from the list', async () => {
    const onValueChange = renderCombobox(['ka-9101']);

    await userEvent.click(screen.getByRole('combobox', { name: 'Assets' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Recompressor' }));

    expect(onValueChange).toHaveBeenCalledWith(['ka-9101', 'ka-9103']);
  });

  it('removes an option picked a second time', async () => {
    const onValueChange = renderCombobox(['ka-9101']);

    await userEvent.click(screen.getByRole('combobox', { name: 'Assets' }));
    await userEvent.click(await screen.findByRole('option', { name: '1st stage compressor' }));

    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  it('keeps the list open after a pick', async () => {
    renderCombobox([]);

    await userEvent.click(screen.getByRole('combobox', { name: 'Assets' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Recompressor' }));

    expect(screen.getByRole('option', { name: '2nd stage compressor' })).toBeInTheDocument();
  });

  it('removes an option from its chip', async () => {
    const onValueChange = renderCombobox(['ka-9101', 'ka-9102']);

    await userEvent.click(screen.getByRole('button', { name: 'Remove 1st stage compressor' }));

    expect(onValueChange).toHaveBeenCalledWith(['ka-9102']);
  });

  it('removes the last chip with Backspace on the closed field', async () => {
    const onValueChange = renderCombobox(['ka-9101', 'ka-9102']);

    screen.getByRole('combobox', { name: 'Assets' }).focus();
    await userEvent.keyboard('{Backspace}');

    expect(onValueChange).toHaveBeenCalledWith(['ka-9101']);
  });

  it('collapses chips beyond the limit into a count', () => {
    render(
      <MultiSelectCombobox
        aria-label="Assets"
        options={OPTIONS}
        value={['ka-9101', 'ka-9102', 'ka-9103']}
        onValueChange={vi.fn()}
        maxVisibleChips={1}
      />
    );

    const chips = screen.getAllByRole('listitem');
    expect(chips).toHaveLength(2);
    expect(chips[1]).toHaveTextContent('+2 more');
  });

  it('filters options by their label', async () => {
    renderCombobox([]);

    await userEvent.click(screen.getByRole('combobox', { name: 'Assets' }));
    await userEvent.type(await screen.findByPlaceholderText('Search…'), 'recomp');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Recompressor');
  });

  it('offers to create a search term that matches no option', async () => {
    const onCreateOption = vi.fn();
    render(
      <MultiSelectCombobox
        aria-label="Labels"
        options={OPTIONS}
        value={[]}
        onValueChange={vi.fn()}
        onCreateOption={onCreateOption}
      />
    );

    await userEvent.click(screen.getByRole('combobox', { name: 'Labels' }));
    await userEvent.type(await screen.findByPlaceholderText('Search…'), 'Flare stack');
    await userEvent.click(screen.getByRole('option', { name: /Create/ }));

    expect(onCreateOption).toHaveBeenCalledWith('Flare stack');
  });

  it('hides chip remove buttons and blocks the trigger when disabled', () => {
    render(
      <MultiSelectCombobox aria-label="Assets" options={OPTIONS} value={['ka-9101']} onValueChange={vi.fn()} disabled />
    );

    expect(screen.getByRole('combobox', { name: 'Assets' })).toBeDisabled();
    expect(within(screen.getByRole('list')).queryByRole('button')).not.toBeInTheDocument();
  });
});

const OPTIONS: readonly MultiSelectOption[] = [
  { value: 'ka-9101', label: '1st stage compressor' },
  { value: 'ka-9102', label: '2nd stage compressor' },
  { value: 'ka-9103', label: 'Recompressor' },
];

function renderCombobox(value: string[]) {
  const onValueChange = vi.fn<(value: string[]) => void>();
  render(
    <MultiSelectCombobox
      aria-label="Assets"
      options={OPTIONS}
      value={value}
      onValueChange={onValueChange}
      placeholder="Select assets"
    />
  );
  return onValueChange;
}
