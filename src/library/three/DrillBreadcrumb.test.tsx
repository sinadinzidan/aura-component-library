import { fireEvent, render, screen } from '@testing-library/react';

import { DrillBreadcrumb } from './DrillBreadcrumb';

const CRUMBS = [
  { id: 'nk', label: 'Nordkapp', kind: 'Plant' },
  { id: 'nk-23', label: 'Gas compression', kind: 'Area' },
  { id: '23-ka-9101', label: '23-KA-9101' },
];

describe(DrillBreadcrumb.name, () => {
  it('marks the last crumb as the current location', () => {
    render(<DrillBreadcrumb crumbs={CRUMBS} onNavigate={vi.fn()} />);

    expect(screen.getByText('23-KA-9101').closest('[aria-current="location"]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /23-KA-9101/ })).not.toBeInTheDocument();
  });

  it('navigates to an ancestor when its crumb is clicked', () => {
    const onNavigate = vi.fn();
    render(<DrillBreadcrumb crumbs={CRUMBS} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('button', { name: /Gas compression/ }));

    expect(onNavigate).toHaveBeenCalledWith('nk-23');
  });

  it('goes up one level from the up button', () => {
    const onUp = vi.fn();
    render(<DrillBreadcrumb crumbs={CRUMBS} onNavigate={vi.fn()} onUp={onUp} />);

    fireEvent.click(screen.getByRole('button', { name: 'Go up one level' }));

    expect(onUp).toHaveBeenCalledOnce();
  });

  it('hides the up button at the top level', () => {
    render(<DrillBreadcrumb crumbs={CRUMBS.slice(0, 1)} onNavigate={vi.fn()} onUp={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Go up one level' })).not.toBeInTheDocument();
  });
});
