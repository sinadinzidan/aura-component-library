import { DiagramCanvas } from '../../industrial/diagrams/DiagramCanvas';
import { DiagramHotspot } from '../../industrial/diagrams/DiagramHotspot';
import { EquipmentSymbol } from '../../industrial/diagrams/EquipmentSymbol';
import { InstrumentBubble } from '../../industrial/diagrams/InstrumentBubble';
import { PipeLine } from '../../industrial/diagrams/PipeLine';
import { symbolPort } from '../../industrial/diagrams/symbolPaths';
import { runStateAppearance } from '../../industrial/diagrams/symbolState';
import { ValueTag } from '../../industrial/diagrams/ValueTag';
import { ValveSymbol } from '../../industrial/diagrams/ValveSymbol';
import type { Tone } from '../../industrial/status';

import { COMPRESSION_DRAWING, COMPRESSION_DRAWING_SIZE, COMPRESSION_INFO, COMPRESSION_LINE_Y, COMPRESSION_RECYCLE_Y } from './compressionArea';
import type { DrawingItem } from './compressionArea';
import { tagForId } from './tagMapping';
import type { TagLink } from './tagMapping';

export type PidInstrument = {
  id: string;
  letters: string;
  loop: string;
  /** The tag of the item it measures; the bubble hangs under it. */
  tag: string;
  value: number | null;
  unit: string;
  decimals?: number;
  tone?: Tone;
  flag?: string;
};

export type PidDrawingProps = {
  /** The mapping table, to turn a symbol's drawing id into a tag. */
  links: readonly TagLink[];
  selectedTag: string | null;
  /** The tag highlighted because the pointer is over it, on either side. */
  hoverTag: string | null;
  onSelect: (tag: string) => void;
  /** Called with the tag under the pointer, and `null` when it leaves. */
  onHover: (tag: string | null) => void;
  instruments?: readonly PidInstrument[];
  /** Tags the 3D model does not have. They are flagged under their label. */
  missingTags?: readonly string[];
};

const INSTRUMENT_Y = 262;

function centreOf(item: DrawingItem): { x: number; y: number } {
  // Valves sit on the line by their ports, which lie a little below the symbol's centre.
  return item.valveType ? { x: item.cx, y: item.cy - (item.size * 3) / 24 } : { x: item.cx, y: item.cy };
}

function portOf(item: DrawingItem, port: 'in' | 'out' | 'top') {
  const centre = centreOf(item);
  return symbolPort(item.symbol, port, centre.x, centre.y, item.size);
}

/**
 * The compression area as a P&ID: process line, equipment and valve symbols, instrument bubbles
 * with live values and a recycle line. Every equipment and valve symbol is a selectable hotspot
 * keyed by tag, so a selection made here can be mirrored in a 3D model that has its own ids.
 */
