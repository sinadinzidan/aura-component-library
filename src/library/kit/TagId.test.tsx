import { render, screen } from '@testing-library/react';

import { TagId } from './TagId';

describe(TagId.name, () => {
  it('shows the tag as plain text by default', () => {
    render(<TagId>23-KA-9101</TagId>);

    expect(screen.getByText('23-KA-9101')).toHaveAttribute('data-variant', 'plain');
  });

  it('never asks for a monospace font', () => {
    render(<TagId variant="chip">23-KA-9101</TagId>);

    expect(screen.getByText('23-KA-9101').className).not.toMatch(/mono/);
  });

  it('leaves the figures to the context unless told', () => {
    const { rerender } = render(<TagId>23-KA-9101</TagId>);
    expect(screen.getByText('23-KA-9101')).not.toHaveAttribute('data-figures');

    rerender(<TagId figures="tabular">23-KA-9101</TagId>);
    expect(screen.getByText('23-KA-9101')).toHaveAttribute('data-figures', 'tabular');
  });
});
