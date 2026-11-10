/** Sets the mouse cursor over a scene's canvas: `pointer` over something clickable, empty to reset. */
export function setSceneCursor(canvas: HTMLElement, cursor: 'pointer' | 'grab' | ''): void {
  canvas.style.cursor = cursor;
}
