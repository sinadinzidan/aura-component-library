import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { GeoMap } from './GeoMap';
import type { MapMarker } from './GeoMap';
import { LocatorMap } from './LocatorMap';
import { MapInfoCard } from './MapInfoCard';
import { MapLegend } from './MapLegend';
import { MapScaleBar } from './MapScaleBar';
import { SiteMark, SiteMarkSwatch } from './SiteMark';
import { describeView, markerRadius, worstOf, worstTone } from './tones';
import { ZoomControls } from './ZoomControls';

const OUTLINES = [
  {
    id: 'norway',
    closed: true,
    points: [
      { lat: 58, lon: 6 },
      { lat: 62, lon: 5 },
      { lat: 70, lon: 18 },
      { lat: 70, lon: 30 },
      { lat: 62, lon: 12 },
    ],
  },
];

const MARKERS: readonly MapMarker[] = [
  { id: 'nordkapp', name: 'Nordkapp', position: { lat: 65.3, lon: 7.2 }, tone: 'warning', shape: 'square', weight: 142, statusLabel: 'reduced', valueLabel: '142 kboe/d' },
  { id: 'utsira', name: 'Utsira Sør', position: { lat: 58.8, lon: 2.4 }, tone: 'success', shape: 'dot', weight: 164, statusLabel: 'producing' },
  { id: 'utsira-nord', name: 'Utsira Nord', position: { lat: 58.9, lon: 2.6 }, tone: 'critical', shape: 'diamond', weight: 80, statusLabel: 'shut in' },
  { id: 'hammerfest', name: 'Hammerfest LNG', position: { lat: 70.7, lon: 23.6 }, tone: 'success', shape: 'dot', weight: 104, statusLabel: 'producing' },
];

const ROUTES = [
  { id: 'gas-1', name: 'Nordkapp to Stord', kind: 'pipeline', points: [{ lat: 65.3, lon: 7.2 }, { lat: 59.8, lon: 5.5 }] },
  { id: 'cargo-1', name: 'Stord to Rotterdam', kind: 'export', points: [{ lat: 59.8, lon: 5.5 }, { lat: 51.95, lon: 4.1 }] },
] as const;

beforeAll(() => {
  // happy-dom has no pointer capture; the map only needs it not to throw.
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => true);
});

const NORWAY_VIEW = { center: { lat: 64, lon: 13 }, scale: 1000 };
const UTSIRA_VIEW = { center: { lat: 58.85, lon: 2.5 }, scale: 1600 };

function map() {
  return screen.getByRole('group', { name: /Test map/ });
}

function live() {
  return document.querySelector('[aria-live="polite"]')?.textContent ?? '';
}

function renderMap(props: Partial<ComponentProps<typeof GeoMap>> = {}) {
  const onSelect = vi.fn();
  render(
    <TooltipProvider>
      <GeoMap label="Test map" outlines={OUTLINES} markers={MARKERS} routes={ROUTES} initialView={NORWAY_VIEW} initialSize={{ width: 800, height: 600 }} onSelect={onSelect} {...props} />
    </TooltipProvider>
  );
  return { onSelect };
}

