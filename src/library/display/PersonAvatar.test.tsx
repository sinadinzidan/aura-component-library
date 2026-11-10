import { render, screen } from '@testing-library/react';

import { PersonAvatar } from './PersonAvatar';

describe(PersonAvatar.name, () => {
  it('derives initials from the first and last name', () => {
    render(<PersonAvatar name="Ingrid Marie Haugen" />);

    expect(screen.getByLabelText('Ingrid Marie Haugen')).toHaveTextContent('IH');
  });

  it('uses a single initial for a one-word name', () => {
    render(<PersonAvatar name="Operations" />);

    expect(screen.getByLabelText('Operations')).toHaveTextContent('O');
  });

  it('prefers explicit initials', () => {
    render(<PersonAvatar name="Tomás Barros" initials="TB" />);

    expect(screen.getByLabelText('Tomás Barros')).toHaveTextContent('TB');
  });

  it('gives the same person the same colorway on every render', () => {
    const { container, rerender } = render(<PersonAvatar name="Aisha Khan" />);
    const first = container.firstElementChild?.className;

    rerender(<PersonAvatar name="Aisha Khan" sizes="default" />);

    expect(container.firstElementChild?.className).toBe(first);
    expect(first).toMatch(/bg-decorative-[1-7]-background/);
  });

  it('keeps the colorway when the name changes but the colour key does not', () => {
    const { container, rerender } = render(<PersonAvatar name="Liv Wold" colorKey="lw" />);
    const before = container.firstElementChild?.className;

    rerender(<PersonAvatar name="Liv Wold-Nyberg" colorKey="lw" />);

    expect(container.firstElementChild?.className).toBe(before);
  });
});
