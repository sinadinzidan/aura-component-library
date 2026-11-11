import { render, screen } from '@testing-library/react';

import { ReportSection } from './ReportSection';

describe(ReportSection.name, () => {
  it('numbers the heading and renders the body', () => {
    render(
      <ReportSection number="2.1" title="Deferred production">
        <p>0.12 MSm³ deferred.</p>
      </ReportSection>,
    );

    expect(screen.getByRole('heading', { name: '2.1 Deferred production' })).toBeInTheDocument();
    expect(screen.getByText('0.12 MSm³ deferred.')).toBeInTheDocument();
  });

  it('can set the heading beside the text', () => {
    const { container } = render(
      <ReportSection number="1" title="Summary" layout="side">
        Text
      </ReportSection>,
    );

    expect(container.querySelector('section')).toHaveAttribute('data-layout', 'side');
  });
});
