import { Tabs, TabsLabel, TabsList, TabsTrigger } from '@cognite/aura/components/tabs';
import type { ReactNode } from 'react';

export type PageTab = {
  value: string;
  label: string;
  icon?: ReactNode;
  /** Number of items behind the tab, shown as a badge. */
  count?: number;
  disabled?: boolean;
};

type PageTabsHeaderProps = {
  title: string;
  description?: string;
  /** Page-level actions. They stay put while the tabs change. */
  actions?: ReactNode;
  tabs: readonly PageTab[];
  value: string;
  onValueChange: (value: string) => void;
  /** The `TabsPanel`s, one per tab value. */
  children?: ReactNode;
};

/** 4 → "4", 1284 → "1.3k", 12000 → "12k": counts stay narrow enough for a tab. */
function formatCount(count: number): string {
  if (count < 1000) return String(count);
  const thousands = count / 1000;
  return `${thousands < 10 ? Math.round(thousands * 10) / 10 : Math.round(thousands)}k`;
}

/**
 * The top of a detail page: title, page actions and a row of tabs on a full-width rule. Title and
 * actions sit above the tabs so they stay stable across tab states, as Aura asks.
 */
export function PageTabsHeader({
  title,
  description,
  actions,
  tabs,
  value,
  onValueChange,
  children,
}: PageTabsHeaderProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (typeof next === 'string') onValueChange(next);
      }}
      className="flex w-full flex-col gap-4"
    >
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-base-foreground">{title}</h2>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
        <TabsList size="default" showSeparator className="w-full">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              badge={tab.count === undefined ? undefined : formatCount(tab.count)}
            >
              {tab.icon}
              <TabsLabel>{tab.label}</TabsLabel>
            </TabsTrigger>
          ))}
        </TabsList>
      </header>
      {children}
    </Tabs>
  );
}
