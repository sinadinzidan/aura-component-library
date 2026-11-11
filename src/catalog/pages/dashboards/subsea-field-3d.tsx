import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Switch } from '@cognite/aura/components/switch';
import { IconX } from '@cognite/aura/icons';
import { useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { severityStatus } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { CameraRig } from '../../../library/three/CameraRig';
import { frameBounds } from '../../../library/three/cameraTargets';
import { drapeOnTerrain, snakePlan } from '../../../library/three/fields/drapeOnTerrain';
import { FlowChevrons } from '../../../library/three/fields/FlowChevrons';
import { Fpso } from '../../../library/three/fields/Fpso';
import { lazyWavePoints } from '../../../library/three/fields/lazyWave';
import { Rov } from '../../../library/three/fields/Rov';
import { SeabedTerrain } from '../../../library/three/fields/SeabedTerrain';
import { DEPTH_LEVELS, depthInMetres, selectableIds } from '../../../library/three/fields/subseaField';
import type { DepthLevel, SubseaLineKind, SubseaStructureKind, SubseaSystemFilter } from '../../../library/three/fields/subseaField';
import { SUBSEA_METRES_PER_UNIT, buildSubseaLayout, subseaHeight } from '../../../library/three/fields/subseaFieldData';
import { SubseaFieldScene } from '../../../library/three/fields/SubseaFieldScene';
import { SubseaTemplate3d } from '../../../library/three/fields/SubseaTemplate3d';
import { SUBSEA_TOKENS } from '../../../library/three/fields/subseaTokens';
import { HudPanel } from '../../../library/three/HudPanel';
import { WellTube } from '../../../library/three/models/WellTube';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { SceneLegend } from '../../../library/three/SceneLegend';
import { SceneLights } from '../../../library/three/SceneLights';
import { SeaPlane } from '../../../library/three/scenes/SeaPlane';
import { StillScene } from '../../../library/three/scenes/StillScene';
import type { TokenColors } from '../../../library/three/tokenColors';
import { TurntableStage } from '../../../library/three/TurntableStage';
import { useTokenColors } from '../../../library/three/useTokenColors';
import { DAY, REFERENCE_NOW, formatDate } from '../../data/series';
import { definePage } from '../../types';

import source from './subsea-field-3d.tsx?raw';

const SUBSEA3D_LAYOUT = buildSubseaLayout();

type Subsea3dFinding = { text: string; severity: 'critical' | 'high' | 'medium' | 'low'; foundDaysAgo: number };
type Subsea3dRecord = { pressure: number; temperature: number; inspectedDaysAgo: number; remainingLife: number; findings: readonly Subsea3dFinding[] };

/** Integrity picture per selectable item, in the field's own tag style. Consistent with the layout ids. */
const SUBSEA3D_INTEGRITY: Readonly<Record<string, Subsea3dRecord>> = {
  't-a': { pressure: 212, temperature: 68, inspectedDaysAgo: 41, remainingLife: 22, findings: [{ text: 'Anode depletion at tree 2 frame, 60 percent consumed', severity: 'medium', foundDaysAgo: 41 }] },
  't-b': { pressure: 198, temperature: 64, inspectedDaysAgo: 41, remainingLife: 24, findings: [] },
  't-c': { pressure: 176, temperature: 59, inspectedDaysAgo: 118, remainingLife: 19, findings: [{ text: 'Hydraulic weep at tree 3 choke actuator', severity: 'high', foundDaysAgo: 118 }, { text: 'Marine growth on the protection frame', severity: 'low', foundDaysAgo: 118 }] },
  't-d': { pressure: 236, temperature: 9, inspectedDaysAgo: 77, remainingLife: 27, findings: [] },
  'm-1': { pressure: 158, temperature: 61, inspectedDaysAgo: 77, remainingLife: 20, findings: [{ text: 'Coating damage on the header support', severity: 'low', foundDaysAgo: 77 }] },
  'plet-1': { pressure: 142, temperature: 55, inspectedDaysAgo: 77, remainingLife: 21, findings: [] },
  'fl-a': { pressure: 151, temperature: 62, inspectedDaysAgo: 203, remainingLife: 17, findings: [{ text: 'Free span of 14 m at kilometre post 0.4', severity: 'medium', foundDaysAgo: 203 }] },
  'fl-b': { pressure: 149, temperature: 60, inspectedDaysAgo: 203, remainingLife: 18, findings: [] },
  'fl-c': { pressure: 144, temperature: 57, inspectedDaysAgo: 203, remainingLife: 7, findings: [{ text: 'Internal corrosion, wall loss 31 percent over 2.1 m', severity: 'high', foundDaysAgo: 203 }, { text: 'Buckle initiation at the second bend', severity: 'medium', foundDaysAgo: 203 }, { text: 'Weight coating cracks', severity: 'low', foundDaysAgo: 203 }] },
  'exp-1': { pressure: 138, temperature: 52, inspectedDaysAgo: 96, remainingLife: 23, findings: [] },
  'rs-1': { pressure: 132, temperature: 48, inspectedDaysAgo: 28, remainingLife: 11, findings: [{ text: 'Outer sheath wear at the touchdown bend', severity: 'medium', foundDaysAgo: 28 }, { text: 'Buoyancy module 6 displaced by 0.4 m', severity: 'medium', foundDaysAgo: 28 }] },
  'rs-2': { pressure: 244, temperature: 11, inspectedDaysAgo: 28, remainingLife: 14, findings: [{ text: 'Bend stiffener tilt 2 degrees from vertical', severity: 'low', foundDaysAgo: 28 }] },
  'ij-1': { pressure: 231, temperature: 9, inspectedDaysAgo: 150, remainingLife: 25, findings: [] },
  'um-1': { pressure: 310, temperature: 6, inspectedDaysAgo: 150, remainingLife: 16, findings: [{ text: 'Chemical injection tube 3 pressure decay', severity: 'high', foundDaysAgo: 12 }] },
  'ru-1': { pressure: 310, temperature: 8, inspectedDaysAgo: 28, remainingLife: 9, findings: [{ text: 'Armour wire corrosion at the hang-off', severity: 'medium', foundDaysAgo: 28 }] },
};

const SUBSEA3D_SYSTEMS: readonly { value: SubseaSystemFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'production', label: 'Production' },
  { value: 'injection', label: 'Injection' },
  { value: 'control', label: 'Control' },
  { value: 'mooring', label: 'Mooring' },
];

