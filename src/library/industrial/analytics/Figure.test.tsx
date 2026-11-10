import { render, screen } from '@testing-library/react';

import { Figure } from './Figure';

describe(Figure.name, () => {
  it('numbers the caption and wraps the content in a figure', () => {
    render(
      <Figure number={2} caption="Gas export against plan." source="Source: 27-FT-20011">
        <p>chart</p>
      </Figure>
    );

    const figure = screen.getByRole('figure');
    expect(figure).toHaveTextContent('Figure 2. Gas export against plan.');
    expect(figure).toHaveTextContent('Source: 27-FT-20011');
    expect(figure).toHaveTextContent('chart');
  });

  it('puts a figure caption below and a table caption above', () => {
    const { container, rerender } = render(<Figure number={1} caption="Trend."><p>content</p></Figure>);
    expect(container.querySelector('figure')?.lastElementChild).toHaveAttribute('data-slot', 'figure-caption');

    rerender(<Figure number={1} kind="Table" caption="Totals."><p>content</p></Figure>);
    expect(container.querySelector('figure')?.firstElementChild).toHaveAttribute('data-slot', 'figure-caption');
    expect(screen.getByText('Table 1.')).toBeInTheDocument();
  });

  it('lets the caption side be set', () => {
    const { container } = render(<Figure number={1} caption="Trend." captionSide="top"><p>content</p></Figure>);

    expect(container.querySelector('figure')?.firstElementChild).toHaveAttribute('data-slot', 'figure-caption');
  });
});
