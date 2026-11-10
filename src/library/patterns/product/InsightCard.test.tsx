import { render, screen } from '@testing-library/react';

import { InsightCard } from './InsightCard';

const EVIDENCE = [
  { id: 'vt', label: '23-VT-92540', value: '6.8 mm/s, limit 7.1', mono: true },
  { id: 'trend', label: 'Trend, last 7 days', value: '+0.9 mm/s' },
];

describe(InsightCard.name, () => {
  it('names the finding by kind and title', () => {
    render(<InsightCard kind="Anomaly detected" tone="warning" title="Vibration is rising" summary="Drive-end vibration has risen for a week." />);

    expect(screen.getByRole('article', { name: 'Anomaly detected: Vibration is rising' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vibration is rising' })).toBeInTheDocument();
  });

  it('writes the kind in words next to its icon', () => {
    const { container } = render(<InsightCard kind="Anomaly detected" tone="critical" title="Trip" summary="Summary" />);

    const kind = container.querySelector('[data-slot="insight-kind"]');
    expect(kind).toHaveTextContent('Anomaly detected');
    expect(kind?.querySelector('svg')).not.toBeNull();
  });

  it('lists the evidence as label and value pairs', () => {
    render(<InsightCard kind="Anomaly detected" title="Vibration is rising" summary="Summary" evidence={EVIDENCE} />);

    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual(['23-VT-92540', 'Trend, last 7 days']);
    expect(screen.getAllByRole('definition').map((definition) => definition.textContent)).toEqual(['6.8 mm/s, limit 7.1', '+0.9 mm/s']);
    expect(screen.getByText('Evidence')).toBeInTheDocument();
  });

  it('leaves out the evidence block when there is none', () => {
    render(<InsightCard kind="Suggestion" title="Group these alarms" summary="Summary" />);

    expect(screen.queryByText('Evidence')).not.toBeInTheDocument();
  });

  it('shows meta, footnote and actions', () => {
    render(
      <InsightCard
        kind="Suggestion"
        title="Group these alarms"
        summary="Summary"
        meta="Generated 13:58"
        footnote="Based on the last 30 days only."
        actions={<button type="button">Open trend</button>}
      />
    );

    expect(screen.getByText('Generated 13:58')).toBeInTheDocument();
    expect(screen.getByText('Based on the last 30 days only.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open trend' })).toBeInTheDocument();
  });
});
