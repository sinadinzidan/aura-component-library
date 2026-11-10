import type { HostAppAPI } from '@cognite/app-sdk';

/** The app's contract with whatever hosts it: restore state, save state, leave the app. */
export interface HostChannel {
  readonly initialState: string | undefined;
  sync(state: string): void;
  openExternal(url: string): void;
}

type FusionApi = Pick<HostAppAPI, 'syncInternalState' | 'navigateExternal'>;

/** Runs inside Fusion: the host owns the URL. */
export class FusionHostChannel implements HostChannel {
  constructor(
    private readonly api: FusionApi,
    readonly initialState: string | undefined
  ) {}

  sync(state: string): void {
    void this.api.syncInternalState(state);
  }

  openExternal(url: string): void {
    void this.api.navigateExternal({ url, openInNewTab: true });
  }
}

export type BrowserWindow = {
  location: Pick<Location, 'href'>;
  history: Pick<History, 'replaceState'>;
  open: (url: string, target: string, features: string) => unknown;
};

const STATE_PARAM = 'state';

/** Runs standalone (local dev, previews): state lives in a `?state=` search param. */
export class UrlHostChannel implements HostChannel {
  readonly initialState: string | undefined;

  constructor(private readonly browser: BrowserWindow) {
    this.initialState = new URL(browser.location.href).searchParams.get(STATE_PARAM) ?? undefined;
  }

  sync(state: string): void {
    const url = new URL(this.browser.location.href);
    url.searchParams.set(STATE_PARAM, state);
    this.browser.history.replaceState(null, '', url);
  }

  openExternal(url: string): void {
    this.browser.open(url, '_blank', 'noopener,noreferrer');
  }
}

export type ConnectHostChannelDeps = {
  connectToHost: () => Promise<{ api: FusionApi; initialState?: string }>;
  createFallback: () => HostChannel;
  timeoutMs: number;
  setTimer: (callback: () => void, ms: number) => unknown;
};

/** Connects to Fusion; when there is no host (or it does not answer in time) falls back. */
export function connectHostChannel(deps: ConnectHostChannelDeps): Promise<HostChannel> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (channel: HostChannel) => {
      if (settled) return;
      settled = true;
      resolve(channel);
    };
    deps.setTimer(() => settle(deps.createFallback()), deps.timeoutMs);
    deps.connectToHost().then(
      ({ api, initialState }) => settle(new FusionHostChannel(api, initialState)),
      () => settle(deps.createFallback())
    );
  });
}
