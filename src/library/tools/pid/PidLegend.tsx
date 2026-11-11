import type { ReactNode } from 'react';

import { SvgStatusMark } from '../../experiences/drilldown/SvgStatusMark';
import { DiagramCanvas } from '../../industrial/diagrams/DiagramCanvas';
import { EquipmentSymbol } from '../../industrial/diagrams/EquipmentSymbol';
import { InstrumentBubble } from '../../industrial/diagrams/InstrumentBubble';
import { PipeLine } from '../../industrial/diagrams/PipeLine';
import { ValueTag } from '../../industrial/diagrams/ValueTag';
import { ValveSymbol } from '../../industrial/diagrams/ValveSymbol';
import { cn } from '../../../lib/utils';

export type PidLegendGroup = 'lines' | 'symbols' | 'states';

export type PidLegendProps = {
  /** Which parts of the key to show. All three by default. */
  groups?: readonly PidLegendGroup[];
  /** One column for a side panel, or groups side by side under a wide drawing. */
  layout?: 'column' | 'row';
  className?: string;
};

function Swatch({ label, children }: { label: string; children: ReactNode }) {
  return (
    <DiagramCanvas label={label} width={56} height={32} className="mx-0 w-14 shrink-0">
      {children}
    </DiagramCanvas>
  );
}

function Row({ label, detail, children }: { label: string; detail?: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      {children}
      <span className="flex min-w-0 flex-col">
        <span className="text-sm text-base-foreground">{label}</span>
        {detail ? <span className="text-xs text-muted-foreground">{detail}</span> : null}
      </span>
    </li>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

const LINE = [
  { x: 4, y: 16 },
  { x: 52, y: 16 },
];

/**
 * The key to a P&ID: what the line weights mean, how symbols show their state and how a reading
 * or an alarm is marked. Every state is told apart by weight, fill, shape or letters, never by
 * colour alone.
 */
export function PidLegend({ groups = ['lines', 'symbols', 'states'], layout = 'column', className }: PidLegendProps) {
  return (
    <div data-slot="pid-legend" className={cn('flex min-w-0 gap-x-8 gap-y-5', layout === 'column' ? 'flex-col' : 'flex-row flex-wrap', className)}>
      {groups.includes('lines') ? (
        <Group title="Lines">
          <Row label="Main process line" detail="Heavy, with flow direction">
            <Swatch label="Heavy line with a flow arrow">
              <PipeLine points={LINE} weight="heavy" flow="forward" />
            </Swatch>
          </Row>
          <Row label="Secondary process line" detail="Recycle, drain, vent">
            <Swatch label="Normal line">
              <PipeLine points={LINE} />
            </Swatch>
          </Row>
          <Row label="Utility line" detail="Cooling water, instrument air">
            <Swatch label="Light line">
              <PipeLine points={LINE} weight="light" />
            </Swatch>
          </Row>
          <Row label="Instrument signal" detail="Dashed">
            <Swatch label="Dashed line">
              <PipeLine points={LINE} weight="light" dashed />
            </Swatch>
          </Row>
        </Group>
      ) : null}
      {groups.includes('symbols') ? (
        <Group title="Symbols">
          <Row label="Running" detail="Body filled">
            <EquipmentSymbol kind="compressor" size="md" fill="solid" label="Compressor, running" />
          </Row>
          <Row label="Stopped" detail="Body hollow">
            <EquipmentSymbol kind="compressor" size="md" label="Compressor, stopped" />
          </Row>
          <Row label="Tripped" detail="Critical outline">
            <EquipmentSymbol kind="compressor" size="md" tone="critical" label="Compressor, tripped" />
          </Row>
          <Row label="Valve open / closed" detail="Hollow is open, solid is closed">
            <span className="flex shrink-0 items-center gap-1">
              <ValveSymbol position="open" size="sm" />
              <ValveSymbol position="closed" size="sm" />
            </span>
          </Row>
          <Row label="Field instrument" detail="Function letters over loop number">
            <InstrumentBubble letters="PT" loop="92531" size="sm" />
          </Row>
          <Row label="Control-room instrument" detail="Bubble with a centre line">
            <InstrumentBubble letters="FIC" loop="92511" mounting="panel" size="sm" />
          </Row>
        </Group>
      ) : null}
      {groups.includes('states') ? (
        <Group title="Readings and alarms">
          <Row label="Within limits" detail="Neutral value">
            <Swatch label="Value within limits">
              <ValueTag x={28} y={6} anchor="middle" value={48.6} decimals={1} unit="barg" />
            </Swatch>
          </Row>
          <Row label="Outside a limit" detail="Tinted, flagged H or L">
            <Swatch label="Value above its high limit">
              <ValueTag x={28} y={6} anchor="middle" value={146.3} decimals={1} tone="warning" flag="H" />
            </Swatch>
          </Row>
          <Row label="At a trip limit" detail="Tinted, flagged HH or LL">
            <Swatch label="Value above its trip limit">
              <ValueTag x={28} y={6} anchor="middle" value={11.6} decimals={1} tone="critical" flag="HH" />
            </Swatch>
          </Row>
          <Row label="Open alarm" detail="Dashed ring; the mark gives the severity">
            <Swatch label="Alarm ring with a severity mark">
              <g className="text-critical-foreground-strong">
                <circle cx={28} cy={16} r={12} stroke="currentColor" strokeWidth={2} strokeDasharray="6 4" />
              </g>
              <SvgStatusMark x={37} y={7} size={10} tone="critical" shape="diamond" />
            </Swatch>
          </Row>
        </Group>
      ) : null}
    </div>
  );
}
