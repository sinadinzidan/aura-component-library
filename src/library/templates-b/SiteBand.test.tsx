import { render, screen } from '@testing-library/react';

import { SiteBand } from './SiteBand';

describe(SiteBand.name, () => {
  it('is a named region when given a label', () => {
    render(<SiteBand label="Features">Content</SiteBand>);

    expect(screen.getByRole('region', { name: 'Features' })).toHaveTextContent('Content');
  });

  it('tints the full width on the muted surface', () => {
    const { container } = render(<SiteBand surface="muted">Content</SiteBand>);

    const band = container.querySelector('[data-slot="site-band"]');
    expect(band).toHaveAttribute('data-surface', 'muted');
    expect(band).toHaveClass('bg-muted-background');
  });

  it('caps the content at the chosen width with the chosen spacing', () => {
    render(
      <SiteBand width="md" spacing="lg">
        <p>Content</p>
      </SiteBand>
    );

    expect(screen.getByText('Content').parentElement).toHaveClass('max-w-3xl', 'py-16');
  });

  it('draws a rule above the band on request', () => {
    const { container } = render(<SiteBand divider>Content</SiteBand>);

    expect(container.querySelector('[data-slot="site-band"]')).toHaveClass('border-t');
  });
});
