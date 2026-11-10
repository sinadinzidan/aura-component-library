import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DraftReview } from './DraftReview';

const DRAFT = 'Inspect drive-end bearing on 23-KA-9103.';

function renderDraft(props: Partial<Parameters<typeof DraftReview>[0]> = {}) {
  const handlers = { onAccept: vi.fn(), onDiscard: vi.fn() };
  const view = render(<DraftReview label="Work order description" draft={DRAFT} {...handlers} {...props} />);
  return { ...handlers, ...view };
}

describe(DraftReview.name, () => {
  it('shows the draft and marks it as not saved', () => {
    renderDraft();

    expect(screen.getByText(DRAFT)).toBeInTheDocument();
    expect(screen.getByText('Draft, not saved')).toBeInTheDocument();
  });

  it('accepts the draft as written', async () => {
    const { onAccept } = renderDraft();

    await userEvent.click(screen.getByRole('button', { name: 'Accept draft' }));

    expect(onAccept).toHaveBeenCalledWith(DRAFT);
  });

  it('accepts the edited text and marks it as edited', async () => {
    const { onAccept } = renderDraft();

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const editor = screen.getByLabelText('Work order description');
    await userEvent.clear(editor);
    await userEvent.type(editor, 'Replace bearing.');
    await userEvent.click(screen.getByRole('button', { name: 'Save edits' }));

    expect(screen.getByText('Draft, edited by you')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Accept draft' }));
    expect(onAccept).toHaveBeenCalledWith('Replace bearing.');
  });

  it('drops the edits on cancel', async () => {
    renderDraft();

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.type(screen.getByLabelText('Work order description'), ' Extra.');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText(DRAFT)).toBeInTheDocument();
    expect(screen.getByText('Draft, not saved')).toBeInTheDocument();
  });

  it('does not save an empty edit', async () => {
    renderDraft();

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.clear(screen.getByLabelText('Work order description'));

    expect(screen.getByRole('button', { name: 'Save edits' })).toBeDisabled();
  });

  it('discards and regenerates through the callbacks', async () => {
    const onRegenerate = vi.fn();
    const { onDiscard } = renderDraft({ onRegenerate });

    await userEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));

    expect(onRegenerate).toHaveBeenCalledTimes(1);
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('replaces the text when a new draft arrives', () => {
    const { rerender, onAccept, onDiscard } = renderDraft();

    rerender(<DraftReview label="Work order description" draft="Second draft." onAccept={onAccept} onDiscard={onDiscard} />);

    expect(screen.getByText('Second draft.')).toBeInTheDocument();
  });

  it('hides Regenerate without a handler and shows the footnote', () => {
    renderDraft({ footnote: 'Based on alarm alm-4812.' });

    expect(screen.queryByRole('button', { name: 'Regenerate' })).not.toBeInTheDocument();
    expect(screen.getByText('Based on alarm alm-4812.')).toBeInTheDocument();
  });
});
