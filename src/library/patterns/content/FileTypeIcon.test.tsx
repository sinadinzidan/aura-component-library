import { render, screen } from '@testing-library/react';

import { FileTypeIcon } from './FileTypeIcon';

describe(FileTypeIcon.name, () => {
  it('names the file type for assistive technology', () => {
    render(<FileTypeIcon kind="pdf" />);

    expect(screen.getByRole('img', { name: 'PDF' })).toBeInTheDocument();
  });

  it('uses a custom label when given', () => {
    render(<FileTypeIcon kind="drawing" label="P&ID drawing" />);

    expect(screen.getByRole('img', { name: 'P&ID drawing' })).toBeInTheDocument();
  });

  it('is neutral unless tinted', () => {
    const { rerender } = render(<FileTypeIcon kind="spreadsheet" />);
    expect(screen.getByRole('img')).toHaveClass('bg-medium-background');

    rerender(<FileTypeIcon kind="spreadsheet" tinted />);

    expect(screen.getByRole('img')).toHaveClass('bg-decorative-3-background');
  });

  it('keeps unknown files neutral even when tinted', () => {
    render(<FileTypeIcon kind="other" tinted />);

    expect(screen.getByRole('img', { name: 'File' })).toHaveClass('bg-medium-background');
  });
});
