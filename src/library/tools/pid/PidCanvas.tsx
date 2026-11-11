import type { KeyboardEvent } from 'react';

import { SvgStatusMark } from '../../experiences/drilldown/SvgStatusMark';
import { polylinePath } from '../../industrial/diagrams/diagramGeometry';
import { DiagramHotspot } from '../../industrial/diagrams/DiagramHotspot';
import { EquipmentSymbol } from '../../industrial/diagrams/EquipmentSymbol';
import { FlowArrow } from '../../industrial/diagrams/FlowArrow';
import { InstrumentBubble } from '../../industrial/diagrams/InstrumentBubble';
import { PipeLine } from '../../industrial/diagrams/PipeLine';
import { runStateAppearance } from '../../industrial/diagrams/symbolState';
import { ValueTag } from '../../industrial/diagrams/ValueTag';
import { ValveSymbol } from '../../industrial/diagrams/ValveSymbol';
import { TONE_TEXT, runStateStatus, severityStatus } from '../../industrial/status';

import { ALL_LAYERS_ON, EQUIPMENT_SIZE, INSTRUMENT_SIZE, VALVE_SIZE, readingState, tagRefs, valveCentreY, worstAlarmByTag } from './pidModel';
import type { PidAlarm, PidDrawing, PidLayers, PidPin, PidTagRef } from './pidModel';
import { pinNumber } from './pidReducer';
import type { PidSelection } from './pidReducer';

export type PidCanvasProps = {
  drawing: PidDrawing;
  /** Live value per instrument id. `null` is a lost signal. */
  readings?: Readonly<Record<string, number | null>>;
  alarms?: readonly PidAlarm[];
  layers?: PidLayers;
  selection?: PidSelection;
  pins?: readonly PidPin[];
  /** Makes tags, lines and pins selectable. Left out, the drawing is a picture. */
  onSelect?: (selection: NonNullable<PidSelection>) => void;
  /** A tag received keyboard focus; the viewer uses it to keep the tag on screen. */
  onFocusTag?: (id: string) => void;
};

const TEXT = 10;

function alarmCircle(drawing: PidDrawing, ref: PidTagRef): { cx: number; cy: number; r: number } {
  if (ref.kind === 'equipment') {
    const item = drawing.equipment.find((candidate) => candidate.id === ref.id);
    return { cx: item?.x ?? ref.centre.x, cy: item?.y ?? ref.centre.y, r: (item?.size ?? EQUIPMENT_SIZE) / 2 + 8 };
  }
  if (ref.kind === 'valve') {
    const item = drawing.valves.find((candidate) => candidate.id === ref.id);
    return { cx: ref.centre.x, cy: item ? valveCentreY(item) : ref.centre.y, r: (item?.size ?? VALVE_SIZE) / 2 + 6 };
  }
  return { cx: ref.centre.x, cy: ref.centre.y, r: INSTRUMENT_SIZE / 2 + 6 };
}

/**
 * The content of a P&ID in world units: sheet border, lines with numbers and flow arrows,
 * equipment, valves, instrument bubbles, live values, the alarm overlay, notes and pins. It is a
 * group, not an SVG, so a viewer can pan and zoom it and a mini-map can draw it small. Layers
 * switch whole classes of marks on and off; equipment is always drawn.
 */
