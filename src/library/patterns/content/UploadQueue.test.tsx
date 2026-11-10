import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { UploadQueue } from './UploadQueue';
import type { UploadItem } from './uploadReducer';

const ITEMS: readonly UploadItem[] = [
  { id: 'a', name: 'P&ID rev C.pdf', size: 2_400_000, loaded: 1_200_000, status: 'uploading' },
  { id: 'b', name: 'Layout.dwg', size: 8_000_000, loaded: 0, status: 'queued' },
  { id: 'c', name: 'Survey.xlsx', size: 318_000, loaded: 318_000, status: 'done' },
  { id: 'd', name: 'Scan.pdf', size: 5_000_000, loaded: 1_000_000, status: 'failed', error: 'Connection lost' },
  { id: 'e', name: 'Photo.jpg', size: 5_100_000, loaded: 2_000_000, status: 'cancelled' },
];

function renderQueue(props: Partial<ComponentProps<typeof UploadQueue>> = {}) {
  return render(
    <TooltipProvider>
      <UploadQueue label="Uploads" items={ITEMS} {...props} />
    </TooltipProvider>
  );
}

const row = (name: string) => {
  const item = screen.getByText(name).closest('li');
  if (item === null) throw new Error(`No row for ${name}`);
  return within(item);
};

describe(UploadQueue.name, () => {
  it('lists every file under an accessible name', () => {
    renderQueue();

    expect(within(screen.getByRole('list', { name: 'Uploads' })).getAllByRole('listitem')).toHaveLength(5);
  });

  it('shows progress with bytes sent for a running upload', () => {
    renderQueue();

    expect(row('P&ID rev C.pdf').getByRole('progressbar', { name: 'Uploading P&ID rev C.pdf' })).toHaveAttribute(
      'aria-valuetext',
      '50%, 1.2 MB of 2.4 MB'
    );
    expect(row('P&ID rev C.pdf').getByText('50%')).toBeInTheDocument();
  });

  it('shows a waiting file at zero', () => {
    renderQueue();

    expect(row('Layout.dwg').getByText('Waiting · 8.0 MB')).toBeInTheDocument();
  });

  it('drops the bar and says uploaded when a file is done', () => {
    renderQueue();

    expect(row('Survey.xlsx').queryByRole('progressbar')).not.toBeInTheDocument();
    expect(row('Survey.xlsx').getByText('Uploaded · 318 kB')).toBeInTheDocument();
  });

  it('says why a file failed and how much was sent', () => {
    renderQueue();

    expect(row('Scan.pdf').getByText('Connection lost · 1.0 MB of 5.0 MB sent')).toBeInTheDocument();
  });

  it('cancels a running upload', async () => {
    const onCancel = vi.fn();
    renderQueue({ onCancel });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel upload of P&ID rev C.pdf' }));

    expect(onCancel).toHaveBeenCalledWith('a');
  });

  it('retries failed and cancelled uploads', async () => {
    const onRetry = vi.fn();
    renderQueue({ onRetry });

    await userEvent.click(screen.getByRole('button', { name: 'Retry upload of Scan.pdf' }));
    await userEvent.click(screen.getByRole('button', { name: 'Retry upload of Photo.jpg' }));

    expect(onRetry.mock.calls).toEqual([['d'], ['e']]);
  });

  it('removes rows that are no longer moving, and only those', async () => {
    const onRemove = vi.fn();
    renderQueue({ onRemove });

    await userEvent.click(screen.getByRole('button', { name: 'Remove Survey.xlsx from the list' }));

    expect(onRemove).toHaveBeenCalledWith('c');
    expect(screen.queryByRole('button', { name: 'Remove P&ID rev C.pdf from the list' })).not.toBeInTheDocument();
  });

  it('renders no action it has no handler for', () => {
    renderQueue();

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
