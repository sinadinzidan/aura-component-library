import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Pager } from './Pager';

describe(Pager.name, () => {
  it('says which records are shown and marks the current page', () => {
    render(<Pager page={2} pageSize={6} total={23} noun="work orders" />);

    expect(screen.getByRole('navigation', { name: 'work orders pages' })).toHaveTextContent('7–12 of 23 work orders');
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('button', { name: /^Page / })).toHaveLength(4);
  });

  it('disables previous on the first page and next on the last', () => {
    const { rerender } = render(<Pager page={1} pageSize={6} total={12} noun="alarms" />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

    rerender(<Pager page={2} pageSize={6} total={12} noun="alarms" />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('reports the requested page', async () => {
    const onPage = vi.fn();
    render(<Pager page={1} pageSize={6} total={23} noun="work orders" onPage={onPage} />);

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }));

    expect(onPage).toHaveBeenNthCalledWith(1, 2);
    expect(onPage).toHaveBeenNthCalledWith(2, 3);
  });

  it('handles an empty list', () => {
    render(<Pager page={1} pageSize={6} total={0} noun="alarms" />);

    expect(screen.getByRole('navigation')).toHaveTextContent('0–0 of 0 alarms');
  });
});
