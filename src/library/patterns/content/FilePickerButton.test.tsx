import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FilePickerButton } from './FilePickerButton';

const pdf = () => new File(['%PDF'], 'P&ID rev C.pdf', { type: 'application/pdf' });

describe(FilePickerButton.name, () => {
  it('opens the file dialog from the button', async () => {
    render(<FilePickerButton onFiles={vi.fn()}>Upload file</FilePickerButton>);
    const input = screen.getByLabelText('Choose files');
    const click = vi.fn();
    input.addEventListener('click', click);

    await userEvent.click(screen.getByRole('button', { name: 'Upload file' }));

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('passes the picked files on', () => {
    const onFiles = vi.fn();
    render(<FilePickerButton onFiles={onFiles}>Upload file</FilePickerButton>);
    const file = pdf();

    fireEvent.change(screen.getByLabelText('Choose files'), { target: { files: [file] } });

    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it('does not call back when the dialog is dismissed', () => {
    const onFiles = vi.fn();
    render(<FilePickerButton onFiles={onFiles}>Upload file</FilePickerButton>);

    fireEvent.change(screen.getByLabelText('Choose files'), { target: { files: [] } });

    expect(onFiles).not.toHaveBeenCalled();
  });

  it('forwards the accepted types and the multiple flag to the input', () => {
    render(
      <FilePickerButton onFiles={vi.fn()} accept=".pdf,.dwg" multiple inputLabel="Choose drawings">
        Upload drawings
      </FilePickerButton>
    );

    const input = screen.getByLabelText('Choose drawings');
    expect(input).toHaveAttribute('accept', '.pdf,.dwg');
    expect(input).toHaveAttribute('multiple');
  });

  it('disables the button and the input together', () => {
    render(
      <FilePickerButton onFiles={vi.fn()} disabled>
        Upload file
      </FilePickerButton>
    );

    expect(screen.getByRole('button', { name: 'Upload file' })).toBeDisabled();
    expect(screen.getByLabelText('Choose files')).toBeDisabled();
  });
});
