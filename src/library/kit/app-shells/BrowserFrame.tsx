import { IconLock } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { LookScope } from '../../looks/LookScope';

import './shells.css';

type BrowserFrameProps = {
  /** Address shown in the window bar, without the scheme: `nordkapp.example.test/alarms`. */
  url: string;
  /** Look the page inside is drawn in. */
  look: LookId;
  /** Title of the browser tab, shown at the end of the bar. */
  tab?: string;
  /** Smallest height of the page area in px, so a short page still reads as a full screen. */
  minHeight?: number;
  /** The page, usually an `AppFrame`. It stretches to fill the window. */
  children: ReactNode;
};

/**
 * A browser window around a full-page template: a neutral bar with the address, then the page in
 * its look. The window stays in the surrounding theme so every template sits in the same frame.
 */
export function BrowserFrame({ url, look, tab, minHeight = 680, children }: BrowserFrameProps) {
  return (
    <div className="shell-browser-stage">
      <div role="group" aria-label={`Browser window: ${url}`} className="shell-browser">
        <div className="shell-browser-bar">
          <span aria-hidden="true" className="shell-browser-dots">
            <span />
            <span />
            <span />
          </span>
          <span className="shell-browser-url">
            <IconLock aria-hidden="true" />
            <span className="truncate">{url}</span>
          </span>
          {tab ? <span className="shell-browser-tab">{tab}</span> : <span />}
        </div>
        <div className="shell-browser-body" style={{ minHeight }}>
          <LookScope look={look} className="shell-fill">
            {children}
          </LookScope>
        </div>
      </div>
    </div>
  );
}
