import { render, screen } from '@testing-library/react';

import { LoadingBlock } from './LoadingBlock';

describe(LoadingBlock.name, () => {
  it('announces what is loading as a busy status', () => {
    render(<LoadingBlock label="Loading gas export" kind="chart" />);

    const status = screen.getByRole('status', { name: 'Loading gas export' });
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveAttribute('data-kind', 'chart');
  });

  it('draws one placeholder row per requested row', () => {
    const { container } = render(<LoadingBlock label="Loading work orders" kind="table" rows={3} />);

    expect(container.querySelectorAll('[role="status"] > div')).toHaveLength(3);
  });
});
