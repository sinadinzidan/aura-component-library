import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { Count, CountUnit, CountValue } from '@cognite/aura/components/count';
import {
  Item,
  ItemCheckbox,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@cognite/aura/components/item';
import { IconBell, IconFolder } from '@cognite/aura/icons';
import { useState } from 'react';

import { StatDelta } from '../../../library/display/StatDelta';
import { ALARMS, ASSETS, SENSORS, WORK_ORDERS } from '../../data/plant';
import type { Sensor } from '../../data/plant';
import { definePage } from '../../types';

import source from './count.tsx?raw';

const DISCHARGE_PRESSURE = SENSORS[0];
const COMPRESSOR_SENSORS = SENSORS.filter((sensor) => sensor.assetId === '23-ka-9101').slice(0, 4);
const ACTIVE_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active');
const AREAS = ASSETS.filter((asset) => asset.type === 'area');

/** Within limits, within 5% of the high limit, or past it. */
function rangeVariant(sensor: Sensor): 'success' | 'warning' | 'critical' {
  if (sensor.value > sensor.highLimit || sensor.value < sensor.lowLimit) return 'critical';
  if (sensor.value > sensor.highLimit * 0.95) return 'warning';
  return 'success';
}

function abbreviate(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

function CountDefault() {
  return (
    <Count>
      <CountValue>12</CountValue>
    </Count>
  );
}

function CountSuccess() {
  return (
    <Count variant="success">
      <CountValue>54</CountValue>
      <CountUnit>%</CountUnit>
    </Count>
  );
}

function CountWarning() {
  return (
    <Count variant="warning">
      <CountValue>141</CountValue>
      <CountUnit>°C</CountUnit>
    </Count>
  );
}

function CountCritical() {
  return (
    <Count variant="critical">
      <CountValue>11.6</CountValue>
      <CountUnit>mm/s</CountUnit>
    </Count>
  );
}

function CountWithUnit() {
  return (
    <Count>
      <CountValue>48.6</CountValue>
      <CountUnit>barg</CountUnit>
    </Count>
  );
}

function CountAbbreviated() {
  return (
    <Count aria-label="182,400 standard cubic metres per hour">
      <CountValue>182k</CountValue>
      <CountUnit>Sm³/h</CountUnit>
    </Count>
  );
}

function CountCapped() {
  return (
    <Count aria-label="More than 99 unread events">
      <CountValue>99+</CountValue>
    </Count>
  );
}

function CountZero() {
  return (
    <div className="flex items-center gap-3">
      <Count>
        <CountValue>0</CountValue>
      </Count>
      <span className="text-sm text-muted-foreground">No active alarms</span>
    </div>
  );
}

function CountNoValue() {
  return (
    <div className="flex items-center gap-3">
      <Count aria-label="No reading">
        <CountValue>—</CountValue>
        <CountUnit>°C</CountUnit>
      </Count>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-base-foreground">Bearing temperature</span>
        <span className="text-xs text-muted-foreground">Signal lost 9 h ago</span>
      </div>
    </div>
  );
}

function CountWithLabel() {
  return (
    <div className="flex items-center gap-3">
      <Count>
        <CountValue>{WORK_ORDERS.filter((order) => order.status !== 'done').length}</CountValue>
      </Count>
      <span className="text-sm font-medium text-base-foreground">Open work orders</span>
    </div>
  );
}

function CountStatusExplained() {
  return (
    <div className="flex items-center gap-3">
      <Count variant="warning">
        <CountValue>6.8</CountValue>
        <CountUnit>mm/s</CountUnit>
      </Count>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-base-foreground">Drive-end vibration</span>
        <span className="text-xs text-warning-foreground-strong">Near high limit of 7.1 mm/s</span>
      </div>
    </div>
  );
}

function CountRangeLegend() {
  return (
    <div className="flex items-start gap-5">
      <div className="flex flex-col items-center gap-1.5">
        <Count variant="success">
          <CountValue>12.4</CountValue>
          <CountUnit>barg</CountUnit>
        </Count>
        <span className="text-xs text-muted-foreground">Within</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Count variant="warning">
          <CountValue>14.6</CountValue>
          <CountUnit>barg</CountUnit>
        </Count>
        <span className="text-xs text-muted-foreground">Near limit</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Count variant="critical">
          <CountValue>15.8</CountValue>
          <CountUnit>barg</CountUnit>
        </Count>
        <span className="text-xs text-muted-foreground">Outside</span>
      </div>
    </div>
  );
}

function CountLive() {
  const [remaining, setRemaining] = useState(ACTIVE_ALARMS.length);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <Count variant={remaining > 0 ? 'critical' : 'default'} aria-live="polite">
          <CountValue>{remaining}</CountValue>
        </Count>
        <span className="text-sm font-medium text-base-foreground">
          {remaining === 0 ? 'All alarms acknowledged' : 'Unacknowledged alarms'}
        </span>
      </div>
      {remaining > 0 ? (
        <Button variant="secondary" size="sm" onClick={() => setRemaining(remaining - 1)}>
          Acknowledge next
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setRemaining(ACTIVE_ALARMS.length)}>
          Reset example
        </Button>
      )}
    </div>
  );
}

