import { render, screen } from '@testing-library/react';

import { AlertDialogHeader } from './AlertDialogHeader';

describe(AlertDialogHeader.name, () => {
  it('renders its children in the header slot', () => {
    render(<AlertDialogHeader>Stop compressor?</AlertDialogHeader>);

    expect(screen.getByText('Stop compressor?')).toHaveAttribute('data-slot', 'alert-dialog-header');
  });
});
