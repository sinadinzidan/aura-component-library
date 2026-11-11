import { bottom } from './gridLayout';
import type { GridItem } from './gridLayout';

type LayoutThumbnailProps = {
  /** What the thumbnail shows: "Operations layout, 6 widgets". */
  label: string;
  items: readonly GridItem[];
  cols?: number;
  /** Tailwind height of the thumbnail. */
  heightClassName?: string;
};

/**
 * A miniature of a dashboard layout: one neutral block per widget, placed and sized as on the
 * real grid. It shows the arrangement only, so a layout can be recognised before it is applied.
 */
export function LayoutThumbnail({ label, items, cols = 12, heightClassName = 'h-20' }: LayoutThumbnailProps) {
  const rows = Math.max(bottom(items), 1);
  return (
    <div
      role="img"
      aria-label={label}
      data-slot="layout-thumbnail"
      className={`grid w-full gap-0.5 rounded-md bg-muted-background p-1 ${heightClassName}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <span
          key={item.id}
          data-slot="layout-thumbnail-item"
          className="rounded-xs bg-medium-background"
          style={{ gridColumn: `${item.x + 1} / span ${item.w}`, gridRow: `${item.y + 1} / span ${item.h}` }}
        />
      ))}
    </div>
  );
}
