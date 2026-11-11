import { IconCameraOff, IconWifiOff } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import type { StatusDescriptor } from '../status';
import { StatusIndicator } from '../StatusIndicator';

import { CameraFrame } from './CameraFrame';
import type { CameraFrameProps } from './CameraFrame';

export type CameraStatus = 'live' | 'recorded' | 'offline' | 'no-signal';

const STATUS: Record<CameraStatus, StatusDescriptor> = {
  live: { tone: 'success', label: 'Live', shape: 'dot' },
  recorded: { tone: 'neutral', label: 'Recorded', shape: 'ring' },
  offline: { tone: 'critical', label: 'Offline', shape: 'diamond' },
  'no-signal': { tone: 'warning', label: 'No signal', shape: 'square' },
};

export type CameraTileProps = {
  /** Camera name: "Compressor hall, west". */
  name: string;
  /** Tag in the plant's style: "23-CAM-0101". */
  tag: string;
  scene: string;
  status: CameraStatus;
  /** Time stamp shown on the frame and under the tile, already formatted. */
  timestamp: string;
  /** Short health text: "Healthy", "Lens dirty". Colour follows `healthTone`. */
  health?: { label: string; tone: StatusDescriptor['tone'] };
  /** What happened and when, for the offline and no-signal states: "Since 11:42". */
  stateDetail?: string;
  mode?: CameraFrameProps['mode'];
  selected?: boolean;
  /** Makes the tile a button. */
  onSelect?: () => void;
  /** Extra overlay layers for the frame. */
  children?: ReactNode;
  className?: string;
};

/**
 * One camera in a grid: the frame, its name and tag, a live/recorded/offline/no-signal state in
 * words and shape, the time stamp and the camera's health. Offline and no-signal replace the frame
 * with a quiet explanation rather than a black box.
 */
export function CameraTile({ name, tag, scene, status, timestamp, health, stateDetail, mode, selected = false, onSelect, children, className }: CameraTileProps) {
  const descriptor = STATUS[status];
  const working = status === 'live' || status === 'recorded';
  const body = (
    <>
      {working ? (
        <CameraFrame scene={scene} label={`${name}, ${descriptor.label.toLowerCase()}, ${timestamp}`} timestamp={timestamp} mode={mode}>
          {children}
        </CameraFrame>
      ) : (
        <div
          role="img"
          aria-label={`${name}, ${descriptor.label.toLowerCase()}${stateDetail ? `, ${stateDetail.toLowerCase()}` : ''}`}
          data-slot="camera-unavailable"
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted-background text-center"
        >
          {status === 'offline' ? <IconCameraOff aria-hidden="true" className="size-6 text-muted-foreground" /> : <IconWifiOff aria-hidden="true" className="size-6 text-muted-foreground" />}
          <span className="text-sm font-medium text-base-foreground">{status === 'offline' ? 'Camera offline' : 'No signal'}</span>
          {stateDetail ? <span className="text-xs text-muted-foreground tabular-nums">{stateDetail}</span> : null}
        </div>
      )}
      <div className="flex items-start justify-between gap-2 px-0.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-base-foreground">{name}</span>
          <span className="font-mono text-xs text-muted-foreground">{tag}</span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <StatusIndicator {...descriptor} size="sm" />
          {health ? <span className="text-xs text-muted-foreground">{health.label}</span> : null}
        </div>
      </div>
    </>
  );
  const classes = cn('flex w-full min-w-0 flex-col gap-2 rounded-xl p-1.5 text-left', selected && 'bg-secondary-background', className);

  return onSelect ? (
    <button type="button" aria-pressed={selected} onClick={onSelect} data-slot="camera-tile" className={cn(classes, 'cursor-pointer outline-none hover:bg-secondary-background focus-visible:outline-2 focus-visible:outline-[var(--ring-default)]')}>
      {body}
    </button>
  ) : (
    <div data-slot="camera-tile" className={classes}>
      {body}
    </div>
  );
}
