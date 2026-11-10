import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconCode } from '@cognite/aura/icons';

import type { Specimen, SpecimenAlign, SpecimenSize, SpecimenSurface } from '../types';

import { SpecimenBoundary } from './SpecimenBoundary';

const SPAN: Record<SpecimenSize, string> = {
  sm: 'col-span-12 md:col-span-6 xl:col-span-4',
  md: 'col-span-12 xl:col-span-6',
  lg: 'col-span-12 xl:col-span-8',
  full: 'col-span-12',
};

const MIN_HEIGHT: Record<SpecimenSize, string> = {
  sm: 'min-h-40',
  md: 'min-h-48',
  lg: 'min-h-56',
  full: 'min-h-56',
};

const ALIGN: Record<SpecimenAlign, string> = {
  center: 'items-center justify-center',
  start: 'items-start justify-start',
  stretch: 'items-stretch justify-stretch [&>*]:min-w-0 [&>*]:flex-1',
};

const SURFACE: Record<SpecimenSurface, string> = {
  base: 'bg-base-background',
  muted: 'bg-muted-background',
  chrome: 'bg-popover-background-fixed-dark',
};

type SpecimenCardProps = {
  specimen: Specimen;
  onViewCode: (specimenId: string) => void;
};

export function SpecimenCard({ specimen, onViewCode }: SpecimenCardProps) {
  const { id, title, note, origin, size = 'sm', align = 'center', surface = 'base', Component } = specimen;

  return (
    <article
      aria-labelledby={`${id}-title`}
      data-specimen={id}
      className={`${SPAN[size]} flex min-w-0 flex-col overflow-hidden rounded-xl border border-default bg-base-background`}
    >
      <div className={`flex flex-1 p-6 ${MIN_HEIGHT[size]} ${ALIGN[align]} ${SURFACE[surface]}`}>
        <SpecimenBoundary>
          <Component />
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
