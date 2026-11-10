import '@testing-library/jest-dom/vitest';

// happy-dom has no layout engine. Charts, virtualised lists and scroll areas ask for these.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;
Element.prototype.scrollIntoView ??= () => undefined;
