import { Avatar, AvatarIcon } from '@cognite/aura/components/avatar';
import {
  Card,
  CardActions,
  CardContent,
  CardDescription,
  CardFooter,
  CardFooterEnd,
  CardFooterStart,
  CardHeader,
  CardHeaderCenter,
  CardHeaderEnd,
  CardHeaderStart,
  CardTitle,
} from '@cognite/aura/components/card';
import { CheckboxItemControl } from '@cognite/aura/components/checkbox';
import type { ReactNode } from 'react';

type EntityCardProps = {
  title: string;
  /** Identifier, owner or type under the title. */
  description?: ReactNode;
  /** Icon for the kind of entity. Rendered in a neutral avatar. */
  icon?: ReactNode;
  /** Replaces `icon` when the entity has its own avatar, such as a person. */
  leading?: ReactNode;
  /** State of the entity, as a badge. Never a coloured border. */
  status?: ReactNode;
  /** `DropdownMenuItem`s for the overflow menu in the header. */
  menu?: ReactNode;
  menuLabel?: string;
  /** Thumbnail or preview. Sits above the header, or beside it when horizontal. */
  media?: ReactNode;
  /** Card body: metadata, a trend, a short list. */
  children?: ReactNode;
  /** Quiet text at the start of the footer, such as when it was last updated. */
  footerNote?: ReactNode;
  /** One or two buttons at the end of the footer. */
  footerActions?: ReactNode;
  /** `horizontal` puts the media beside the text, for wide rows of few cards. */
  orientation?: 'vertical' | 'horizontal';
  /** Adds a checkbox to the header and outlines the card while it is checked. */
  selection?: { checked: boolean; onChange: (checked: boolean) => void; label: string };
};

/**
 * A card for one entity (asset, data set, pipeline, dashboard, person, site): icon, name and
 * identifier in the header, state as a badge, a free body and an optional footer that stays at
 * the bottom so cards in a grid line up. One anatomy for every entity keeps a grid scannable.
 */
export function EntityCard({
  title,
  description,
  icon,
  leading,
  status,
  menu,
  menuLabel = 'Card actions',
  media,
  children,
  footerNote,
  footerActions,
  orientation = 'vertical',
  selection,
}: EntityCardProps) {
  const horizontal = orientation === 'horizontal';
  const hasFooter = Boolean(footerNote) || Boolean(footerActions);
  const hasEnd = Boolean(status) || Boolean(menu) || selection !== undefined;

  const text = (
    <>
      <CardHeader>
        {leading || icon ? (
          <CardHeaderStart>
            {leading ?? (
              <Avatar variant="overflow" aria-hidden="true">
                <AvatarIcon>{icon}</AvatarIcon>
              </Avatar>
            )}
          </CardHeaderStart>
        ) : null}
        <CardHeaderCenter>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeaderCenter>
        {hasEnd ? (
          <CardHeaderEnd className="items-center">
            {status}
            {menu ? <CardActions aria-label={menuLabel}>{menu}</CardActions> : null}
            {selection ? (
              <CheckboxItemControl
                aria-label={selection.label}
                checked={selection.checked}
                onCheckedChange={(checked) => selection.onChange(checked)}
              />
            ) : null}
          </CardHeaderEnd>
        ) : null}
      </CardHeader>
      {children ? <CardContent>{children}</CardContent> : null}
      {hasFooter ? (
        <CardFooter className="mt-auto">
          <CardFooterStart>
            {footerNote ? <span className="text-xs text-muted-foreground">{footerNote}</span> : null}
          </CardFooterStart>
          {footerActions ? <CardFooterEnd className="gap-2">{footerActions}</CardFooterEnd> : null}
        </CardFooter>
      ) : null}
    </>
  );

  return (
    <div
      data-slot="entity-card"
      data-selected={selection?.checked ? '' : undefined}
      className="h-full min-w-0 rounded-xl ring-2 ring-transparent transition-shadow data-selected:ring-primary-background"
    >
      <Card className={horizontal ? 'h-full flex-row items-stretch' : 'h-full'}>
        {media ? <div className={horizontal ? 'flex w-2/5 shrink-0' : 'flex w-full'}>{media}</div> : null}
        {horizontal ? <div className="flex min-w-0 flex-1 flex-col gap-4">{text}</div> : text}
      </Card>
    </div>
  );
}
