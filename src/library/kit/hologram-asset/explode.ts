/**
 * Layout of an exploded view along one axis. Collapsed, the parts sit end to end as assembled and
 * parts marked `inside` hide within their neighbours; exploded, every part gets its own place with
 * a gap between. Both layouts are centred in the given width so the asset stays in the middle.
 */

export type ExplodePart = { id: string; length: number; inside?: boolean };

export type ExplodeSlot = { id: string; start: number; centre: number; end: number };

const tidy = (value: number): number => Number(value.toFixed(2));

/** Where each part sits along the axis. */
export function layoutParts(parts: readonly ExplodePart[], exploded: boolean, width: number, gap: number): ExplodeSlot[] {
  let cursor = 0;
  const raw = parts.map((part, index) => {
    if (!exploded && part.inside) {
      return { id: part.id, start: cursor - part.length / 2, end: cursor + part.length / 2 };
    }
    const start = cursor;
    cursor += part.length + (exploded && index < parts.length - 1 ? gap : 0);
    return { id: part.id, start, end: start + part.length };
  });
  const total = Math.max(...raw.map((slot) => slot.end), 0);
  const shift = (width - total) / 2;
  return raw.map((slot) => ({
    id: slot.id,
    start: tidy(slot.start + shift),
    centre: tidy((slot.start + slot.end) / 2 + shift),
    end: tidy(slot.end + shift),
  }));
}

/** Centres of `count` evenly spaced label slots across the width. */
export function labelSlots(count: number, width: number): number[] {
  return Array.from({ length: count }, (_, index) => tidy((width * (index + 0.5)) / Math.max(count, 1)));
}

/**
 * Outline of a cylinder lying along the x axis, seen slightly from its right end: a body with a
 * rounded left end, and the right end cap as a separate ellipse (`capRx` wide).
 */
export function cylinderBody(start: number, end: number, cy: number, radius: number, squash = 0.26): string {
  const rx = tidy(radius * squash);
  return `M ${start} ${cy - radius} L ${end} ${cy - radius} A ${rx} ${radius} 0 0 1 ${end} ${cy + radius} L ${start} ${cy + radius} A ${rx} ${radius} 0 0 1 ${start} ${cy - radius} Z`;
}
