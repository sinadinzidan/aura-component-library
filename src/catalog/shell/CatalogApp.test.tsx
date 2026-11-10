import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CatalogDepsContext, type CatalogDeps } from '../CatalogDeps';
import { createCatalogIndex } from '../catalogIndex';
import { CatalogStateProvider } from '../state/CatalogStateProvider';
import type { HostChannel } from '../state/hostChannel';
import type { CatalogPage } from '../types';

import { CatalogApp } from './CatalogApp';

// Integration: shell + view model + page loading, with page modules and the search index faked.

const PAGE_SOURCE = `import { Thing } from '../../../library/actions/Thing';

function ButtonPrimary() {
  return <button>Save changes</button>;
}

function ButtonSplit() {
  return <Thing />;
}
`;

function ButtonPrimary() {
  return <button>Save changes</button>;
}

function ButtonSplit() {
  return <button>Split</button>;
}

function ButtonBroken(): never {
  throw new Error('broken specimen');
}

const BUTTON_PAGE: CatalogPage = {
  id: 'button',
  title: 'Button',
  summary: 'Buttons trigger an action or event.',
  docsSlug: 'button',
  guidance: { use: ['One primary action per view.'], avoid: ['Two primary buttons.'] },
  source: PAGE_SOURCE,
  sections: [
    {
      id: 'emphasis',
      title: 'Emphasis',
      description: 'Levels of importance.',
      specimens: [
        { id: 'ButtonPrimary', title: 'Primary', note: 'The main action on a view.', origin: 'aura', Component: ButtonPrimary },
        {
          id: 'ButtonSplit',
          title: 'Split button',
          note: 'A default action plus alternatives.',
          origin: 'custom',
          uses: ['actions/Thing.tsx'],
          Component: ButtonSplit,
        },
        { id: 'ButtonBroken', title: 'Broken', note: 'A specimen that throws.', origin: 'aura', Component: ButtonBroken },
      ],
    },
  ],
};

