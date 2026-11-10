import { IconBattery3, IconWifi, IconWifiOff } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type DeviceKind = 'phone' | 'tablet';

export type DeviceFrameProps = {
  /** What the screen is, for the accessible name: "Checkpoint screen on a phone". */
  label: string;
  device?: DeviceKind;
  /** Clock text in the status bar. */
  time?: string;
  /** Connection shown in the status bar, as an icon and a word. */
  connection?: 'online' | 'offline';
  /** Fixed area above the content: a title bar or a banner. */
  header?: ReactNode;
  /** Fixed area under the content: an action bar or a tab bar. */
  footer?: ReactNode;
  /** `screen` keeps the height of the device; `content` crops the frame to its content, to show one component. */
  height?: 'screen' | 'content';
  /** The screen content. The frame grows with it instead of clipping. */
  children: ReactNode;
  className?: string;
};

const WIDTH: Record<DeviceKind, string> = { phone: 'w-full max-w-80', tablet: 'w-full max-w-3xl' };
const SCREEN_HEIGHT: Record<DeviceKind, string> = { phone: 'min-h-144', tablet: 'min-h-112' };

/**
 * A phone or tablet outline drawn from tokens, to show a field screen at the size it is used at:
 * bezel, status bar, a scrolling content area and fixed header and footer slots. It is a frame for
 * documentation and review, not a responsive container — the content inside must still work alone.
 */
export function DeviceFrame({ label, device = 'phone', time = '14:00', connection = 'online', height = 'screen', header, footer, children, className }: DeviceFrameProps) {
  const ConnectionIcon = connection === 'online' ? IconWifi : IconWifiOff;

  return (
    <section
      data-slot="device-frame"
      data-device={device}
      aria-label={label}
      data-height={height}
      className={cn('flex min-w-0 flex-col rounded-3xl border border-emphasized bg-medium-background p-2', WIDTH[device], height === 'screen' ? SCREEN_HEIGHT[device] : '', className)}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-base-background text-base-foreground">
        <div data-slot="device-status-bar" className="flex shrink-0 items-center justify-between gap-3 px-4 py-1.5 text-xs text-muted-foreground">
          <span className="tabular-nums">{time}</span>
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <ConnectionIcon aria-hidden="true" className="size-3.5" />
              {connection === 'online' ? 'Online' : 'Offline'}
            </span>
            <IconBattery3 aria-hidden="true" className="size-4" />
          </span>
        </div>
        {header ? (
          <div data-slot="device-header" className="shrink-0">
            {header}
          </div>
        ) : null}
        <div data-slot="device-content" className="flex min-h-0 min-w-0 flex-1 flex-col">
          {children}
        </div>
        {footer ? (
          <div data-slot="device-footer" className="shrink-0 border-t border-default">
            {footer}
          </div>
        ) : null}
      </div>
    </section>
  );
}
