import { scaleBar } from './scaleBar';

type MapScaleBarProps = {
  /** Ground distance one pixel covers at the middle of the map, from `kilometresPerPixel`. */
  kmPerPixel: number;
  /** The longest the bar may be, in pixels. */
  maxPixels?: number;
};

/**
 * A scale bar with a round-numbered length that is true for the map's latitude. It never draws
 * wider than `maxPixels`, so it changes length and label as the map zooms.
 */
export function MapScaleBar({ kmPerPixel, maxPixels = 110 }: MapScaleBarProps) {
  const bar = scaleBar(kmPerPixel, maxPixels);
  if (!bar) return null;
  return (
    <div data-slot="scale-bar" className="flex flex-col gap-1" role="img" aria-label={`Scale: ${bar.label}`}>
      <span className="text-xs tabular-nums text-medium-foreground">{bar.label}</span>
      <span aria-hidden="true" className="block h-1.5 border-x border-b border-emphasized" style={{ width: bar.pixels }} />
    </div>
  );
}
