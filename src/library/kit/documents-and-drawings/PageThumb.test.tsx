import { render, screen } from '@testing-library/react';

import { PageThumb } from './PageThumb';

describe(PageThumb.name, () => {
  it('names the preview and stamps the revision', () => {
    render(<PageThumb label="First page of NK-23-PR-0012" kind="procedure" revision="05" />);

    expect(screen.getByRole('img', { name: 'First page of NK-23-PR-0012' })).toBeInTheDocument();
    expect(screen.getByText('Rev 05')).toBeInTheDocument();
  });

  it('draws drawings on a landscape sheet and text documents on a portrait page', () => {
    const { rerender } = render(<PageThumb label="Sheet" kind="pid" />);
    expect(screen.getByRole('img')).toHaveAttribute('data-format', 'landscape');

    rerender(<PageThumb label="Page" kind="report" />);
    expect(screen.getByRole('img')).toHaveAttribute('data-format', 'portrait');
  });

  it('draws data sheets as a form grid', () => {
    const { container } = render(<PageThumb label="Page" kind="datasheet" />);

    expect(container.querySelectorAll('.grid > span')).toHaveLength(12);
    expect(screen.queryByText(/Rev/)).not.toBeInTheDocument();
  });
});
