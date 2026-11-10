import { render, screen } from '@testing-library/react';

import { ReportPage } from './ReportPage';

describe(ReportPage.name, () => {
  it('is an article named by its label with the content inside', () => {
    render(
      <ReportPage label="Daily production report, page 1">
        <p>Production met the plan.</p>
      </ReportPage>
    );

    const page = screen.getByRole('article', { name: 'Daily production report, page 1' });
    expect(page).toHaveTextContent('Production met the plan.');
    expect(page).toHaveAttribute('data-orientation', 'portrait');
    expect(page).toHaveClass('aspect-[210/297]');
  });

  it('switches proportions with the orientation', () => {
    const { rerender } = render(<ReportPage label="Page" orientation="landscape">content</ReportPage>);
    expect(screen.getByRole('article')).toHaveClass('aspect-[297/210]');

    rerender(<ReportPage label="Page" orientation="auto">content</ReportPage>);
    expect(screen.getByRole('article').className).not.toContain('aspect-');
  });

  it('places the header before the body and the footer after it', () => {
    const { container } = render(
      <ReportPage label="Page" header={<h3>Shift report</h3>} footer={<p>Page 1 of 2</p>}>
        <p>Body</p>
      </ReportPage>
    );

    const page = screen.getByRole('article');
    expect(page.firstElementChild).toHaveTextContent('Shift report');
    expect(container.querySelector('[data-slot="report-body"]')).toHaveTextContent('Body');
    expect(page.lastElementChild).toHaveTextContent('Page 1 of 2');
  });

  it('leaves the footer out when not given', () => {
    const { container } = render(<ReportPage label="Page">content</ReportPage>);

    expect(container.querySelector('[data-slot="report-footer"]')).toBeNull();
  });
});
