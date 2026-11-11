import type { ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { LookScope } from '../../looks/LookScope';
import { Canvas } from '../Canvas';

import './shells.css';

type PhoneFrameProps = {
  /** What the screen is, for assistive technology and the caption: "Alarms on a phone". */
  label: string;
  look: LookId;
  /** Clock in the status bar. */
  time?: string;
  /** Docked under the screen content, usually a `BottomNav`. */
  footer?: ReactNode;
  /** Smallest height of the screen in px. */
  minHeight?: number;
  /** Show the label under the phone. */
  caption?: boolean;
  children: ReactNode;
};

/** A phone around a small-screen template: status bar, the screen on the look's canvas, a docked footer. */
export function PhoneFrame({ label, look, time = '14:00', footer, minHeight = 600, caption = true, children }: PhoneFrameProps) {
  return (
    <figure className="m-0 flex flex-col items-center">
      <div role="group" aria-label={label} className="shell-phone">
        <div aria-hidden="true" className="shell-phone-status">
          <span>{time}</span>
          <span>5G · 82 %</span>
        </div>
        <div className="shell-phone-screen" style={{ minHeight }}>
          <LookScope look={look} className="shell-fill">
            <Canvas>{children}</Canvas>
            {footer}
          </LookScope>
        </div>
      </div>
      {caption ? <figcaption className="shell-phone-caption">{label}</figcaption> : null}
    </figure>
  );
}