function CountSelectionTotal() {
  const orders = WORK_ORDERS.slice(0, 4);
  const [selected, setSelected] = useState<readonly string[]>([orders[0].id, orders[1].id]);

  const toggle = (id: string, checked: boolean) =>
    setSelected(checked ? [...selected, id] : selected.filter((other) => other !== id));

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="flex items-center gap-2 px-2">
        <Count>
          <CountValue>{selected.length}</CountValue>
        </Count>
        <span className="text-sm text-medium-foreground">of {orders.length} work orders selected</span>
      </div>
      <ItemGroup>
        {orders.map((order) => (
          <Item key={order.id} selected={selected.includes(order.id)}>
            <ItemCheckbox
              aria-label={`Select ${order.title}`}
              checked={selected.includes(order.id)}
              onCheckedChange={(checked) => toggle(order.id, checked)}
            />
            <ItemContent>
              <ItemTitle>{order.title}</ItemTitle>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </div>
  );
}

function CountWithDelta() {
  return (
    <StatDelta
      label={DISCHARGE_PRESSURE.name}
      value={DISCHARGE_PRESSURE.value}
      previous={47.1}
      unit={DISCHARGE_PRESSURE.unit}
      decimals={1}
      comparison="vs last shift"
    />
  );
}

function CountDeltaImproved() {
  return (
    <StatDelta label="Active alarms" value={3} previous={7} betterWhen="lower" comparison="vs yesterday" />
  );
}

function CountDeltaWorse() {
  return (
    <StatDelta
      label="Overdue work orders"
      value={5}
      previous={2}
      betterWhen="lower"
      comparison="vs last week"
    />
  );
}

function CountDeltaColumn() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <StatDelta label="Plant availability" value={97.2} previous={96.4} unit="%" decimals={1} betterWhen="higher" />
      <StatDelta label="Gas flow" value={182400} previous={184100} unit="Sm³/h" format={abbreviate} />
      <StatDelta label="Open work orders" value={6} previous={6} betterWhen="lower" />
    </div>
  );
}

function CountInSectionHeader() {
  return (
    <div className="flex w-full max-w-xs items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <IconBell className="size-4 text-medium-foreground" aria-hidden="true" />
        <h3 className="text-base font-semibold text-base-foreground">Active alarms</h3>
      </div>
      <Count variant="critical">
        <CountValue>{ACTIVE_ALARMS.length}</CountValue>
      </Count>
    </div>
  );
}

