import { render, screen } from '@testing-library/react';

import { StickyFooter } from './StickyFooter';

describe(StickyFooter.name, () => {
  it('groups the actions under an accessible name', () => {
    render(
      <StickyFooter>
        <button type="button">Cancel</button>
        <button type="button">Create work order</button>
      </StickyFooter>
    );

    const group = screen.getByRole('group', { name: 'Page actions' });
    expect(group).toContainElement(screen.getByRole('button', { name: 'Create work order' }));
  });

  it('shows the status at the start of the bar and announces changes', () => {
    render(
      <StickyFooter status="2 unsaved changes">
        <button type="button">Save changes</button>
      </StickyFooter>
    );

    expect(screen.getByText('2 unsaved changes')).toHaveAttribute('aria-live', 'polite');
  });

  it('sticks to the bottom of the scrolling region', () => {
    const { container } = render(
      <StickyFooter>
        <button type="button">Save changes</button>
      </StickyFooter>
    );

    expect(container.querySelector('[data-slot="sticky-footer"]')).toHaveClass('sticky', 'bottom-0', 'border-t');
  });

  it('lines its contents up with the width of the page', () => {
    render(
      <StickyFooter width="detail">
        <button type="button">Save changes</button>
      </StickyFooter>
    );

    expect(screen.getByRole('group').parentElement).toHaveClass('max-w-4xl');
  });
});
