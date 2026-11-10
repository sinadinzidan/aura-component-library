import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconChevronRight } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

export type SidebarNavItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** A quiet number at the end of the row: open work orders, unread items. */
  count?: number;
  /** Replaces the count with a component, for example a status `Count` for active alarms. */
  trailing?: ReactNode;
  /** Makes the row a real link, so it can be opened in a new tab. */
  href?: string;
  disabled?: boolean;
  /** One nested level. A parent row expands and collapses; it does not navigate. */
  children?: readonly SidebarNavItem[];
};

export type SidebarNavGroup = {
  id: string;
  /** Section label. Leave out for the first, unlabelled group. */
  label?: string;
  /** Lets people fold the group away by pressing its label. */
  collapsible?: boolean;
  items: readonly SidebarNavItem[];
};

export type SidebarNavTone = 'light' | 'dark';

type SidebarNavProps = {
  /** Accessible name of the navigation, for example "Main" or "Settings". */
  label: string;
  groups: readonly SidebarNavGroup[];
  /** The current page. */
  activeId?: string;
  onSelect?: (id: string) => void;
  /** Icon rail: labels move into tooltips and group labels become rules. */
  collapsed?: boolean;
  /** `dark` uses the fixed-dark shell tokens and stays dark in both themes. */
  tone?: SidebarNavTone;
  /** Parent rows that start expanded. The parent of the active page is always expanded. */
  defaultExpandedIds?: readonly string[];
  /** Collapsible groups that start folded. */
  defaultCollapsedGroupIds?: readonly string[];
};

const TONES: Record<
  SidebarNavTone,
  { row: string; active: string; quiet: string; rule: string; disabled: string }
> = {
  light: {
    row: 'text-medium-foreground hover:bg-base-background-hover hover:text-base-foreground',
    active: 'bg-secondary-background font-medium text-secondary-foreground',
    quiet: 'text-muted-foreground',
    rule: 'border-default',
    disabled: 'text-base-foreground-disabled',
  },
  dark: {
    row: 'text-medium-foreground-fixed-dark hover:bg-base-background-hover-fixed-dark hover:text-popover-foreground-fixed-dark',
    active: 'bg-secondary-background-fixed-dark font-medium text-popover-foreground-fixed-dark',
    quiet: 'text-muted-foreground-fixed-dark',
    rule: 'border-secondary-background-hover-fixed-dark',
    disabled: 'text-base-foreground-disabled-fixed-dark',
  },
};

const ROW =
  'flex min-h-8 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm outline-none transition-colors focus-visible:shadow-focus-ring [&>svg]:size-4 [&>svg]:shrink-0';

function containsActive(item: SidebarNavItem, activeId: string | undefined): boolean {
  return (item.children ?? []).some((child) => child.id === activeId);
}

function toggle(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((current) => current !== value) : [...values, value];
}

/**
 * The list of destinations inside a sidebar: grouped rows with icons, counts, one nested level and
 * foldable groups, in light or fixed-dark chrome. Collapsed, it becomes an icon rail whose labels
 * live in tooltips. The current page is marked with `aria-current`, never by colour alone.
 */
export function SidebarNav({
  label,
  groups,
  activeId,
  onSelect,
  collapsed = false,
  tone = 'light',
  defaultExpandedIds = [],
  defaultCollapsedGroupIds = [],
}: SidebarNavProps) {
  const [expandedIds, setExpandedIds] = useState<readonly string[]>(defaultExpandedIds);
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<readonly string[]>(defaultCollapsedGroupIds);
  const colors = TONES[tone];

  const renderRow = (item: SidebarNavItem, nested: boolean) => {
    const isParent = Boolean(item.children?.length);
    const isActive = item.id === activeId || (collapsed && containsActive(item, activeId));
    const isExpanded = isParent && (expandedIds.includes(item.id) || containsActive(item, activeId));
    const stateColors = item.disabled ? colors.disabled : isActive ? colors.active : colors.row;
    const layout = collapsed ? 'justify-center' : nested ? 'pl-8' : '';
    const className = `${ROW} ${layout} ${stateColors}`;

    const content = collapsed ? (
      (item.icon ?? <span aria-hidden="true">{item.label.charAt(0)}</span>)
    ) : (
      <>
        {item.icon}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.trailing ??
          (item.count === undefined ? null : (
            <span className={`text-xs tabular-nums ${isActive ? '' : colors.quiet}`}>{item.count}</span>
          ))}
        {isParent ? (
          <IconChevronRight
            aria-hidden="true"
            className={`size-4 shrink-0 transition-transform ${colors.quiet} ${isExpanded ? 'rotate-90' : ''}`}
          />
        ) : null}
      </>
    );

    const shared = {
      className,
      'aria-label': collapsed ? item.label : undefined,
      'aria-current': item.id === activeId ? ('page' as const) : undefined,
    };

    const control =
      isParent && !collapsed ? (
        <button
          type="button"
          {...shared}
          aria-expanded={isExpanded}
          disabled={item.disabled}
          onClick={() => setExpandedIds((current) => toggle(current, item.id))}
        >
          {content}
        </button>
      ) : item.href && !item.disabled ? (
        <a {...shared} href={item.href} onClick={() => onSelect?.(item.id)}>
          {content}
        </a>
      ) : (
        <button type="button" {...shared} disabled={item.disabled} onClick={() => onSelect?.(item.id)}>
          {content}
        </button>
      );

    return (
      <li key={item.id}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger render={control} />
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          control
        )}
        {isExpanded && !collapsed ? (
          <ul className="mt-0.5 flex flex-col gap-0.5">{item.children?.map((child) => renderRow(child, true))}</ul>
        ) : null}
      </li>
    );
  };

  return (
    <nav data-slot="sidebar-nav" data-tone={tone} aria-label={label} className="flex w-full min-w-0 flex-col gap-4">
      {groups.map((group, index) => {
        const folded = !collapsed && Boolean(group.collapsible) && collapsedGroupIds.includes(group.id);
        const headingId = `sidebar-nav-${group.id}`;
        const labelClass = `px-2 text-xs font-medium ${colors.quiet}`;

        return (
          <div
            key={group.id}
            role="group"
            aria-labelledby={group.label && !collapsed ? headingId : undefined}
            aria-label={group.label && collapsed ? group.label : undefined}
            className={`flex flex-col gap-1 ${collapsed && index > 0 ? `border-t pt-4 ${colors.rule}` : ''}`}
          >
            {group.label && !collapsed ? (
              group.collapsible ? (
                <button
                  type="button"
                  id={headingId}
                  aria-expanded={!folded}
                  className={`flex min-h-6 items-center gap-1 rounded-md text-left outline-none focus-visible:shadow-focus-ring ${labelClass}`}
                  onClick={() => setCollapsedGroupIds((current) => toggle(current, group.id))}
                >
                  <span className="min-w-0 flex-1 truncate">{group.label}</span>
                  <IconChevronRight
                    aria-hidden="true"
                    className={`size-3.5 shrink-0 transition-transform ${folded ? '' : 'rotate-90'}`}
                  />
                </button>
              ) : (
                <p id={headingId} className={`flex min-h-6 items-center ${labelClass}`}>
                  {group.label}
                </p>
              )
            ) : null}
            {folded ? null : <ul className="flex flex-col gap-0.5">{group.items.map((item) => renderRow(item, false))}</ul>}
          </div>
        );
      })}
    </nav>
  );
}