function CountInCardHeader() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Work orders</CardTitle>
          <CardDescription>Gas compression, due this week</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Count>
            <CountValue>{WORK_ORDERS.filter((order) => order.status !== 'done').length}</CountValue>
          </Count>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <ul className="flex w-full flex-col gap-2 text-sm text-base-foreground">
          {WORK_ORDERS.slice(0, 3).map((order) => (
            <li key={order.id} className="truncate">
              {order.title}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function CountListRows() {
  return (
    <ItemGroup className="w-full max-w-sm">
      {AREAS.map((area) => (
        <Item key={area.id}>
          <ItemMedia>
            <IconFolder />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{area.name}</ItemTitle>
            <ItemDescription>{area.tag}</ItemDescription>
          </ItemContent>
          <Count aria-label={`${ASSETS.filter((asset) => asset.parentId === area.id).length} assets`}>
            <CountValue>{ASSETS.filter((asset) => asset.parentId === area.id).length}</CountValue>
          </Count>
        </Item>
      ))}
    </ItemGroup>
  );
}

function CountSensorStrip() {
  return (
    <div className="grid w-full grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
      {COMPRESSOR_SENSORS.map((sensor) => (
        <div key={sensor.id} className="flex flex-col items-start gap-2">
          <Count variant={rangeVariant(sensor)}>
            <CountValue>{sensor.value.toFixed(sensor.decimals)}</CountValue>
            <CountUnit>{sensor.unit}</CountUnit>
          </Count>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-base-foreground">{sensor.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{sensor.tag}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CountSeveritySummary() {
  const bySeverity = (severity: string) => ALARMS.filter((alarm) => alarm.severity === severity).length;

  return (
    <div className="flex items-start gap-6">
      <div className="flex flex-col items-center gap-1.5">
        <Count variant="critical">
          <CountValue>{bySeverity('critical')}</CountValue>
        </Count>
        <span className="text-xs text-muted-foreground">Critical</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Count variant="warning">
          <CountValue>{bySeverity('high')}</CountValue>
        </Count>
        <span className="text-xs text-muted-foreground">High</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Count>
          <CountValue>{bySeverity('medium')}</CountValue>
        </Count>
        <span className="text-xs text-muted-foreground">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Count>
          <CountValue>{bySeverity('low')}</CountValue>
        </Count>
        <span className="text-xs text-muted-foreground">Low</span>
      </div>
    </div>
  );
}

export default definePage({
  id: 'count',
  title: 'Count',
  summary:
    'A count surfaces one quantity inline — a total, a reading, a number of selected items — in a compact tile, with an optional unit underneath.',
  docsSlug: 'count',
  guidance: {
    use: [
      'A quantity that belongs to a label, list row, section or card header.',
      'A unit under the value for readings such as °C, barg or %.',
      'Status variants only when the value is within, near or outside an expected range.',
      'Short values; abbreviate large numbers to 1.2k and keep the full value accessible.',
    ],
    avoid: [
      'A count for a status or category — that is a Badge.',
      'Status colour with no nearby text saying what it means.',
      'Actions inside a count; it is an output, not a control.',
    ],
  },
  source,
  sections: [
    {
      id: 'variants',
      title: 'Variants',
      description: 'Neutral by default; three status variants for a value judged against a range.',
      specimens: [
        {
          id: 'CountDefault',
          title: 'Default',
          note: 'A plain quantity with nothing to judge: totals, selections, items in a group.',
          origin: 'aura',
          Component: CountDefault,
        },
        {
          id: 'CountSuccess',
          title: 'Success',
          note: 'A reading that is comfortably within its expected range.',
          origin: 'aura',
          Component: CountSuccess,
        },
        {
          id: 'CountWarning',
          title: 'Warning',
          note: 'A reading that is close to a limit.',
          origin: 'aura',
          Component: CountWarning,
        },
        {
          id: 'CountCritical',
          title: 'Critical',
          note: 'A reading outside its limits, or a count of things that need action now.',
          origin: 'aura',
          Component: CountCritical,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      description: 'What the tile can hold, and what to show when there is little or nothing to show.',
      specimens: [
        {
          id: 'CountWithUnit',
          title: 'With unit',
          note: 'Any measured value; the unit sits under the number.',
          origin: 'aura',
          Component: CountWithUnit,
        },
        {
          id: 'CountAbbreviated',
          title: 'Abbreviated value',
          note: 'Large numbers; shorten what is shown and put the full value in the accessible name.',
          origin: 'aura',
          Component: CountAbbreviated,
        },
        {
          id: 'CountCapped',
          title: 'Capped value',
          note: 'Unread counts where anything past the cap reads the same to the user.',
          origin: 'aura',
          Component: CountCapped,
        },
        {
          id: 'CountZero',
          title: 'Zero',
          note: 'Keep the tile when zero is an answer, and say what it means next to it.',
          origin: 'aura',
          Component: CountZero,
        },
        {
          id: 'CountNoValue',
          title: 'No value',
          note: 'A reading that is missing or of bad quality; never show a stale number as if it were live.',
          origin: 'aura',
          Component: CountNoValue,
        },
      ],
    },
    {
      id: 'with-labels',
      title: 'With labels and state',
      description: 'A count always belongs to something. Name it, and explain any status colour in words.',
      specimens: [
        {
          id: 'CountWithLabel',
          title: 'With label',
          note: 'The basic pairing: the number, then what it counts.',
          origin: 'aura',
          Component: CountWithLabel,
        },
        {
          id: 'CountStatusExplained',
          title: 'Status with explanation',
          note: 'Whenever a status variant is used, so the meaning does not rest on colour.',
          origin: 'aura',
          Component: CountStatusExplained,
        },
        {
          id: 'CountRangeLegend',
          title: 'Range legend',
          note: 'Teaches the three range states once, at the top of a view that uses them.',
          origin: 'aura',
          Component: CountRangeLegend,
        },
        {
          id: 'CountLive',
          title: 'Live count',
          note: 'A number that changes while the user watches; the output element announces it. Click to try.',
          origin: 'aura',
          Component: CountLive,
        },
        {
          id: 'CountInSectionHeader',
          title: 'In a section header',
          note: 'How many items the section below holds, right-aligned with the heading.',
          origin: 'aura',
          Component: CountInSectionHeader,
        },
        {
          id: 'CountSeveritySummary',
          title: 'Breakdown',
          note: 'One total split by category, such as alarms by severity.',
          origin: 'aura',
          Component: CountSeveritySummary,
        },
      ],
    },
    {
      id: 'with-delta',
      title: 'With change',
      description: 'The value next to how it moved since a previous reading.',
      specimens: [
        {
          id: 'CountWithDelta',
          title: 'With delta',
          note: 'A reading where the direction matters but neither direction is good or bad.',
          origin: 'custom',
          uses: ['display/StatDelta.tsx'],
          Component: CountWithDelta,
        },
        {
          id: 'CountDeltaImproved',
          title: 'Delta, improved',
          note: 'A metric where lower is better and it went down.',
          origin: 'custom',
          uses: ['display/StatDelta.tsx'],
          Component: CountDeltaImproved,
        },
        {
          id: 'CountDeltaWorse',
          title: 'Delta, worse',
          note: 'The same metric type moving the wrong way; only the change is coloured.',
          origin: 'custom',
          uses: ['display/StatDelta.tsx'],
          Component: CountDeltaWorse,
        },
        {
          id: 'CountDeltaColumn',
          title: 'Stat column',
          note: 'A few key figures in a side panel, including one that did not change.',
          origin: 'custom',
          size: 'md',
          uses: ['display/StatDelta.tsx'],
          Component: CountDeltaColumn,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Counts in cards, lists and reading strips.',
      specimens: [
        {
          id: 'CountInCardHeader',
          title: 'In a card header',
          note: 'A card that summarises a list; the count says how many before the user reads them.',
          origin: 'aura',
          size: 'md',
          Component: CountInCardHeader,
        },
        {
          id: 'CountListRows',
          title: 'In list rows',
          note: 'How many children each row holds, as the trailing element.',
          origin: 'aura',
          size: 'md',
          Component: CountListRows,
        },
        {
          id: 'CountSelectionTotal',
          title: 'Selection total',
          note: 'Keeps the number of selected rows in view while the user picks. Click rows to try.',
          origin: 'aura',
          size: 'md',
          Component: CountSelectionTotal,
        },
        {
          id: 'CountSensorStrip',
          title: 'Sensor readings',
          note: 'Live readings for one asset, each coloured by where it sits against its limits.',
          origin: 'aura',
          size: 'lg',
          Component: CountSensorStrip,
        },
      ],
    },
  ],
});
