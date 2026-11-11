import { render, screen } from '@testing-library/react';

import { PersonChip } from './PersonChip';

describe(PersonChip.name, () => {
  it('shows initials, name and role', () => {
    render(<PersonChip name="Ingrid Haugen" initials="IH" role="Control room operator" tone="teal" />);

    expect(screen.getByText('IH')).toHaveAttribute('data-tone', 'teal');
    expect(screen.getByText('Ingrid Haugen')).toBeVisible();
    expect(screen.getByText('Control room operator')).toBeInTheDocument();
  });

  it('keeps the name for assistive technology when compact', () => {
    render(<PersonChip name="Ingrid Haugen" initials="IH" role="Control room operator" compact />);

    expect(screen.getByText('Ingrid Haugen')).toHaveClass('sr-only');
    expect(screen.queryByText('Control room operator')).toBeNull();
  });
});
