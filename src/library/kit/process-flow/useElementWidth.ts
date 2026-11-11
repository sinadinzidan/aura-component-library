import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * The width of an element in px, kept current as it resizes. Drawings use it to lay out at real
 * size so their type never scales. Zero until measured, and where layout is not available.
 */
export function useElementWidth<Element extends HTMLElement>(): [RefObject<Element>, number] {
  const ref = useRef<Element>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const measure = () => setWidth(element.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
