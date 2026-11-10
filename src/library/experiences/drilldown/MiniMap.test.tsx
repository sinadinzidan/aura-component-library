import { fireEvent, render, screen } from '@testing-library/react';

import { MiniMap } from './MiniMap';

const WORLD = { width: 1000, height: 600 };
const REGIONS = [
  { id: 'a', label: 'Inlet and separation', x: 20, y: 20, width: 460, height: 260 },
  { id: 'b', label: 'Gas compression', x: 520, y: 20, width: 460, height: 260, tone: 'critical' as const },
];

describe(MiniMap.name, () => {
  it('names what it shows', () => {
    render(<MiniMap world={WORLD} regions={REGIONS} viewport={{ x: 0, y: 0, ...WORLD }} label="Overview: showing the whole plant" />);

    expect(screen.getByRole('img', { name: 'Overview: showing the whole plant' })).toHaveAttribute('viewBox', '0 0 1000 600');
  });

  it('draws one block per region, with abnormal ones outlined in their tone', () => {
    const { container } = render(<MiniMap world={WORLD} regions={REGIONS} viewport={{ x: 0, y: 0, ...WORLD }} label="Overview" />);
    const blocks = container.querySelectorAll('[data-slot="mini-map-region"]');

    expect(blocks).toHaveLength(2);
    expect(blocks[1]).toHaveAttribute('data-tone', 'critical');
    expect(blocks[1]).toHaveClass('stroke-critical-foreground-strong');
    expect(screen.getByText('Gas compression')).toBeInTheDocument();
  });

  it('frames the viewport', () => {
    const { container } = render(<MiniMap world={WORLD} regions={REGIONS} viewport={{ x: 500, y: 0, width: 500, height: 300 }} label="Overview" />);
    const frame = container.querySelector<SVGRectElement>('[data-slot="mini-map-viewport"]');

    expect(frame?.style.transform).toBe('translate(500px, 0px) scale(0.5, 0.5)');
  });

  it('never lets the frame shrink out of sight', () => {
    const { container } = render(<MiniMap world={WORLD} regions={REGIONS} viewport={{ x: 600, y: 100, width: 10, height: 6 }} label="Overview" />);
    const frame = container.querySelector<SVGRectElement>('[data-slot="mini-map-viewport"]');

    expect(frame?.style.transform).toBe('translate(575px, 85px) scale(0.06, 0.06)');
  });

  it('reports a clicked region when regions are selectable', () => {
    const onSelectRegion = vi.fn();
    const { container } = render(
      <MiniMap world={WORLD} regions={REGIONS} viewport={{ x: 0, y: 0, ...WORLD }} label="Overview" onSelectRegion={onSelectRegion} />
    );

    const block = container.querySelector('[data-slot="mini-map-region"]');
    if (block) fireEvent.click(block);

    expect(onSelectRegion).toHaveBeenCalledWith('a');
  });
});