export function PidDrawing({ links, selectedTag, hoverTag, onSelect, onHover, instruments = [], missingTags = [] }: PidDrawingProps) {
  const item = (tag: string): DrawingItem => {
    const found = COMPRESSION_DRAWING.find((candidate) => candidate.tag === tag);
    if (!found) throw new Error(`No drawing item for ${tag}`);
    return found;
  };
  const inlet = item('23-XV-9111');
  const scrubber = item('23-VA-9120');
  const first = item('23-KA-9101');
  const cooler = item('23-HA-9114');
  const second = item('23-KA-9102');
  const recycle = item('23-HV-9162');
  const y = COMPRESSION_LINE_Y;
  const tee = second.cx + 56;
  const hotspotLabel = (entry: DrawingItem): string => {
    const info = COMPRESSION_INFO[entry.tag];
    const state = info?.valve ?? info?.run ?? '';
    return `${entry.tag} ${info?.name ?? ''}, ${state}`.trim();
  };

  return (
    <DiagramCanvas
      interactive
      label="P&ID of the compression area: inlet shutdown valve, suction scrubber, 1st stage compressor, interstage cooler, 2nd stage compressor and a recycle line with a control valve. Each symbol can be selected."
      width={COMPRESSION_DRAWING_SIZE.width}
      height={COMPRESSION_DRAWING_SIZE.height}
    >
      {/* Process line */}
      <PipeLine points={[{ x: 12, y }, portOf(inlet, 'in')]} weight="heavy" flow="forward" />
      <PipeLine points={[portOf(inlet, 'out'), portOf(scrubber, 'in')]} weight="heavy" />
      <PipeLine points={[portOf(scrubber, 'out'), portOf(first, 'in')]} weight="heavy" flow="forward" />
      <PipeLine points={[portOf(first, 'out'), portOf(cooler, 'in')]} weight="heavy" flow="forward" />
      <PipeLine points={[portOf(cooler, 'out'), portOf(second, 'in')]} weight="heavy" flow="forward" />
      <PipeLine points={[portOf(second, 'out'), { x: 628, y }]} weight="heavy" flow="forward" />
      {/* Recycle */}
      <PipeLine points={[{ x: tee, y }, { x: tee, y: COMPRESSION_RECYCLE_Y }, portOf(recycle, 'out')]} flow="reverse" />
      <PipeLine points={[portOf(recycle, 'in'), { x: scrubber.cx, y: COMPRESSION_RECYCLE_Y }, portOf(scrubber, 'top')]} flow="reverse" />
      <circle cx={tee} cy={y} r={3.5} className="fill-medium-foreground" />
      <text x={tee + 8} y={COMPRESSION_RECYCLE_Y - 8} className="fill-muted-foreground text-[10px]">
        Recycle
      </text>
      <text x={10} y={y - 10} className="fill-muted-foreground text-[10px]">
        Gas in
      </text>
      <text x={628} y={y - 12} textAnchor="end" className="fill-muted-foreground text-[10px]">
        To export
      </text>

      {/* Instruments, hanging under what they measure */}
      {instruments.map((instrument) => {
        const target = item(instrument.tag);
        return (
          <g key={instrument.id}>
            <PipeLine points={[{ x: target.cx, y: INSTRUMENT_Y - 18 }, { x: target.cx, y: target.cy + target.size / 2 + 22 }]} weight="light" dashed />
            <InstrumentBubble letters={instrument.letters} loop={instrument.loop} size={36} cx={target.cx} cy={INSTRUMENT_Y} tone={instrument.tone} />
            <ValueTag x={target.cx} y={INSTRUMENT_Y + 26} anchor="middle" value={instrument.value} unit={instrument.unit} decimals={instrument.decimals} tone={instrument.tone} flag={instrument.flag} />
          </g>
        );
      })}

      {/* Symbols as selectable hotspots */}
      {COMPRESSION_DRAWING.map((entry) => {
        const info = COMPRESSION_INFO[entry.tag];
        const tag = tagForId(links, entry.id, 'drawing') ?? entry.tag;
        const centre = centreOf(entry);
        const half = entry.size / 2;
        const box = { x: centre.x - half - 14, y: centre.y - half - 12, width: entry.size + 28, height: entry.size + 50 };
        const hovered = hoverTag === tag && selectedTag !== tag;
        const missing = missingTags.includes(tag);
        return (
          <g key={entry.id} onPointerEnter={() => onHover(tag)} onPointerLeave={() => onHover(null)}>
            {hovered ? <rect x={box.x} y={box.y} width={box.width} height={box.height} rx={8} className="fill-muted-background stroke-[var(--primary-background)]" strokeDasharray="4 3" strokeWidth={1.5} vectorEffect="non-scaling-stroke" /> : null}
            <DiagramHotspot x={box.x} y={box.y} width={box.width} height={box.height} label={hotspotLabel(entry)} selected={selectedTag === tag} onSelect={() => onSelect(tag)}>
              {entry.valveType ? (
                <ValveSymbol type={entry.valveType} position={info?.valve ?? 'open'} label={entry.tag} size={entry.size} cx={centre.x} cy={centre.y} />
              ) : (
                <EquipmentSymbol kind={entry.symbol} size={entry.size} cx={centre.x} cy={centre.y} label={hotspotLabel(entry)} {...runStateAppearance(info?.run ?? 'running')} />
              )}
              <text x={centre.x} y={centre.y + half + 16} textAnchor="middle" className="fill-base-foreground font-mono text-[11px]">
                {entry.tag}
              </text>
              <text x={centre.x} y={centre.y + half + 29} textAnchor="middle" className={missing ? 'fill-warning-foreground-strong text-[10px] font-medium' : 'fill-muted-foreground text-[10px]'}>
                {missing ? 'Not in 3D model' : info?.name}
              </text>
            </DiagramHotspot>
          </g>
        );
      })}
    </DiagramCanvas>
  );
}
