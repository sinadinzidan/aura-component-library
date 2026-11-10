import {
  connectHostChannel,
  FusionHostChannel,
  UrlHostChannel,
  type BrowserWindow,
  type HostChannel,
} from './hostChannel';

describe(FusionHostChannel.name, () => {
  it('pushes state to the host', () => {
    const api = { syncInternalState: vi.fn(() => Promise.resolve(true)), navigateExternal: vi.fn() };
    const channel = new FusionHostChannel(api, '{"page":"button"}');

    channel.sync('{"page":"badge"}');

    expect(channel.initialState).toBe('{"page":"button"}');
    expect(api.syncInternalState).toHaveBeenCalledWith('{"page":"badge"}');
  });

  it('opens external links in a new tab through the host', () => {
    const api = { syncInternalState: vi.fn(), navigateExternal: vi.fn(() => Promise.resolve(true)) };

    new FusionHostChannel(api, undefined).openExternal('https://docs.example.test/button');

    expect(api.navigateExternal).toHaveBeenCalledWith({ url: 'https://docs.example.test/button', openInNewTab: true });
  });
});

describe(UrlHostChannel.name, () => {
  it('reads the initial state from the search param', () => {
    const browser = createBrowser('https://app.example.test/?state=%7B%22page%22%3A%22button%22%7D');

    expect(new UrlHostChannel(browser).initialState).toBe('{"page":"button"}');
  });

  it('has no initial state when the param is missing', () => {
    expect(new UrlHostChannel(createBrowser('https://app.example.test/')).initialState).toBeUndefined();
  });

  it('writes state to the search param and keeps other params', () => {
    const browser = createBrowser('https://app.example.test/?debug=1');

    new UrlHostChannel(browser).sync('{"page":"badge"}');

    const [, , url] = vi.mocked(browser.history.replaceState).mock.calls[0];
    expect(String(url)).toBe('https://app.example.test/?debug=1&state=%7B%22page%22%3A%22badge%22%7D');
  });

  it('opens external links in a new tab without an opener', () => {
    const browser = createBrowser('https://app.example.test/');

    new UrlHostChannel(browser).openExternal('https://docs.example.test/');

    expect(browser.open).toHaveBeenCalledWith('https://docs.example.test/', '_blank', 'noopener,noreferrer');
  });
});

describe(connectHostChannel.name, () => {
  const fallback: HostChannel = { initialState: 'fallback', sync: vi.fn(), openExternal: vi.fn() };

  it('uses the Fusion host when it connects', async () => {
    const api = { syncInternalState: vi.fn(), navigateExternal: vi.fn() };

    const channel = await connectHostChannel({
      connectToHost: () => Promise.resolve({ api, initialState: 'from-host' }),
      createFallback: () => fallback,
      timeoutMs: 1000,
      setTimer: vi.fn(),
    });

    expect(channel.initialState).toBe('from-host');
  });

  it('falls back when the host rejects', async () => {
    const channel = await connectHostChannel({
      connectToHost: () => Promise.reject(new Error('no host')),
      createFallback: () => fallback,
      timeoutMs: 1000,
      setTimer: vi.fn(),
    });

    expect(channel).toBe(fallback);
  });

  it('falls back when the host does not answer in time', async () => {
    const channel = await connectHostChannel({
      connectToHost: () => new Promise(() => undefined),
      createFallback: () => fallback,
      timeoutMs: 1000,
      setTimer: (callback) => callback(),
    });

    expect(channel).toBe(fallback);
  });
});

function createBrowser(href: string): BrowserWindow {
  return { location: { href }, history: { replaceState: vi.fn() }, open: vi.fn() };
}
