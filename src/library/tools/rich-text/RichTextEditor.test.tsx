import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { RichTextEditor } from './RichTextEditor';

const PEOPLE = [
  { id: 'ih', label: 'Ingrid Haugen', detail: 'Control room operator' },
  { id: 'ms', label: 'Magnus Solberg', detail: 'Maintenance planner' },
];
const TAGS = [
  { id: 'a', label: '23-KA-9101', detail: '1st stage compressor' },
  { id: 'b', label: '23-KA-9103', detail: 'Recompressor' },
];

describe(RichTextEditor.name, () => {
  it('labels the text field', () => {
    renderEditor();

    expect(field()).toBeInTheDocument();
  });

  it('reports what is typed', async () => {
    const { onChange } = renderEditor();

    await userEvent.type(field(), 'Trip');

    expect(onChange).toHaveBeenLastCalledWith('Trip');
  });

  it('wraps the selection in bold from the toolbar', async () => {
    renderEditor({ defaultValue: 'Restart now' });
    select(0, 7);

    await userEvent.click(screen.getByRole('button', { name: 'Bold' }));

    expect(field()).toHaveValue('**Restart** now');
    expect([field().selectionStart, field().selectionEnd]).toEqual([2, 9]);
  });

  it('applies bold and italic with keyboard shortcuts', async () => {
    renderEditor({ defaultValue: 'Restart now' });
    select(0, 7);

    await userEvent.keyboard('{Control>}b{/Control}');
    expect(field()).toHaveValue('**Restart** now');
    await userEvent.keyboard('{Control>}i{/Control}');
    expect(field()).toHaveValue('**_Restart_** now');
  });

  it('opens the link form with Ctrl+K and inserts the link', async () => {
    renderEditor({ defaultValue: 'See procedure' });
    select(4, 13);

    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(screen.getByRole('textbox', { name: /Address/ }), 'https://docs.example.test/p{Enter}');

    expect(field()).toHaveValue('See [procedure](https://docs.example.test/p)');
  });

  it('continues a list on Enter and ends it on an empty item', async () => {
    renderEditor({ defaultValue: '1. Reset' });
    field().focus();

    await userEvent.keyboard('{Enter}Start');
    expect(field()).toHaveValue('1. Reset\n2. Start');
    await userEvent.keyboard('{Enter}{Enter}');
    expect(field()).toHaveValue('1. Reset\n2. Start\n');
  });

  it('indents a list item with Tab and outdents with Shift+Tab', async () => {
    renderEditor({ defaultValue: '- Valve' });
    field().focus();

    await userEvent.keyboard('{Tab}');
    expect(field()).toHaveValue('  - Valve');
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(field()).toHaveValue('- Valve');
  });

  it('lets Tab leave the field outside a list', async () => {
    renderEditor({ defaultValue: 'Plain' });
    field().focus();

    await userEvent.keyboard('{Tab}');

    expect(field()).not.toHaveFocus();
    expect(field()).toHaveValue('Plain');
  });

  it('undoes and redoes a command', async () => {
    renderEditor({ defaultValue: 'Seal gas' });
    field().focus();
    await userEvent.click(screen.getByRole('button', { name: 'Bullet list' }));
    expect(field()).toHaveValue('- Seal gas');

    await userEvent.keyboard('{Control>}z{/Control}');
    expect(field()).toHaveValue('Seal gas');
    await userEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(field()).toHaveValue('- Seal gas');
  });

  it('suggests people after @ and inserts the picked one with Enter', async () => {
    renderEditor();

    await userEvent.type(field(), 'Ask @ma');
    expect(screen.getByRole('option', { name: /Magnus Solberg/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('option', { name: /Ingrid Haugen/ })).not.toBeInTheDocument();
    await userEvent.keyboard('{Enter}');

    expect(field()).toHaveValue('Ask @Magnus Solberg ');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('moves through suggestions with the arrow keys', async () => {
    renderEditor();

    await userEvent.type(field(), '#');
    await userEvent.keyboard('{ArrowDown}{Enter}');

    expect(field()).toHaveValue('#23-KA-9103 ');
  });

  it('closes the suggestions on Escape without changing the text', async () => {
    renderEditor();

    await userEvent.type(field(), '@in');
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(field()).toHaveValue('@in');
  });

  it('starts a mention from the toolbar', async () => {
    renderEditor({ defaultValue: 'Ask' });
    field().focus();

    await userEvent.click(screen.getByRole('button', { name: 'Mention person' }));

    expect(field()).toHaveValue('Ask @');
    expect(screen.getByRole('listbox', { name: 'People' })).toBeInTheDocument();
  });

  it('switches to the preview and back', async () => {
    renderEditor({ defaultValue: '# Restart' });

    await userEvent.click(screen.getByRole('tab', { name: 'Preview' }));
    expect(screen.getByRole('heading', { name: 'Restart' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Shift note' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Split' }));
    expect(field()).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Restart' })).toBeInTheDocument();
  });

  it('shows guidance in the preview while the note is empty', () => {
    renderEditor({ defaultMode: 'split', guidance: 'Say what happened, what you did and what is left.' });

    expect(screen.getByText('Say what happened, what you did and what is left.')).toBeInTheDocument();
  });

  it('marks text past the hard limit as invalid and says what to do', () => {
    renderEditor({ defaultValue: 'abcdefghijkl', maxLength: 10 });

    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Shorten the text to 10 characters to save it.')).toBeInTheDocument();
  });

  it('hides the tools and blocks typing when read-only', async () => {
    renderEditor({ defaultValue: 'Signed off', readOnly: true, readOnlyReason: 'Signed off by Liv Wold' });

    await userEvent.type(field(), 'x');

    expect(field()).toHaveValue('Signed off');
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    expect(screen.getByText('Signed off by Liv Wold')).toBeInTheDocument();
  });

  it('turns everything off with the reason when disabled', () => {
    renderEditor({ disabledReason: 'Only the shift on duty can write to the log.' });

    expect(field()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();
    expect(field()).toHaveAccessibleDescription('Only the shift on duty can write to the log.');
  });

  it('hands the footer actions the text and a reset', async () => {
    const onPost = vi.fn();
    renderEditor({
      actions: (snapshot) => (
        <button
          type="button"
          disabled={!snapshot.valid}
          onClick={() => {
            onPost(snapshot.value);
            snapshot.reset();
          }}
        >
          Post comment
        </button>
      ),
    });
    expect(screen.getByRole('button', { name: 'Post comment' })).toBeDisabled();

    await userEvent.type(field(), 'Done');
    await userEvent.click(screen.getByRole('button', { name: 'Post comment' }));

    expect(onPost).toHaveBeenCalledWith('Done');
    expect(field()).toHaveValue('');
  });
});

function field(): HTMLTextAreaElement {
  const element = screen.getByRole('textbox', { name: 'Shift note' });
  if (!(element instanceof HTMLTextAreaElement)) throw new Error('Expected a textarea');
  return element;
}

function select(start: number, end: number) {
  field().focus();
  field().setSelectionRange(start, end);
  // The editor tracks the selection through the select event.
  field().dispatchEvent(new Event('select', { bubbles: true }));
}

function renderEditor(props: Partial<ComponentProps<typeof RichTextEditor>> = {}) {
  const onChange = vi.fn();
  render(
    <TooltipProvider>
      <RichTextEditor label="Shift note" people={PEOPLE} tags={TAGS} onChange={onChange} {...props} />
    </TooltipProvider>
  );
  return { onChange };
}