const SUBSEA3D_LEVELS: Readonly<Record<DepthLevel, { label: string; hint: string }>> = {
  surface: { label: 'Surface', hint: 'Vessel and turret' },
  'water-column': { label: 'Water column', hint: 'Risers and moorings' },
  seabed: { label: 'Seabed', hint: 'Templates and lines' },
};

const SUBSEA3D_KIND_LABEL: Readonly<Record<SubseaStructureKind | SubseaLineKind, string>> = { template: 'Template', manifold: 'Manifold', plet: 'Termination', termination: 'Anchor', flowline: 'Flowline', pipeline: 'Trunkline', umbilical: 'Umbilical', riser: 'Riser', jumper: 'Jumper', mooring: 'Mooring' };

const SUBSEA3D_LEGEND = [
  { kind: 'selection', label: 'Selected item' },
  { kind: 'flow', label: 'Flow direction' },
  { kind: 'area', label: 'Water volume' },
] as const;

const SUBSEA3D_GLASS = 'border border-default bg-[color-mix(in_oklab,var(--card-background)_78%,transparent)] backdrop-blur-md';
const SUBSEA3D_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]';

type Subsea3dInitial = { level?: DepthLevel; filter?: SubseaSystemFilter; selectedId?: string | null; flow?: boolean };

function subsea3dIsSystem(value: unknown): value is SubseaSystemFilter {
  return SUBSEA3D_SYSTEMS.some((system) => system.value === value);
}

function subsea3dItem(id: string): { tag: string; name: string; kind: SubseaStructureKind | SubseaLineKind; system: string } | null {
  const structure = SUBSEA3D_LAYOUT.structures.find((candidate) => candidate.id === id);
  if (structure) return { tag: structure.tag, name: structure.name ?? structure.tag, kind: structure.kind, system: structure.system };
  const line = SUBSEA3D_LAYOUT.lines.find((candidate) => candidate.id === id);
  return line ? { tag: line.tag, name: line.name ?? line.tag, kind: line.kind, system: line.system } : null;
}

