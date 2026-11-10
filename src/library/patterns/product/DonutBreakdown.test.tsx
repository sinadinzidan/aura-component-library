import { render, screen, within } from '@testing-library/react';

import { DonutBreakdown } from './DonutBreakdown';

const SEGMENTS = [
  { id: 'corrective', label: 'Corrective', value: 12 },
  { id: 'preventive', label: 'Preventive', value: 6 },
  { id: 'inspection', label: 'Inspection', value: 2 },
];

describe(DonutBreakdown.name, () => {
  it('describes the split in the name of the ring', () => {
    render(<DonutBreakdown label="Work orders by type" segments={SEGMENTS} />);

    expect(
      screen.getByRole('img', { name: 'Work orders by type: Corrective 60%, Preventive 30%, Inspection 10%' })
    ).toBeInTheDocument();
  });

  it('shows the total with its caption in the middle', () => {
    const { container } = render(<DonutBreakdown label="Work orders by type" segments={SEGMENTS} totalLabel="open" />);

    expect(container.querySelector('[data-slot="donut-total"]')).toHaveTextContent('20');
    expect(screen.getByText('open')).toBeInTheDocument();
  });

  it('repeats every part in the legend with value and share', () => {
    render(<DonutBreakdown label="Work orders by type" segments={SEGMENTS} unit="h" />);

    const items = within(screen.getByRole('list', { name: 'Work orders by type, by part' })).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['Corrective12\u00a0h60%', 'Preventive6\u00a0h30%', 'Inspection2\u00a0h10%']);
  });

  it('draws no arc for an empty part but keeps it in the legend', () => {
    const { container } = render(
      <DonutBreakdown label="Alarms by severity" segments={[...SEGMENTS, { id: 'other', label: 'Other', value: 0 }]} />
    );

    expect(container.querySelectorAll('[data-slot="donut-arc"]')).toHaveLength(3);
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('can replace the centre and format values', () => {
    render(
      <DonutBreakdown
        label="Storage by type"
        segments={SEGMENTS}
        format={(value) => value.toFixed(1)}
        center={<span>Storage</span>}
        legend="below"
      />
    );

    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('12.0')).toBeInTheDocument();
  });
});
