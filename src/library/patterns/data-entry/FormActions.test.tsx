import { render, screen } from '@testing-library/react';

import { FormActions } from './FormActions';

describe(FormActions.name, () => {
  it('groups the buttons under an accessible name', () => {
    render(
      <FormActions label="Work order actions">
        <button type="button">Cancel</button>
        <button type="submit">Create work order</button>
      </FormActions>
    );

    const group = screen.getByRole('group', { name: 'Work order actions' });
    expect(group).toContainElement(screen.getByRole('button', { name: 'Create work order' }));
  });

  it('announces the status politely', () => {
    render(
      <FormActions status="2 unsaved changes">
        <button type="submit">Save changes</button>
      </FormActions>
    );

    expect(screen.getByText('2 unsaved changes')).toHaveAttribute('aria-live', 'polite');
  });

  it('puts the status after the buttons when the actions start the row', () => {
    const { container } = render(
      <FormActions align="start" status="Saved 2 min ago">
        <button type="submit">Save changes</button>
      </FormActions>
    );

    expect(container.firstElementChild?.firstElementChild).toHaveAttribute('role', 'group');
  });

  it('marks a sticky footer', () => {
    const { container } = render(
      <FormActions sticky>
        <button type="submit">Save changes</button>
      </FormActions>
    );

    expect(container.firstElementChild).toHaveAttribute('data-sticky', 'true');
  });
});
