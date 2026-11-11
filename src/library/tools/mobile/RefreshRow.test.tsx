import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RefreshRow } from './RefreshRow';

describe(RefreshRow.name, () => {
  it('shows how fresh the data is and refreshes on a tap', async () => {
    const onRefresh = vi.fn();
    render(<RefreshRow status="Updated 14:00" refreshing={false} onRefresh={onRefresh} />);

    expect(screen.getByText('Updated 14:00')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('says it is refreshing and cannot be tapped again', () => {
    render(<RefreshRow status="Updated 14:00" refreshing onRefresh={() => undefined} />);

    expect(screen.getByText('Refreshing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  });
});
