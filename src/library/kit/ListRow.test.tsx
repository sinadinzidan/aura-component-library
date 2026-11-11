import { render, screen } from '@testing-library/react';

import { ListRow } from './ListRow';

describe(ListRow.name, () => {
  it('renders title, meta, leading and trailing content in a list item', () => {
    render(
      <ul>
        <ListRow title="Discharge temperature high" meta="23-TT-92532" leading={<span>!</span>} trailing="38 min ago" tone="warning" />
      </ul>
    );

    const row = screen.getByRole('listitem');
    expect(row).toHaveTextContent('Discharge temperature high');
    expect(row).toHaveTextContent('23-TT-92532');
    expect(row).toHaveTextContent('38 min ago');
    expect(row).toHaveAttribute('data-tone', 'warning');
  });
});
