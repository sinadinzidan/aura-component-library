import { Kbd, KbdGroup } from '@cognite/aura/components/kbd';
import { Fragment } from 'react';

export type ShortcutPlatform = 'mac' | 'other';

type KeyNames = { mac: string; other: string; spoken: { mac: string; other: string } };

/** Platform-neutral key names a shortcut can be written with. Anything else is shown as typed. */
const KEYS: Record<string, KeyNames> = {
  mod: { mac: '⌘', other: 'Ctrl', spoken: { mac: 'Command', other: 'Control' } },
  shift: { mac: '⇧', other: 'Shift', spoken: { mac: 'Shift', other: 'Shift' } },
  alt: { mac: '⌥', other: 'Alt', spoken: { mac: 'Option', other: 'Alt' } },
  enter: { mac: '↵', other: 'Enter', spoken: { mac: 'Return', other: 'Enter' } },
  backspace: { mac: '⌫', other: 'Backspace', spoken: { mac: 'Delete', other: 'Backspace' } },
  esc: { mac: 'Esc', other: 'Esc', spoken: { mac: 'Escape', other: 'Escape' } },
  up: { mac: '↑', other: '↑', spoken: { mac: 'Up arrow', other: 'Up arrow' } },
  down: { mac: '↓', other: '↓', spoken: { mac: 'Down arrow', other: 'Down arrow' } },
  left: { mac: '←', other: '←', spoken: { mac: 'Left arrow', other: 'Left arrow' } },
  right: { mac: '→', other: '→', spoken: { mac: 'Right arrow', other: 'Right arrow' } },
};

/** Reads the platform from the user agent; anything that is not Apple hardware counts as `other`. */
function detectPlatform(userAgent: string): ShortcutPlatform {
  return /Mac|iPhone|iPad/i.test(userAgent) ? 'mac' : 'other';
}

type ShortcutHintProps = {
  /** Keys in press order, using `mod`, `shift`, `alt`, `enter`, `esc`, arrows or literal keys such as `K`. */
  keys: readonly string[];
  /** `chord` = held together; `sequence` = pressed one after the other ("G then D"). */
  mode?: 'chord' | 'sequence';
  /** Defaults to the platform the app runs on. Pass it to keep a hint fixed, for example in docs. */
  platform?: ShortcutPlatform;
  /** Where the platform is detected from when `platform` is not set. */
  userAgent?: string;
};

/**
 * Renders a shortcut with the right keys for the platform — ⌘ on a Mac, Ctrl elsewhere — and reads
 * it out in words, so shortcuts are written once and never show the wrong modifier.
 */
export function ShortcutHint({
  keys,
  mode = 'chord',
  platform,
  userAgent = globalThis.navigator?.userAgent ?? '',
}: ShortcutHintProps) {
  const resolved = platform ?? detectPlatform(userAgent);
  const visible = keys.map((key) => KEYS[key.toLowerCase()]?.[resolved] ?? key);
  const spoken = keys.map((key) => KEYS[key.toLowerCase()]?.spoken[resolved] ?? key);

  return (
    <KbdGroup>
      <span className="sr-only">{spoken.join(mode === 'sequence' ? ' then ' : ' + ')}</span>
      {visible.map((key, index) => (
        <Fragment key={`${key}-${index}`}>
          {mode === 'sequence' && index > 0 ? (
            <span aria-hidden className="text-xs text-muted-foreground">
              then
            </span>
          ) : null}
          <Kbd aria-hidden>{key}</Kbd>
        </Fragment>
      ))}
    </KbdGroup>
  );
}
