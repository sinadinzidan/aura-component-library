import { render, screen } from '@testing-library/react';

import { Grid } from './Grid';

describe(Grid.name, () => {
  it('lays children out on twelve columns by default', () => {
    render(<Grid>Cells</Grid>);

    expect(screen.getByText('Cells')).toHaveClass('kit-grid');
    expect(screen.getByText('Cells').style.gridTemplateColumns).toBe('repeat(12, minmax(0, 1fr))');
  });

  it('stacks children when asked', () => {
    render(<Grid stack>Cells</Grid>);

    expect(screen.getByText('Cells')).toHaveClass('kit-stack');
  });
});
