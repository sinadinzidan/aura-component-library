import type { ReactNode } from 'react';

type ContentContainerProps = {
  /**
   * The widest the page may get, from Aura's layout guide: `form` (max-w-2xl) for forms and
   * wizard steps, `detail` (max-w-4xl) for record pages, `wide` (max-w-7xl) for lists and
   * dashboards, `full` for pages that use every pixel.
   */
  width?: 'form' | 'detail' | 'wide' | 'full';
  /** `page` is the standard desktop padding, `compact` the mobile one, `none` for flush panes. */
  padding?: 'page' | 'compact' | 'none';
  /** Space between the page's sections: `sections` within a page, `groups` between form groups. */
  gap?: 'sections' | 'groups';
  children: ReactNode;
};

const WIDTH = { form: 'max-w-2xl', detail: 'max-w-4xl', wide: 'max-w-7xl', full: 'max-w-none' } as const;
const PADDING = { page: 'px-6 py-8', compact: 'px-4 py-6', none: '' } as const;
const GAP = { sections: 'gap-6', groups: 'gap-8' } as const;

/**
 * The centred column a page's content sits in: one of four maximum widths, the standard page
 * padding and one gap between sections. Using it on every page is what makes headers and content
 * edges line up when people move between screens.
 */
export function ContentContainer({ width = 'wide', padding = 'page', gap = 'sections', children }: ContentContainerProps) {
  return (
    <div
      data-slot="content-container"
      data-width={width}
      className={`mx-auto flex w-full min-w-0 flex-col ${WIDTH[width]} ${PADDING[padding]} ${GAP[gap]}`}
    >
      {children}
    </div>
  );
}
