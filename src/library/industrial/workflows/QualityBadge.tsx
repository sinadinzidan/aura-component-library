import { Badge } from '@cognite/aura/components/badge';
import { IconAlertTriangle, IconCircleCheck, IconCircleX } from '@cognite/aura/icons';

import { qualityStatus } from '../status';
import type { SignalQuality } from '../status';

export type QualityBadgeProps = {
  quality: SignalQuality;
  /** Overrides the quality word, e.g. "Flatline" or "No signal". */
  label?: string;
  /** Quieter outlined style for rows where many badges repeat. */
  outline?: boolean;
};

const VARIANT = { good: 'success', uncertain: 'warning', bad: 'error' } as const;
const ICON = { good: IconCircleCheck, uncertain: IconAlertTriangle, bad: IconCircleX } as const;

/**
 * Signal quality (good, uncertain, bad) as an Aura Badge with an icon, for the one quality that
 * heads a tag card. In dense rows use `StatusIndicator` with `qualityStatus` instead.
 */
export function QualityBadge({ quality, label, outline = false }: QualityBadgeProps) {
  const Icon = ICON[quality];
  return (
    <Badge data-slot="quality-badge" data-quality={quality} variant={VARIANT[quality]} outline={outline}>
      <Icon aria-hidden="true" />
      {label ?? qualityStatus(quality).label}
    </Badge>
  );
}
