import { render, screen } from '@testing-library/react';

import { AnomalyRow } from './AnomalyRow';
import type { AnomalyRecord } from './AnomalyRow';

const ANOMALY: AnomalyRecord = { id: 'an-1', tag: '23-VT-92540', name: 'Drive-end vibration', score: 0.91, status: 'new' };

function renderRow(props: Partial<Parameters<typeof AnomalyRow>[0]> = {}) {
  return render(
    <ul>
      <AnomalyRow anomaly={ANOMALY} started="12 Mar, 11:30" duration="2 h 16 min" {...props} />
    </ul>
  );
}

describe(AnomalyRow.name, () => {
  it('shows the measurement, tag, start, duration and status', () => {
    renderRow({ assetName: '1st stage compressor', pattern: 'Drift' });

    const row = screen.getByRole('listitem');
    expect(row).toHaveTextContent('Drive-end vibration');
    expect(row).toHaveTextContent('Drift');
    expect(row).toHaveTextContent('23-VT-92540 · 1st stage compressor');
    expect(row).toHaveTextContent('12 Mar, 11:30');
    expect(row).toHaveTextContent('2 h 16 min');
    expect(row).toHaveTextContent('New');
  });

  it('names the score and its level against the threshold', () => {
    renderRow();

    expect(screen.getByRole('img', { name: 'Anomaly score 0.91, anomalous' })).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveAttribute('data-level', 'anomalous');
  });

  it('judges the score against a custom threshold', () => {
    renderRow({ threshold: 0.95 });

    expect(screen.getByRole('img', { name: 'Anomaly score 0.91, elevated' })).toBeInTheDocument();
  });

  it('makes only a new anomaly strong', () => {
    const { container, unmount } = renderRow();
    expect(container.querySelector('[data-slot="anomaly-status"]')).toHaveClass('font-medium');
    unmount();

    const acknowledged = renderRow({ anomaly: { ...ANOMALY, status: 'acknowledged' } });
    expect(acknowledged.container.querySelector('[data-slot="anomaly-status"]')).not.toHaveClass('font-medium');
    expect(screen.getByText('Acknowledged')).toBeInTheDocument();
  });

  it('mutes a dismissed anomaly', () => {
    renderRow({ anomaly: { ...ANOMALY, status: 'dismissed' } });

    expect(screen.getByText('Dismissed')).toBeInTheDocument();
    expect(screen.getByText('Drive-end vibration')).toHaveClass('text-muted-foreground');
  });

  it('moves the start into the tag line in the compact density', () => {
    renderRow({ density: 'compact' });

    expect(screen.getByText(/23-VT-92540/).closest('p')).toHaveTextContent('23-VT-92540 · 12 Mar, 11:30');
    expect(screen.queryByText('2 h 16 min')).not.toBeInTheDocument();
  });

  it('renders row actions', () => {
    renderRow({ actions: <button type="button">Acknowledge anomaly</button> });

    expect(screen.getByRole('button', { name: 'Acknowledge anomaly' })).toBeInTheDocument();
  });
});
