import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FormatToolbar } from './FormatToolbar';
import { LengthCounter } from './LengthCounter';
import { LinkPopover } from './LinkPopover';
import { RichTextPreview } from './RichTextPreview';
import { SuggestionList } from './SuggestionList';
import { ToolButton } from './ToolButton';

function submitForm(): HTMLElement {
  const form = screen.getByRole('textbox', { name: /Address/ }).closest('form');
  if (!form) throw new Error('Expected the link form');
  return form;
}

describe(ToolButton.name, () => {
  it('is named by its label and runs its action', async () => {
    const onClick = vi.fn();
    render(
      <TooltipProvider>
        <ToolButton label="Bold" shortcut="Ctrl+B" onClick={onClick}>
          <svg aria-hidden="true" />
        </ToolButton>
      </TooltipProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Bold' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('reports a toggle state only when it is a toggle', () => {
    render(
      <TooltipProvider>
        <ToolButton label="Bold" pressed>
          <svg aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Rule">
          <svg aria-hidden="true" />
        </ToolButton>
      </TooltipProvider>
    );

    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Rule' })).not.toHaveAttribute('aria-pressed');
  });
});

describe(FormatToolbar.name, () => {
  const renderToolbar = (props: Partial<Parameters<typeof FormatToolbar>[0]> = {}) => {
    const onCommand = vi.fn();
    render(
      <TooltipProvider>
        <FormatToolbar onCommand={onCommand} {...props} />
      </TooltipProvider>
    );
    return { onCommand };
  };

  it('sends the command of the pressed button', async () => {
    const { onCommand } = renderToolbar();

    await userEvent.click(screen.getByRole('button', { name: 'Numbered list' }));

    expect(onCommand).toHaveBeenCalledWith('numbered');
  });

  it('shows the formats at the caret as pressed', () => {
    renderToolbar({ active: { bold: true, italic: false, code: false, heading: 2, list: 'bullet', quote: false } });

    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Heading 2' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Bullet list' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('leaves document tools out of the compact variant', () => {
    renderToolbar({ variant: 'compact' });

    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Heading 1' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Code block' })).not.toBeInTheDocument();
  });

  it('hides undo, link and lookups unless asked for', () => {
    renderToolbar({ lookups: false });

    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Insert link' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mention person' })).not.toBeInTheDocument();
  });

  it('disables undo and redo when there is nothing to step to', () => {
    renderToolbar({ onUndo: vi.fn(), onRedo: vi.fn(), canUndo: true, canRedo: false });

    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();
  });

  it('is one tab stop and moves between buttons with the arrow keys', async () => {
    renderToolbar({ variant: 'compact', lookups: false });
    const toolbar = screen.getByRole('toolbar', { name: 'Formatting' });
    expect(within(toolbar).getAllByRole('button').filter((button) => button.tabIndex === 0)).toHaveLength(1);

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Quote' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
  });

  it('disables every button when disabled', () => {
    renderToolbar({ disabled: true });

    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
  });
});

describe(LinkPopover.name, () => {
  const renderPopover = (selectedText = '') => {
    const onInsert = vi.fn();
    render(
      <TooltipProvider>
        <LinkPopover selectedText={selectedText} onInsert={onInsert} />
      </TooltipProvider>
    );
    return { onInsert };
  };

  it('stays closed until its button is pressed', () => {
    renderPopover();

    expect(screen.queryByRole('textbox', { name: /Address/ })).not.toBeInTheDocument();
  });

  it('offers the selected text as the link text', async () => {
    renderPopover('restart procedure');

    await userEvent.click(screen.getByRole('button', { name: 'Insert link' }));

    expect(screen.getByRole('textbox', { name: 'Text' })).toHaveValue('restart procedure');
  });

  it('inserts a valid link and closes', async () => {
    const { onInsert } = renderPopover('restart procedure');
    await userEvent.click(screen.getByRole('button', { name: 'Insert link' }));

    await userEvent.type(screen.getByRole('textbox', { name: /Address/ }), 'https://docs.example.test/restart');
    await userEvent.click(within(submitForm()).getByRole('button', { name: 'Insert link' }));

    expect(onInsert).toHaveBeenCalledWith({ text: 'restart procedure', url: 'https://docs.example.test/restart' });
    expect(screen.queryByRole('textbox', { name: /Address/ })).not.toBeInTheDocument();
  });

  it('refuses an address that is not https and says why', async () => {
    const { onInsert } = renderPopover();
    await userEvent.click(screen.getByRole('button', { name: 'Insert link' }));

    await userEvent.type(screen.getByRole('textbox', { name: /Address/ }), 'javascript:alert(1){Enter}');

    expect(onInsert).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: /Address/ })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter a full address that starts with https://')).toBeInTheDocument();
  });
});

