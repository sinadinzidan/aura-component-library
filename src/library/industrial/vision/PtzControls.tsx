import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowDown, IconArrowLeft, IconArrowRight, IconArrowUp, IconHome, IconMinus, IconPlus } from '@cognite/aura/icons';
import type { Dispatch, ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { PTZ_HOME, activePreset, atLimit, describePtz, panTiltStep } from './ptz';
import type { PtzAction, PtzPreset, PtzState } from './ptz';

export type PtzControlsProps = {
  state: PtzState;
  dispatch: Dispatch<PtzAction>;
  presets?: readonly PtzPreset[];
  /** Turns every control off, with a reason in the accessible name of the group. */
  disabledReason?: string;
  className?: string;
};

function IconControl({ label, icon, disabled, onClick }: { label: string; icon: ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="secondary" size="icon" aria-label={label} disabled={disabled} onClick={onClick}>
            {icon}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Pan, tilt and zoom for a PTZ camera: a direction pad with a home button, zoom in and out, the
 * current position in words and a list of presets. Buttons disable at the mechanical limits and
 * moves shrink as the zoom grows. The position is announced politely after each move.
 */
export function PtzControls({ state, dispatch, presets = [], disabledReason, className }: PtzControlsProps) {
  const step = panTiltStep(state.zoom);
  const off = disabledReason !== undefined;
  const current = activePreset(state, presets);

  return (
    <div role="group" aria-label={off ? `PTZ controls, unavailable: ${disabledReason}` : 'PTZ controls'} data-slot="ptz-controls" className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center gap-6">
        <div className="grid grid-cols-3 gap-1.5">
          <span />
          <IconControl label="Tilt up" icon={<IconArrowUp />} disabled={off || atLimit(state, 'tilt', 1)} onClick={() => dispatch({ type: 'tilt', by: step })} />
          <span />
          <IconControl label="Pan left" icon={<IconArrowLeft />} disabled={off || atLimit(state, 'pan', -1)} onClick={() => dispatch({ type: 'pan', by: -step })} />
          <IconControl label="Home position" icon={<IconHome />} disabled={off || (state.pan === PTZ_HOME.pan && state.tilt === PTZ_HOME.tilt && state.zoom === PTZ_HOME.zoom)} onClick={() => dispatch({ type: 'home' })} />
          <IconControl label="Pan right" icon={<IconArrowRight />} disabled={off || atLimit(state, 'pan', 1)} onClick={() => dispatch({ type: 'pan', by: step })} />
          <span />
          <IconControl label="Tilt down" icon={<IconArrowDown />} disabled={off || atLimit(state, 'tilt', -1)} onClick={() => dispatch({ type: 'tilt', by: -step })} />
          <span />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <IconControl label="Zoom in" icon={<IconPlus />} disabled={off || atLimit(state, 'zoom', 1)} onClick={() => dispatch({ type: 'zoom', by: state.zoom < 5 ? 0.5 : 1 })} />
          <span className="text-xs font-medium text-base-foreground tabular-nums">{state.zoom}×</span>
          <IconControl label="Zoom out" icon={<IconMinus />} disabled={off || atLimit(state, 'zoom', -1)} onClick={() => dispatch({ type: 'zoom', by: state.zoom <= 5 ? -0.5 : -1 })} />
        </div>
      </div>
      <p aria-live="polite" className="text-xs text-muted-foreground tabular-nums">
        {describePtz(state)}
        {current ? ` · ${current.name}` : ''}
      </p>
      {presets.length > 0 ? (
        <ul aria-label="Presets" className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <li key={preset.id}>
              <Button size="sm" variant={current?.id === preset.id ? 'secondary' : 'ghost'} aria-pressed={current?.id === preset.id} disabled={off} onClick={() => dispatch({ type: 'preset', state: preset.state })}>
                {preset.name}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
