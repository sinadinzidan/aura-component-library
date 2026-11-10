import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';

import App from './App';
import type { HostChannel } from './catalog/state/hostChannel';

describe('App', () => {
  it('shows a loader until the host channel is connected', () => {
    renderApp(() => new Promise(() => undefined));

    expect(screen.getByLabelText('Loading the library')).toBeInTheDocument();
  });

  it('opens the library home when the host has no saved state', async () => {
    renderApp(() => Promise.resolve(createChannel(undefined)));

    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Aura Library' })).toBeInTheDocument());
  });

  it('restores the page saved by the host', async () => {
    renderApp(() => Promise.resolve(createChannel(JSON.stringify({ page: 'button' }))));

    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeInTheDocument());
  });
});

function createChannel(initialState: string | undefined): HostChannel {
  return { initialState, sync: vi.fn(), openExternal: vi.fn() };
}

function renderApp(connect: () => Promise<HostChannel>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <App connect={connect} />
    </QueryClientProvider>
  );
}
