import { render, screen } from '@testing-library/react';

import { PagePreview } from './PagePreview';

describe(PagePreview.name, () => {
  it('is an image named by what it stands for', () => {
    render(<PagePreview label="First page of the bearing inspection procedure" />);

    expect(
      screen.getByRole('img', {
        name: 'First page of the bearing inspection procedure',
      })
    ).toBeInTheDocument();
  });

  it('defaults to a portrait text page', () => {
    render(<PagePreview label="Procedure" />);

    const page = screen.getByRole('img');
    expect(page).toHaveAttribute('data-variant', 'text');
    expect(page).toHaveClass('aspect-[3/4]');
  });

  it('draws a landscape sheet for drawings', () => {
    render(<PagePreview label="P&ID" variant="drawing" orientation="landscape" />);

    const page = screen.getByRole('img');
    expect(page).toHaveClass('aspect-[4/3]');
    expect(page.querySelector('svg')).not.toBeNull();
  });

  it.each(['table', 'image'] as const)('renders the %s variant', (variant) => {
    render(<PagePreview label="Preview" variant={variant} />);

    expect(screen.getByRole('img')).toHaveAttribute('data-variant', variant);
  });
});