describe(GeoMap.name, () => {
  it('is a labelled map with instructions for the keyboard', () => {
    renderMap();

    expect(map()).toHaveAttribute('aria-roledescription', 'map');
    expect(map().getAttribute('aria-label')).toContain('Drag to pan');
    expect(map()).toHaveAttribute('tabindex', '0');
  });

  it('draws each far-apart site as a button named with its status and figure', () => {
    renderMap();

    expect(screen.getByRole('button', { name: 'Nordkapp, reduced, 142 kboe/d' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hammerfest LNG, producing' })).toBeInTheDocument();
  });

  it('merges nearby sites into a counted cluster that names its members', () => {
    renderMap({ initialView: UTSIRA_VIEW });

    expect(screen.getByRole('button', { name: /2 sites: Utsira Sør, Utsira Nord/ })).toHaveTextContent('2');
    expect(screen.queryByRole('button', { name: /^Utsira Sør, producing/ })).not.toBeInTheDocument();
  });

  it('splits a cluster when zoomed in', async () => {
    renderMap({ initialView: UTSIRA_VIEW });
    expect(screen.getByRole('button', { name: /2 sites:/ })).toBeInTheDocument();

    for (let step = 0; step < 4; step += 1) await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));

    expect(screen.queryByRole('button', { name: /2 sites:/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Utsira Sør, producing/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Utsira Nord, shut in/ })).toBeInTheDocument();
  });

  it('zooms to a cluster when it is chosen, which splits it', async () => {
    renderMap({ initialView: { center: { lat: 58.85, lon: 2.5 }, scale: 900 } });

    await userEvent.click(screen.getByRole('button', { name: /2 sites:/ }));

    expect(screen.queryByRole('button', { name: /2 sites:/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Utsira Sør, producing/ })).toBeInTheDocument();
  });

  it('selects a site with Enter, shows its card, and clears with Escape', async () => {
    const { onSelect } = renderMap({ renderCard: (marker, close) => <MapInfoCard title={marker.name} rows={[]} onClose={close} /> });
    const nordkapp = screen.getByRole('button', { name: /^Nordkapp/ });
    nordkapp.focus();

    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith('nordkapp');
    expect(nordkapp).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('region', { name: 'Nordkapp details' })).toBeInTheDocument();
    expect(live()).toContain('Selected Nordkapp, reduced, 142 kboe/d.');

    await userEvent.keyboard('{Escape}');
    expect(onSelect).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('region', { name: 'Nordkapp details' })).not.toBeInTheDocument();
  });

  it('closes the card with its button', async () => {
    renderMap({ initialSelectedId: 'nordkapp', renderCard: (marker, close) => <MapInfoCard title={marker.name} rows={[]} onClose={close} /> });

    await userEvent.click(screen.getByRole('button', { name: 'Close Nordkapp' }));

    expect(screen.queryByRole('region', { name: 'Nordkapp details' })).not.toBeInTheDocument();
  });

  it('selects with the pointer, and clicking empty map clears the selection', async () => {
    renderMap({ initialSelectedId: 'nordkapp' });

    await userEvent.click(screen.getByRole('button', { name: /^Hammerfest/ }));
    expect(screen.getByRole('button', { name: /^Hammerfest/ })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(map());
    expect(screen.getByRole('button', { name: /^Hammerfest/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('zooms with + and − and announces the new zoom', async () => {
    renderMap();
    map().focus();

    await userEvent.keyboard('+');
    const zoomedIn = live();
    await userEvent.keyboard('-{-}');

    expect(zoomedIn).toMatch(/Mercator, zoom \d+\.\d, centred on/);
    expect(live()).not.toBe(zoomedIn);
  });

  it('pans with the arrow keys and moves the centre the way the key points', async () => {
    renderMap();
    const before = document.querySelector('[data-slot="coordinates"]')?.textContent;
    map().focus();

    await userEvent.keyboard('{ArrowRight}');

    expect(document.querySelector('[data-slot="coordinates"]')?.textContent).not.toBe(before);
    expect(document.querySelector('[data-slot="coordinates"]')?.textContent).toMatch(/E$/);
  });

  it('resets with 0 and goes back with Ctrl+Z', async () => {
    renderMap();
    const initial = document.querySelector('[data-slot="coordinates"]')?.textContent;
    map().focus();

    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(document.querySelector('[data-slot="coordinates"]')?.textContent).not.toBe(initial);
    await userEvent.keyboard('{Control>}z{/Control}{Control>}z{/Control}');
    expect(document.querySelector('[data-slot="coordinates"]')?.textContent).toBe(initial);

    await userEvent.keyboard('{ArrowDown}0');
    expect(document.querySelector('[data-slot="coordinates"]')?.textContent).toBe(initial);
  });

  it('fits all sites with F and with the button', async () => {
    renderMap();
    map().focus();
    const before = live();

    await userEvent.keyboard('f');

    expect(live()).not.toBe(before);
    expect(screen.getByRole('button', { name: 'Fit all sites' })).toBeInTheDocument();
  });

  it('enables Previous view only after something changed', async () => {
    renderMap();
    expect(screen.getByRole('button', { name: 'Previous view' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByRole('button', { name: 'Previous view' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Previous view' }));
    expect(screen.getByRole('button', { name: 'Previous view' })).toBeDisabled();
  });

  it('drags the map with the pointer and shows the coordinates under it', () => {
    renderMap();
    const before = document.querySelector('[data-slot="coordinates"]')?.textContent;

    fireEvent.pointerDown(map(), { button: 0, clientX: 300, clientY: 200, pointerId: 1 });
    fireEvent.pointerMove(map(), { clientX: 360, clientY: 230, pointerId: 1 });
    fireEvent.pointerUp(map(), { clientX: 360, clientY: 230, pointerId: 1 });
    fireEvent.pointerLeave(map());

    expect(document.querySelector('[data-slot="coordinates"]')?.textContent).not.toBe(before);
    expect(Element.prototype.setPointerCapture).toHaveBeenCalled();
  });

  it('does not treat a press that barely moves as a drag', () => {
    renderMap();
    (Element.prototype.setPointerCapture as ReturnType<typeof vi.fn>).mockClear();

    fireEvent.pointerDown(map(), { button: 0, clientX: 300, clientY: 200, pointerId: 1 });
    fireEvent.pointerMove(map(), { clientX: 301, clientY: 201, pointerId: 1 });
    fireEvent.pointerUp(map(), { pointerId: 1 });

    expect(Element.prototype.setPointerCapture).not.toHaveBeenCalled();
  });

  it('zooms about the pointer with the wheel and changes the scale bar', () => {
    renderMap();
    const before = screen.getByRole('img', { name: /^Scale:/ }).getAttribute('aria-label');

    act(() => {
      for (let step = 0; step < 6; step += 1) fireEvent.wheel(map(), { deltaY: -120, clientX: 200, clientY: 100 });
    });

    expect(screen.getByRole('img', { name: /^Scale:/ }).getAttribute('aria-label')).not.toBe(before);
  });

  it('leaves the wheel to the page when wheel zoom is off', () => {
    renderMap({ wheelZoom: false });
    const notPrevented = fireEvent.wheel(map(), { deltaY: -120 });

    // fireEvent returns false when a listener called preventDefault.
    expect(notPrevented).toBe(true);
  });

  it('switches projection', async () => {
    renderMap();

    await userEvent.click(screen.getByRole('tab', { name: 'Equal area' }));

    expect(document.querySelector('[data-slot="geo-map"]')).toHaveAttribute('data-projection', 'equal-area');
    expect(live()).toContain('Equal area');
  });

  it('keeps the layers behind a button and hides a layer when it is unchecked', async () => {
    renderMap();
    expect(screen.queryByRole('checkbox', { name: 'Sites' })).not.toBeInTheDocument();
    expect(document.querySelector('[data-route="gas-1"]')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Layers/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sites' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Pipelines' }));

    expect(screen.queryByRole('button', { name: /^Nordkapp/ })).not.toBeInTheDocument();
    expect(document.querySelector('[data-route="gas-1"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-route="cargo-1"]')).toBeInTheDocument();
  });

  it('draws licence blocks only when that layer is on, marking licensed ones', () => {
    renderMap({ blocks: { box: { south: 58, north: 60, west: 2, east: 4 }, lonStep: 1, latStep: 1, licensedIds: ['B2'] }, layers: { blocks: true } });

    expect(document.querySelectorAll('[data-block]')).toHaveLength(4);
    expect(document.querySelector('[data-block="B2"]')).toHaveAttribute('data-licensed');
    expect(document.querySelector('[data-block="B1"]')).not.toHaveAttribute('data-licensed');
  });

  it('highlights a region and hatches one with no data', () => {
    const regions = [
      { id: 'north-sea', name: 'North Sea', points: [{ lat: 56, lon: 0 }, { lat: 62, lon: 0 }, { lat: 62, lon: 6 }, { lat: 56, lon: 6 }] },
      { id: 'barents', name: 'Barents Sea', noData: true, points: [{ lat: 70, lon: 20 }, { lat: 74, lon: 20 }, { lat: 74, lon: 30 }, { lat: 70, lon: 30 }] },
    ];
    renderMap({ regions, highlightedRegionId: 'north-sea', initialView: { center: { lat: 64, lon: 12 }, scale: 1500 } });

    expect(document.querySelector('[data-region="north-sea"]')).toHaveAttribute('data-active');
    expect(document.querySelector('[data-region="barents"]')).not.toHaveAttribute('data-active');
    expect(screen.queryByText('Barents Sea, no data') ?? document.querySelector('[data-region="barents"] path[fill^="url"]')).toBeTruthy();
  });

  it('shows a loading status instead of the sites', () => {
    renderMap({ loading: true, loadingText: 'Loading sites' });

    expect(screen.getByText('Loading sites')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Nordkapp/ })).not.toBeInTheDocument();
  });

  it('offers no fit button when there are no sites', () => {
    renderMap({ markers: [] });

    expect(screen.queryByRole('button', { name: 'Fit all sites' })).not.toBeInTheDocument();
  });

  it('shows only zoom buttons in the minimal chrome and nothing in none', () => {
    const { container } = render(
      <TooltipProvider>
        <GeoMap label="Minimal map" outlines={OUTLINES} initialView={NORWAY_VIEW} chrome="minimal" />
        <GeoMap label="Bare map" outlines={OUTLINES} initialView={NORWAY_VIEW} chrome="none" />
      </TooltipProvider>
    );

    expect(screen.getAllByRole('button', { name: 'Zoom in' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /Layers/ })).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="geo-map"]')).toHaveLength(2);
  });

  it('shows the legend when given one', () => {
    renderMap({ legend: { statuses: [{ id: 'p', label: 'Producing', tone: 'success', shape: 'dot' }], sizeNote: 'Marker size follows production' } });

    expect(screen.getByRole('region', { name: 'Legend' })).toHaveTextContent('Producing');
  });
});

describe('map parts', () => {
  it('SiteMark draws four distinct shapes', () => {
    const { container } = render(
      <svg>
        {(['dot', 'ring', 'square', 'diamond'] as const).map((shape) => (
          <SiteMark key={shape} x={10} y={10} tone="warning" shape={shape} />
        ))}
      </svg>
    );

    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(container.querySelectorAll('rect')).toHaveLength(2);
    expect(container.querySelector('rect[transform^="rotate"]')).toBeInTheDocument();
  });

  it('SiteMark draws a ring around the selected one', () => {
    const { container } = render(
      <svg>
        <SiteMark x={10} y={10} tone="success" shape="dot" selected />
      </svg>
    );

    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });

  it('SiteMarkSwatch is named only when given a label', () => {
    render(
      <>
        <SiteMarkSwatch tone="critical" shape="diamond" label="Shut in" />
        <SiteMarkSwatch tone="success" shape="dot" />
      </>
    );

    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Shut in' })).toBeInTheDocument();
  });

  it('MapLegend lists statuses with marks and lines with samples', () => {
    render(
      <MapLegend
        statuses={[{ id: 'a', label: 'Shut in', tone: 'critical', shape: 'diamond' }]}
        lines={[
          { id: 'p', label: 'Pipeline', style: 'pipeline' },
          { id: 'i', label: 'Not flowing', style: 'idle' },
        ]}
        sizeNote="Size follows production"
      />
    );

    expect(screen.getByText('Shut in')).toBeInTheDocument();
    expect(screen.getByText('Not flowing')).toBeInTheDocument();
    expect(screen.getByText('Size follows production')).toBeInTheDocument();
  });

  it('MapScaleBar labels the bar and is named for assistive technology', () => {
    render(<MapScaleBar kmPerPixel={3} />);

    expect(screen.getByRole('img', { name: 'Scale: 200 km' })).toBeInTheDocument();
  });

  it('MapScaleBar draws nothing when no bar fits', () => {
    const { container } = render(<MapScaleBar kmPerPixel={0} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('ZoomControls call back and respect disabled states', async () => {
    const handlers = { onZoomIn: vi.fn(), onZoomOut: vi.fn(), onFit: vi.fn(), onHome: vi.fn(), onBack: vi.fn() };
    render(
      <TooltipProvider>
        <ZoomControls {...handlers} canZoomOut={false} canGoBack={false} />
      </TooltipProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fit all sites' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset view' }));

    expect(handlers.onZoomIn).toHaveBeenCalledTimes(1);
    expect(handlers.onFit).toHaveBeenCalledTimes(1);
    expect(handlers.onHome).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous view' })).toBeDisabled();
  });

  it('MapInfoCard shows status in words, figures and a note', () => {
    render(
      <TooltipProvider>
        <MapInfoCard title="Nordkapp" subtitle="Norwegian Sea · Platform" status={{ label: 'Reduced', tone: 'warning', shape: 'square' }} rows={[{ label: 'Production', value: '142 kboe/d' }]} note="Recompressor tripped 14 min ago" onClose={vi.fn()} />
      </TooltipProvider>
    );

    const card = screen.getByRole('region', { name: 'Nordkapp details' });
    expect(within(card).getByText('Reduced')).toBeInTheDocument();
    expect(within(card).getByText('142 kboe/d')).toBeInTheDocument();
    expect(within(card).getByText('Recompressor tripped 14 min ago')).toBeInTheDocument();
  });

  it('LocatorMap is named, draws the focus box and the chosen places', () => {
    const { container } = render(
      <LocatorMap label="Where Nordkapp is" outlines={OUTLINES} view={{ center: { lat: 62, lon: 10 }, scale: 700 }} focus={{ south: 58, north: 70, west: 0, east: 30 }} points={[{ lat: 65.3, lon: 7.2 }]} />
    );

    expect(screen.getByRole('img', { name: 'Where Nordkapp is' })).toBeInTheDocument();
    expect(container.querySelector('polygon')).toBeInTheDocument();
    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });
});

describe('tones', () => {
  it('ranks tones from critical down to neutral', () => {
    expect(worstTone(['success', 'warning', 'neutral'])).toBe('warning');
    expect(worstTone(['info', 'critical', 'warning'])).toBe('critical');
    expect(worstTone([])).toBe('neutral');
  });

  it('picks the most urgent item, the first on a tie', () => {
    const items = [
      { id: 'a', tone: 'success', shape: 'dot' },
      { id: 'b', tone: 'warning', shape: 'square' },
      { id: 'c', tone: 'warning', shape: 'ring' },
    ] as const;
    expect(worstOf(items)?.id).toBe('b');
    expect(worstOf([])).toBeUndefined();
  });

  it('sizes a marker by the square root of its weight, within bounds', () => {
    expect(markerRadius(0, 100)).toBe(5);
    expect(markerRadius(100, 100)).toBe(13);
    expect(markerRadius(25, 100)).toBeCloseTo(9);
    expect(markerRadius(500, 100)).toBe(13);
    expect(markerRadius(10, 0)).toBe(5);
  });

  it('describes a view in one sentence', () => {
    expect(describeView({ zoom: 3.04, centre: '64.0° N, 12.0° E', markers: 5, groups: 3, projection: 'Mercator' })).toBe('Mercator, zoom 3.0, centred on 64.0° N, 12.0° E. 5 sites in view in 3 groups.');
    expect(describeView({ zoom: 6, centre: 'x', markers: 1, groups: 1, projection: 'Mercator' })).toBe('Mercator, zoom 6.0, centred on x. 1 site in view.');
  });
});
