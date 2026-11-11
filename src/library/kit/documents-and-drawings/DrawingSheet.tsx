import type { CSSProperties } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, toneLine } from '../tones';

export type SheetHotspot = {
  tag: string;
  /** What the tag is, for the accessible name. */
  name: string;
  /** Centre of the tag label, in percent of the sheet width and height. */
  x: number;
  y: number;
};

export type SheetPin = { id: number; x: number; y: number; resolved?: boolean };

type DrawingSheetProps = {
  /** What the drawing shows, in words. */
  label: string;
  /** Detected tags, placed on the recompressor loop this sheet draws. */
  hotspots: readonly SheetHotspot[];
  /** Numbered annotation pins. */
  pins?: readonly SheetPin[];
  /** The selected tag. */
  selected?: string;
  /** Makes each tag a button. */
  onSelect?: (tag: string) => void;
  showTags?: boolean;
  showPins?: boolean;
  /** Tags that changed since the compared revision; drawn with a change mark. */
  changed?: readonly string[];
  /** Zoom in percent; 100 fits the sheet to its frame. */
  zoom?: number;
  /** The drawing's title block. */
  titleBlock?: { number: string; title: string; revision: string };
  className?: string;
};

/**
 * A P&ID sheet for a viewer: the recompressor loop as line art, with detected tags as selectable
 * labels, annotation pins and a title block. Ink and paper come from the look — dark like a CAD
 * screen in console, blue ink on a blueprint.
 */
export function DrawingSheet({ label, hotspots, pins = [], selected, onSelect, showTags = true, showPins = false, changed = [], zoom = 100, titleBlock, className }: DrawingSheetProps) {
  const look = useLook();
  const ink = 'var(--kit-text)';
  const fine = 'var(--kit-text-2)';
  const scale: CSSProperties = { transform: `scale(${zoom / 100})`, transformOrigin: '47% 60%' };
  const square = look === 'console' || look === 'poster' || look === 'blueprint' || look === 'editorial';

  return (
    <div
      role="group"
      aria-label={label}
      data-look={look}
      data-zoom={zoom}
      className={cx('relative aspect-[5/3] w-full min-w-0 overflow-hidden bg-[var(--kit-halo)]', className)}
      style={{ border: '1px solid var(--kit-rule-strong)' }}
    >
      <div className="absolute inset-0" style={scale}>
        <svg viewBox="0 0 1000 600" aria-hidden="true" className="absolute inset-0 h-full w-full" fill="none" stroke={ink} strokeWidth="2" strokeLinejoin="round">
          <rect x="16" y="16" width="968" height="568" stroke={fine} strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <g vectorEffect="non-scaling-stroke">
            <path d="M40 380 H130 M170 380 H240 M300 380 H424 M516 380 H662 M738 380 H830 M870 380 H960" vectorEffect="non-scaling-stroke" />
            <path d="M130 362 L170 398 V362 L130 398 Z" vectorEffect="non-scaling-stroke" />
            <rect x="240" y="300" width="60" height="160" rx="30" vectorEffect="non-scaling-stroke" />
            <circle cx="470" cy="380" r="46" vectorEffect="non-scaling-stroke" />
            <path d="M444 352 L506 380 L444 408 Z" vectorEffect="non-scaling-stroke" />
            <circle cx="700" cy="380" r="38" vectorEffect="non-scaling-stroke" />
            <path d="M672 380 L686 362 L700 398 L714 362 L728 380" vectorEffect="non-scaling-stroke" />
            <path d="M830 362 L870 398 V362 L830 398 Z" vectorEffect="non-scaling-stroke" />
            <path d="M780 380 V250 H580 M540 250 H330 V380" vectorEffect="non-scaling-stroke" />
            <path d="M540 236 L580 264 V236 L540 264 Z" vectorEffect="non-scaling-stroke" />
            <rect x="430" y="495" width="140" height="60" vectorEffect="non-scaling-stroke" />
            <path d="M470 426 V495" vectorEffect="non-scaling-stroke" />
            <circle cx="380" cy="150" r="22" vectorEffect="non-scaling-stroke" />
            <circle cx="560" cy="150" r="22" vectorEffect="non-scaling-stroke" />
            <circle cx="330" cy="525" r="22" vectorEffect="non-scaling-stroke" />
            <path d="M358 150 H402 M538 150 H582 M308 525 H352" stroke={fine} strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </g>
          <path d="M380 172 L440 344 M560 172 L498 344 M352 525 H430" stroke={fine} strokeWidth="1.25" strokeDasharray="7 6" vectorEffect="non-scaling-stroke" />
        </svg>
        {showTags
          ? hotspots.map((hotspot) => {
              const picked = selected === hotspot.tag;
              const isChanged = changed.includes(hotspot.tag);
              const style: CSSProperties = {
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                borderRadius: square ? 0 : 6,
                background: picked ? 'var(--kit-accent)' : 'var(--kit-halo)',
                color: picked ? 'var(--kit-on-accent)' : ink,
                border: `${isChanged ? 2 : 1}px solid ${isChanged ? toneLine('warning') : picked ? 'var(--kit-accent)' : fine}`,
              };
              const classes = 'absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-1.5 text-xs font-semibold leading-5 tabular-nums';
              return onSelect ? (
                <button
                  key={hotspot.tag}
                  type="button"
                  aria-label={`${hotspot.tag}, ${hotspot.name}${isChanged ? ', changed' : ''}`}
                  aria-pressed={picked}
                  data-tag={hotspot.tag}
                  data-changed={isChanged}
                  className={cx(classes, 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kit-text)]')}
                  style={style}
                  onClick={() => onSelect(hotspot.tag)}
                >
                  {hotspot.tag}
                </button>
              ) : (
                <span key={hotspot.tag} title={hotspot.name} data-tag={hotspot.tag} data-changed={isChanged} className={classes} style={style}>
                  {hotspot.tag}
                </span>
              );
            })
          : null}
        {showPins
          ? pins.map((pin) => (
              <span
                key={pin.id}
                data-pin={pin.id}
                className="absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-semibold leading-none tabular-nums"
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  background: pin.resolved ? 'var(--kit-halo)' : toneLine('warning'),
                  color: pin.resolved ? toneLine('warning') : 'var(--kit-halo)',
                  border: `2px solid ${toneLine('warning')}`,
                }}
              >
                {pin.id}
              </span>
            ))
          : null}
      </div>
      {titleBlock ? (
        <dl
          className="absolute bottom-[4.5%] right-[2.8%] grid grid-cols-[auto_auto] bg-[var(--kit-halo)] text-xs leading-4 text-[var(--kit-text)]"
          style={{ border: `1px solid ${ink}` }}
        >
          <div className="col-span-2 px-2 py-1 font-semibold" style={{ borderBottom: `1px solid ${ink}` }}>
            <dt className="sr-only">Title</dt>
            <dd>{titleBlock.title}</dd>
          </div>
          <div className="px-2 py-1" style={{ borderRight: `1px solid ${ink}` }}>
            <dt className="text-[var(--kit-text-2)]">Drawing</dt>
            <dd className="font-semibold tabular-nums">{titleBlock.number}</dd>
          </div>
          <div className="px-2 py-1">
            <dt className="text-[var(--kit-text-2)]">Rev</dt>
            <dd className="font-semibold tabular-nums">{titleBlock.revision}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