function subsea3dSeverityTone(severity: Subsea3dFinding['severity']): Tone {
  return severityStatus(severity).tone;
}

function subsea3dWorst(record: Subsea3dRecord): Subsea3dFinding['severity'] | null {
  const order = ['critical', 'high', 'medium', 'low'] as const;
  return order.find((severity) => record.findings.some((finding) => finding.severity === severity)) ?? null;
}

function Subsea3dRail({ level, onChange, className = '' }: { level: DepthLevel; onChange: (level: DepthLevel) => void; className?: string }) {
  return (
    <nav aria-label="Camera depth" className={`flex w-32 shrink-0 flex-col items-stretch border-r border-default bg-card-background px-3 py-4 ${className}`}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Depth</p>
      <ol className="relative flex flex-1 flex-col justify-between">
        <span aria-hidden="true" className="absolute bottom-4 left-[0.4375rem] top-4 w-px bg-emphasized" />
        {DEPTH_LEVELS.map((value) => {
          const active = value === level;
          const metres = value === 'surface' ? 0 : value === 'seabed' ? SUBSEA3D_LAYOUT.waterDepth * SUBSEA_METRES_PER_UNIT : Math.round((SUBSEA3D_LAYOUT.waterDepth * SUBSEA_METRES_PER_UNIT) / 2);
          return (
            <li key={value} className="relative">
              <button
                type="button"
                aria-pressed={active}
                aria-label={`${SUBSEA3D_LEVELS[value].label}, ${metres} metres`}
                onClick={() => onChange(value)}
                className={`group flex w-full items-start gap-2 rounded-md py-1 text-left ${SUBSEA3D_FOCUS}`}
              >
                <span
                  aria-hidden="true"
                  className={`relative z-10 mt-1 size-3.5 shrink-0 rounded-full border-2 bg-card-background ${active ? 'border-[var(--primary-background)] bg-[var(--primary-background)]' : 'border-emphasized group-hover:border-[var(--primary-background)]'}`}
                />
                <span className="flex min-w-0 flex-col">
                  <span className={`text-sm ${active ? 'font-medium text-base-foreground' : 'text-medium-foreground'}`}>{SUBSEA3D_LEVELS[value].label}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{metres} m</span>
                  <span className="text-xs text-muted-foreground">{SUBSEA3D_LEVELS[value].hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Subsea3dSystemSwitch({ value, onChange }: { value: SubseaSystemFilter; onChange: (value: SubseaSystemFilter) => void }) {
  return (
    <SegmentedControl
      value={value}
      onValueChange={(next) => {
        if (subsea3dIsSystem(next)) onChange(next);
      }}
    >
      <SegmentedControlList size="small" aria-label="Highlight system">
        {SUBSEA3D_SYSTEMS.map((system) => (
          <SegmentedControlButton key={system.value} value={system.value}>
            {system.label}
          </SegmentedControlButton>
        ))}
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function Subsea3dSystemLegend() {
  return (
    <div className="flex flex-col gap-1.5">
      <ul aria-label="Networks" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-medium-foreground">
        {[
          { label: 'Production', swatch: 'bg-chart-1-450', style: 'h-1' },
          { label: 'Injection', swatch: 'bg-chart-2-450', style: 'h-1' },
          { label: 'Control umbilical', swatch: 'bg-chart-3-450', style: 'h-0.5' },
          { label: 'Mooring', swatch: 'bg-chart-neutral-450', style: 'h-0.5' },
        ].map((item) => (
          <li key={item.label} className="flex items-center gap-1.5 whitespace-nowrap">
            <span aria-hidden="true" className={`w-4 rounded-full ${item.swatch} ${item.style}`} />
            {item.label}
          </li>
        ))}
      </ul>
      <SceneLegend items={SUBSEA3D_LEGEND} />
    </div>
  );
}

function Subsea3dReading({ label, value, unit, decimals = 0, tone }: { label: string; value: number; unit: string; decimals?: number; tone?: Tone }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <ValueReadout value={value} unit={unit} decimals={decimals} size="sm" tone={tone ?? 'neutral'} />
    </div>
  );
}

function Subsea3dCard({ id, onClose, rovArrived }: { id: string; onClose?: () => void; rovArrived?: boolean }) {
  const item = subsea3dItem(id);
  const record = SUBSEA3D_INTEGRITY[id];
  if (!item || !record) return null;
  const worst = subsea3dWorst(record);

  return (
    <HudPanel
      title="Integrity"
      meta={SUBSEA3D_KIND_LABEL[item.kind]}
      actions={
        onClose ? (
          <Button variant="ghost" size="icon-sm" aria-label="Close integrity card" onClick={onClose}>
            <IconX />
          </Button>
        ) : undefined
      }
      className="w-full shrink-0"
    >
      <div>
        <p className="font-mono text-sm font-medium text-base-foreground">{item.tag}</p>
        <p className="text-sm text-medium-foreground">{item.name}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {worst ? <StatusIndicator {...severityStatus(worst)} label={`${record.findings.length} open ${record.findings.length === 1 ? 'anomaly' : 'anomalies'}`} detail={`worst ${worst}`} size="sm" /> : <StatusIndicator tone="neutral" shape="ring" label="No open anomalies" size="sm" />}
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
        <Subsea3dReading label="Pressure" value={record.pressure} unit="bar" />
        <Subsea3dReading label="Temperature" value={record.temperature} unit="°C" />
        <Subsea3dReading label="Last inspection" value={record.inspectedDaysAgo} unit="days ago" />
        <Subsea3dReading label="Remaining life" value={record.remainingLife} unit="years" tone={record.remainingLife < 8 ? 'warning' : 'neutral'} />
      </dl>
      <p className="text-xs text-muted-foreground">Inspected {formatDate(REFERENCE_NOW - record.inspectedDaysAgo * DAY)}</p>
      <div className="flex flex-col gap-1.5">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className={`inline-block size-1.5 rounded-full ${rovArrived ? 'bg-[var(--primary-background)]' : 'bg-muted-foreground motion-safe:animate-pulse'}`} aria-hidden="true" />
          {rovArrived ? 'ROV on station' : 'ROV flying to the item'}
        </p>
        <p className="text-xs font-medium text-muted-foreground">Inspection findings</p>
        {record.findings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No findings in the last campaign.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {record.findings.map((finding) => (
              <li key={finding.text} className="flex flex-col gap-0.5">
                <StatusIndicator {...severityStatus(finding.severity)} size="sm" detail={`found ${formatDate(REFERENCE_NOW - finding.foundDaysAgo * DAY)}`} />
                <span className="text-sm text-base-foreground">{finding.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </HudPanel>
  );
}

function Subsea3dItemList({ selectedId, onSelect, filter }: { selectedId: string | null; onSelect: (id: string) => void; filter: SubseaSystemFilter }) {
  const groups: readonly { title: string; ids: string[] }[] = [
    { title: 'Templates and manifold', ids: selectableIds(SUBSEA3D_LAYOUT).filter((id) => SUBSEA3D_LAYOUT.structures.some((structure) => structure.id === id)) },
    { title: 'Flowlines and umbilicals', ids: selectableIds(SUBSEA3D_LAYOUT).filter((id) => SUBSEA3D_LAYOUT.lines.some((line) => line.id === id && line.kind !== 'riser')) },
    { title: 'Risers', ids: selectableIds(SUBSEA3D_LAYOUT).filter((id) => SUBSEA3D_LAYOUT.lines.some((line) => line.id === id && line.kind === 'riser')) },
  ];

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <div key={group.title} className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{group.title}</span>
          <ul className="flex flex-col">
            {group.ids.map((id) => {
              const item = subsea3dItem(id);
              const record = SUBSEA3D_INTEGRITY[id];
              if (!item || !record) return null;
              const worst = subsea3dWorst(record);
              const faded = filter !== 'all' && filter !== item.system;
              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-pressed={id === selectedId}
                    onClick={() => onSelect(id)}
                    className={`-mx-1.5 flex w-[calc(100%+0.75rem)] items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left hover:bg-secondary-background aria-pressed:bg-secondary-background ${faded ? 'opacity-50' : ''} ${SUBSEA3D_FOCUS}`}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="font-mono text-xs text-base-foreground">{item.tag}</span>
                      <span className="truncate text-xs text-muted-foreground">{item.name}</span>
                    </span>
                    {worst ? (
                      <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground">
                        <StatusDot tone={subsea3dSeverityTone(worst)} shape={severityStatus(worst).shape} size="sm" />
                        {record.findings.length}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Subsea3dFallback() {
  return (
    <ul className="flex flex-col gap-1.5 rounded-lg border border-default bg-card-background p-3 text-sm">
      {SUBSEA3D_LAYOUT.structures.map((structure) => (
        <li key={structure.id} className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs">{structure.tag}</span>
          <span className="truncate text-muted-foreground">{structure.name}</span>
        </li>
      ))}
    </ul>
  );
}

function Subsea3dField({ initial = {}, still = false }: { initial?: Subsea3dInitial; still?: boolean }) {
  const scope = useRef<HTMLDivElement>(null);
  const colors = useTokenColors(SUBSEA_TOKENS, scope);
  const [level, setLevel] = useState<DepthLevel>(initial.level ?? 'surface');
  const [filter, setFilter] = useState<SubseaSystemFilter>(initial.filter ?? 'all');
  const [selectedId, setSelectedId] = useState<string | null>(initial.selectedId ?? null);
  const [flow, setFlow] = useState(initial.flow ?? false);
  const [arrived, setArrived] = useState(false);
  const selected = selectedId ? subsea3dItem(selectedId) : null;

  const select = (id: string) => {
    setArrived(false);
    setSelectedId(id === selectedId ? null : id);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && selectedId !== null) {
      event.preventDefault();
      setSelectedId(null);
    }
  };
  const depthText = depthInMetres(SUBSEA3D_LAYOUT, level === 'surface' ? SUBSEA3D_LAYOUT.waterDepth : level === 'seabed' ? 0 : SUBSEA3D_LAYOUT.waterDepth / 2, SUBSEA_METRES_PER_UNIT);

  return (
    <div
      ref={scope}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerDownCapture={(event) => {
        // Orbit controls swallow the pointer event, so take focus by hand to keep Escape working.
        if (event.target instanceof HTMLCanvasElement) event.currentTarget.focus({ preventScroll: true });
      }}
      className="flex h-[46rem] w-full overflow-hidden rounded-xl border border-default bg-base-background outline-none"
    >
      <Subsea3dRail
        level={level}
        onChange={(next) => {
          setSelectedId(null);
          setLevel(next);
        }}
      />

      <div className="relative min-w-0 flex-1 bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--primary-background)_14%,transparent),transparent_70%)]">
        <SceneCanvas
          label={`3D model of the Nordkapp Vest subsea field at ${SUBSEA3D_LAYOUT.waterDepth * SUBSEA_METRES_PER_UNIT} metres of water: templates, flowlines and umbilicals on the seabed, three lazy-wave risers to a floating production vessel and six mooring lines. Camera at ${SUBSEA3D_LEVELS[level].label.toLowerCase()}${selected ? `, ${selected.tag} selected` : ''}`}
          fallback={<Subsea3dFallback />}
          onPointerMissed={() => setSelectedId(null)}
        >
          <StillScene still={still}>
            <SubseaFieldScene layout={SUBSEA3D_LAYOUT} height={subseaHeight} colors={colors} filter={filter} level={level} selectedId={selectedId} onSelect={select} flow={flow} rov onRovArrive={() => setArrived(true)} />
          </StillScene>
        </SceneCanvas>

        <div className="pointer-events-none absolute inset-3 z-30 flex flex-col justify-between gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className={`pointer-events-auto flex items-center gap-2 rounded-lg px-2 py-1 ${SUBSEA3D_GLASS}`}>
              <span className="pl-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">System</span>
              <Subsea3dSystemSwitch value={filter} onChange={setFilter} />
            </div>
            <div className={`pointer-events-auto flex items-center gap-3 rounded-lg px-3 py-1.5 ${SUBSEA3D_GLASS}`}>
              <Switch label="Flow direction" checked={flow} onCheckedChange={(checked) => setFlow(checked)} />
              <span className="text-xs tabular-nums text-muted-foreground">{depthText} m</span>
            </div>
          </div>
          <div className={`pointer-events-auto self-start rounded-lg px-3 py-2 ${SUBSEA3D_GLASS}`}>
            <Subsea3dSystemLegend />
          </div>
        </div>
      </div>

      <aside aria-label="Field items" className="flex w-80 shrink-0 flex-col border-l border-default bg-card-background">
        <header className="flex shrink-0 flex-col gap-0.5 border-b border-default px-4 py-3">
          <p className="text-sm font-medium text-base-foreground">Nordkapp Vest subsea field</p>
          <p className="text-xs text-muted-foreground">{selected ? 'Click the item again or press Escape to close the card' : 'Click an item in the scene or pick one here'}</p>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {selectedId && selected ? <Subsea3dCard key={selectedId} id={selectedId} onClose={() => setSelectedId(null)} rovArrived={arrived} /> : null}
          <Subsea3dItemList selectedId={selectedId} onSelect={select} filter={filter} />
        </div>
      </aside>
    </div>
  );
}

function Subsea3dFieldNordic() {
  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <Subsea3dField />
    </ThemeScope>
  );
}

function Subsea3dFieldHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <Subsea3dField still initial={{ level: 'water-column', flow: true }} />
    </ThemeScope>
  );
}

function Subsea3dFieldTron() {
  return (
    <ThemeScope preset="tron" className="w-full">
      <Subsea3dField still initial={{ level: 'seabed', filter: 'production', selectedId: 'fl-c' }} />
    </ThemeScope>
  );
}

function Subsea3dStage({ label, children, className = 'h-72' }: { label: string; children: (colors: TokenColors<typeof SUBSEA_TOKENS>) => ReactNode; className?: string }) {
  const scope = useRef<HTMLDivElement>(null);
  const colors = useTokenColors(SUBSEA_TOKENS, scope);

  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <div ref={scope} className={`${className} w-full overflow-hidden rounded-xl border border-default bg-base-background`}>
        <SceneCanvas label={label}>
          <StillScene>{colors ? children(colors) : null}</StillScene>
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

function Subsea3dPartTemplate() {
  return (
    <Subsea3dStage label="Subsea template with four christmas trees under a tubular protection frame">
      {() => (
        <TurntableStage subjectSize={[9, 3.6, 7]} padding={1.1}>
          <SubseaTemplate3d id="stage-template" position={[0, 0, 0]} slots={4} />
        </TurntableStage>
      )}
    </Subsea3dStage>
  );
}

function Subsea3dPartFpso() {
  return (
    <Subsea3dStage label="Floating production vessel with a turret at the bow, topside modules, a flare boom and the accommodation aft">
      {() => (
        <TurntableStage subjectSize={[56, 16, 16]} padding={1.05}>
          <Fpso position={[0, 3.4, 0]} length={52} />
        </TurntableStage>
      )}
    </Subsea3dStage>
  );
}

function Subsea3dPartRov() {
  return (
    <Subsea3dStage label="Inspection vehicle on a tether with its light cone pointing at the seabed">
      {() => (
        <TurntableStage subjectSize={[8, 8, 8]} padding={0.9}>
          <Rov target={[0, 3, 0]} tetherFrom={[-6, 9, -5]} size={1.6} />
        </TurntableStage>
      )}
    </Subsea3dStage>
  );
}

function Subsea3dPartRiser() {
  const top = [30, 36, 0] as const;
  const seabed = [-6, 0.3, 0] as const;
  const points = lazyWavePoints(top, seabed, { segments: 32 });
  const target = frameBounds({ min: [-8, 0, -6], max: [32, 38, 6] }, { aspect: 1.4, padding: 0.72, view: 'perspective' });

  return (
    <Subsea3dStage label="Flexible riser in a lazy-wave shape: a steep descent, a sag bend, a buoyant hog bend and a gentle run to the seabed" className="h-80">
      {(colors) => (
        <>
          <SceneLights />
          <CameraRig target={target} minDistance={8} maxDistance={140} />
          <SeaPlane size={[60, 30]} center={[12, 0]} level={36} cell={6} opacity={0.4} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, 0, 0]}>
            <planeGeometry args={[60, 30]} />
            <meshStandardMaterial color={colors.mooring.color} roughness={1} />
          </mesh>
          <WellTube id="riser" points={points} color={colors.production.color} radius={0.4} />
          <FlowChevrons points={[...points].reverse()} color={colors.control.color} radius={0.4} spacing={7} />
        </>
      )}
    </Subsea3dStage>
  );
}

function Subsea3dPartTerrain() {
  const plan = snakePlan([-30, -18], [30, 18], { amplitude: 6, waves: 1.5, steps: 16 });
  const line = drapeOnTerrain(plan, subseaHeight, { spacing: 4, clearance: 0.3 });
  const target = frameBounds({ min: [-45, -3, -30], max: [45, 4, 30] }, { aspect: 1.4, padding: 0.9 });

  return (
    <Subsea3dStage label="Low-poly seabed with a flowline draped along the terrain" className="h-80">
      {(colors) => (
        <>
          <SceneLights />
          <CameraRig target={target} minDistance={10} maxDistance={160} />
          <SeabedTerrain height={subseaHeight} size={[100, 70]} segments={[26, 18]} />
          <WellTube id="line" points={line} color={colors.production.color} radius={0.45} />
        </>
      )}
    </Subsea3dStage>
  );
}

function Subsea3dPartRail() {
  const [level, setLevel] = useState<DepthLevel>('water-column');

  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <div className="flex h-[22rem] w-full justify-center overflow-hidden rounded-xl border border-default bg-base-background">
        <Subsea3dRail level={level} onChange={setLevel} className="border-r-0" />
      </div>
    </ThemeScope>
  );
}

function Subsea3dPartSystemSwitch() {
  const [value, setValue] = useState<SubseaSystemFilter>('production');

  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <div className="flex w-full flex-col items-start gap-4 rounded-xl border border-default bg-base-background p-4">
        <div className={`flex items-center gap-2 rounded-lg px-2 py-1 ${SUBSEA3D_GLASS}`}>
          <span className="pl-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">System</span>
          <Subsea3dSystemSwitch value={value} onChange={setValue} />
        </div>
        <Subsea3dSystemLegend />
      </div>
    </ThemeScope>
  );
}

function Subsea3dPartCard() {
  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <div className="flex w-full justify-center rounded-xl border border-default bg-base-background bg-[radial-gradient(ellipse_at_50%_30%,color-mix(in_oklab,var(--primary-background)_16%,transparent),transparent_70%)] p-4">
        <div className="w-80 max-w-full">
          <Subsea3dCard id="fl-c" rovArrived />
        </div>
      </div>
    </ThemeScope>
  );
}

export default definePage({
  id: 'subsea-field-3d',
  title: 'Subsea field',
  summary:
    'A subsea production system seen from the surface down to the seabed: templates, a manifold and snaking flowlines on rolling terrain, lazy-wave risers up to a floating vessel, and an inspection vehicle that flies to whatever you click.',
  guidance: {
    use: [
      'When inspection and integrity are location questions: which line, which template, how deep and what the last campaign found.',
      'With a depth rail beside the scene, so the three altitudes are one click each and the camera never gets lost in the water column.',
      'To separate networks in a dense field: highlight one system and let the rest fade, instead of hiding it.',
      'Beside a list of the same items, so the card and findings are reachable without pointing at a thin line.',
    ],
    avoid: [
      'Showing every network at full strength at once. Ghost the ones that are not the question.',
      'Colour as the only way to tell networks apart. Name them in the legend and on the card.',
      'Motion that never stops. The vehicle flight and flow chevrons hold still under reduced motion.',
      'A true-to-scale seabed. Draw structures larger than life so they stay selectable.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Drag to orbit, scroll to zoom. Use the depth rail on the left to move between surface, water column and seabed. Switch the system to highlight one network, click a template, flowline or riser to open its integrity card and send the vehicle to it, and turn on flow direction to see chevrons from the wells to the vessel. Escape closes the card.',
      specimens: [
        {
          id: 'Subsea3dFieldNordic',
          title: 'Subsea field',
          note: 'Pick it when people inspect a subsea system and need to move between depths, networks and one item at a time.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/fields/SubseaFieldScene.tsx',
            'three/fields/SeabedTerrain.tsx',
            'three/fields/SubseaTemplate3d.tsx',
            'three/fields/Fpso.tsx',
            'three/fields/Rov.tsx',
            'three/fields/MooringLine.tsx',
            'three/fields/FlowChevrons.tsx',
            'three/fields/subseaField.ts',
            'three/fields/subseaFieldData.ts',
            'three/fields/lazyWave.ts',
            'three/fields/drapeOnTerrain.ts',
            'three/fields/terrainHeight.ts',
            'three/SceneCanvas.tsx',
            'three/HudPanel.tsx',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: Subsea3dFieldNordic,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same field in two more presets, each opened somewhere else: the water column with flow on, and the seabed with one flowline selected.',
      specimens: [
        {
          id: 'Subsea3dFieldHologram',
          title: 'Hologram, water column',
          note: 'Pick it for a presentation wall where the risers and moorings are the story.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/fields/SubseaFieldScene.tsx', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: Subsea3dFieldHologram,
        },
        {
          id: 'Subsea3dFieldTron',
          title: 'Tron, seabed with a finding',
          note: 'Pick it for an inspection control room: cyan lines on black, one flowline open with its findings.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/fields/SubseaFieldScene.tsx', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: Subsea3dFieldTron,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The scene pieces on their own, and the panels that sit around the canvas.',
      specimens: [
        {
          id: 'Subsea3dPartTemplate',
          title: 'Subsea template',
          note: 'Pick it for a drilling template: a protection frame, a manifold header and a tree on every slot.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/fields/SubseaTemplate3d.tsx', 'three/models/SubseaTemplate.tsx', 'three/TurntableStage.tsx'],
          Component: Subsea3dPartTemplate,
        },
        {
          id: 'Subsea3dPartFpso',
          title: 'Floating production vessel',
          note: 'Pick it as the surface anchor of a subsea scene: hull, turret, topside modules and accommodation.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/fields/Fpso.tsx', 'three/TurntableStage.tsx'],
          Component: Subsea3dPartFpso,
        },
        {
          id: 'Subsea3dPartRov',
          title: 'Inspection vehicle',
          note: 'Pick it to show where inspection is happening: a tethered vehicle with a light cone on the item.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/fields/Rov.tsx', 'three/fields/tether.ts', 'three/TurntableStage.tsx'],
          Component: Subsea3dPartRov,
        },
        {
          id: 'Subsea3dPartRiser',
          title: 'Lazy-wave riser',
          note: 'Pick it to explain why a riser has a hump: buoyancy decouples vessel motion from the touchdown point.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/fields/lazyWave.ts', 'three/fields/FlowChevrons.tsx', 'three/models/WellTube.tsx', 'three/scenes/SeaPlane.tsx'],
          Component: Subsea3dPartRiser,
        },
        {
          id: 'Subsea3dPartTerrain',
          title: 'Terrain with a draped flowline',
          note: 'Pick it when a line must follow the ground: one height function builds the mesh and lays the line.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/fields/SeabedTerrain.tsx', 'three/fields/drapeOnTerrain.ts', 'three/fields/terrainHeight.ts'],
          Component: Subsea3dPartTerrain,
        },
        {
          id: 'Subsea3dPartRail',
          title: 'Depth rail',
          note: 'Pick it to move a camera between a few named altitudes with depth in metres on each stop.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/fields/subseaField.ts'],
          Component: Subsea3dPartRail,
        },
        {
          id: 'Subsea3dPartSystemSwitch',
          title: 'System switch and legend',
          note: 'Pick it to highlight one network and fade the rest, with a legend that names every line type.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/SceneLegend.tsx'],
          Component: Subsea3dPartSystemSwitch,
        },
        {
          id: 'Subsea3dPartCard',
          title: 'Integrity card',
          note: 'Pick it as the detail side of the scene: pressure, temperature, inspection date, remaining life and findings.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/HudPanel.tsx', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          Component: Subsea3dPartCard,
        },
      ],
    },
  ],
});
