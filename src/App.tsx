import { connectToHostApp as connectToHostAppImpl } from '@cognite/app-sdk';
import { Loader } from '@cognite/aura/components/loader';
import { useEffect, useState } from 'react';

import appConfig from '../app.json';

import { CatalogApp } from './catalog/shell/CatalogApp';
import { CatalogStateProvider } from './catalog/state/CatalogStateProvider';
import {
  connectHostChannel,
  UrlHostChannel,
  type ConnectHostChannelDeps,
  type HostChannel,
} from './catalog/state/hostChannel';

const HOST_TIMEOUT_MS = 1500;

type AppProps = {
  /** Resolves the channel to the host. Injected in tests. */
  connect?: () => Promise<HostChannel>;
  doc?: Document;
};

const defaultDeps: ConnectHostChannelDeps = {
  connectToHost: () => connectToHostAppImpl({ applicationName: appConfig.externalId }),
  createFallback: () => new UrlHostChannel(window),
  timeoutMs: HOST_TIMEOUT_MS,
  setTimer: (callback, ms) => window.setTimeout(callback, ms),
};

const defaultConnect = () => connectHostChannel(defaultDeps);

function App({ connect = defaultConnect, doc = document }: AppProps) {
  const [channel, setChannel] = useState<HostChannel | null>(null);

  useEffect(() => {
    let cancelled = false;
    void connect().then((result) => {
      if (!cancelled) setChannel(result);
    });
    return () => {
      cancelled = true;
    };
  }, [connect]);

  if (!channel) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted-background">
        <Loader size={24} aria-label="Loading the library" />
      </div>
    );
  }

  return (
    <CatalogStateProvider channel={channel}>
      <CatalogApp doc={doc} />
    </CatalogStateProvider>
  );
}

export default App;
