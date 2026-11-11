import { render, screen } from '@testing-library/react';

import { SelectionBar } from './SelectionBar';

describe(SelectionBar.name, () => {
  it('announces how many records are selected, in the plural', () => {
    render(<SelectionBar count={3} noun={['work order', 'work orders']} actions={<button type="button">Assign</button>} />);

    expect(screen.getByRole('status')).toHaveTextContent('3 work orders selected');
    expect(screen.getByRole('button', { name: 'Assign' })).toBeInTheDocument();
  });

  it('uses the singular for one record', () => {
    render(<SelectionBar count={1} noun={['work order', 'work orders']} />);

    expect(screen.getByRole('status')).toHaveTextContent('1 work order selected');
  });
});
