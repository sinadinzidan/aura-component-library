import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { ComponentProps } from 'react';

import { TagInput } from './TagInput';

type HarnessProps = Partial<ComponentProps<typeof TagInput>> & {
  initial?: string[];
};

function Harness({ initial = ['rotating', 'critical'], onChange, ...props }: HarnessProps) {
  const [tags, setTags] = useState(initial);
  return (
    <TagInput
      label="Labels"
      {...props}
      tags={tags}
      onChange={(next) => {
        setTags(next);
        onChange?.(next);
      }}
    />
  );
}

const field = () => screen.getByRole('textbox', { name: 'Labels' });

describe(TagInput.name, () => {
  it('adds the typed tag on Enter and clears the field', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.type(field(), ' compressor {Enter}');

    expect(onChange).toHaveBeenLastCalledWith(['rotating', 'critical', 'compressor']);
    expect(field()).toHaveValue('');
  });

  it('adds a tag when a comma is typed', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.type(field(), 'bearing,');

    expect(onChange).toHaveBeenLastCalledWith(['rotating', 'critical', 'bearing']);
    expect(field()).toHaveValue('');
  });

  it('turns a pasted list into several tags', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(field());

    await userEvent.paste('bearing, vibration, ');

    expect(onChange).toHaveBeenLastCalledWith(['rotating', 'critical', 'bearing', 'vibration']);
  });

  it('removes the last tag with Backspace in the empty field', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.type(field(), '{Backspace}');

    expect(onChange).toHaveBeenLastCalledWith(['rotating']);
  });

  it('keeps the tags when Backspace deletes typed text', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.type(field(), 'ab{Backspace}');

    expect(onChange).not.toHaveBeenCalled();
    expect(field()).toHaveValue('a');
  });

  it('removes a tag from its button', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove rotating' }));

    expect(onChange).toHaveBeenLastCalledWith(['critical']);
  });

  it('refuses a duplicate with a reason and keeps the text', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.type(field(), 'Critical{Enter}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('“Critical” is already added.');
    expect(field()).toHaveValue('Critical');
    expect(field()).toBeInvalid();
  });

  it('refuses a tag the caller rejects', async () => {
    const validate = (tag: string) => (tag.includes(' ') ? 'Use one word.' : null);
    render(<Harness validate={validate} />);

    await userEvent.type(field(), 'two words{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('Use one word.');
  });

  it('clears the reason when typing continues', async () => {
    render(<Harness />);
    await userEvent.type(field(), 'critical{Enter}');

    await userEvent.type(field(), 's');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('counts tags against the limit', () => {
    render(<Harness maxTags={5} />);

    expect(screen.getByText('2 of 5 tags')).toBeInTheDocument();
  });

  it('stops taking tags at the limit and says how to continue', async () => {
    const onChange = vi.fn();
    render(<Harness maxTags={2} onChange={onChange} />);

    await userEvent.type(field(), 'bearing{Enter}');

    expect(onChange).not.toHaveBeenCalled();
    expect(field()).toHaveAttribute('readonly');
    expect(screen.getByText('2 of 2 tags. Remove one to add another.')).toBeInTheDocument();
  });

  it('keeps what fits from a pasted list that passes the limit', async () => {
    const onChange = vi.fn();
    render(<Harness maxTags={3} onChange={onChange} />);
    await userEvent.click(field());

    await userEvent.paste('bearing, vibration,');

    expect(onChange).toHaveBeenLastCalledWith(['rotating', 'critical', 'bearing']);
  });

  it('disables the field and the remove buttons together', () => {
    render(<Harness disabled />);

    expect(field()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove rotating' })).toBeDisabled();
  });
});
