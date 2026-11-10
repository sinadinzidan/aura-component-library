import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';

import { healthStatus, qualityStatus, runStateStatus, severityStatus } from '../../../library/industrial/status';
import type { StatusDescriptor } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ALARMS, ASSETS, SENSORS, childrenOf, findAsset } from '../../data/plant';
import type { Asset, RunState, Sensor, Severity } from '../../data/plant';
import { formatAgo } from '../../data/series';
import { definePage } from '../../types';

import source from './status-indicators.tsx?raw';

function findSensor(id: string): Sensor {
  const sensor = SENSORS.find((candidate) => candidate.id === id);
  if (!sensor) throw new Error(`Unknown sensor ${id}`);
  return sensor;
}

function findAssetById(id: string): Asset {
  const asset = ASSETS.find((candidate) => candidate.id === id);
  if (!asset) throw new Error(`Unknown asset ${id}`);
  return asset;
}

const RUN_STATES: readonly RunState[] = ['running', 'standby', 'stopped', 'tripped', 'maintenance'];
const SEVERITIES: readonly Severity[] = ['critical', 'high', 'medium', 'low'];

/** Equipment only: the leaves of the asset hierarchy. */
const EQUIPMENT = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));

const countByState = (assets: readonly Asset[], state: RunState): number => assets.filter((asset) => asset.state === state).length;

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

function StatusIndicatorRunStates() {
  return (
    <div className="flex flex-col gap-3">
      {RUN_STATES.map((state) => (
        <StatusIndicator key={state} {...runStateStatus(state)} />
      ))}
    </div>
  );
}

function StatusIndicatorHealth() {
  return (
    <div className="flex flex-col gap-3">
      <StatusIndicator {...healthStatus('good')} />
      <StatusIndicator {...healthStatus('watch')} />
      <StatusIndicator {...healthStatus('poor')} />
    </div>
  );
}

function StatusIndicatorQuality() {
  return (
    <div className="flex flex-col gap-3">
      <StatusIndicator {...qualityStatus('good')} />
      <StatusIndicator {...qualityStatus('uncertain')} />
      <StatusIndicator {...qualityStatus('bad')} />
    </div>
  );
}

function StatusIndicatorSeverity() {
  return (
    <div className="flex flex-col gap-3">
      {SEVERITIES.map((severity) => (
        <StatusIndicator key={severity} {...severityStatus(severity)} />
      ))}
    </div>
  );
}

function StatusIndicatorCustomState() {
  return (
    <div className="flex flex-col gap-3">
      <StatusIndicator tone="success" label="Online" />
      <StatusIndicator tone="info" shape="ring" label="Starting" />
      <StatusIndicator tone="warning" shape="square" label="Bypassed" />
      <StatusIndicator tone="neutral" shape="ring" label="Not commissioned" />
    </div>
  );
}

function StatusIndicatorPlain() {
  return <StatusIndicator {...runStateStatus('running')} />;
}

function StatusIndicatorBadge() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {RUN_STATES.map((state) => (
        <StatusIndicator key={state} variant="badge" {...runStateStatus(state)} />
      ))}
    </div>
  );
}

function StatusIndicatorSizes() {
  return (
    <div className="flex flex-col items-start gap-3">
      <StatusIndicator size="sm" {...runStateStatus('maintenance')} />
      <StatusIndicator size="md" {...runStateStatus('maintenance')} />
    </div>
  );
}

function StatusIndicatorWithDetail() {
  return (
    <div className="flex flex-col items-start gap-3">
      <StatusIndicator {...runStateStatus('running')} detail="for 41 d" />
      <StatusIndicator {...runStateStatus('tripped')} detail="14 min ago" />
    </div>
  );
}

function StatusIndicatorPulse() {
  return (
    <div className="flex flex-col items-start gap-3">
      <StatusIndicator pulse {...severityStatus('critical')} label="Unacknowledged" detail="14 min" />
      <StatusIndicator {...severityStatus('critical')} label="Acknowledged" detail="2 h" />
    </div>
  );
}

