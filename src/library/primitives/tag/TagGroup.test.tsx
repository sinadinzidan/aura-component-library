import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { TagGroup } from './TagGroup';
import type { TagGroupProps } from './TagGroup';

const OPTIONS = [
  { value: 'corrective', label: 'Corrective' },
  { value: 'preventive', label: 'Preventive' },
  { value: 'inspection', label: 'Inspection', disabled: true, disabledReason: 'No inspections this week' },
  { value: 'modification', label: 'Modification' },
];

describe(TagGroup.name, () => {
  it('names the group and marks the selected tags', () => {
    render(<Harness initial={['preventive']} />);

    expect(screen.getByRole('group', { name: 'Order type' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preventive' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Corrective' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('selects several tags in multiple mode', async () => {
    render(<Harness initial={[]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Corrective' }));
    await userEvent.click(screen.getByRole('button', { name: 'Modification' }));

    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(2);
  });

  it('keeps one tag selected at a time in single mode', async () => {
    render(<Harness initial={['corrective']} selection="single" />);

    await userEvent.click(screen.getByRole('button', { name: 'Preventive' }));

    expect(screen.getByRole('button', { name: 'Preventive' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Corrective' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('is a single tab stop on the selected tag', async () => {
    render(<Harness initial={['preventive']} />);

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Preventive' })).toHaveFocus();
    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });

  it('moves focus with the arrow keys and skips disabled tags', async () => {
    render(<Harness initial={['preventive']} />);
    await userEvent.tab();

    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('button', { name: 'Modification' })).toHaveFocus();
  });

  it('wraps and jumps with Home and End', async () => {
    render(<Harness initial={[]} />);
    await userEvent.tab();

    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Modification' })).toHaveFocus();

    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'Corrective' })).toHaveFocus();
  });

  it('toggles the focused tag with Space without moving the selection of others', async () => {
    render(<Harness initial={['corrective']} />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');

    await userEvent.keyboard(' ');

    expect(screen.getByRole('button', { name: 'Preventive' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Corrective' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not select a disabled tag', async () => {
    render(<Harness initial={[]} />);

    await userEvent.click(screen.getByRole('button', { name: /Inspection/ }));

    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument();
  });
});

function Harness({ initial, selection }: { initial: string[]; selection?: TagGroupProps['selection'] }) {
  const [value, setValue] = useState<string[]>(initial);
  return <TagGroup label="Order type" options={OPTIONS} value={value} onValueChange={setValue} selection={selection} />;
}
