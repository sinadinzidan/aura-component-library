/** The result of comparing the tags on a drawing with the tags in a 3D model. */
export type TagDiff = {
  /** On both sides. */
  matched: string[];
  /** On the drawing but not in the model: not modelled yet, or deleted from the model. */
  drawingOnly: string[];
  /** In the model but not on the drawing: the drawing is out of date, or the tag is wrong. */
  modelOnly: string[];
};

export type ModelCheckKind = 'missing-in-model' | 'missing-on-drawing';

export type ModelCheckFinding = { tag: string; kind: ModelCheckKind; message: string };

const normalise = (tag: string): string => tag.trim().toUpperCase();

function unique(tags: readonly string[]): string[] {
  return [...new Set(tags.map(normalise).filter((tag) => tag !== ''))];
}

/**
 * Compares two tag sets, the way a digital-twin quality check does. Tags are compared without
 * regard to case or surrounding space, duplicates count once, and each list comes back sorted.
 */
export function diffTagSets(drawingTags: readonly string[], modelTags: readonly string[]): TagDiff {
  const drawing = unique(drawingTags);
  const model = unique(modelTags);
  const inModel = new Set(model);
  const onDrawing = new Set(drawing);
  const sort = (tags: string[]): string[] => tags.sort((a, b) => a.localeCompare(b));
  return {
    matched: sort(drawing.filter((tag) => inModel.has(tag))),
    drawingOnly: sort(drawing.filter((tag) => !inModel.has(tag))),
    modelOnly: sort(model.filter((tag) => !onDrawing.has(tag))),
  };
}

/** The mismatches as a list a person can act on, drawing-side findings first. */
export function modelCheckFindings(diff: TagDiff): ModelCheckFinding[] {
  return [
    ...diff.drawingOnly.map((tag) => ({ tag, kind: 'missing-in-model' as const, message: 'On the drawing, not in the 3D model' })),
    ...diff.modelOnly.map((tag) => ({ tag, kind: 'missing-on-drawing' as const, message: 'In the 3D model, not on the drawing' })),
  ];
}

/** Share of all tags that are on both sides, 0–1. An empty comparison counts as complete. */
export function matchRate(diff: TagDiff): number {
  const total = diff.matched.length + diff.drawingOnly.length + diff.modelOnly.length;
  return total === 0 ? 1 : diff.matched.length / total;
}
