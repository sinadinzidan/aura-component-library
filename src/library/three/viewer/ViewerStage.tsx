import { useRef } from 'react';
import type { ReactNode } from 'react';

import { SceneCanvas } from '../SceneCanvas';
import type { SceneCanvasProps } from '../SceneCanvas';
import type { TokenColors } from '../tokenColors';
import { useTokenColors } from '../useTokenColors';

import { COLOR_KEY_TOKENS } from './colorBy';
import type { ColorKey } from './colorBy';

export type ViewerStageProps = Pick<SceneCanvasProps, 'label' | 'fallback' | 'forceFallback' | 'frameloop' | 'camera' | 'onPointerMissed' | 'webglAvailable'> & {
  /** The scene. It receives the resolved colour of every colour key, since materials cannot read CSS variables. */
  children: (colors: Readonly<Record<ColorKey, string>>) => ReactNode;
  className?: string;
};

function toColorMap(colors: TokenColors<typeof COLOR_KEY_TOKENS>): Record<ColorKey, string> {
  return {
    steel: colors.steel.color,
    neutral: colors.neutral.color,
    success: colors.success.color,
    warning: colors.warning.color,
    critical: colors.critical.color,
    info: colors.info.color,
    sys1: colors.sys1.color,
    sys2: colors.sys2.color,
    sys3: colors.sys3.color,
    sys4: colors.sys4.color,
    sys5: colors.sys5.color,
  };
}

/**
 * A `SceneCanvas` that also resolves the viewer's colour tokens (status tones and chart colours)
 * for the scene inside it, and follows theme changes. Give its parent a height.
 */
export function ViewerStage({ children, className, ...canvas }: ViewerStageProps) {
  const scope = useRef<HTMLDivElement>(null);
  const colors = useTokenColors(COLOR_KEY_TOKENS, scope);

  return (
    <div ref={scope} data-slot="viewer-stage" className={className ?? 'size-full'}>
      <SceneCanvas {...canvas}>{colors ? children(toColorMap(colors)) : null}</SceneCanvas>
    </div>
  );
}
