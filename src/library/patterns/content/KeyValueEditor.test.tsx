import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { ComponentProps } from 'react';

import type { KeyValuePair } from './duplicateKeys';
import { KeyValueEditor } from './KeyValueEditor';

const PAIRS: KeyValuePair[] = [
  { id: 'a', key: 'unit', value: 'barg' },
  { id: 'b', key: 'source', value: 'PI' },
];

type HarnessProps = Partial<ComponentProps<typeof KeyValueEditor>> & {
  initial?: KeyValuePair[];
};

function Harness({ initial = PAIRS, onChange, ...props }: HarnessProps) {
  const [pairs, setPairs] = useState(initial);
  return (
    <TooltipProvider>
      <KeyValueEditor
        label="Metadata"
        {...props}
        pairs={pairs}
        onChange={(next) => {
          setPairs(next);
          onChange?.(next);
        }}
      />
    </TooltipProvider>
  );
}

describe(KeyValueEditor.name, () => {
  it('shows each pair as two named fields', () => {
    render(<Harness />);

    expect(screen.getByRole('group', { name: 'Metadata' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Key, row 1' })).toHaveValue('unit');
    expect(screen.getByRole('textbox', { name: 'Value for unit' })).toHaveValue('barg');
  });

  it('edits a value in place', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Value for source' }), '2');

    expect(onChange).toHaveBeenLastCalledWith([PAIRS[0], { id: 'b', key: 'source', value: 'PI2' }]);
  });

  it('removes a row', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove unit' }));

    expect(onChange).toHaveBeenLastCalledWith([PAIRS[1]]);
  });

  it('adds an empty row at the end and focuses its key', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} createId={() => 'new'} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add property' }));

    expect(onChange).toHaveBeenLastCalledWith([...PAIRS, { id: 'new', key: '', value: '' }]);
    expect(screen.getByRole('textbox', { name: 'Key, row 3' })).toHaveFocus();
  });

  it('makes its own ids that do not collide with existing ones', async () => {
    const onChange = vi.fn();
    render(<Harness initial={[{ id: 'pair-1', key: 'unit', value: 'barg' }]} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add property' }));

    expect(onChange.mock.lastCall?.[0][1].id).toBe('pair-2');
  });

  it('marks every row of a key that is used twice', async () => {
    render(<Harness />);

    await userEvent.clear(screen.getByRole('textbox', { name: 'Key, row 2' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Key, row 2' }), 'Unit');

    expect(screen.getByRole('alert')).toHaveTextContent('Key used more than once: unit. Each key needs its own name.');
    expect(screen.getByRole('textbox', { name: 'Key, row 1' })).toBeInvalid();
    expect(screen.getByRole('textbox', { name: 'Key, row 2' })).toBeInvalid();
  });

  it('names a row without a key by its position', () => {
    render(<Harness initial={[{ id: 'a', key: '', value: '' }]} />);

    expect(screen.getByRole('button', { name: 'Remove row 1' })).toBeInTheDocument();
  });

  it('says so when there are no pairs', () => {
    render(<Harness initial={[]} />);

    expect(screen.getByText('No properties yet.')).toBeInTheDocument();
  });

  it('stops adding at the limit and says why', () => {
    render(<Harness maxPairs={2} />);

    expect(screen.getByRole('button', { name: 'Add property' })).toBeDisabled();
    expect(screen.getByText('Up to 2 properties. Remove one to add another.')).toBeInTheDocument();
  });
});
