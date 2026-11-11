import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { TagInput } from './TagInput';

describe(TagInput.name, () => {
  it('adds a tag on Enter and clears the field', async () => {
    render(<Harness initial={['vibration']} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Labels' }), 'bearing{Enter}');

    expect(screen.getByRole('button', { name: 'Remove bearing' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Labels' })).toHaveValue('');
  });

  it('adds a tag when a comma is typed', async () => {
    render(<Harness initial={[]} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Labels' }), 'bearing,');

    expect(screen.getByRole('button', { name: 'Remove bearing' })).toBeInTheDocument();
  });

  it('turns a pasted list into several tags', async () => {
    render(<Harness initial={[]} />);

    await userEvent.click(screen.getByRole('textbox', { name: 'Labels' }));
    await userEvent.paste('bearing, seal, coupling,');

    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(3);
  });

  it('removes the last tag with Backspace in the empty field', async () => {
    render(<Harness initial={['vibration', 'bearing']} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Labels' }), '{Backspace}');

    expect(screen.queryByRole('button', { name: 'Remove bearing' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove vibration' })).toBeInTheDocument();
  });

  it('removes a tag from its button and returns focus to the field', async () => {
    render(<Harness initial={['vibration', 'bearing']} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove vibration' }));

    expect(screen.queryByRole('button', { name: 'Remove vibration' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Labels' })).toHaveFocus();
  });

  it('refuses a duplicate with a reason and keeps the text', async () => {
    render(<Harness initial={['bearing']} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Labels' }), 'Bearing{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('“Bearing” is already added.');
    expect(screen.getByRole('textbox', { name: 'Labels' })).toHaveValue('Bearing');
    expect(screen.getByRole('textbox', { name: 'Labels' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('counts tags against the limit and stops at it', async () => {
    render(<Harness initial={['a', 'b']} maxTags={3} />);
    expect(screen.getByText('2 of 3 tags')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox', { name: 'Labels' }), 'c{Enter}');

    expect(screen.getByText('3 of 3 tags. Remove one to add another.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Labels' })).toHaveAttribute('readonly');
  });

  it('disables the field and its tags', () => {
    render(<TagInput label="Labels" tags={['vibration']} onChange={() => {}} disabled />);

    expect(screen.getByRole('textbox', { name: 'Labels' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove vibration' })).toBeDisabled();
  });
});

function Harness({ initial, maxTags }: { initial: string[]; maxTags?: number }) {
  const [tags, setTags] = useState<string[]>(initial);
  return <TagInput label="Labels" tags={tags} onChange={setTags} maxTags={maxTags} />;
}
