import { render, screen } from '@testing-library/react';

import { BrandMark } from './BrandMark';

describe(BrandMark.name, () => {
  it('shows the name with its initial as a decorative mark', () => {
    const { container } = render(<BrandMark name="Nordkapp" />);

    expect(screen.getByText('Nordkapp')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('N');
  });

  it('appends a quiet section word', () => {
    render(<BrandMark name="Nordkapp" section="Docs" />);

    expect(screen.getByText('Docs')).toBeInTheDocument();
  });

  it('uses an icon in place of the initial', () => {
    const { container } = render(<BrandMark name="Nordkapp" icon={<svg data-testid="icon" />} />);

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toHaveTextContent('N');
  });

  it('keeps the name for screen readers when only the mark is shown', () => {
    render(<BrandMark name="Nordkapp" markOnly />);

    expect(screen.getByText('Nordkapp')).toHaveClass('sr-only');
  });
});
