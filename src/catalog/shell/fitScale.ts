export type Fit = { scale: number; width: number | null };

/**
 * How to show a screen designed for `designWidth` in a container `containerWidth` wide: at its
 * natural size when there is room, otherwise laid out at the design width and scaled down so it
 * stays a correct miniature instead of reflowing into a layout it was never drawn for.
 */
export function fitScale(containerWidth: number | null, designWidth: number): Fit {
  if (containerWidth === null || containerWidth <= 0 || containerWidth >= designWidth) {
    return { scale: 1, width: null };
  }
  return { scale: containerWidth / designWidth, width: designWidth };
}
