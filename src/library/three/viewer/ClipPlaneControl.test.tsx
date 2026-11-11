import { fireEvent, render, screen } from '@testing-library/react';

import { INITIAL_CLIP } from './clipPlane';
import { ClipPlaneControl } from './ClipPlaneControl';

const bounds = { min: [-10, 0, -5], max: [10, 4, 5] } as const;

describe(ClipPlaneControl.name, () => {
  it('starts off with the other controls disabled', () => {
    render(<ClipPlaneControl state={INITIAL_CLIP} dispatch={() => undefined} bounds={bounds} />);

    expect(screen.getByText('Section plane off')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Keep the far side' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('switches the plane on', () => {
    const dispatch = vi.fn();
    render(<ClipPlaneControl state={INITIAL_CLIP} dispatch={dispatch} bounds={bounds} />);

    fireEvent.click(screen.getByRole('switch', { name: 'Section plane' }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'enable', enabled: true });
  });

  it('says where the cut is in words and metres', () => {
    render(<ClipPlaneControl state={{ ...INITIAL_CLIP, enabled: true, position: 0.75 }} dispatch={() => undefined} bounds={bounds} />);

    expect(screen.getByText('Section across east–west at 5 m, keeping the near side')).toBeInTheDocument();
    expect(screen.getByText('5 m')).toBeInTheDocument();
  });

  it('flips the side and resets', () => {
    const dispatch = vi.fn();
    render(<ClipPlaneControl state={{ ...INITIAL_CLIP, enabled: true }} dispatch={dispatch} bounds={bounds} />);

    fireEvent.click(screen.getByRole('switch', { name: 'Keep the far side' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset plane' }));

    expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'flip', flip: true });
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'reset' });
  });

  it('exposes the position as a slider', () => {
    render(<ClipPlaneControl state={{ ...INITIAL_CLIP, enabled: true, position: 0.25 }} dispatch={() => undefined} bounds={bounds} />);

    expect(screen.getByRole('slider', { hidden: true })).toHaveAttribute('aria-valuenow', '25');
  });
});
