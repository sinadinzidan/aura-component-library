import type { KeyboardEvent, ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

type SceneStageProps = {
  /** The scene itself: a `SceneCanvas`, or a drawing that fills the stage. */
  children: ReactNode;
  /**
   * DOM drawn over the scene: readouts, docks, cards. The layer ignores the pointer so the scene
   * stays draggable; give each overlay element `pointer-events-auto`.
   */
  overlay?: ReactNode;
  /** `glow` puts a soft accent light behind the subject; `none` shows the surface underneath. */
  backdrop?: 'glow' | 'none';
  /** Called on Escape while the stage or anything in it has focus: step back, clear the selection. */
  onEscape?: () => void;
  /** Layout classes: the height, the grid span, a radius. */
  className?: string;
};

/** Labels a scene draws inside its canvas are set in the UI sans at a readable size, never monospace. */
const READABLE_LABELS =
  '[&_.font-mono]:font-sans [&_.font-mono]:tabular-nums [&_[data-slot=scene-label]_.text-xs]:text-[0.8125rem] [&_[data-slot=scene-label]_.text-xs]:py-1.5 [&_.uppercase]:normal-case [&_.tracking-wider]:tracking-normal';

/**
 * The frame around a 3D scene or drawing: it holds the scene, layers DOM overlays on top without
 * stealing the pointer from orbit controls, keeps Escape working after a drag on the canvas, and
 * sets every in-scene label in readable sans. Give it a height.
 */
export function SceneStage({ children, overlay, backdrop = 'glow', onEscape, className }: SceneStageProps) {
  const look = useLook();

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || !onEscape) return;
    event.preventDefault();
    onEscape();
  };

  return (
    <div
      data-slot="scene-stage"
      data-look={look}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerDownCapture={(event) => {
        // Orbit controls swallow the pointer event, so take focus by hand to keep Escape working.
        if (event.target instanceof HTMLCanvasElement) event.currentTarget.focus({ preventScroll: true });
      }}
      className={cx('relative min-h-0 min-w-0 overflow-hidden outline-none', READABLE_LABELS, className)}
    >
      {backdrop === 'glow' ? (
        <div
          aria-hidden="true"
          data-slot="scene-stage-backdrop"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_46%,color-mix(in_oklab,var(--primary-background)_18%,transparent),transparent_68%)]"
        />
      ) : null}
      <div className="absolute inset-0">{children}</div>
      {overlay ? (
        <div data-slot="scene-stage-overlay" className="pointer-events-none absolute inset-0 z-30">
          {overlay}
        </div>
      ) : null}
    </div>
  );
}
