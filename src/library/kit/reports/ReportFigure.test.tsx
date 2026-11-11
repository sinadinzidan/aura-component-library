import { render, screen } from '@testing-library/react';

import { ReportFigure } from './ReportFigure';

describe(ReportFigure.name, () => {
  it('numbers a figure and puts its caption after the content', () => {
    render(
      <ReportFigure number={2} caption="Export recovered within 40 minutes." source="Nordkapp historian">
        <div>chart</div>
      </ReportFigure>,
    );

    const figure = screen.getByRole('figure');
    expect(figure).toHaveTextContent('Figure 2. Export recovered within 40 minutes.');
    expect(figure).toHaveTextContent('Source: Nordkapp historian');
    expect(figure.lastElementChild?.tagName).toBe('FIGCAPTION');
  });

  it('puts a table caption above the table', () => {
    render(
      <ReportFigure kind="Table" number={1} caption="Key figures.">
        <div>table</div>
      </ReportFigure>,
    );

    expect(screen.getByRole('figure').firstElementChild?.tagName).toBe('FIGCAPTION');
    expect(screen.getByText('Table 1.')).toBeInTheDocument();
  });
});
