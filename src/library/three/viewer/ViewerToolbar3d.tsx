import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowsMaximize, IconHandMove, IconHome, IconMapPin, IconPointer, IconRotate360, IconRuler2, IconZoomIn } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { ToggleGroup } from '../../actions/ToggleGroup';

export type ViewerMode = 'orbit' | 'pan' | 'zoom';
export type ViewerTool = 'select' | 'measure' | 'pin';

export type ViewerToolbar3dProps = {
  /** What a drag does. */
  mode: ViewerMode;
  onModeChange: (mode: ViewerMode) => void;
  /** What a click does. Leave out to hide the tool group. */
  tool?: ViewerTool;
  onToolChange?: (tool: ViewerTool) => void;
  onFit: () => void;
  onHome: () => void;
  /** More controls after the standard ones: screenshot, settings. */
  children?: ReactNode;
  className?: string;
};

const MODES = [
  { value: 'orbit', label: 'Orbit (O)', icon: <IconRotate360 /> },
  { value: 'pan', label: 'Pan (P)', icon: <IconHandMove /> },
  { value: 'zoom', label: 'Zoom (Z)', icon: <IconZoomIn /> },
];

const TOOLS = [
  { value: 'select', label: 'Select (V)', icon: <IconPointer /> },
  { value: 'measure', label: 'Measure (M)', icon: <IconRuler2 /> },
  { value: 'pin', label: 'Add pin (N)', icon: <IconMapPin /> },
];

function isMode(value: string): value is ViewerMode {
  return value === 'orbit' || value === 'pan' || value === 'zoom';
}

function isTool(value: string): value is ViewerTool {
  return value === 'select' || value === 'measure' || value === 'pin';
}

function IconAction({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick}>
            {icon}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The toolbar of a 3D viewer: how a drag moves the camera (orbit, pan, zoom), what a click does
 * (select, measure, pin), fit to model and home. Every button has a label and a shortcut, and the
 * pressed mode and tool are exposed to assistive technology.
 */
export function ViewerToolbar3d({ mode, onModeChange, tool, onToolChange, onFit, onHome, children, className }: ViewerToolbar3dProps) {
  return (
    <div
      role="toolbar"
      aria-label="3D viewer controls"
      data-slot="viewer-toolbar-3d"
      className={cn('flex items-center gap-1 rounded-lg bg-[color-mix(in_oklab,var(--card-background)_90%,transparent)] p-1 backdrop-blur-sm', className)}
    >
      <ToggleGroup label="Drag action" iconOnly selection="single" required size="sm" options={MODES} value={[mode]} onValueChange={([next]) => next && isMode(next) && onModeChange(next)} />
      {tool !== undefined && onToolChange ? (
        <>
          <span aria-hidden="true" className="mx-1 h-4 border-l border-default" />
          <ToggleGroup label="Click action" iconOnly selection="single" required size="sm" options={TOOLS} value={[tool]} onValueChange={([next]) => next && isTool(next) && onToolChange(next)} />
        </>
      ) : null}
      <span aria-hidden="true" className="mx-1 h-4 border-l border-default" />
      <IconAction label="Fit to model (F)" icon={<IconArrowsMaximize />} onClick={onFit} />
      <IconAction label="Home view (H)" icon={<IconHome />} onClick={onHome} />
      {children}
    </div>
  );
}
