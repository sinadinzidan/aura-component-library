import { fireEvent, render, screen } from '@testing-library/react';

import { InteractiveSpectrum } from './InteractiveSpectrum';

const spectrum = Array.from({ length: 41 }, (_, index) => ({ frequencyHz: index * 5, amplitude: index === 10 ? 4 : index === 20 ? 2 : 0.1 }));

function setup(onCursorChange?: () => void) {
  render(<InteractiveSpectrum label="Drive-end spectrum" spectrum={spectrum} unit="mm/s" runningHz={50} onCursorChange={onCursorChange} />);
  return screen.getByRole('slider', { name: /Readout cursor/ });
}

describe(InteractiveSpectrum.name, () => {
  it('starts without a reading', () => {
    setup();

    expect(screen.getByText('None set')).toBeInTheDocument();
  });

  it('reads frequency, orders and amplitude with the arrow keys', () => {
    const slider = setup();

    fireEvent.keyDown(slider, { key: 'ArrowRight' });

    expect(slider).toHaveAttribute('aria-valuetext', '10.0 Hz, 0.20 orders, 0.10 mm/s');
  });

  it('jumps to the next peak with shift and the arrow', () => {
    const slider = setup();

    fireEvent.keyDown(slider, { key: 'ArrowRight', shiftKey: true });

    expect(slider.getAttribute('aria-valuetext')).toContain('50.0 Hz');
  });

  it('sets and clears a harmonic family from the keyboard', () => {
    const { container } = render(<InteractiveSpectrum label="Spectrum" spectrum={spectrum} unit="mm/s" runningHz={50} initialHz={50} />);
    const slider = screen.getByRole('slider');

    fireEvent.keyDown(slider, { key: 'Enter' });
    expect(container.querySelectorAll('[data-slot="spectrum-cursor-label"]').length).toBeGreaterThan(1);
    expect(screen.getByText('50.0 Hz (1.00×)')).toBeInTheDocument();

    fireEvent.keyDown(slider, { key: 'Escape' });
    expect(container.querySelectorAll('[data-slot="spectrum-cursor-label"]')).toHaveLength(0);
  });

  it('announces the reading in a live region and reports changes', () => {
    const onChange = vi.fn();
    const slider = setup(onChange);

    fireEvent.keyDown(slider, { key: 'End' });

    expect(onChange).toHaveBeenCalledWith(spectrum[40]);
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toContain('200.0 Hz');
  });

  it('starts on a given line and fundamental', () => {
    render(<InteractiveSpectrum label="Spectrum" spectrum={spectrum} unit="mm/s" runningHz={50} initialHz={100} initialFundamentalHz={50} />);

    expect(screen.getByText('50.0 Hz (1.00×)')).toBeInTheDocument();
  });
});
