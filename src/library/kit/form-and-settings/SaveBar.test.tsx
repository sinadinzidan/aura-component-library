import { render, screen } from '@testing-library/react';

import { SaveBar } from './SaveBar';

describe(SaveBar.name, () => {
  it('announces the form state and holds the actions', () => {
    render(<SaveBar message="3 unsaved changes" tone="warning" actions={<button type="button">Save changes</button>} />);

    expect(screen.getByRole('status')).toHaveTextContent('3 unsaved changes');
    expect(screen.getByRole('group', { name: 'Form actions' })).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('is neutral by default', () => {
    render(<SaveBar message="No changes" actions={<button type="button">Save</button>} />);

    expect(screen.getByRole('group', { name: 'Form actions' })).toHaveAttribute('data-tone', 'neutral');
  });
});
