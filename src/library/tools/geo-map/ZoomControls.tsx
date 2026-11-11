import { IconArrowBackUp, IconFocusCentered, IconHome, IconMinus, IconPlus } from '@cognite/aura/icons';

import { IconAction } from '../../patterns/collections/IconAction';

type ZoomControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  /** Fit all sites. Leave out to hide the button. */
  onFit?: () => void;
  onHome?: () => void;
  onBack?: () => void;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
  canGoBack?: boolean;
};

/** Zoom, fit, reset and back as labelled icon buttons in one vertical group. */
export function ZoomControls({ onZoomIn, onZoomOut, onFit, onHome, onBack, canZoomIn = true, canZoomOut = true, canGoBack = true }: ZoomControlsProps) {
  return (
    <div role="group" aria-label="Map zoom" className="flex flex-col gap-0.5 rounded-lg border border-default bg-card-background p-0.5">
      <IconAction label="Zoom in" onClick={onZoomIn} disabled={!canZoomIn}>
        <IconPlus />
      </IconAction>
      <IconAction label="Zoom out" onClick={onZoomOut} disabled={!canZoomOut}>
        <IconMinus />
      </IconAction>
      {onFit ? (
        <IconAction label="Fit all sites" onClick={onFit}>
          <IconFocusCentered />
        </IconAction>
      ) : null}
      {onHome ? (
        <IconAction label="Reset view" onClick={onHome}>
          <IconHome />
        </IconAction>
      ) : null}
      {onBack ? (
        <IconAction label="Previous view" onClick={onBack} disabled={!canGoBack}>
          <IconArrowBackUp />
        </IconAction>
      ) : null}
    </div>
  );
}
