import { render, screen } from '@testing-library/react';

import { useElementWidth } from './useElementWidth';

function Probe() {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="probe">
      {width}
    </div>
  );
}

describe(useElementWidth.name, () => {
  it('reports the measured width of the element', () => {
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 640, height: 10, top: 0, left: 0, right: 640, bottom: 10, x: 0, y: 0, toJSON: () => ({}) });

    render(<Probe />);

    expect(screen.getByTestId('probe')).toHaveTextContent('640');
    spy.mockRestore();
  });

  it('is zero where nothing is laid out', () => {
    render(<Probe />);

    expect(screen.getByTestId('probe')).toHaveTextContent('0');
  });
});
