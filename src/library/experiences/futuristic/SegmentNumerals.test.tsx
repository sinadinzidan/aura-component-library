import { render, screen } from '@testing-library/react';

import { SegmentNumerals } from './SegmentNumerals';

describe(SegmentNumerals.name, () => {
  it('names the picture with the label, value and unit', () => {
    render(<SegmentNumerals value="96.4" label="Availability" unit="%" />);

    expect(screen.getByRole('img', { name: 'Availability: 96.4 %' })).toBeInTheDocument();
  });

  it('lights the right number of segments', () => {
    const { container } = render(<SegmentNumerals value="18" label="Count" />);

    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(2 + 7);
  });

  it('draws unlit segments as ghosts unless turned off', () => {
    const { container, rerender } = render(<SegmentNumerals value="1" label="Count" />);
    expect(container.querySelectorAll('[data-lit="false"]')).toHaveLength(5);

    rerender(<SegmentNumerals value="1" label="Count" ghost={false} />);
    expect(container.querySelectorAll('[data-lit="false"]')).toHaveLength(0);
  });

  it('draws a colon as two marks and a point as one', () => {
    const { container } = render(<SegmentNumerals value="1:2.3" label="Time" />);

    expect(container.querySelectorAll('rect')).toHaveLength(3);
  });
});
