import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbEllipsisButton,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cognite/aura/components/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { Fragment } from 'react';
import type { MouseEvent, ReactNode } from 'react';

export type BreadcrumbTrailItem = {
  id: string;
  label: string;
  /** Real URL for the ancestor page, so it can be opened in a new tab. */
  href?: string;
  icon?: ReactNode;
};

type CollapsingBreadcrumbProps = {
  /** The trail from the root to the current page. The last item is the current page. */
  items: readonly BreadcrumbTrailItem[];
  /** Called for ancestors instead of following `href`, for in-app routing. */
  onNavigate?: (item: BreadcrumbTrailItem) => void;
  /** Longest trail shown in full. Longer trails keep the first item and the last two. */
  maxVisible?: number;
  /** Labels longer than this are cut with an ellipsis and get a tooltip with the full text. */
  maxLabelLength?: number;
  /** Accessible name of the overflow button. */
  hiddenLabel?: string;
};

const KEPT_AT_END = 2;

/**
 * A breadcrumb that follows Aura's overflow rules from a plain list of pages: deep trails fold
 * their middle into a menu behind an ellipsis, long labels truncate with a tooltip, and the last
 * item is rendered as the current page, never as a link.
 */
export function CollapsingBreadcrumb({
  items,
  onNavigate,
  maxVisible = 4,
  maxLabelLength = 24,
  hiddenLabel = 'Show hidden pages',
}: CollapsingBreadcrumbProps) {
  if (items.length === 0) return null;

  const collapse = items.length > Math.max(maxVisible, KEPT_AT_END + 1);
  const head = collapse ? items.slice(0, 1) : [];
  const hidden = collapse ? items.slice(1, -KEPT_AT_END) : [];
  const tail = collapse ? items.slice(-KEPT_AT_END) : items;
  const currentId = items[items.length - 1].id;

  const follow = (item: BreadcrumbTrailItem) => (event: MouseEvent) => {
    if (!onNavigate) return;
    event.preventDefault();
    onNavigate(item);
  };

  const renderLabel = (item: BreadcrumbTrailItem) => {
    const long = item.label.length > maxLabelLength;
    const text = long ? <span className="block max-w-36 truncate">{item.label}</span> : item.label;
    const content = (
      <>
        {item.icon}
        {text}
      </>
    );
    const crumb =
      item.id === currentId ? (
        <BreadcrumbPage>{content}</BreadcrumbPage>
      ) : (
        <BreadcrumbLink
          href={item.href}
          render={item.href ? undefined : <button type="button" />}
          onClick={follow(item)}
        >
          {content}
        </BreadcrumbLink>
      );
    if (!long) return crumb;
    return (
      <Tooltip>
        <TooltipTrigger render={crumb} />
        <TooltipContent>{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap">
        {head.map((item) => (
          <Fragment key={item.id}>
            <BreadcrumbItem className="whitespace-nowrap">{renderLabel(item)}</BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        {collapse ? (
          <>
            <BreadcrumbEllipsis>
              <DropdownMenu>
                <DropdownMenuTrigger render={<BreadcrumbEllipsisButton aria-label={hiddenLabel} />} />
                <DropdownMenuContent align="start">
                  {hidden.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      render={item.href ? <a href={item.href} /> : undefined}
                      onClick={follow(item)}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbEllipsis>
            <BreadcrumbSeparator />
          </>
        ) : null}
        {tail.map((item, index) => (
          <Fragment key={item.id}>
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem className="whitespace-nowrap">{renderLabel(item)}</BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
