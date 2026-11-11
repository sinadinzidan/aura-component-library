/** Side of the chart's own coordinate box. */
export const SUNBURST_SIZE = 680;

/** Font size of arc labels in that box when the chart is drawn at full size. */
export const SUNBURST_FONT = 14;

/**
 * Font size, in chart units, that keeps arc labels at a readable 12.5 px or more when the chart
 * is drawn `displaySize` pixels wide.
 */
export function labelFontSize(displaySize: number): number {
  if (displaySize <= 0) return SUNBURST_FONT;
  return Math.max(SUNBURST_FONT, Math.round((12.5 * SUNBURST_SIZE) / displaySize));
}

/** The label that fits along an arc at this font size: the full one, the short one, or none. */
export function fittingLabel(datum: { label: string; short?: string }, room: number, thickness: number, font: number = SUNBURST_FONT): string | null {
  if (thickness < font + 8) return null;
  const width = (text: string) => text.length * font * 0.56 + font;
  if (width(datum.label) <= room) return datum.label;
  if (datum.short && width(datum.short) <= room) return datum.short;
  return null;
}
