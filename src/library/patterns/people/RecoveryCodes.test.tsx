import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RecoveryCodes } from './RecoveryCodes';

const CODES = ['DEMO-0001', 'DEMO-0002', 'DEMO-0003', 'DEMO-0004'];

describe(RecoveryCodes.name, () => {
  it('lists every code', () => {
    render(<RecoveryCodes codes={CODES} writeText={vi.fn(() => Promise.resolve())} />);

    expect(within(screen.getByRole('list', { name: 'Recovery codes' })).getAllByRole('listitem')).toHaveLength(4);
  });

  it('announces used codes and counts what is left', () => {
    render(<RecoveryCodes codes={CODES} usedCodes={['DEMO-0002']} writeText={vi.fn(() => Promise.resolve())} />);

    expect(screen.getByText('DEMO-0002').closest('li')).toHaveTextContent('DEMO-0002 (used)');
    expect(screen.getByText('3 of 4 left')).toBeInTheDocument();
  });

  it('copies only the unused codes, one per line', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    render(<RecoveryCodes codes={CODES} usedCodes={['DEMO-0002']} writeText={writeText} />);

    await userEvent.click(screen.getByRole('button', { name: 'Copy codes' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('DEMO-0001\nDEMO-0003\nDEMO-0004'));
  });

  it('hands the unused codes to the download handler', async () => {
    const onDownload = vi.fn();
    render(<RecoveryCodes codes={CODES} onDownload={onDownload} writeText={vi.fn(() => Promise.resolve())} />);

    await userEvent.click(screen.getByRole('button', { name: 'Download codes' }));

    expect(onDownload).toHaveBeenCalledWith(CODES.join('\n'));
  });

  it('hides download when there is no handler', () => {
    render(<RecoveryCodes codes={CODES} writeText={vi.fn(() => Promise.resolve())} />);

    expect(screen.queryByRole('button', { name: 'Download codes' })).not.toBeInTheDocument();
  });
});
