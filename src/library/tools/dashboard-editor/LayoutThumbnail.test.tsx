import { render, screen } from '@testing-library/react';

import { LayoutThumbnail } from './LayoutThumbnail';

const ITEMS = [
  { id: 'a', x: 0, y: 0, w: 6, h: 2 },
  { id: 'b', x: 6, y: 0, w: 6, h: 2 },
  { id: 'c', x: 0, y: 2, w: 12, h: 3 },
];

describe(LayoutThumbnail.name, () => {
  it('is an image with a name', () => {
    render(<LayoutThumbnail label="Operations layout, 3 widgets" items={ITEMS} />);

    expect(screen.getByRole('img', { name: 'Operations layout, 3 widgets' })).toBeInTheDocument();
  });

  it('draws one block per widget in its cell', () => {
    const { container } = render(<LayoutThumbnail label="Operations layout" items={ITEMS} />);

    const blocks = container.querySelectorAll<HTMLElement>('[data-slot="layout-thumbnail-item"]');
    expect(blocks).toHaveLength(3);
    expect(blocks[2].style.gridColumn).toBe('1 / span 12');
    expect(blocks[2].style.gridRow).toBe('3 / span 3');
  });

  it('sizes its rows to the layout', () => {
    render(<LayoutThumbnail label="Operations layout" items={ITEMS} />);

    expect(screen.getByRole('img').style.gridTemplateRows).toBe('repeat(5, minmax(0, 1fr))');
  });
});
