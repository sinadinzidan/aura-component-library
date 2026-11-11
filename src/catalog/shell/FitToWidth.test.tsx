import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FitToWidth } from './FitToWidth';

describe(FitToWidth.name, () => {
  let notify: (width: number) => void;
  const original = globalThis.ResizeObserver;

  beforeEach(() => {
    notify = () => undefined;
    // The observer is the only way to learn the width, so the test drives it by hand.
    class FakeObserver {
      constructor(callback: ResizeObserverCallback) {
        notify = (width) =>
          callback([{ contentRect: { width } } as Partial<ResizeObserverEntry> as ResizeObserverEntry], this as Partial<ResizeObserver> as ResizeObserver);
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    globalThis.ResizeObserver = FakeObserver;
  });

  afterEach(() => {
    globalThis.ResizeObserver = original;
  });

  it('renders its content unscaled before it is measured', () => {
    const { container } = render(<FitToWidth designWidth={1152}>Board</FitToWidth>);

    expect(screen.getByText('Board')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-fit-scale', '1');
  });

  it('scales the content down when the container is narrower than the design width', () => {
    const { container } = render(<FitToWidth designWidth={1000}>Board</FitToWidth>);

    act(() => notify(500));

    expect(container.firstElementChild).toHaveAttribute('data-fit-scale', '0.5');
  });

  it('keeps the natural size in a wide container', () => {
    const { container } = render(<FitToWidth designWidth={1000}>Board</FitToWidth>);

    act(() => notify(1400));

    expect(container.firstElementChild).toHaveAttribute('data-fit-scale', '1');
  });
});
