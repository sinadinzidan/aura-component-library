import { render, screen } from '@testing-library/react';

import { ContentContainer } from './ContentContainer';

describe(ContentContainer.name, () => {
  it('caps a page at the wide dashboard width with page padding by default', () => {
    render(<ContentContainer>Page</ContentContainer>);

    expect(screen.getByText('Page')).toHaveClass('max-w-7xl', 'px-6', 'py-8', 'gap-6', 'mx-auto');
  });

  it.each([
    ['form', 'max-w-2xl'],
    ['detail', 'max-w-4xl'],
    ['full', 'max-w-none'],
  ] as const)('caps a %s page at %s', (width, className) => {
    render(<ContentContainer width={width}>Page</ContentContainer>);

    expect(screen.getByText('Page')).toHaveClass(className);
  });

  it('uses the mobile padding when compact', () => {
    render(<ContentContainer padding="compact">Page</ContentContainer>);

    expect(screen.getByText('Page')).toHaveClass('px-4', 'py-6');
  });

  it('drops the padding for flush panes', () => {
    render(<ContentContainer padding="none">Page</ContentContainer>);

    expect(screen.getByText('Page')).not.toHaveClass('px-6');
  });

  it('spaces form groups further apart', () => {
    render(<ContentContainer gap="groups">Page</ContentContainer>);

    expect(screen.getByText('Page')).toHaveClass('gap-8');
  });
});
