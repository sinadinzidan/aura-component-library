import { Badge } from '@cognite/aura/components/badge';
import { IconActivity, IconLeaf, IconShieldCheck, IconTool } from '@cognite/aura/icons';

import { logCategoryLabel } from './workflow';
import type { LogCategory } from './workflow';

export type LogCategoryBadgeProps = {
  category: LogCategory;
  /** Overrides the category word. */
  label?: string;
};

const VARIANT = {
  operations: 'decorative-2',
  safety: 'decorative-6',
  maintenance: 'decorative-5',
  environment: 'decorative-3',
} as const;

const ICON = { operations: IconActivity, safety: IconShieldCheck, maintenance: IconTool, environment: IconLeaf } as const;

/**
 * The category of a shift log entry. Categories are not states, so they use decorative colours
 * with an icon and a word each — never the status colours.
 */
export function LogCategoryBadge({ category, label }: LogCategoryBadgeProps) {
  const Icon = ICON[category];
  return (
    <Badge data-slot="log-category" data-category={category} variant={VARIANT[category]}>
      <Icon aria-hidden="true" />
      {label ?? logCategoryLabel(category)}
    </Badge>
  );
}
