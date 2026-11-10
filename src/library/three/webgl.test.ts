import { isWebGLAvailable } from './webgl';
import type { CanvasFactory } from './webgl';

function fakeDocument(getContext: (contextId: string) => unknown): CanvasFactory {
  return { createElement: () => ({ getContext }) };
}

describe(isWebGLAvailable.name, () => {
  it('is true when a webgl2 context can be created', () => {
    const doc = fakeDocument((contextId) => (contextId === 'webgl2' ? {} : null));

    expect(isWebGLAvailable(doc)).toBe(true);
  });

  it('falls back to webgl 1', () => {
    const doc = fakeDocument((contextId) => (contextId === 'webgl' ? {} : null));

    expect(isWebGLAvailable(doc)).toBe(true);
  });

  it('is false when no context is available', () => {
    expect(isWebGLAvailable(fakeDocument(() => null))).toBe(false);
  });

  it('is false when creating a context throws', () => {
    const doc = fakeDocument(() => {
      throw new Error('blocked');
    });

    expect(isWebGLAvailable(doc)).toBe(false);
  });

  it('is false without a document', () => {
    expect(isWebGLAvailable(undefined)).toBe(false);
  });
});
