import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { ExportProgress } from './ExportProgress';

describe(ExportProgress.name, () => {
  it('shows progress and what has been done while running', () => {
    renderExport({ status: 'running', value: 44.6, detail: '184,000 of 412,000 rows' });

    expect(screen.getByRole('progressbar', { name: 'Exporting alarm-history.csv' })).toHaveAttribute('aria-valuetext', '45%');
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('184,000 of 412,000 rows');
  });

  it('can be cancelled while running', async () => {
    const onCancel = vi.fn();
    renderExport({ status: 'running', value: 10, onCancel });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel export' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('clamps the value to 0–100', () => {
    renderExport({ status: 'running', value: 140 });

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('offers the download and drops the bar when ready', async () => {
    const onDownload = vi.fn();
    renderExport({ status: 'ready', readyText: '18.4 MB', onDownload, onCancel: vi.fn() });

    await userEvent.click(screen.getByRole('button', { name: 'Download' }));

    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Ready · 18.4 MB');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel export' })).not.toBeInTheDocument();
  });

  it('says what went wrong and offers another try', async () => {
    const onRetry = vi.fn();
    renderExport({ status: 'failed', errorText: 'The time range holds more than 5 million rows.', onRetry });

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('The time range holds more than 5 million rows.');
  });

  it('confirms a cancellation and lets the export start again', () => {
    renderExport({ status: 'cancelled', onRetry: vi.fn() });

    expect(screen.getByRole('status')).toHaveTextContent('Export cancelled. No file was created.');
    expect(screen.getByRole('button', { name: 'Export again' })).toBeInTheDocument();
  });
});

function renderExport(props: Partial<ComponentProps<typeof ExportProgress>>) {
  return render(<ExportProgress fileName="alarm-history.csv" status="running" {...props} />);
}
