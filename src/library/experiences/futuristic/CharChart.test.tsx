import { render, screen } from '@testing-library/react';

import { CharChart } from './CharChart';

describe(CharChart.name, () => {
  it('is one picture named with the latest value, range and limit', () => {
    render(<CharChart values={[40, 48.6]} label="Discharge pressure" unit="barg" limit={52} />);

    expect(
      screen.getByRole('img', { name: 'Discharge pressure: latest 48.6 barg, range 40.0 to 48.6, limit 52.0' })
    ).toBeInTheDocument();
  });

  it('draws the requested number of rows', () => {
    const { container } = render(<CharChart values={[1, 2, 3]} label="Trend" rows={5} />);

    expect(container.querySelectorAll('[data-slot="char-chart-row"]')).toHaveLength(5);
  });

  it('averages a long series down to the column count', () => {
    const { container } = render(<CharChart values={Array.from({ length: 100 }, (_, index) => index)} label="Trend" columns={20} rows={2} />);

    const firstRow = container.querySelector('[data-slot="char-chart-row"]');
    // Gutter ("99.0"), a space, the axis character, then one cell per column.
    expect([...(firstRow?.textContent ?? '')]).toHaveLength(4 + 2 + 20);
  });

  it('draws a dashed limit row in the gaps', () => {
    const { container } = render(<CharChart values={[1, 2, 3, 4]} label="Trend" rows={4} limit={4} />);

    expect(container.querySelector('[data-slot="char-chart-limit"]')?.textContent).toMatch(/^┄+$/);
  });

  it('labels both ends of the time axis', () => {
    render(<CharChart values={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} label="Trend" startLabel="-12 h" endLabel="now" />);

    expect(screen.getByText(/-12 h\s+now/)).toBeInTheDocument();
  });

  it('says so when there is no data', () => {
    render(<CharChart values={[]} label="Trend" />);

    expect(screen.getByRole('img', { name: 'Trend: no data' })).toBeInTheDocument();
  });
});
