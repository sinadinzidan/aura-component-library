import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { ReportPage } from './ReportPage';

describe(ReportPage.name, () => {
  it('renders header, body and a running footer with the page count', () => {
    render(
      <ReportPage label="Daily production report, page 1" header={<h2>Daily production report</h2>} footer={{ left: 'NK-DPR-2026-071', center: 'Nordkapp gas processing', page: 1, of: 3 }}>
        <p>Export averaged 4.33 MSm³/d.</p>
      </ReportPage>,
    );

    const sheet = screen.getByRole('article', { name: 'Daily production report, page 1' });
    expect(sheet).toHaveAttribute('data-size', 'a4');
    expect(sheet).toHaveStyle({ aspectRatio: '210 / 297' });
    expect(screen.getByRole('heading', { name: 'Daily production report' })).toBeInTheDocument();
    expect(screen.getByText('NK-DPR-2026-071')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('hugs its content when asked and frames the sheet on a blueprint', () => {
    const { container } = render(
      <LookScope look="blueprint">
        <ReportPage label="Sheet" size="auto">
          Body
        </ReportPage>
      </LookScope>,
    );

    const sheet = screen.getByRole('article', { name: 'Sheet' });
    expect(sheet.style.aspectRatio).toBe('');
    expect(sheet).toHaveAttribute('data-look', 'blueprint');
    expect(container.querySelectorAll('article > span[aria-hidden="true"]')).toHaveLength(4);
  });
});
