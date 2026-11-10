import { render, waitFor } from '@testing-library/react';
import { useRef } from 'react';

import type { TokenColors } from './tokenColors';
import { useTokenColors } from './useTokenColors';

const TOKENS = { surface: 'card-background' };

function Probe({ onColors }: { onColors: (colors: TokenColors<typeof TOKENS> | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  onColors(useTokenColors(TOKENS, ref));
  return <div ref={ref} data-testid="scope" />;
}

describe(useTokenColors.name, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves tokens from the computed style of a hidden probe', async () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => Object.assign(document.createElement('span').style, { color: 'rgba(1, 2, 3, 0.5)' }));
    const onColors = vi.fn();

    render(<Probe onColors={onColors} />);

    await waitFor(() => expect(onColors).toHaveBeenLastCalledWith({ surface: { color: 'rgb(1, 2, 3)', opacity: 0.5 } }));
  });

  it('stays null when the colour cannot be read', () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => Object.assign(document.createElement('span').style, { color: '' }));
    const onColors = vi.fn();

    render(<Probe onColors={onColors} />);

    expect(onColors).toHaveBeenLastCalledWith(null);
  });

  it('removes its probe on unmount', () => {
    const { getByTestId, unmount } = render(<Probe onColors={vi.fn()} />);
    const scope = getByTestId('scope');
    expect(scope.querySelector('[data-slot="token-probe"]')).not.toBeNull();

    unmount();

    expect(scope.querySelector('[data-slot="token-probe"]')).toBeNull();
  });
});
