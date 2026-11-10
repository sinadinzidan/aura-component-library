import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { CommentComposer } from './CommentComposer';

describe(CommentComposer.name, () => {
  it('keeps the submit button disabled until there is text', async () => {
    renderComposer({});
    expect(screen.getByRole('button', { name: 'Comment' })).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox', { name: 'Comment on WO-104482' }), 'Checked');

    expect(screen.getByRole('button', { name: 'Comment' })).toBeEnabled();
  });

  it('does not count whitespace as text', async () => {
    renderComposer({});

    await userEvent.type(screen.getByRole('textbox'), '   ');

    expect(screen.getByRole('button', { name: 'Comment' })).toBeDisabled();
  });

  it('submits the trimmed text and clears the field', async () => {
    const onSubmit = vi.fn();
    renderComposer({ onSubmit });

    await userEvent.type(screen.getByRole('textbox'), '  Bearing looks fine ');
    await userEvent.click(screen.getByRole('button', { name: 'Comment' }));

    expect(onSubmit).toHaveBeenCalledWith('Bearing looks fine');
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('submits with Control + Enter', async () => {
    const onSubmit = vi.fn();
    renderComposer({ onSubmit });

    await userEvent.type(screen.getByRole('textbox'), 'Restart approved{Control>}{Enter}{/Control}');

    expect(onSubmit).toHaveBeenCalledWith('Restart approved');
  });

  it('submits with Command + Enter', async () => {
    const onSubmit = vi.fn();
    renderComposer({ onSubmit });

    await userEvent.type(screen.getByRole('textbox'), 'Restart approved{Meta>}{Enter}{/Meta}');

    expect(onSubmit).toHaveBeenCalledWith('Restart approved');
  });

  it('does not submit an empty comment from the keyboard', async () => {
    const onSubmit = vi.fn();
    renderComposer({ onSubmit });

    await userEvent.type(screen.getByRole('textbox'), '{Control>}{Enter}{/Control}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('reports every change so a draft can be saved', async () => {
    const onValueChange = vi.fn();
    renderComposer({ onValueChange });

    await userEvent.type(screen.getByRole('textbox'), 'Hi');

    expect(onValueChange).toHaveBeenLastCalledWith('Hi');
  });

  it('starts from a restored draft', () => {
    renderComposer({ defaultValue: 'Half a thought' });

    expect(screen.getByRole('textbox')).toHaveValue('Half a thought');
    expect(screen.getByRole('button', { name: 'Comment' })).toBeEnabled();
  });

  it('offers Cancel only when it can be abandoned', async () => {
    const onCancel = vi.fn();
    renderComposer({ onCancel, submitLabel: 'Reply' });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Reply' })).toBeInTheDocument();
  });

  it('shows the reason and no field when the thread is read-only', () => {
    renderComposer({ readOnlyReason: 'Only the assignee and planners can comment.' });

    expect(screen.getByText('Only the assignee and planners can comment.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('reads the shortcut out in words', () => {
    renderComposer({ platform: 'other' });

    expect(screen.getByText('Control + Enter')).toBeInTheDocument();
  });
});

function renderComposer(props: Partial<ComponentProps<typeof CommentComposer>>) {
  return render(<CommentComposer label="Comment on WO-104482" onSubmit={vi.fn()} {...props} />);
}
