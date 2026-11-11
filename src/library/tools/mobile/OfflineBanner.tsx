import { IconWifiOff } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

export type OfflineBannerProps = {
  /** What it means for the user: "Changes are saved on this device and sent when you are back online." */
  children: ReactNode;
  /** The words that name the state. */
  title?: string;
  /** An action, usually a retry button. */
  action?: ReactNode;
};

/**
 * A strip under the status bar that says the device is offline and what that means for the work in
 * hand. A status message with an icon and words, so it does not depend on colour.
 */
export function OfflineBanner({ children, title = 'You are offline', action }: OfflineBannerProps) {
  return (
    <div role="status" data-slot="offline-banner" className="flex items-start gap-3 bg-warning-background px-4 py-2 text-warning-foreground">
      <IconWifiOff aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 flex-1 text-xs">
        <span className="font-semibold">{title}. </span>
        {children}
      </p>
      {action}
    </div>
  );
}
