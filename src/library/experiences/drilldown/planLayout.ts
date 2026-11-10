import type { DrillNode, DrillTree } from './hierarchy';

/**
 * Pure geometry for the semantic-zoom plot plan: where every area, piece of equipment and
 * measurement point sits in world units, and the viewport that frames a node at its level.
 */

export type PlanRect = { x: number; y: number; width: number; height: number };

export type PlanPlace = {
  /** The block (area), slot (equipment) or hit box (sensor) in world units. */
  rect: PlanRect;
  /** Anchor: centre of a block or machine, the measurement point itself for a sensor. */
  cx: number;
  cy: number;
  /** Which side of its machine a measurement point sits on. */
  side?: 'left' | 'right';
};

export type PlanLayout = {
  world: { width: number; height: number };
  places: ReadonlyMap<string, PlanPlace>;
};

export type PlanOptions = {
  width?: number;
  height?: number;
  /** Space around the plan and between area blocks. */
  margin?: number;
  gap?: number;
  /** Band at the top of an area block kept free for its title. */
  header?: number;
  /** Equipment slots per row inside an area. */
  columns?: number;
  /** Distance from a machine's centre to its measurement points, and between their rows. */
  sensorOffset?: number;
  sensorGap?: number;
};

/** How far each level zooms in: the world is this many times wider than the viewport. */
export const PLAN_ZOOM = { site: 1, area: 2, equipment: 5, sensor: 9 } as const;

/** Air kept around a block or slot when a viewport is fitted to it. */
const FIT_PADDING = 1.04;

/** Where the selected measurement point sits across the viewport, leaving room for its card. */
export const SENSOR_ANCHOR_X = 0.27;

/**
 * Lays the tree out as a plot plan: areas in a near-square grid of equal blocks, equipment in
 * rows of slots inside its area (short rows are centred), and measurement points stacked to the
 * left and right of their machine.
 */
export function layoutPlan(tree: DrillTree, options: PlanOptions = {}): PlanLayout {
  const { width = 1000, height = 600, margin = 24, gap = 28, header = 44, columns = 3, sensorOffset = 30, sensorGap = 13 } = options;
  const places = new Map<string, PlanPlace>();
  places.set(tree.root.id, { rect: { x: 0, y: 0, width, height }, cx: width / 2, cy: height / 2 });

  const areas = tree.root.children;
  const areaColumns = Math.max(1, Math.ceil(Math.sqrt(areas.length)));
  const areaRows = Math.max(1, Math.ceil(areas.length / areaColumns));
  const blockWidth = (width - margin * 2 - gap * (areaColumns - 1)) / areaColumns;
  const blockHeight = (height - margin * 2 - gap * (areaRows - 1)) / areaRows;

  areas.forEach((area, areaIndex) => {
    const block: PlanRect = {
      x: margin + (areaIndex % areaColumns) * (blockWidth + gap),
      y: margin + Math.floor(areaIndex / areaColumns) * (blockHeight + gap),
      width: blockWidth,
      height: blockHeight,
    };
    places.set(area.id, { rect: block, cx: block.x + block.width / 2, cy: block.y + block.height / 2 });

    const rows = Math.max(2, Math.ceil(area.children.length / columns));
    const slotWidth = block.width / columns;
    const slotHeight = (block.height - header) / rows;

    area.children.forEach((equipment, index) => {
      const row = Math.floor(index / columns);
      const inRow = Math.min(columns, area.children.length - row * columns);
      const indent = ((columns - inRow) * slotWidth) / 2;
      const slot: PlanRect = {
        x: block.x + indent + (index % columns) * slotWidth,
        y: block.y + header + row * slotHeight,
        width: slotWidth,
        height: slotHeight,
      };
      const cx = slot.x + slot.width / 2;
      const cy = slot.y + slot.height / 2;
      places.set(equipment.id, { rect: slot, cx, cy });

      const leftCount = Math.ceil(equipment.children.length / 2);
      const rightCount = equipment.children.length - leftCount;
      equipment.children.forEach((sensor, sensorIndex) => {
        const side = sensorIndex % 2 === 0 ? 'left' : 'right';
        const count = side === 'left' ? leftCount : rightCount;
        const x = cx + (side === 'left' ? -sensorOffset : sensorOffset);
        const y = cy + (Math.floor(sensorIndex / 2) - (count - 1) / 2) * sensorGap;
        const reach = slot.width / 2 - sensorOffset;
        places.set(sensor.id, {
          rect: { x: side === 'left' ? x - reach : x, y: y - sensorGap / 2, width: reach, height: sensorGap },
          cx: x,
          cy: y,
          side,
        });
      });
    });
  });

  return { world: { width, height }, places };
}

/** The viewport that frames a node: the whole plan for the site, tighter at each level below. */
export function viewportFor(layout: PlanLayout, node: Pick<DrillNode, 'id' | 'level'>): PlanRect {
  const { world } = layout;
  const place = layout.places.get(node.id);
  if (!place || node.level === 'site') return { x: 0, y: 0, width: world.width, height: world.height };
  // Never zoom past what still shows the whole block or slot, however the plan is proportioned.
  const fit = Math.min(world.width / (place.rect.width * FIT_PADDING), world.height / (place.rect.height * FIT_PADDING));
  const zoom = node.level === 'sensor' ? PLAN_ZOOM.sensor : Math.min(PLAN_ZOOM[node.level], fit);
  const width = world.width / zoom;
  const height = world.height / zoom;
  if (node.level === 'sensor') return { x: place.cx - width * SENSOR_ANCHOR_X, y: place.cy - height / 2, width, height };
  return { x: place.cx - width / 2, y: place.cy - height / 2, width, height };
}

/** Zoom factor of a viewport: 1 shows the whole world. */
export const viewportScale = (layout: PlanLayout, viewport: PlanRect): number => layout.world.width / viewport.width;

/** A world point in view units (the SVG's own coordinate system, as wide as the world). */
export function project(layout: PlanLayout, viewport: PlanRect, x: number, y: number): { x: number; y: number } {
  const scale = viewportScale(layout, viewport);
  return { x: (x - viewport.x) * scale, y: (y - viewport.y) * scale };
}

/** A world rectangle in view units. */
export function projectRect(layout: PlanLayout, viewport: PlanRect, rect: PlanRect): PlanRect {
  const scale = viewportScale(layout, viewport);
  return { x: (rect.x - viewport.x) * scale, y: (rect.y - viewport.y) * scale, width: rect.width * scale, height: rect.height * scale };
}

/**
 * Interpolates between two viewports so the zoom feels even: the width moves geometrically (the
 * same zoom ratio per step) and the centre follows it, instead of racing ahead of the scale.
 */
export function mixViewport(from: PlanRect, to: PlanRect, progress: number): PlanRect {
  if (progress <= 0) return from;
  if (progress >= 1) return to;
  const width = from.width * (to.width / from.width) ** progress;
  const height = from.height * (to.height / from.height) ** progress;
  const travelled = to.width === from.width ? progress : (width - from.width) / (to.width - from.width);
  const mix = (a: number, b: number): number => a + (b - a) * travelled;
  return { x: mix(from.x, to.x), y: mix(from.y, to.y), width, height };
}

/** 0 below `from`, 1 above `to`, linear between: how visible a detail layer is at a zoom factor. */
export function reveal(scale: number, from: number, to: number): number {
  if (to === from) return scale >= to ? 1 : 0;
  return Math.min(1, Math.max(0, (scale - from) / (to - from)));
}
