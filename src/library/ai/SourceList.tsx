import type { InlineCitationLinkProps } from '@cognite/aura/components/inline-citation';
import { Source, Sources, SourcesTitle } from '@cognite/aura/components/sources';
import { IconBinaryTree, IconCalendarEvent, IconChartLine, IconFileText, IconWorld } from '@cognite/aura/icons';

export type SourceKind = 'web' | 'file' | 'timeseries' | 'asset' | 'event';

export type SourceItem = {
  id: string;
  title: string;
  href: string;
  /** What the source is. Sets the icon and the colour, so kinds can be told apart at a glance. */
  kind?: SourceKind;
};

type SourceListProps = {
  sources: readonly SourceItem[];
  /** Fold the list behind its count. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Overrides the "4 sources" title. */
  title?: string;
};

const KIND_STYLE: Record<SourceKind, Pick<InlineCitationLinkProps, 'icon' | 'variant'>> = {
  web: { icon: IconWorld, variant: 'decorative-1' },
  file: { icon: IconFileText, variant: 'decorative-2' },
  timeseries: { icon: IconChartLine, variant: 'decorative-3' },
  asset: { icon: IconBinaryTree, variant: 'decorative-4' },
  event: { icon: IconCalendarEvent, variant: 'decorative-5' },
};

/**
 * Typed sources behind an answer: counts them in the title and gives each kind of source — web
 * page, file, time series, asset, event — its own icon and decorative colour.
 */
export function SourceList({ sources, collapsible = false, defaultOpen = false, title }: SourceListProps) {
  if (sources.length === 0) return null;

  const heading = title ?? (sources.length === 1 ? '1 source' : `${sources.length} sources`);

  return (
    <Sources collapsible={collapsible} defaultOpen={defaultOpen} title={<SourcesTitle title={heading} />}>
      {sources.map((source) => {
        const { icon, variant } = KIND_STYLE[source.kind ?? 'web'];
        return (
          <Source key={source.id} href={source.href} icon={icon} variant={variant}>
            {source.title}
          </Source>
        );
      })}
    </Sources>
  );
}
