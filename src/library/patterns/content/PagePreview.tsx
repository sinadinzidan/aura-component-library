import { IconPhoto } from '@cognite/aura/icons';

type PagePreviewProps = {
  /** What the placeholder stands for: "First page of the bearing inspection procedure". */
  label: string;
  /** The kind of content, so a grid of previews is not a wall of identical pages. */
  variant?: 'text' | 'drawing' | 'table' | 'image';
  orientation?: 'portrait' | 'landscape';
};

const TEXT_LINES = ['w-2/5', 'w-full', 'w-11/12', 'w-full', 'w-3/4', 'w-0', 'w-full', 'w-5/6', 'w-full', 'w-2/3'] as const;
const TABLE_ROWS = [0, 1, 2, 3, 4, 5] as const;

/**
 * A stand-in for a page thumbnail while there is no rendered preview: a sheet in the right
 * proportion with lines, a table grid or a schematic drawn from tokens. It fills the width it is
 * given and never loads an image, so it is also the loading and the "no preview" state.
 */
export function PagePreview({ label, variant = 'text', orientation = 'portrait' }: PagePreviewProps) {
  const ratio = orientation === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]';

  return (
    <div
      role="img"
      aria-label={label}
      data-slot="page-preview"
      data-variant={variant}
      className={`flex w-full flex-col overflow-hidden rounded-md border border-default bg-base-background ${ratio}`}
    >
      {variant === 'text' ? (
        <div className="flex flex-1 flex-col gap-2 p-4">
          {TEXT_LINES.map((width, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full ${width} ${index === 0 ? 'bg-emphasized-background' : 'bg-medium-background'}`}
            />
          ))}
        </div>
      ) : null}
      {variant === 'table' ? (
        <div className="flex flex-1 flex-col gap-2 p-4">
          <span className="h-1.5 w-1/3 rounded-full bg-emphasized-background" />
          <div className="flex flex-col gap-1.5 pt-1">
            {TABLE_ROWS.map((row) => (
              <div key={row} className="grid grid-cols-4 gap-2 border-b border-default pb-1.5">
                <span className="h-1.5 rounded-full bg-medium-background" />
                <span className="h-1.5 rounded-full bg-medium-background" />
                <span className="h-1.5 w-2/3 rounded-full bg-medium-background" />
                <span className="h-1.5 w-1/2 justify-self-end rounded-full bg-medium-background" />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {variant === 'drawing' ? (
        <svg viewBox="0 0 120 90" aria-hidden="true" className="size-full p-2 text-muted-foreground" fill="none" stroke="currentColor">
          <rect x="2" y="2" width="116" height="86" strokeWidth="1" />
          <rect x="14" y="20" width="16" height="34" rx="8" strokeWidth="1.5" />
          <circle cx="62" cy="37" r="9" strokeWidth="1.5" />
          <path d="M57 42 L62 30 L67 42" strokeWidth="1.5" />
          <rect x="88" y="26" width="18" height="22" strokeWidth="1.5" />
          <path d="M30 37 H40 M48 37 H53 M71 37 H88 M97 48 V64 H22 V54" strokeWidth="1.5" />
          <path d="M40 33 L48 41 V33 L40 41 Z" strokeWidth="1.5" />
          <path d="M76 70 H118 M76 70 V88 M76 79 H118 M98 70 V88" strokeWidth="1" />
        </svg>
      ) : null}
      {variant === 'image' ? (
        <div className="flex flex-1 items-center justify-center bg-medium-background text-muted-foreground">
          <IconPhoto aria-hidden="true" className="size-8" />
        </div>
      ) : null}
    </div>
  );
}