describe(SuggestionList.name, () => {
  const people = [
    { id: 'ih', label: 'Ingrid Haugen', detail: 'Control room operator' },
    { id: 'ms', label: 'Magnus Solberg', detail: 'Maintenance planner' },
  ];

  it('marks the active row as selected', () => {
    render(<SuggestionList id="s" label="People" suggestions={people} activeIndex={1} onPick={vi.fn()} />);

    expect(screen.getByRole('option', { name: /Magnus Solberg/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: /Ingrid Haugen/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('picks a row on pointer down', async () => {
    const onPick = vi.fn();
    render(<SuggestionList id="s" label="People" suggestions={people} activeIndex={0} onPick={onPick} />);

    await userEvent.click(screen.getByRole('option', { name: /Magnus Solberg/ }));

    expect(onPick).toHaveBeenCalledWith(people[1]);
  });

  it('says so when nothing matches', () => {
    render(<SuggestionList id="s" label="People" suggestions={[]} activeIndex={0} onPick={vi.fn()} emptyText="No one by that name" />);

    expect(screen.getByText('No one by that name')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe(LengthCounter.name, () => {
  it('counts words and characters', () => {
    render(<LengthCounter text="Recompressor tripped" />);

    expect(screen.getByText('2 words')).toBeInTheDocument();
    expect(screen.getByText('20 characters')).toBeInTheDocument();
  });

  it('warns in words past the soft limit', () => {
    const { container } = render(<LengthCounter text="abcdef" soft={5} max={10} />);

    expect(container.querySelector('[data-slot="length-counter"]')).toHaveAttribute('data-status', 'near');
    expect(screen.getByText(/Getting long/)).toBeInTheDocument();
  });

  it('says by how much the hard limit is passed', () => {
    render(<LengthCounter text="abcdefghijkl" max={10} words={false} />);

    expect(screen.getByText(/Too long/)).toBeInTheDocument();
    expect(screen.getByText(/12 \/ 10 characters, 2 over/)).toBeInTheDocument();
    expect(screen.queryByText(/words/)).not.toBeInTheDocument();
  });
});

describe(RichTextPreview.name, () => {
  it('renders headings one level down, so a note never owns the page title', () => {
    render(<RichTextPreview source={'# Restart\n## Before start'} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Restart' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Before start' })).toBeInTheDocument();
  });

  it('renders check items with their state in words', () => {
    render(<RichTextPreview source={'- [x] Permit closed\n- [ ] Trip reset'} />);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Done: Permit closed');
    expect(items[1]).toHaveTextContent('To do: Trip reset');
  });

  it('nests lists', () => {
    render(<RichTextPreview source={'- Valve\n  - Opening'} />);

    expect(within(screen.getAllByRole('listitem')[0]).getByRole('list')).toHaveTextContent('Opening');
  });

  it('renders safe links, mentions and tags', () => {
    const { container } = render(
      <RichTextPreview source="Ask @Aisha Khan about #23-KA-9103, see [the report](https://docs.example.test/r)." mentions={['Aisha Khan']} />
    );

    expect(screen.getByRole('link', { name: 'the report' })).toHaveAttribute('href', 'https://docs.example.test/r');
    expect(container.querySelector('[data-slot="mention"]')).toHaveTextContent('@Aisha Khan');
    expect(container.querySelector('[data-slot="tag"]')).toHaveTextContent('#23-KA-9103');
  });

  it('never turns typed markup into elements', () => {
    const { container } = render(<RichTextPreview source={'<img src=x onerror=alert(1)> and [x](javascript:alert(1))'} />);

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
  });

  it('shows the empty text for an empty note', () => {
    render(<RichTextPreview source="  " emptyText="Nothing written yet." />);

    expect(screen.getByText('Nothing written yet.')).toBeInTheDocument();
  });
});
