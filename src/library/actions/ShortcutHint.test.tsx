import { render, screen } from '@testing-library/react';

import { ShortcutHint } from './ShortcutHint';

describe(ShortcutHint.name, () => {
  it('shows Mac symbols on a Mac', () => {
    const { container } = render(<ShortcutHint keys={['mod', 'shift', 'K']} platform="mac" />);

    expect(keysIn(container)).toEqual(['⌘', '⇧', 'K']);
  });

  it('shows named keys on other platforms', () => {
    const { container } = render(<ShortcutHint keys={['mod', 'shift', 'K']} platform="other" />);

    expect(keysIn(container)).toEqual(['Ctrl', 'Shift', 'K']);
  });

  it('reads a chord out in words', () => {
    render(<ShortcutHint keys={['mod', 'enter']} platform="mac" />);

    expect(screen.getByText('Command + Return')).toBeInTheDocument();
  });

  it('separates the keys of a sequence with "then"', () => {
    render(<ShortcutHint keys={['G', 'D']} mode="sequence" platform="other" />);

    expect(screen.getByText('G then D')).toBeInTheDocument();
    expect(screen.getByText('then')).toBeInTheDocument();
  });

  it('shows keys it does not know as typed', () => {
    const { container } = render(<ShortcutHint keys={['F2']} platform="other" />);

    expect(keysIn(container)).toEqual(['F2']);
  });

  it('detects a Mac from the user agent', () => {
    const { container } = render(
      <ShortcutHint keys={['mod', 'K']} userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" />
    );

    expect(keysIn(container)).toEqual(['⌘', 'K']);
  });

  it('treats any other user agent as a non-Mac platform', () => {
    const { container } = render(
      <ShortcutHint keys={['mod', 'K']} userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)" />
    );

    expect(keysIn(container)).toEqual(['Ctrl', 'K']);
  });
});

function keysIn(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('kbd'), (key) => key.textContent ?? '');
}
