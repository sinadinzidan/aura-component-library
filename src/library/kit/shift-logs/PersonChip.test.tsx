import { render, screen } from '@testing-library/react';

import { PersonChip } from './PersonChip';

describe(PersonChip.name, () => {
  it('shows initials and is named after the person', () => {
    render(<PersonChip name="Ingrid Haugen" tone="blue" />);

    expect(screen.getByRole('img', { name: 'Ingrid Haugen' })).toHaveTextContent('IH');
  });
});
