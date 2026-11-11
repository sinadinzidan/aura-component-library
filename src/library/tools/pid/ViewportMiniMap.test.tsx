import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ViewportMiniMap } from './ViewportMiniMap';

const WORLD = { x: 0, y: 0, width: 1000, height: 500 };
const VIEWPORT = { x: 200, y: 100, width: 400, height: 200 };

function renderMap(onRecentre = vi.fn()) {
  const view = render(
    <ViewportMiniMap world={WORLD} viewport={VIEWPORT} label="Mini-map of the drawing" onRecentre={onRecentre}>
      <rect data-testid="content" x={10} y={10} width={50} height={50} />
    </ViewportMiniMap>
  );
  return { ...view, onRecentre };
}

describe(ViewportMiniMap.name, () => {
  it('is one named button that draws its content and the viewport frame', () => {
    const { container } = renderMap();

    expect(screen.getByRole('button', { name: 'Mini-map of the drawing' })).toBeInTheDocument();
    expect(container.querySelector('[data-testid="content"]')).toBeInTheDocument();
    const frame = container.querySelector('[data-slot="viewport-mini-map-frame"]');
    expect(frame).toHaveAttribute('x', '200');
    expect(frame).toHaveAttribute('width', '400');
  });

  it('clips the frame to the world when the view hangs over the edge', () => {
    const { container } = render(
      <ViewportMiniMap world={WORLD} viewport={{ x: -100, y: 0, width: 400, height: 200 }} label="Map" onRecentre={vi.fn()}>
        <g />
      </ViewportMiniMap>
    );

    const frame = container.querySelector('[data-slot="viewport-mini-map-frame"]');
    expect(frame).toHaveAttribute('x', '0');
    expect(frame).toHaveAttribute('width', '300');
  });

  it('recentres on the point that is pressed', () => {
    const { onRecentre } = renderMap();
    const map = screen.getByRole('button');
    map.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });

    fireEvent.pointerDown(map, { clientX: 50, clientY: 50, pointerId: 1 });

    expect(onRecentre).toHaveBeenCalledWith({ x: 250, y: 250 });
  });

  it('nudges the view with the arrow keys', async () => {
    const { onRecentre } = renderMap();

    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{ArrowUp}');

    expect(onRecentre.mock.calls).toEqual([[{ x: 500, y: 200 }], [{ x: 400, y: 150 }]]);
  });
});
