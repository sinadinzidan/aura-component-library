import { render, screen } from '@testing-library/react';

import { PagePreview } from './PagePreview';

describe(PagePreview.name, () => {
  it.each(['document', 'drawing', 'photo'] as const)('is a named image for the %s kind', (kind) => {
    render(<PagePreview kind={kind} label="Preview of NK-23-PR-0012" />);
    expect(screen.getByRole('img', { name: 'Preview of NK-23-PR-0012' })).toHaveAttribute('data-kind', kind);
  });

  it('shows a caption under a photo placeholder', () => {
    render(<PagePreview kind="photo" label="Photo of the drive-end bearing" caption="Photo 1 · Drive-end bearing" />);
    expect(screen.getByText('Photo 1 · Drive-end bearing')).toBeInTheDocument();
  });

  it('draws page lines for a document', () => {
    const { container } = render(<PagePreview kind="document" label="Page 1" />);
    expect(container.querySelectorAll('span[aria-hidden]').length).toBeGreaterThan(6);
  });
});
