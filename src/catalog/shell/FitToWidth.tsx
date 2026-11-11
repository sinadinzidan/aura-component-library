import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { fitScale } from './fitScale';

type FitToWidthProps = {
  /** The width the content was designed for, in pixels. */
  designWidth: number;
  children: ReactNode;
};

/**
 * Shows a full-screen specimen at its design width and scales it down when the preview is
 * narrower, so a desktop dashboard stays intact in a narrow window instead of collapsing.
 */
export function FitToWidth({ designWidth, children }: FitToWidthProps) {
  const outer = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = outer.current;
    if (!element) return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { scale, width } = fitScale(containerWidth, designWidth);

  return (
    <div ref={outer} data-fit-scale={scale} className="w-full min-w-0 overflow-hidden">
      <div className="[&>*]:min-w-0 [&>*]:w-full" style={width === null ? undefined : { width, zoom: scale }}>
        {children}
      </div>
    </div>
  );
}
