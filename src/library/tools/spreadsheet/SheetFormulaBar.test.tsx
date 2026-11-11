import { render, screen } from '@testing-library/react';

import { SheetFormulaBar } from './SheetFormulaBar';

describe(SheetFormulaBar.name, () => {
  it('shows the address and the raw content', () => {
    render(<SheetFormulaBar cell="C4" content="=SUM(C2:C3)" result="67.0" />);

    expect(screen.getByText('C4')).toBeInTheDocument();
    expect(screen.getByLabelText('Content of C4')).toHaveTextContent('=SUM(C2:C3)');
    expect(screen.getByText('= 67.0')).toBeInTheDocument();
  });

  it('says when the cell is empty', () => {
    render(<SheetFormulaBar cell="A1" content="" />);

    expect(screen.getByLabelText('Content of A1')).toHaveTextContent('Empty');
  });
});
