import { render, screen } from '@testing-library/react';

import { EmptyPanel } from './EmptyPanel';

describe(EmptyPanel.name, () => {
  it('explains the empty state and offers its action', () => {
    render(<EmptyPanel title="No notes for this shift" description="Notes appear here." action={<button type="button">Add a note</button>} />);

    expect(screen.getByText('No notes for this shift')).toBeInTheDocument();
    expect(screen.getByText('Notes appear here.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add a note' })).toBeInTheDocument();
  });
});
