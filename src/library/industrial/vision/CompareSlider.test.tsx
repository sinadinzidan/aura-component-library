import { fireEvent, render, screen } from '@testing-library/react';

import { CompareSlider } from './CompareSlider';

function setup(initial?: number) {
  render(<CompareSlider label="Hall before and after" before={<div>Earlier frame</div>} after={<div>Later frame</div>} initial={initial} />);
  return screen.getByRole('slider', { name: 'Hall before and after' });
}

describe(CompareSlider.name, () => {
  it('shows both frames and labels them', () => {
    setup();

    expect(screen.getByText('Earlier frame')).toBeInTheDocument();
    expect(screen.getByText('Later frame')).toBeInTheDocument();
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('starts in the middle and says what is shown', () => {
    const slider = setup();

    expect(slider).toHaveAttribute('aria-valuenow', '50');
    expect(slider).toHaveAttribute('aria-valuetext', '50 % before, 50 % after');
  });

  it('moves with the arrow keys', () => {
    const slider = setup();

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider).toHaveAttribute('aria-valuenow', '52');
    fireEvent.keyDown(slider, { key: 'ArrowLeft', shiftKey: true });
    expect(slider).toHaveAttribute('aria-valuenow', '42');
  });

  it('jumps to the ends with Home and End', () => {
    const slider = setup();

    fireEvent.keyDown(slider, { key: 'End' });
    expect(slider).toHaveAttribute('aria-valuenow', '100');
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(slider).toHaveAttribute('aria-valuenow', '0');
  });

  it('ignores other keys', () => {
    const slider = setup(0.3);

    fireEvent.keyDown(slider, { key: 'x' });

    expect(slider).toHaveAttribute('aria-valuenow', '30');
  });

  it('clips the later frame to the right of the divider', () => {
    setup(0.25);

    expect(document.querySelector('[data-slot="compare-after"]')).toHaveStyle({ clipPath: 'inset(0 0 0 25%)' });
  });
});
