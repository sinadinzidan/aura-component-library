import { fireEvent, render, screen } from '@testing-library/react';

import { DropZone } from './DropZone';

const file = (name: string) => new File(['x'], name);

describe(DropZone.name, () => {
  it('is a named group described by its hint', () => {
    render(<DropZone label="Upload drawings" hint="PDF or DWG, up to 100 MB each" onFiles={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Upload drawings' })).toHaveAccessibleDescription('PDF or DWG, up to 100 MB each');
  });

  it('hands dropped files to the caller', () => {
    const onFiles = vi.fn();
    render(<DropZone label="Upload drawings" onFiles={onFiles} />);
    const files = [file('a.pdf'), file('b.dwg')];

    fireEvent.drop(screen.getByRole('group'), { dataTransfer: { files } });

    expect(onFiles).toHaveBeenCalledWith(files);
  });

  it('keeps only the first dropped file when single', () => {
    const onFiles = vi.fn();
    render(<DropZone label="Replace drawing" multiple={false} onFiles={onFiles} />);
    const files = [file('a.pdf'), file('b.dwg')];

    fireEvent.drop(screen.getByRole('group'), { dataTransfer: { files } });

    expect(onFiles).toHaveBeenCalledWith([files[0]]);
  });

  it('shows that a drag is over it and resets when the drag leaves', () => {
    render(<DropZone label="Upload drawings" onFiles={vi.fn()} />);
    const zone = screen.getByRole('group');

    fireEvent.dragEnter(zone, { dataTransfer: { files: [] } });
    expect(screen.getByText('Release to upload')).toBeInTheDocument();

    fireEvent.dragLeave(zone, { relatedTarget: document.body });
    expect(screen.getByText('Drop files here')).toBeInTheDocument();
  });

  it('stays in the drag-over state while the pointer moves over its own content', () => {
    render(<DropZone label="Upload drawings" onFiles={vi.fn()} />);
    const zone = screen.getByRole('group');
    fireEvent.dragEnter(zone, { dataTransfer: { files: [] } });

    fireEvent.dragLeave(zone, { relatedTarget: screen.getByRole('button', { name: 'Browse files' }) });

    expect(screen.getByText('Release to upload')).toBeInTheDocument();
  });

  it('passes files picked with the button', () => {
    const onFiles = vi.fn();
    render(<DropZone label="Upload drawings" onFiles={onFiles} />);
    const picked = file('a.pdf');

    fireEvent.change(screen.getByLabelText('Browse files for Upload drawings'), { target: { files: [picked] } });

    expect(onFiles).toHaveBeenCalledWith([picked]);
  });

  it('ignores drops and says why while disabled', () => {
    const onFiles = vi.fn();
    render(
      <DropZone
        label="Upload drawings"
        hint="PDF or DWG"
        disabled
        disabledReason="You need write access to Engineering documents."
        onFiles={onFiles}
      />
    );
    const zone = screen.getByRole('group');

    fireEvent.dragEnter(zone, { dataTransfer: { files: [] } });
    fireEvent.drop(zone, { dataTransfer: { files: [file('a.pdf')] } });

    expect(onFiles).not.toHaveBeenCalled();
    expect(zone).toHaveAccessibleDescription('You need write access to Engineering documents.');
    expect(screen.queryByText('Release to upload')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse files' })).toBeDisabled();
  });

  it('can be forced into the drag-over look', () => {
    render(<DropZone label="Upload drawings" dragging onFiles={vi.fn()} />);

    expect(screen.getByRole('group')).toHaveAttribute('data-dragging', 'true');
  });
});