describe(CatalogApp.name, () => {
  let channel: HostChannel;
  let deps: CatalogDeps;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    channel = createChannel(undefined);
    deps = {
      index: createCatalogIndex([
        {
          area: 'primitives',
          id: 'button',
          title: 'Button',
          sections: [
            {
              id: 'emphasis',
              title: 'Emphasis',
              specimens: [
                { id: 'ButtonPrimary', title: 'Primary', note: 'The main action on a view.', origin: 'aura' },
                { id: 'ButtonSplit', title: 'Split button', note: 'A default action plus alternatives.', origin: 'custom' },
              ],
            },
          ],
        },
      ]),
      lookupPageLoader: (location) => (location.page.id === 'button' ? () => Promise.resolve(BUTTON_PAGE) : null),
      loadLibrarySource: vi.fn((file: string) => Promise.resolve(`// source of ${file}`)),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.classList.remove('dark');
  });

  it('shows the library home with totals', () => {
    renderApp(channel, deps);

    expect(screen.getByRole('heading', { level: 1, name: 'Aura Library' })).toBeInTheDocument();
    expect(within(screen.getByText('Variants').parentElement ?? document.body).getByText('2')).toBeInTheDocument();
  });

  it('navigates from an area overview to a page and syncs each step to the host', async () => {
    renderApp(channel, deps);

    await userEvent.click(screen.getByRole('tab', { name: 'Primitives' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Primitives' })).toBeInTheDocument();

    await userEvent.click(within(screen.getByRole('navigation', { name: 'Primitives' })).getByRole('button', { name: /^Button\s*2$/ }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Emphasis' })).toBeInTheDocument();
    expect(lastSynced(channel)).toMatchObject({ area: 'primitives', page: 'button' });
  });

  it('renders a page with summary, guidance and its specimens', async () => {
    renderApp(createChannel(JSON.stringify({ page: 'button' })), deps);

    expect(await screen.findByText('Buttons trigger an action or event.')).toBeInTheDocument();
    expect(screen.getByText('One primary action per view.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    expect(screen.getByText('3 variants in 1 sections')).toBeInTheDocument();
  });

  it('marks custom specimens and contains a specimen that throws', async () => {
    renderApp(createChannel(JSON.stringify({ page: 'button' })), deps);

    const split = await screen.findByRole('article', { name: 'Split button' });
    expect(within(split).getByText('Custom')).toBeInTheDocument();
    const broken = screen.getByRole('article', { name: 'Broken' });
    expect(within(broken).getByRole('alert')).toHaveTextContent('This variant failed to render.');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('shows a planned state for a page that is not built', async () => {
    renderApp(createChannel(JSON.stringify({ page: 'badge' })), deps);

    expect(await screen.findByText('Planned')).toBeInTheDocument();
  });

  it('shows an error when a page fails to load', async () => {
    deps = { ...deps, lookupPageLoader: () => () => Promise.reject(new Error('chunk failed')) };

    renderApp(createChannel(JSON.stringify({ page: 'button' })), deps);

    expect(await screen.findByText('This page could not be loaded. Reload to try again.')).toBeInTheDocument();
  });

  it('opens the code view for a specimen and syncs it', async () => {
    renderApp(createChannel(JSON.stringify({ page: 'button' })), deps);
    await screen.findByRole('article', { name: 'Primary' });

    await userEvent.click(screen.getByRole('button', { name: 'View code for Primary' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Primary' })).toBeInTheDocument();
    await waitFor(() => expect(dialog).toHaveTextContent('function ButtonPrimary()'));
  });

  it('restores an open code view from the host state and offers the library source', async () => {
    renderApp(createChannel(JSON.stringify({ page: 'button', specimen: 'ButtonSplit' })), deps);

    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog).toHaveTextContent("from '@/library/actions/Thing'"));

    await userEvent.click(within(dialog).getByRole('tab', { name: 'Thing.tsx' }));

    await waitFor(() => expect(dialog).toHaveTextContent('// source of actions/Thing.tsx'));
    expect(deps.loadLibrarySource).toHaveBeenCalledWith('actions/Thing.tsx');
  });

  it('opens external docs through the host channel', async () => {
    channel = createChannel(JSON.stringify({ page: 'button' }));
    renderApp(channel, deps);

    await userEvent.click(await screen.findByRole('button', { name: /Aura docs/ }));

    expect(channel.openExternal).toHaveBeenCalledWith('https://docs.cognite.com/aura-design-system/primitives/button');
  });

  it('finds a variant through search and jumps to it', async () => {
    renderApp(channel, deps);

    await userEvent.click(screen.getByRole('button', { name: /Search/ }));
    await userEvent.type(await screen.findByPlaceholderText('Search pages and variants'), 'split');
    await userEvent.click(await screen.findByRole('option', { name: /Split button/ }));

    expect(lastSynced(channel)).toMatchObject({ page: 'button', specimen: 'ButtonSplit', query: 'split' });
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('function ButtonSplit()'));
  });

  it('opens search with the slash key', async () => {
    renderApp(channel, deps);

    await userEvent.keyboard('/');

    expect(await screen.findByPlaceholderText('Search pages and variants')).toBeInTheDocument();
  });

  it('applies the dark theme class from saved state', () => {
    renderApp(createChannel(JSON.stringify({ theme: 'dark' })), deps);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies a theme preset to the document root and syncs it', async () => {
    renderApp(channel, deps);

    await userEvent.click(screen.getByRole('button', { name: /Theme/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Control room' }));

    expect(document.documentElement).toHaveAttribute('data-accent', 'nordic');
    expect(document.documentElement).toHaveAttribute('data-shape', 'sharp');
    expect(document.documentElement).toHaveAttribute('data-contrast', 'high');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(lastSynced(channel)).toMatchObject({ theme: { accent: 'nordic', shape: 'sharp', contrast: 'high' } });
  });

  it('changes a single theme option and keeps the rest', async () => {
    renderApp(createChannel(JSON.stringify({ theme: { accent: 'fjord', shape: 'soft' } })), deps);

    await userEvent.click(screen.getByRole('button', { name: /Theme/ }));
    await userEvent.click(await screen.findByRole('radio', { name: 'Dusk' }));

    expect(document.documentElement).toHaveAttribute('data-accent', 'dusk');
    expect(document.documentElement).toHaveAttribute('data-shape', 'soft');
  });
});

function createChannel(initialState: string | undefined): HostChannel {
  return { initialState, sync: vi.fn(), openExternal: vi.fn() };
}

function lastSynced(channel: HostChannel): unknown {
  const calls = vi.mocked(channel.sync).mock.calls;
  return JSON.parse(calls[calls.length - 1][0]);
}

function renderApp(channel: HostChannel, deps: CatalogDeps) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CatalogDepsContext.Provider value={deps}>
        <CatalogStateProvider channel={channel}>
          <CatalogApp doc={document} />
        </CatalogStateProvider>
      </CatalogDepsContext.Provider>
    </QueryClientProvider>
  );
}