export function PidCanvas({ drawing, readings = {}, alarms = [], layers = ALL_LAYERS_ON, selection = null, pins = [], onSelect, onFocusTag }: PidCanvasProps) {
  const refs = tagRefs(drawing);
  const refById = new Map(refs.map((ref) => [ref.id, ref]));
  const selectedTagId = selection?.kind === 'tag' ? selection.id : null;
  const selectedLineId = selection?.kind === 'line' ? selection.id : null;
  const selectedPinId = selection?.kind === 'pin' ? selection.id : null;
  const worst = worstAlarmByTag(alarms);

  const activate = (event: KeyboardEvent<SVGGElement>, target: NonNullable<PidSelection>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(target);
    }
  };

  const equipmentMarks = drawing.equipment.map((item) => {
    const size = item.size ?? EQUIPMENT_SIZE;
    return (
      <g key={item.id} data-tag={item.tag}>
        <EquipmentSymbol kind={item.kind} size={size} cx={item.x} cy={item.y} label={`${item.tag} ${item.name}, ${runStateStatus(item.state).label.toLowerCase()}`} {...runStateAppearance(item.state)} />
        <text x={item.x} y={item.y + size / 2 + 14} fontSize={TEXT} textAnchor="middle" className="fill-base-foreground font-mono">
          {item.tag}
        </text>
        <text x={item.x} y={item.y + size / 2 + 27} fontSize={TEXT} textAnchor="middle" className="fill-muted-foreground">
          {item.name}
        </text>
      </g>
    );
  });

  const valveMarks = drawing.valves.map((item) => {
    const size = item.size ?? VALVE_SIZE;
    return (
      <g key={item.id} data-tag={item.tag}>
        <ValveSymbol type={item.type} position={item.position} label={item.tag} size={size} cx={item.x} cy={valveCentreY(item)} />
        <text x={item.x} y={item.y + size / 2 + 6} fontSize={TEXT - 1} textAnchor="middle" className="fill-base-foreground font-mono">
          {item.tag}
        </text>
      </g>
    );
  });

  const instrumentMarks = layers.instruments
    ? drawing.instruments.map((item) => {
        const state = readingState(readings[item.id], item.limits);
        return (
          <g key={item.id} data-tag={item.tag}>
            {item.tapTo ? (
              <path
                data-slot="pid-tap"
                d={polylinePath([{ x: item.x, y: item.y + (item.tapTo.y > item.y ? INSTRUMENT_SIZE / 2 : -INSTRUMENT_SIZE / 2) }, item.tapTo])}
                strokeWidth={1}
                strokeDasharray={item.mounting === 'panel' ? '3 3' : undefined}
                vectorEffect="non-scaling-stroke"
                className="stroke-muted-foreground"
              />
            ) : null}
            <InstrumentBubble letters={item.letters} loop={item.loop} mounting={item.mounting} size={INSTRUMENT_SIZE} cx={item.x} cy={item.y} label={`${item.tag} ${item.name}`} tone={state.tone} />
          </g>
        );
      })
    : null;

  const bodyOf = (ref: PidTagRef) => {
    if (ref.kind === 'equipment') return equipmentMarks[drawing.equipment.findIndex((item) => item.id === ref.id)];
    if (ref.kind === 'valve') return valveMarks[drawing.valves.findIndex((item) => item.id === ref.id)];
    return instrumentMarks ? instrumentMarks[drawing.instruments.findIndex((item) => item.id === ref.id)] : null;
  };

  const visibleRefs = refs.filter((ref) => ref.kind !== 'instrument' || layers.instruments);

  return (
    <g data-slot="pid-canvas" className="text-medium-foreground">
      <rect data-slot="pid-sheet" x={0} y={0} width={drawing.width} height={drawing.height} rx={4} strokeWidth={1} vectorEffect="non-scaling-stroke" className="fill-base-background stroke-default" />

      {layers.lines ? (
        <g data-slot="pid-lines">
          {drawing.lines.map((line) => {
            const selected = line.id === selectedLineId;
            return (
              <g key={line.id} data-line={line.id} data-selected={selected}>
                {selected ? (
                  <path d={polylinePath(line.points)} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-info-background" />
                ) : null}
                <PipeLine
                  points={line.points}
                  weight={line.weight ?? 'normal'}
                  dashed={line.dashed}
                  flow={line.flow}
                  arrows={line.arrows ?? 1}
                  arrowSize={line.weight === 'light' ? 6 : 9}
                  tone={selected ? 'info' : 'neutral'}
                />
                {line.label ? (
                  <text
                    x={line.label.x}
                    y={line.label.y}
                    fontSize={TEXT - 1}
                    textAnchor={line.label.anchor ?? 'start'}
                    className={selected ? 'fill-info-foreground-strong font-mono font-medium' : 'fill-muted-foreground font-mono'}
                  >
                    {line.number}
                  </text>
                ) : null}
              </g>
            );
          })}
          {drawing.connectors.map((connector) => {
            const out = connector.direction === 'out';
            return (
              <g key={connector.id} data-slot="pid-connector">
                <FlowArrow x={connector.x + (out ? 8 : -8)} y={connector.y} direction="right" size={12} />
                <text x={connector.x + (out ? 18 : -18)} y={connector.y - 2} fontSize={TEXT} textAnchor={out ? 'start' : 'end'} className="fill-base-foreground">
                  {connector.label}
                </text>
                <text x={connector.x + (out ? 18 : -18)} y={connector.y + 10} fontSize={TEXT - 1} textAnchor={out ? 'start' : 'end'} className="fill-muted-foreground font-mono">
                  {connector.drawing}
                </text>
              </g>
            );
          })}
        </g>
      ) : null}

      <g data-slot="pid-tags">
        {visibleRefs.map((ref) => {
          const selected = ref.id === selectedTagId;
          const ring = selected ? (
            <rect
              data-slot="pid-selection-ring"
              x={ref.bounds.x - 3}
              y={ref.bounds.y - 3}
              width={ref.bounds.width + 6}
              height={ref.bounds.height + 6}
              rx={10}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              className="pointer-events-none stroke-base-foreground"
            />
          ) : null;
          if (!onSelect) {
            return (
              <g key={ref.id}>
                {ring}
                {bodyOf(ref)}
              </g>
            );
          }
          return (
            <g key={ref.id} onFocus={() => onFocusTag?.(ref.id)}>
              {ring}
              <DiagramHotspot
                x={ref.bounds.x}
                y={ref.bounds.y}
                width={ref.bounds.width}
                height={ref.bounds.height}
                label={`${ref.tag}, ${ref.name}`}
                selected={selected}
                onSelect={() => onSelect({ kind: 'tag', id: ref.id })}
              >
                {bodyOf(ref)}
              </DiagramHotspot>
            </g>
          );
        })}
      </g>

      {layers.lines && onSelect ? (
        <g data-slot="pid-line-targets">
          {drawing.lines.map((line) => (
            <g
              key={line.id}
              role="button"
              tabIndex={0}
              aria-label={`Line ${line.number}, ${line.service}`}
              aria-pressed={line.id === selectedLineId}
              onClick={() => onSelect({ kind: 'line', id: line.id })}
              onKeyDown={(event) => activate(event, { kind: 'line', id: line.id })}
              className="group cursor-pointer outline-none"
            >
              <path
                d={polylinePath(line.points)}
                strokeWidth={12}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                pointerEvents="stroke"
                className="stroke-transparent group-focus-visible:stroke-ring-default group-focus-visible:opacity-40"
              />
            </g>
          ))}
        </g>
      ) : null}

      {layers.values && layers.instruments ? (
        <g data-slot="pid-values" className="pointer-events-none">
          {drawing.instruments.map((item) => {
            const value = readings[item.id];
            const state = readingState(value, item.limits);
            const above = (item.valueAt ?? 'above') === 'above';
            return (
              <ValueTag
                key={item.id}
                x={item.x}
                y={above ? item.y - INSTRUMENT_SIZE / 2 - 26 : item.y + INSTRUMENT_SIZE / 2 + 6}
                anchor="middle"
                value={value ?? null}
                unit={item.unit}
                decimals={item.decimals}
                tone={state.tone}
                flag={state.flag}
              />
            );
          })}
        </g>
      ) : null}

      {layers.alarms ? (
        <g data-slot="pid-alarms" className="pointer-events-none">
          {[...worst.entries()].map(([tagId, alarm]) => {
            const ref = refById.get(tagId);
            if (!ref || (ref.kind === 'instrument' && !layers.instruments)) return null;
            const { cx, cy, r } = alarmCircle(drawing, ref);
            const status = severityStatus(alarm.severity);
            const corner = r * Math.SQRT1_2;
            return (
              <g key={tagId} data-slot="pid-alarm" data-severity={alarm.severity} className={TONE_TEXT[status.tone]}>
                <title>{`${status.label} alarm on ${ref.tag}: ${alarm.message}`}</title>
                <circle cx={cx} cy={cy} r={r} stroke="currentColor" strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" className="motion-safe:animate-pulse" />
                <circle cx={cx + corner} cy={cy - corner} r={8} className="fill-base-background" />
                <SvgStatusMark x={cx + corner} y={cy - corner} size={11} tone={status.tone} shape={status.shape} />
              </g>
            );
          })}
        </g>
      ) : null}

      {layers.annotations ? (
        <g data-slot="pid-annotations">
          {drawing.notes.map((note) => (
            <text key={note.id} x={note.x} y={note.y} fontSize={TEXT} textAnchor={note.anchor ?? 'start'} className="fill-muted-foreground">
              {note.text}
            </text>
          ))}
          {pins.map((pin) => {
            const selected = pin.id === selectedPinId;
            const label = `Pin ${pinNumber(pin)}${pin.note ? `: ${pin.note}` : ''}`;
            const mark = (
              <>
                <path
                  d={`M ${pin.x} ${pin.y} L ${pin.x - 7} ${pin.y - 14} A 9 9 0 1 1 ${pin.x + 7} ${pin.y - 14} Z`}
                  strokeWidth={selected ? 2 : 1.5}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  className={selected ? 'fill-base-foreground stroke-base-foreground' : 'fill-base-background stroke-base-foreground group-focus-visible:stroke-ring-default'}
                />
                <text x={pin.x} y={pin.y - 19} fontSize={TEXT} textAnchor="middle" dominantBaseline="central" className={selected ? 'fill-base-background font-medium' : 'fill-base-foreground font-medium'}>
                  {pinNumber(pin)}
                </text>
              </>
            );
            if (!onSelect) {
              return (
                <g key={pin.id} data-slot="pid-pin" role="img" aria-label={label}>
                  {mark}
                </g>
              );
            }
            return (
              <g
                key={pin.id}
                data-slot="pid-pin"
                role="button"
                tabIndex={0}
                aria-label={label}
                aria-pressed={selected}
                onClick={() => onSelect({ kind: 'pin', id: pin.id })}
                onKeyDown={(event) => activate(event, { kind: 'pin', id: pin.id })}
                className="group cursor-pointer outline-none"
              >
                {mark}
              </g>
            );
          })}
        </g>
      ) : null}
    </g>
  );
}
