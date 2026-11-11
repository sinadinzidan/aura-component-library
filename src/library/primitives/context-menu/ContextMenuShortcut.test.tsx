import { render, screen } from '@testing-library/react';

import { ContextMenuShortcut } from './ContextMenuShortcut';

describe(ContextMenuShortcut.name, () => {
  it('renders the keys as keyboard input', () => {
    render(<ContextMenuShortcut>⌘C</ContextMenuShortcut>);

    expect(screen.getByText('⌘C').tagName).toBe('KBD');
  });
});
