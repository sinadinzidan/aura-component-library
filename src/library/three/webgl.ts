/** The part of `document` the check needs, so a fake can stand in for it in tests. */
export type CanvasFactory = {
  createElement(tagName: 'canvas'): { getContext(contextId: string): unknown };
};

/**
 * Whether this environment can create a WebGL context. `SceneCanvas` calls it before mounting a
 * scene, so a browser (or test runner) without WebGL gets the designed fallback instead of a crash.
 */
export function isWebGLAvailable(doc: CanvasFactory | undefined = typeof document === 'undefined' ? undefined : document): boolean {
  if (!doc) return false;
  try {
    const canvas = doc.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
