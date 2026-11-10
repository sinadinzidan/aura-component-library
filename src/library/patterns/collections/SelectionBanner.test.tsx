import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SelectionBanner } from './SelectionBanner';

const NOUN = { one: 'work order', other: 'work orders' };

describe(SelectionBanner.name, () => {
  it('says the page is selected and offers every page', async () => {
    const onSelectAllPages = vi.fn();
    render(
      <SelectionBanner pageCount={25} totalCount={312} allPagesSelected={false} noun={NOUN} onSelectAllPages={onSelectAllPages} onClear={vi.fn()} />
    );

    expect(screen.getByRole('status')).toHaveTextContent('All 25 work orders on this page are selected.');
    await userEvent.click(screen.getByRole('button', { name: 'Select all 312 work orders' }));

    expect(onSelectAllPages).toHaveBeenCalledTimes(1);
  });

  it('says everything is selected and offers to clear', async () => {
    const onClear = vi.fn();
    render(<SelectionBanner pageCount={25} totalCount={312} allPagesSelected noun={NOUN} onSelectAllPages={vi.fn()} onClear={onClear} />);

    expect(screen.getByRole('status')).toHaveTextContent('All 312 work orders are selected.');
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('does not offer more when the page is the whole result', () => {
    render(<SelectionBanner pageCount={8} totalCount={8} allPagesSelected={false} noun={NOUN} onSelectAllPages={vi.fn()} onClear={vi.fn()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses the singular noun for one row', () => {
    render(<SelectionBanner pageCount={1} totalCount={1} allPagesSelected={false} noun={NOUN} onSelectAllPages={vi.fn()} onClear={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('All 1 work order on this page are selected.');
  });
});
