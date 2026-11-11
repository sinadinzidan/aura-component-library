import { render, screen } from '@testing-library/react';

import { MiniMap } from './MiniMap';
import { VIEWER_BOUNDS } from './viewerModelLogic';

const pose = { position: [0, 8, 12] as const, lookAt: [0, 0, 0] as const };

describe(MiniMap.name, () => {
  it('names the heading of the camera', () => {
    render(<MiniMap bounds={VIEWER_BOUNDS} pose={pose} />);

    expect(screen.getByRole('img', { name: 'Plan view. The camera looks towards 0 degrees from north.' })).toBeInTheDocument();
  });

  it('draws the parts, the camera and its view cone', () => {
    const { container } = render(<MiniMap bounds={VIEWER_BOUNDS} pose={pose} />);

    expect(container.querySelectorAll('[data-slot="map-part"]').length).toBeGreaterThan(5);
    expect(container.querySelector('[data-slot="map-camera"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="map-cone"]')).toBeInTheDocument();
  });

  it('outlines highlighted parts more strongly', () => {
    const { container } = render(<MiniMap bounds={VIEWER_BOUNDS} pose={pose} highlightIds={['motor']} />);

    const strong = Array.from(container.querySelectorAll('[data-slot="map-part"]')).filter((node) => node.getAttribute('stroke-width') === '2');
    expect(strong).toHaveLength(1);
  });
});
