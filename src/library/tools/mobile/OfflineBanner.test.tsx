import { render, screen } from '@testing-library/react';

import { OfflineBanner } from './OfflineBanner';

describe(OfflineBanner.name, () => {
  it('says the device is offline and what it means', () => {
    render(<OfflineBanner>Changes are saved on this device.</OfflineBanner>);

    expect(screen.getByRole('status')).toHaveTextContent('You are offline. Changes are saved on this device.');
  });

  it('can carry an action and a different title', () => {
    render(
      <OfflineBanner title="Connection lost" action={<button type="button">Retry</button>}>
        Trying again.
      </OfflineBanner>
    );

    expect(screen.getByRole('status')).toHaveTextContent('Connection lost.');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
