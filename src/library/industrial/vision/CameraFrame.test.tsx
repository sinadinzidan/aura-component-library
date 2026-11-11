import { render, screen } from '@testing-library/react';

import { CameraFrame } from './CameraFrame';
import { FRAME_SCENES } from './frameScenes';

describe(CameraFrame.name, () => {
  it('names the frame and draws the scene equipment', () => {
    const { container } = render(<CameraFrame scene="compressor-hall" label="Compressor hall camera" />);

    expect(screen.getByRole('img', { name: 'Compressor hall camera' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="equipment-symbol"]')).toHaveLength(FRAME_SCENES[0].items.length);
  });

  it('burns in the time stamp and the camera caption', () => {
    render(<CameraFrame scene="pump-bay" label="Pump bay" timestamp="12 Mar 2026 14:02:05" caption="23-CAM-0104" />);

    expect(screen.getByText('12 Mar 2026 14:02:05')).toBeInTheDocument();
    expect(screen.getByText('23-CAM-0104')).toBeInTheDocument();
  });

  it('marks night mode with IR', () => {
    render(<CameraFrame scene="flare" label="Flare" mode="night" />);

    expect(screen.getByText('IR')).toBeInTheDocument();
  });

  it('blanks privacy masks and says so', () => {
    const { container } = render(<CameraFrame scene="flare" label="Flare" masks={[{ x: 0.1, y: 0.1, w: 0.2, h: 0.2 }]} />);

    expect(container.querySelector('[data-slot="privacy-mask"]')).toHaveTextContent('Masked');
  });

  it('applies zoom and pan to the scene', () => {
    const { container } = render(<CameraFrame scene="flare" label="Flare" view={{ pan: 10, tilt: 5, zoom: 2 }} />);

    expect(container.querySelector('svg g')).toHaveStyle({ transform: 'translate(-9.0px, 3.0px) scale(2)' });
  });

  it('renders overlay children above the scene', () => {
    render(
      <CameraFrame scene="flare" label="Flare">
        <span>Overlay</span>
      </CameraFrame>
    );

    expect(screen.getByText('Overlay')).toBeInTheDocument();
  });

  it('falls back to the first scene for an unknown id', () => {
    const { container } = render(<CameraFrame scene="unknown" label="Unknown" />);

    expect(container.querySelectorAll('[data-slot="equipment-symbol"]')).toHaveLength(FRAME_SCENES[0].items.length);
  });
});