function StatusIndicatorShapes() {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
      <StatusIndicator tone="neutral" shape="dot" label="Dot — active, normal" />
      <StatusIndicator tone="neutral" shape="ring" label="Ring — idle, uncertain" />
      <StatusIndicator tone="neutral" shape="square" label="Square — held, attention" />
      <StatusIndicator tone="neutral" shape="diamond" label="Diamond — fault" />
    </div>
  );
}

function StatusIndicatorDotOnly() {
  const asset = findAssetById('23-ka-9103');
  const status = runStateStatus(asset.state);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button type="button" className="inline-flex size-6 items-center justify-center rounded-md focus-visible:shadow-focus-ring focus-visible:outline-none">
            <StatusDot tone={status.tone} shape={status.shape} label={`${asset.name}: ${status.label}`} />
          </button>
        }
      />
      <TooltipContent>
        {asset.name}: {status.label}
      </TooltipContent>
    </Tooltip>
  );
}

function StatusIndicatorDotSizes() {
  return (
    <div className="flex items-center gap-6">
      {RUN_STATES.map((state) => (
        <div key={state} className="flex items-center gap-2">
          <StatusDot size="sm" tone={runStateStatus(state).tone} shape={runStateStatus(state).shape} label={`${runStateStatus(state).label}, small`} />
          <StatusDot size="md" tone={runStateStatus(state).tone} shape={runStateStatus(state).shape} label={`${runStateStatus(state).label}, medium`} />
        </div>
      ))}
    </div>
  );
}

function StatusIndicatorInHeading() {
  const asset = findAssetById('23-ka-9103');
  return (
    <div className="flex w-full max-w-sm items-start justify-between gap-4 self-center">
      <div className="min-w-0">
        <h3 className="truncate text-xl font-semibold text-base-foreground">{asset.name}</h3>
        <p className="text-sm text-muted-foreground">{asset.tag} · Gas compression</p>
      </div>
      <StatusIndicator variant="badge" {...runStateStatus(asset.state)} />
    </div>
  );
}

function StatusIndicatorInListRow() {
  return (
    <ul className="flex w-full max-w-sm flex-col gap-3 self-center">
      {childrenOf('nk-23').map((asset) => (
        <li key={asset.id} className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm text-base-foreground">{asset.name}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{asset.tag}</p>
          </div>
          <StatusIndicator size="sm" {...runStateStatus(asset.state)} />
        </li>
      ))}
    </ul>
  );
}

function StatusIndicatorWithValue() {
  const cooler = findSensor('tt-91141');
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">
        {cooler.name} · {cooler.tag}
      </span>
      <div className="flex items-baseline gap-3">
        <ValueReadout value={cooler.value} unit={cooler.unit} decimals={1} />
        <StatusIndicator size="sm" {...qualityStatus(cooler.quality)} label="Uncertain quality" />
      </div>
    </div>
  );
}

function StatusIndicatorCounts() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {RUN_STATES.map((state) => (
        <StatusIndicator key={state} {...runStateStatus(state)} detail={String(countByState(EQUIPMENT, state))} />
      ))}
    </div>
  );
}

function StatusIndicatorLegend() {
  const entries: readonly StatusDescriptor[] = [healthStatus('good'), healthStatus('watch'), healthStatus('poor')];
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span>Equipment health</span>
      {entries.map((entry) => (
        <StatusIndicator key={entry.label} size="sm" {...entry} />
      ))}
    </div>
  );
}

function StatusIndicatorNoSignal() {
  const bearing = findSensor('tt-40015');
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">
        {bearing.name} · {bearing.tag}
      </span>
      <div className="flex items-baseline gap-3">
        <ValueReadout value={null} unit={bearing.unit} />
        <StatusIndicator size="sm" {...qualityStatus(bearing.quality)} label="No signal" detail="9 h" />
      </div>
    </div>
  );
}

function StatusIndicatorEquipmentStrip() {
  return (
    <div className="grid w-full grid-cols-2 gap-3 self-center md:grid-cols-3 xl:grid-cols-6">
      {EQUIPMENT.slice(5).map((asset) => (
        <Card key={asset.id} className="min-w-0 gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">{asset.tag}</span>
          <span className="truncate text-sm font-medium text-base-foreground">{asset.name}</span>
          <StatusIndicator size="sm" {...runStateStatus(asset.state)} />
        </Card>
      ))}
    </div>
  );
}

