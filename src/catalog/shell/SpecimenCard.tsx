import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconCode } from '@cognite/aura/icons';

import type { Specimen, SpecimenAlign, SpecimenSize, SpecimenSurface } from '../types';

import { FitToWidth } from './FitToWidth';
import { SpecimenBoundary } from './SpecimenBoundary';

const SPAN: Record<SpecimenSize, string> = {
  sm: 'col-span-12 md:col-span-6 xl:col-span-4',
  md: 'col-span-12 xl:col-span-6',
  lg: 'col-span-12 xl:col-span-8',
  full: 'col-span-12',
};

const ALIGN: Record<SpecimenAlign, string> = {
  center: 'items-center justify-center',
  start: 'items-start justify-start',
  // Full width, vertically centred: a lone field should not sit pinned to the top of its frame.
  stretch: 'items-center justify-center [&>*]:min-w-0 [&>*]:w-full',
};

/**
 * The preview is a quiet stage, not a white box: a muted ground with a fine dot pattern, so the
 * edges of the specimen itself are what the eye finds.
 */
const STAGE =
  'bg-[radial-gradient(circle_at_1px_1px,var(--emphasized)_1px,transparent_0)] bg-[length:16px_16px]';

const SURFACE: Record<SpecimenSurface, string> = {
  base: `bg-muted-background ${STAGE}`,
  muted: `bg-medium-background ${STAGE}`,
  chrome: 'bg-popover-background-fixed-dark',
};

type SpecimenCardProps = {
  specimen: Specimen;
  onViewCode: (specimenId: string) => void;
  /**
   * Design width for full-width specimens that are whole screens. In a narrower preview they are
   * scaled down to fit instead of reflowing.
   */
  fitWidth?: number;
};

export function SpecimenCard({ specimen, onViewCode, fitWidth }: SpecimenCardProps) {
  const { id, title, note, origin, size = 'sm', align = 'center', surface = 'base', bleed = false, Component } = specimen;

  return (
    <article
      aria-labelledby={`${id}-title`}
      data-specimen={id}
      className={`${SPAN[size]} flex min-w-0 flex-col overflow-hidden rounded-xl border border-default bg-base-background`}
    >
      <div
        data-specimen-preview
        // Hugs its content: a small part gets comfortable padding, never a tall empty box.
        className={
          bleed
            ? 'flex overflow-x-auto [&>*]:min-w-0 [&>*]:w-full'
            : `flex overflow-x-auto px-6 py-8 ${ALIGN[align]} ${SURFACE[surface]}`
        }
      >
        <SpecimenBoundary>
          {fitWidth !== undefined && size === 'full' ? (
            <FitToWidth designWidth={fitWidth}>
              <Component />
            </FitToWidth>
          ) : (
            <Component />
          )}
        </SpecimenBoundary>
      </div>
      <footer className="flex min-h-20 items-start gap-3 border-t border-default px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 id={`${id}-title`} className="truncate text-sm font-medium text-base-foreground">
              {title}
            </h3>
            {origin === 'custom' ? <Badge variant="secondary">Custom</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{note}</p>
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label={`View code for ${title}`} onClick={() => onViewCode(id)}>
                <IconCode />
              </Button>
            }
          />
          <TooltipContent>View code</TooltipContent>
        </Tooltip>
      </footer>
    </article>
  );
}
