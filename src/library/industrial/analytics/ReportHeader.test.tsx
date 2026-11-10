import { render, screen } from '@testing-library/react';

import { ReportHeader } from './ReportHeader';

const PROPS = {
  title: 'Daily production report',
  period: '11 March 2026',
  site: 'Nordkapp',
  generatedAt: '12 Mar 2026, 06:15 UTC',
};

describe(ReportHeader.name, () => {
  it('shows the title with period, site and generation time as labelled fields', () => {
    render(<ReportHeader {...PROPS} overline="Operations report" />);

    expect(screen.getByRole('heading', { name: 'Daily production report' })).toBeInTheDocument();
    expect(screen.getByText('Operations report')).toBeInTheDocument();
    expect(screen.getByText('Period').nextElementSibling).toHaveTextContent('11 March 2026');
    expect(screen.getByText('Site').nextElementSibling).toHaveTextContent('Nordkapp');
    expect(screen.getByText('Generated').nextElementSibling).toHaveTextContent('12 Mar 2026, 06:15 UTC');
  });

  it('leaves out fields that are not given', () => {
    render(<ReportHeader title="Shift report" site="Nordkapp" />);

    expect(screen.queryByText('Period')).not.toBeInTheDocument();
    expect(screen.queryByText('Document')).not.toBeInTheDocument();
  });

  it('prints the document number in monospace and the author', () => {
    render(<ReportHeader {...PROPS} documentId="NK-RPT-2026-0311" author="Liv Wold" />);

    expect(screen.getByText('NK-RPT-2026-0311')).toHaveClass('font-mono');
    expect(screen.getByText('Prepared by').nextElementSibling).toHaveTextContent('Liv Wold');
  });

  it('renders a status mark beside the title', () => {
    render(<ReportHeader {...PROPS} status={<span>Draft</span>} />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('collapses to one running line in the compact variant', () => {
    const { container } = render(<ReportHeader {...PROPS} documentId="NK-RPT-2026-0311" variant="compact" />);

    expect(container.querySelector('[data-variant="compact"]')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Nordkapp · 11 March 2026 · NK-RPT-2026-0311')).toBeInTheDocument();
  });

  it('uses a larger title on a cover', () => {
    render(<ReportHeader {...PROPS} variant="cover" />);

    expect(screen.getByRole('heading', { name: 'Daily production report' })).toHaveClass('text-4xl');
  });
});
