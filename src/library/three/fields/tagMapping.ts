/** Which half of a linked view something lives in. */
export type LinkSide = 'drawing' | 'scene';

/**
 * One row of the table that ties a drawing to a 3D model. The functional location tag is the
 * common key; either id may be `null` when the item is missing on that side.
 */
export type TagLink = {
  /** Functional location tag, e.g. `23-KA-9101`. */
  tag: string;
  /** Id of the symbol on the drawing, or `null` when the drawing does not show it. */
  drawingId: string | null;
  /** Id of the object in the 3D model, or `null` when it is not modelled. */
  sceneId: string | null;
};

const idOn = (link: TagLink, side: LinkSide): string | null => (side === 'drawing' ? link.drawingId : link.sceneId);

/** The row for a tag; `null` when the tag is unknown. */
export function linkForTag(links: readonly TagLink[], tag: string | null): TagLink | null {
  if (tag === null) return null;
  return links.find((link) => link.tag === tag) ?? null;
}

/** The id an item has on one side; `null` when it is unknown or missing there. */
export function idForTag(links: readonly TagLink[], tag: string | null, side: LinkSide): string | null {
  const link = linkForTag(links, tag);
  return link ? idOn(link, side) : null;
}

/** The tag behind an id on one side; `null` for an unknown id. */
export function tagForId(links: readonly TagLink[], id: string | null, side: LinkSide): string | null {
  if (id === null) return null;
  return links.find((link) => idOn(link, side) === id)?.tag ?? null;
}

/** The id on the other side for an id on this one: drawing symbol → scene object, or back. */
export function counterpartId(links: readonly TagLink[], id: string | null, from: LinkSide): string | null {
  return idForTag(links, tagForId(links, id, from), from === 'drawing' ? 'scene' : 'drawing');
}

/** Every tag that exists on a side. */
export function tagsOn(links: readonly TagLink[], side: LinkSide): string[] {
  return links.filter((link) => idOn(link, side) !== null).map((link) => link.tag);
}

/** Every id on a side, in table order. */
export function idsOn(links: readonly TagLink[], side: LinkSide): string[] {
  return links.flatMap((link) => {
    const id = idOn(link, side);
    return id === null ? [] : [id];
  });
}

/** Problems in the table itself: a tag or an id used twice, or a row that exists on neither side. */
export function mappingProblems(links: readonly TagLink[]): string[] {
  const problems: string[] = [];
  const seen = { tag: new Set<string>(), drawing: new Set<string>(), scene: new Set<string>() };
  for (const link of links) {
    if (seen.tag.has(link.tag)) problems.push(`Tag ${link.tag} is listed twice`);
    seen.tag.add(link.tag);
    if (link.drawingId === null && link.sceneId === null) problems.push(`Tag ${link.tag} is on neither side`);
    if (link.drawingId !== null) {
      if (seen.drawing.has(link.drawingId)) problems.push(`Drawing id ${link.drawingId} is mapped twice`);
      seen.drawing.add(link.drawingId);
    }
    if (link.sceneId !== null) {
      if (seen.scene.has(link.sceneId)) problems.push(`Scene id ${link.sceneId} is mapped twice`);
      seen.scene.add(link.sceneId);
    }
  }
  return problems;
}
