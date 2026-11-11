import { fireEvent, render, screen } from '@testing-library/react';

import { TourStepper } from './TourStepper';

const STAGES = [
  { id: 'inlet', label: 'Inlet' },
  { id: 'treatment', label: 'Treatment' },
  { id: 'liquefaction', label: 'Liquefaction' },
];

function setup(overrides: Partial<Parameters<typeof TourStepper>[0]> = {}) {
  const handlers = { onSelect: vi.fn(), onPrevious: vi.fn(), onNext: vi.fn(), onResume: vi.fn() };
  render(<TourStepper stages={STAGES} index={1} mode="tour" {...handlers} {...overrides} />);
  return handlers;
}

describe(TourStepper.name, () => {
  it('marks the current stop', () => {
    setup();

    expect(screen.getByRole('button', { name: /Treatment/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: /Inlet/ })).not.toHaveAttribute('aria-current');
  });

  it('selects a stop by its index', () => {
    const { onSelect } = setup();

    fireEvent.click(screen.getByRole('button', { name: /Liquefaction/ }));

    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('steps with Previous and Next', () => {
    const { onPrevious, onNext } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Previous stop' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next stop' }));

    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('disables Previous in the overview and Next on the last stop', () => {
    setup({ index: -1 });
    expect(screen.getByRole('button', { name: 'Previous stop' })).toBeDisabled();
  });

  it('disables Next on the last stop', () => {
    setup({ index: 2 });

    expect(screen.getByRole('button', { name: 'Next stop' })).toBeDisabled();
  });

  it('offers Resume tour only after leaving the tour, and marks no stop as current', () => {
    const { onResume } = setup({ mode: 'free' });

    expect(screen.queryByRole('button', { current: 'step' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Resume tour/ }));
    expect(onResume).toHaveBeenCalledOnce();
  });

  it('hides Resume tour while following the tour', () => {
    setup();

    expect(screen.queryByRole('button', { name: /Resume tour/ })).toBeNull();
  });
});
