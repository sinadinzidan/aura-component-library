import { render, screen } from '@testing-library/react';

import { ReportHeader } from './ReportHeader';

const BASE = { kind: 'Daily production report', title: 'Thursday 12 March 2026', period: '12 Mar 2026, 00:00–24:00 UTC', site: 'Nordkapp gas processing', generated: '13 Mar 2026, 06:00 UTC' };

describe(ReportHeader.name, () => {
  it('states kind, title, period, site, generation time and document number', () => {
    render(<ReportHeader {...BASE} documentId="NK-DPR-2026-071" state={{ label: 'Approved', tone: 'success' }} />);

    expect(screen.getByRole('heading', { name: 'Thursday 12 March 2026' })).toBeInTheDocument();
    expect(screen.getByText('Daily production report')).toBeInTheDocument();
    expect(screen.getByText('Period').nextElementSibling).toHaveTextContent('12 Mar 2026, 00:00–24:00 UTC');
    expect(screen.getByText('Generated').nextElementSibling).toHaveTextContent('13 Mar 2026, 06:00 UTC');
    expect(screen.getByText('Document').nextElementSibling).toHaveTextContent('NK-DPR-2026-071');
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('repeats a short form on following pages', () => {
    render(<ReportHeader {...BASE} variant="running" documentId="NK-DPR-2026-071" />);

    expect(screen.getByRole('banner')).toHaveAttribute('data-variant', 'running');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Nordkapp gas processing · 12 Mar 2026, 00:00–24:00 UTC · NK-DPR-2026-071')).toBeInTheDocument();
  });

  it('fills a cover with the title and a lead', () => {
    render(<ReportHeader {...BASE} variant="cover" lead="The recompressor tripped on high vibration." />);

    expect(screen.getByRole('banner')).toHaveAttribute('data-variant', 'cover');
    expect(screen.getByText('The recompressor tripped on high vibration.')).toBeInTheDocument();
  });
});
