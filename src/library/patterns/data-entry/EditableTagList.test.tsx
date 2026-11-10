import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EditableTagList } from './EditableTagList';

const TAGS = ['rotating', 'critical'];

describe(EditableTagList.name, () => {
  it('lists the tags under an accessible name', () => {
    render(<EditableTagList tags={TAGS} label="Labels" onChange={vi.fn()} />);

    expect(screen.getByRole('list', { name: 'Labels' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('removes a tag from its button', async () => {
    const onChange = vi.fn();
    render(<EditableTagList tags={TAGS} label="Labels" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove rotating' }));

    expect(onChange).toHaveBeenCalledWith(['critical']);
  });

  it('opens a focused input from the add button', async () => {
    render(<EditableTagList tags={TAGS} label="Labels" addLabel="Add label" onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add label' }));

    expect(screen.getByRole('textbox', { name: 'Add label' })).toHaveFocus();
  });

  it('adds the trimmed tag on Enter and keeps the input open', async () => {
    const onChange = vi.fn();
    render(<EditableTagList tags={TAGS} label="Labels" addLabel="Add label" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add label' }));

    await userEvent.type(screen.getByRole('textbox'), ' compressor {Enter}');

    expect(onChange).toHaveBeenCalledWith(['rotating', 'critical', 'compressor']);
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('rejects a duplicate with a reason', async () => {
    const onChange = vi.fn();
    render(<EditableTagList tags={TAGS} label="Labels" addLabel="Add label" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add label' }));

    await userEvent.type(screen.getByRole('textbox'), 'Critical{Enter}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('“Critical” is already added.');
  });

  it('rejects a tag the caller refuses', async () => {
    const onChange = vi.fn();
    const validate = (tag: string) => (tag.includes(' ') ? 'Use one word.' : null);
    render(<EditableTagList tags={TAGS} label="Labels" addLabel="Add label" validate={validate} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add label' }));

    await userEvent.type(screen.getByRole('textbox'), 'gas export{Enter}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Use one word.');
  });

  it('closes the input on Escape and returns focus to the add button', async () => {
    render(<EditableTagList tags={TAGS} label="Labels" addLabel="Add label" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add label' }));

    await userEvent.type(screen.getByRole('textbox'), 'draft{Escape}');

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add label' })).toHaveFocus();
  });

  it('replaces the add button with a note at the maximum', () => {
    render(<EditableTagList tags={TAGS} label="Labels" addLabel="Add label" maxTags={2} onChange={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Add label' })).not.toBeInTheDocument();
    expect(screen.getByText('Up to 2.')).toBeInTheDocument();
  });
});
