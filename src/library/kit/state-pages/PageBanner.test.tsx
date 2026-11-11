import { render, screen } from '@testing-library/react';

import { PageBanner } from './PageBanner';

describe(PageBanner.name, () => {
  it('announces the state of the page with its explanation and way out', () => {
    render(
      <PageBanner title="Archived" tone="warning" action={<button type="button">Restore</button>}>
        This record is read only.
      </PageBanner>,
    );

    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent('Archived');
    expect(banner).toHaveTextContent('This record is read only.');
    expect(banner).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
  });
});
