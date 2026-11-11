import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EditorToolbar } from './EditorToolbar';

describe(EditorToolbar.name, () => {
  it('offers only the way into editing in view mode', async () => {
    const onModeChange = vi.fn();
    render(<EditorToolbar title="Gas compression" mode="view" onModeChange={onModeChange} onUndo={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit dashboard' }));

    expect(onModeChange).toHaveBeenCalledWith('edit');
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('shows the editing tools in edit mode', () => {
    render(<EditorToolbar title="Gas compression" mode="edit" onModeChange={vi.fn()} onReset={vi.fn()} onTogglePalette={vi.fn()} />);

    expect(screen.getByRole('toolbar', { name: 'Dashboard editing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset layout' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add widget' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('disables undo and redo with a reason until there is history', () => {
    render(<EditorToolbar title="Gas compression" mode="edit" onModeChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Nothing to undo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Nothing to redo' })).toBeDisabled();
  });

  it('undoes and redoes', async () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    render(<EditorToolbar title="Gas compression" mode="edit" onModeChange={vi.fn()} canUndo canRedo onUndo={onUndo} onRedo={onRedo} />);

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Redo' }));

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('leaves edit mode from the primary button', async () => {
    const onModeChange = vi.fn();
    render(<EditorToolbar title="Gas compression" mode="edit" onModeChange={onModeChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Done editing' }));

    expect(onModeChange).toHaveBeenCalledWith('view');
  });

  it('replaces the edit button with the reason when read-only', () => {
    render(<EditorToolbar title="Gas compression" mode="edit" onModeChange={vi.fn()} readOnlyReason="Shared by Liv Wold. Ask her for edit access." />);

    expect(screen.getByText('Shared by Liv Wold. Ask her for edit access.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
