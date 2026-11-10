import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cognite/aura/components/breadcrumb';
import { IconChevronRight } from '@cognite/aura/icons';
import { Fragment } from 'react';

import { cn } from '../../../lib/utils';
import { CopyButton } from '../../actions/CopyButton';

import { LEVEL_LABEL, formatPath } from './hierarchy';
import type { DrillNode } from './hierarchy';

export type PathBarProps = {
  /** The path from the root to the current node. */
  nodes: readonly DrillNode[];
  /** Called with the id of an ancestor when it is picked. */
  onSelect: (id: string) => void;
  /** Adds a button that copies the path as text: "NK / NK-23 / 23-KA-9101". */
  copyable?: boolean;
  writeText?: (text: string) => Promise<void>;
  /** Accessible name of the trail. */
  label?: string;
  className?: string;
};

/**
 * Where you are in the hierarchy, as a trail of tag and name per level. Every ancestor is one
 * click away; the last item is the current node and is not a link.
 */
export function PathBar({ nodes, onSelect, copyable = false, writeText, label = 'Location', className }: PathBarProps) {
  return (
    <div data-slot="path-bar" className={cn('flex min-w-0 items-center gap-2', className)}>
      <Breadcrumb aria-label={label} className="min-w-0 flex-1">
        <BreadcrumbList>
          {nodes.map((node, index) => {
            const isCurrent = index === nodes.length - 1;
            const content = (
              <>
                <span className="font-mono text-xs">{node.tag}</span>
                <span>{node.name}</span>
              </>
            );
            return (
              <Fragment key={node.id}>
                {index > 0 ? (
                  <BreadcrumbSeparator>
                    <IconChevronRight className="text-muted-foreground" />
                  </BreadcrumbSeparator>
                ) : null}
                <BreadcrumbItem>
                  {isCurrent ? (
                    <BreadcrumbPage aria-label={`${LEVEL_LABEL[node.level]}: ${node.tag} ${node.name}`}>{content}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={<button type="button" />}
                      aria-label={`Go up to ${LEVEL_LABEL[node.level].toLowerCase()} ${node.tag} ${node.name}`}
                      onClick={() => onSelect(node.id)}
                    >
                      {content}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      {copyable ? <CopyButton text={formatPath(nodes)} label="Copy path" iconOnly variant="ghost" size="icon-sm" writeText={writeText} /> : null}
    </div>
  );
}
