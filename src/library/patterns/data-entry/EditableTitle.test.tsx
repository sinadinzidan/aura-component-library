import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { EditableTitle } from './EditableTitle';

describe(EditableTitle.name, () => {
  it('shows the title as a heading until renaming starts', () => {
    renderTitle({});

    expect(screen.getByRole('heading', { name: 'Compressor overview' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('opens a focused input with the current title', async () => {
    renderTitle({});

    await userEvent.click(screen.getByRole('button', { name: 'Rename dashboard' }));

    const input = screen.getByRole('textbox', { name: 'Name of the dashboard' });
    expect(input).toHaveValue('Compressor overview');
    expect(input).toHaveFocus();
  });

  it('saves the trimmed title on Enter and returns focus to the rename button', async () => {
    const onSave = vi.fn();
    renderTitle({ onSave });
    await userEvent.click(screen.getByRole('button', { name: 'Rename dashboard' }));

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), ' Gas compression {Enter}');

    expect(onSave).toHaveBeenCalledWith('Gas compression');
    expect(screen.getByRole('button', { name: 'Rename dashboard' })).toHaveFocus();
  });

  it('saves when focus leaves the field', async () => {
    const onSave = vi.fn();
    renderTitle({ onSave });
    await userEvent.click(screen.getByRole('button', { name: 'Rename dashboard' }));
    await userEvent.type(screen.getByRole('textbox'), ' 2');

    await userEvent.tab();

    expect(onSave).toHaveBeenCalledWith('Compressor overview 2');
  });

  it('discards the draft on Escape', async () => {
    const onSave = vi.fn();
    renderTitle({ onSave });
    await userEvent.click(screen.getByRole('button', { name: 'Rename dashboard' }));

    await userEvent.type(screen.getByRole('textbox'), ' draft{Escape}');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Compressor overview' })).toBeInTheDocument();
  });

  it('refuses an empty title with a reason', async () => {
    const onSave = vi.fn();
    renderTitle({ onSave });
    await userEvent.click(screen.getByRole('button', { name: 'Rename dashboard' }));

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.keyboard('{Enter}');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a name for the dashboard.');
  });

  it('refuses a title the caller rejects', async () => {
    const onSave = vi.fn();
    renderTitle({ onSave, validate: (title) => (title === 'Taken' ? 'A dashboard with this name exists.' : null) });
    await userEvent.click(screen.getByRole('button', { name: 'Rename dashboard' }));

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'Taken{Enter}');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('A dashboard with this name exists.');
  });
});

function renderTitle(overrides: Partial<ComponentProps<typeof EditableTitle>>) {
  return render(
    <TooltipProvider>
      <EditableTitle value="Compressor overview" label="dashboard" onSave={vi.fn()} {...overrides} />
    </TooltipProvider>
  );
}