function StatusIndicatorAssetTable() {
  return (
    <div className="w-full self-center overflow-x-auto">
      <table className="w-full min-w-xl border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Tag
            </th>
            <th scope="col" className={TH}>
              Equipment
            </th>
            <th scope="col" className={TH}>
              State
            </th>
            <th scope="col" className={TH}>
              Health
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Score
            </th>
            <th scope="col" className={TH}>
              Criticality
            </th>
          </tr>
        </thead>
        <tbody>
          {EQUIPMENT.map((asset) => (
            <tr key={asset.id} className="border-t border-default">
              <td className={`${TD} whitespace-nowrap text-base-foreground tabular-nums`}>{asset.tag}</td>
              <td className={`${TD} text-muted-foreground`}>{asset.name}</td>
              <td className={TD}>
                <StatusIndicator size="sm" {...runStateStatus(asset.state)} />
              </td>
              <td className={TD}>
                <StatusIndicator size="sm" {...healthStatus(asset.health)} />
              </td>
              <td className={`${TD} text-right`}>
                <ValueReadout size="xs" value={asset.healthScore} />
              </td>
              <td className={`${TD} text-muted-foreground`}>{asset.criticality}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusIndicatorAreaSummary() {
  const areas = ['nk-20', 'nk-23', 'nk-27'].map(findAssetById);
  return (
    <div className="grid w-full grid-cols-1 gap-4 self-center md:grid-cols-3">
      {areas.map((area) => {
        const equipment = childrenOf(area.id);
        return (
          <Card key={area.id}>
            <CardHeader>
              <CardHeaderCenter>
                <CardTitle>{area.name}</CardTitle>
                <CardDescription>
                  {area.tag} · {equipment.length} units
                </CardDescription>
              </CardHeaderCenter>
              <CardHeaderEnd>
                <StatusIndicator variant="badge" {...healthStatus(area.health)} />
              </CardHeaderEnd>
            </CardHeader>
            <CardContent>
              <ul className="flex w-full flex-col gap-2">
                {RUN_STATES.filter((state) => countByState(equipment, state) > 0).map((state) => (
                  <li key={state} className="flex items-center justify-between">
                    <StatusIndicator size="sm" {...runStateStatus(state)} />
                    <ValueReadout size="xs" value={countByState(equipment, state)} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StatusIndicatorAlarmSummary() {
  const open = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');
  return (
    <Card className="w-full max-w-md self-center">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Open alarms</CardTitle>
          <CardDescription>Nordkapp plant · {open.length} open</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <ul className="flex w-full flex-col gap-3">
          {open.map((alarm) => (
            <li key={alarm.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-baseline gap-3">
              <StatusIndicator size="sm" pulse={alarm.state === 'active' && alarm.severity === 'critical'} {...severityStatus(alarm.severity)} />
              <div className="min-w-0">
                <p className="truncate text-sm text-base-foreground">{alarm.message}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {findAsset(alarm.assetId)?.name} · {alarm.state === 'active' ? 'Unacknowledged' : 'Acknowledged'}
                </p>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">{formatAgo(alarm.raisedAt)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function StatusIndicatorDotMatrix() {
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="text-xs text-muted-foreground">Equipment state, Nordkapp plant · {EQUIPMENT.length} units</span>
      <div className="grid grid-cols-6 gap-1">
        {EQUIPMENT.map((asset) => {
          const status = runStateStatus(asset.state);
          return (
            <Tooltip key={asset.id}>
              <TooltipTrigger
                render={
                  <button type="button" className="inline-flex size-6 items-center justify-center rounded-md focus-visible:shadow-focus-ring focus-visible:outline-none">
                    <StatusDot tone={status.tone} shape={status.shape} label={`${asset.tag} ${asset.name}: ${status.label}`} />
                  </button>
                }
              />
              <TooltipContent>
                {asset.tag} {asset.name}: {status.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {RUN_STATES.map((state) => (
          <StatusIndicator key={state} size="sm" {...runStateStatus(state)} />
        ))}
      </div>
    </div>
  );
}

function StatusIndicatorAssetHeader() {
  const asset = findAssetById('23-ka-9101');
  return (
    <Card className="w-full max-w-lg self-center">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{asset.name}</CardTitle>
          <CardDescription>{asset.tag} · Gas compression · criticality {asset.criticality}</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator variant="badge" {...runStateStatus(asset.state)} />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <dl className="grid w-full grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Health</dt>
            <dd>
              <StatusIndicator {...healthStatus(asset.health)} detail={String(asset.healthScore)} />
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Alarms</dt>
            <dd>
              <StatusIndicator {...severityStatus('high')} label="2 open" />
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Signals</dt>
            <dd>
              <StatusIndicator {...qualityStatus('good')} label="6 of 6 good" />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export default definePage({
  id: 'status-indicators',
  title: 'Status indicators',
  summary:
    'The state of equipment, signals and alarms as a dot with a label. One mapping from state to colour and shape is shared by every industrial component, so "tripped" looks the same in a table, a card and a gauge.',
  guidance: {
    use: [
      'Take the tone, label and shape from the status helpers instead of choosing colours per screen.',
      'Use the plain dot and label in rows and tables; keep the badge for one state per card or page header.',
      'Give a dot without visible text an accessible name and a tooltip.',
      'Pulse only what is new and unacknowledged; stop once someone has seen it.',
    ],
    avoid: [
      'Colour as the only signal — every state has a label, and a shape that repeats it.',
      'Status colours for things that are not states, such as categories or owners.',
      'More than one pulsing indicator in view at a time.',
      'Inventing a sixth colour for a new state; map it to one of the five tones.',
    ],
  },
  source,
  sections: [
    {
      id: 'vocabularies',
      title: 'State vocabularies',
      description: 'The fixed mappings from an operational state to tone, label and shape.',
      specimens: [
        {
          id: 'StatusIndicatorRunStates',
          title: 'Run state',
          note: 'Pick it for what equipment is doing: running, standby, stopped, tripped or in maintenance.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          Component: StatusIndicatorRunStates,
        },
        {
          id: 'StatusIndicatorHealth',
          title: 'Health',
          note: 'Pick it for the condition of equipment as judged by monitoring: good, watch or poor.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          Component: StatusIndicatorHealth,
        },
        {
          id: 'StatusIndicatorQuality',
          title: 'Signal quality',
          note: 'Pick it for how far a reading can be trusted: good, uncertain or bad.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          Component: StatusIndicatorQuality,
        },
        {
          id: 'StatusIndicatorSeverity',
          title: 'Alarm severity',
          note: 'Pick it for how urgent an alarm or event is, from critical down to low.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          Component: StatusIndicatorSeverity,
        },
        {
          id: 'StatusIndicatorCustomState',
          title: 'Your own states',
          note: 'Pick it when a state is not in the vocabularies: choose one of the five tones and a shape, and write the label.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: StatusIndicatorCustomState,
        },
      ],
    },
    {
      id: 'forms',
      title: 'Forms',
      description: 'The same state as dot and label, as a badge, or as a dot on its own.',
      specimens: [
        {
          id: 'StatusIndicatorPlain',
          title: 'Dot and label',
          note: 'Pick it by default: it is quiet enough to repeat on every row.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: StatusIndicatorPlain,
        },
        {
          id: 'StatusIndicatorBadge',
          title: 'Badge',
          note: 'Pick it for the one state that heads a card or page, where it should be found first.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          Component: StatusIndicatorBadge,
        },
        {
          id: 'StatusIndicatorSizes',
          title: 'Sizes',
          note: 'Pick small in tables, tiles and legends, medium in lists and detail panels.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: StatusIndicatorSizes,
        },
        {
          id: 'StatusIndicatorWithDetail',
          title: 'With detail',
          note: 'Pick it when how long, how many or since when belongs with the state.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: StatusIndicatorWithDetail,
        },
        {
          id: 'StatusIndicatorPulse',
          title: 'Needs attention',
          note: 'Pick the pulse for a new state nobody has acknowledged yet; drop it once they have.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: StatusIndicatorPulse,
        },
        {
          id: 'StatusIndicatorShapes',
          title: 'Shapes',
          note: 'Pick the shape by meaning, so a state can be told apart in greyscale or with a colour vision deficiency.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          Component: StatusIndicatorShapes,
        },
        {
          id: 'StatusIndicatorDotOnly',
          title: 'Dot only',
          note: 'Pick it where there is no room for a label; it then needs an accessible name and a tooltip.',
          origin: 'custom',
          uses: ['industrial/StatusDot.tsx', 'industrial/status.ts'],
          Component: StatusIndicatorDotOnly,
        },
        {
          id: 'StatusIndicatorDotSizes',
          title: 'Dot sizes',
          note: 'Pick the small dot beside 12 px text and the medium dot beside 14 px text.',
          origin: 'custom',
          uses: ['industrial/StatusDot.tsx', 'industrial/status.ts'],
          size: 'md',
          Component: StatusIndicatorDotSizes,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Where an indicator sits relative to the thing whose state it gives.',
      specimens: [
        {
          id: 'StatusIndicatorInHeading',
          title: 'Beside a heading',
          note: 'Pick it on an asset page: the badge sits opposite the name so the state is read with it.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'md',
          align: 'stretch',
          Component: StatusIndicatorInHeading,
        },
        {
          id: 'StatusIndicatorInListRow',
          title: 'In list rows',
          note: 'Pick it for equipment lists: states line up on the right edge and can be scanned as a column.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'md',
          align: 'stretch',
          Component: StatusIndicatorInListRow,
        },
        {
          id: 'StatusIndicatorWithValue',
          title: 'Quality beside a value',
          note: 'Pick it when a reading is shown but should not be fully trusted.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx', 'industrial/status.ts'],
          Component: StatusIndicatorWithValue,
        },
        {
          id: 'StatusIndicatorNoSignal',
          title: 'No signal',
          note: 'Pick it when there is no reading at all: the dash and the state together say why.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx', 'industrial/status.ts'],
          Component: StatusIndicatorNoSignal,
        },
        {
          id: 'StatusIndicatorCounts',
          title: 'Counts by state',
          note: 'Pick it as a summary line above a list or map: how many units are in each state.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'md',
          Component: StatusIndicatorCounts,
        },
        {
          id: 'StatusIndicatorLegend',
          title: 'Legend',
          note: 'Pick it under a map, matrix or diagram that shows states as dots only.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'md',
          Component: StatusIndicatorLegend,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Strips, tables and summaries',
      description: 'Many states at once, the way overview screens show them.',
      specimens: [
        {
          id: 'StatusIndicatorEquipmentStrip',
          title: 'Equipment status strip',
          note: 'Pick it across the top of an area view: one small card per unit with its run state.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'full',
          align: 'stretch',
          Component: StatusIndicatorEquipmentStrip,
        },
        {
          id: 'StatusIndicatorAssetHeader',
          title: 'Asset summary',
          note: 'Pick it at the top of an asset card: run state as the badge, health, alarms and signals beneath.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'md',
          align: 'stretch',
          Component: StatusIndicatorAssetHeader,
        },
        {
          id: 'StatusIndicatorAlarmSummary',
          title: 'Open alarms list',
          note: 'Pick it for a short alarm list where severity leads each row and only the new critical one pulses.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'md',
          align: 'stretch',
          Component: StatusIndicatorAlarmSummary,
        },
        {
          id: 'StatusIndicatorAreaSummary',
          title: 'Area summaries',
          note: 'Pick it on a plant overview: each area with its health and a count of units per run state.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx', 'industrial/status.ts'],
          size: 'lg',
          align: 'stretch',
          Component: StatusIndicatorAreaSummary,
        },
        {
          id: 'StatusIndicatorDotMatrix',
          title: 'Dot matrix',
          note: 'Pick it to show a whole fleet in a few square centimetres; every dot is named and the legend explains them.',
          origin: 'custom',
          uses: ['industrial/StatusDot.tsx', 'industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          Component: StatusIndicatorDotMatrix,
        },
        {
          id: 'StatusIndicatorAssetTable',
          title: 'Equipment table',
          note: 'Pick it when run state and health are two columns of many and need to be sorted and compared.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx', 'industrial/status.ts'],
          size: 'full',
          align: 'stretch',
          Component: StatusIndicatorAssetTable,
        },
      ],
    },
  ],
});
