import { render, screen } from '@testing-library/react';

import { PageHeader } from './PageHeader';

describe(PageHeader.name, () => {
  it('renders the title as the page heading', () => {
    render(<PageHeader title="Work orders" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Work orders' })).toBeInTheDocument();
  });

  it('uses the requested heading level', () => {
    render(<PageHeader title="Work orders" as="h2" />);

    expect(screen.getByRole('heading', { level: 2, name: 'Work orders' })).toBeInTheDocument();
  });

  it('renders every slot that is given', () => {
    render(
      <PageHeader
        title="1st stage compressor"
        description="Gas compression, train 1"
        breadcrumb={<nav aria-label="Breadcrumb">Assets</nav>}
        leading={<span>Icon</span>}
        status={<span>Running</span>}
        meta={<span>Updated 14:00</span>}
        actions={<button type="button">Create work order</button>}
        tabs={<div role="tablist" />}
      >
        <p>KPI strip</p>
      </PageHeader>
    );

    expect(screen.getByText('Gas compression, train 1')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Updated 14:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create work order' })).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByText('KPI strip')).toBeInTheDocument();
  });

  it('leaves out wrappers for slots that are not given', () => {
    render(<PageHeader title="Work orders" />);

    expect(screen.getByRole('banner').querySelectorAll('p')).toHaveLength(0);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('draws a rule only when asked', () => {
    const { rerender } = render(<PageHeader title="Work orders" />);
    expect(screen.getByRole('banner')).not.toHaveClass('border-b');

    rerender(<PageHeader title="Work orders" divider />);

    expect(screen.getByRole('banner')).toHaveClass('border-b');
  });
});
