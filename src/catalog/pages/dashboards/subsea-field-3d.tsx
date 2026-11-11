import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Switch } from '@cognite/aura/components/switch';
import { IconAnchor, IconChevronLeft, IconChevronRight, IconRadar, IconX } from '@cognite/aura/icons';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { ListRow } from '../../../library/kit/ListRow';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { Stat } from '../../../library/kit/Stat';
import { StatusPill } from '../../../library/kit/StatusPill';
import { DepthRail, type DepthStop } from '../../../library/kit/subsea-field-3d/DepthRail';
import {
  DESIGN_LIFE_YEARS,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  SHORT_LIFE_YEARS,
  fieldIntegrityIndex,
  findingsBySeverity,
  integritySummary,
  integrityTone,
  rankByRisk,
  type IntegrityRecord,
} from '../../../library/kit/subsea-field-3d/integrity';
import { IntegrityCard } from '../../../library/kit/subsea-field-3d/IntegrityCard';
import { TagId } from '../../../library/kit/TagId';
import { LookScope } from '../../../library/looks/LookScope';
import { Fpso } from '../../../library/three/fields/Fpso';
import { selectableIds } from '../../../library/three/fields/subseaField';
import type { DepthLevel, SubseaLineKind, SubseaStructureKind, SubseaSystem, SubseaSystemFilter } from '../../../library/three/fields/subseaField';
import { SUBSEA_METRES_PER_UNIT, buildSubseaLayout, subseaHeight } from '../../../library/three/fields/subseaFieldData';
import { SubseaFieldScene } from '../../../library/three/fields/SubseaFieldScene';
import { SubseaTemplate3d } from '../../../library/three/fields/SubseaTemplate3d';
import { SUBSEA_TOKENS } from '../../../library/three/fields/subseaTokens';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { StillScene } from '../../../library/three/scenes/StillScene';
import { TurntableStage } from '../../../library/three/TurntableStage';
import { useTokenColors } from '../../../library/three/useTokenColors';
import { DAY, REFERENCE_NOW, formatDate } from '../../data/series';
import { definePage } from '../../types';

import source from './subsea-field-3d.tsx?raw';

const SUBSEA3D_LAYOUT = buildSubseaLayout();

const SUBSEA3D_DEPTH = SUBSEA3D_LAYOUT.waterDepth * SUBSEA_METRES_PER_UNIT;

/** Integrity picture per selectable item, in the field's own tag style. Consistent with the layout ids. */
const SUBSEA3D_INTEGRITY: Readonly<Record<string, IntegrityRecord>> = {
  't-a': { pressure: 212, temperature: 68, inspectedDaysAgo: 41, remainingLife: 22, findings: [{ text: 'Anode depletion at tree 2 frame, 60 percent consumed', severity: 'medium', foundDaysAgo: 41 }] },
  't-b': { pressure: 198, temperature: 64, inspectedDaysAgo: 41, remainingLife: 24, findings: [] },
  't-c': {
    pressure: 176,
    temperature: 59,
    inspectedDaysAgo: 118,
    remainingLife: 19,
    findings: [
      { text: 'Hydraulic weep at tree 3 choke actuator', severity: 'high', foundDaysAgo: 118 },
      { text: 'Marine growth on the protection frame', severity: 'low', foundDaysAgo: 118 },
    ],
  },
  't-d': { pressure: 236, temperature: 9, inspectedDaysAgo: 77, remainingLife: 27, findings: [] },
  'm-1': { pressure: 158, temperature: 61, inspectedDaysAgo: 77, remainingLife: 20, findings: [{ text: 'Coating damage on the header support', severity: 'low', foundDaysAgo: 77 }] },
  'plet-1': { pressure: 142, temperature: 55, inspectedDaysAgo: 77, remainingLife: 21, findings: [] },
  'fl-a': { pressure: 151, temperature: 62, inspectedDaysAgo: 203, remainingLife: 17, findings: [{ text: 'Free span of 14 m at kilometre post 0.4', severity: 'medium', foundDaysAgo: 203 }] },
  'fl-b': { pressure: 149, temperature: 60, inspectedDaysAgo: 203, remainingLife: 18, findings: [] },
  'fl-c': {
    pressure: 144,
    temperature: 57,
    inspectedDaysAgo: 203,
    remainingLife: 7,
    findings: [
      { text: 'Internal corrosion, wall loss 31 percent over 2.1 m', severity: 'high', foundDaysAgo: 203 },
      { text: 'Buckle initiation at the second bend', severity: 'medium', foundDaysAgo: 203 },
      { text: 'Weight coating cracks', severity: 'low', foundDaysAgo: 203 },
    ],
  },
  'exp-1': { pressure: 138, temperature: 52, inspectedDaysAgo: 96, remainingLife: 23, findings: [] },
  'rs-1': {
    pressure: 132,
    temperature: 48,
    inspectedDaysAgo: 28,
    remainingLife: 11,
    findings: [
      { text: 'Outer sheath wear at the touchdown bend', severity: 'medium', foundDaysAgo: 28 },
      { text: 'Buoyancy module 6 displaced by 0.4 m', severity: 'medium', foundDaysAgo: 28 },
    ],
  },
  'rs-2': { pressure: 244, temperature: 11, inspectedDaysAgo: 28, remainingLife: 14, findings: [{ text: 'Bend stiffener tilt 2 degrees from vertical', severity: 'low', foundDaysAgo: 28 }] },
  'ij-1': { pressure: 231, temperature: 9, inspectedDaysAgo: 150, remainingLife: 25, findings: [] },
  'um-1': { pressure: 310, temperature: 6, inspectedDaysAgo: 150, remainingLife: 16, findings: [{ text: 'Chemical injection tube 3 pressure decay', severity: 'high', foundDaysAgo: 12 }] },
  'ru-1': { pressure: 310, temperature: 8, inspectedDaysAgo: 28, remainingLife: 9, findings: [{ text: 'Armour wire corrosion at the hang-off', severity: 'medium', foundDaysAgo: 28 }] },
};

/** Every selectable asset, the one that needs attention first at the front. */
const SUBSEA3D_RANKED = rankByRisk(SUBSEA3D_INTEGRITY, selectableIds(SUBSEA3D_LAYOUT).filter((id) => SUBSEA3D_INTEGRITY[id] !== undefined));

const SUBSEA3D_RECORDS = SUBSEA3D_RANKED.flatMap((id) => (SUBSEA3D_INTEGRITY[id] ? [SUBSEA3D_INTEGRITY[id]] : []));

const SUBSEA3D_SEVERITIES = findingsBySeverity(SUBSEA3D_RECORDS).filter((entry) => entry.severity !== 'critical');

const SUBSEA3D_SYSTEMS: readonly { value: SubseaSystemFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'production', label: 'Production' },
  { value: 'injection', label: 'Injection' },
  { value: 'control', label: 'Control' },
  { value: 'mooring', label: 'Mooring' },
];

const SUBSEA3D_SYSTEM_LABEL: Readonly<Record<SubseaSystem, string>> = { production: 'Production', injection: 'Injection', control: 'Control', mooring: 'Mooring' };

const SUBSEA3D_STOPS: readonly DepthStop<DepthLevel>[] = [
  { id: 'surface', label: 'Surface', metres: 0, hint: 'Vessel and turret' },
  { id: 'water-column', label: 'Water column', metres: SUBSEA3D_DEPTH / 2, hint: 'Risers and moorings' },
  { id: 'seabed', label: 'Seabed', metres: SUBSEA3D_DEPTH, hint: 'Templates and lines' },
];

const SUBSEA3D_KIND_LABEL: Readonly<Record<SubseaStructureKind | SubseaLineKind, string>> = {
  template: 'Template',
  manifold: 'Manifold',
  plet: 'Termination',
  termination: 'Anchor',
  flowline: 'Flowline',
  pipeline: 'Trunkline',
  umbilical: 'Umbilical',
  riser: 'Riser',
  jumper: 'Jumper',
  mooring: 'Mooring',
};

const SUBSEA3D_NETWORKS: readonly { label: string; swatch: string }[] = [
  { label: 'Production', swatch: 'bg-chart-1-450' },
  { label: 'Injection', swatch: 'bg-chart-2-450' },
  { label: 'Control umbilical', swatch: 'bg-chart-3-450' },
  { label: 'Mooring', swatch: 'bg-chart-neutral-450' },
];

/** A floating glass surface for chrome that is not a kit panel: the top bar, the dock. */
const SUBSEA3D_GLASS =
  'pointer-events-auto rounded-[var(--kit-radius)] border border-[var(--kit-rule)] bg-[color-mix(in_oklab,var(--mountain-950)_56%,transparent)] shadow-[var(--kit-panel-shadow)] backdrop-blur-xl backdrop-saturate-150';

/** Panels that float on the scene are smoked, so their text keeps its contrast over a pale seabed. */
const SUBSEA3D_SMOKED = 'pointer-events-auto bg-[color-mix(in_oklab,var(--mountain-950)_56%,transparent)]!';

/** Scene labels come from the shared 3D library; here they are set in the UI sans like everything else. */
const SUBSEA3D_SCENE = '[&_[data-slot=scene-label]_.font-mono]:font-sans [&_[data-slot=scene-label]_.font-mono]:tabular-nums';

type Subsea3dItem = { id: string; tag: string; name: string; kind: SubseaStructureKind | SubseaLineKind; system: SubseaSystem };

type Subsea3dInitial = { level?: DepthLevel; filter?: SubseaSystemFilter; selectedId?: string | null; flow?: boolean };

function subsea3dIsSystem(value: unknown): value is SubseaSystemFilter {
  return SUBSEA3D_SYSTEMS.some((system) => system.value === value);
}

function subsea3dItem(id: string): Subsea3dItem | null {
  const structure = SUBSEA3D_LAYOUT.structures.find((candidate) => candidate.id === id);
  if (structure) return { id, tag: structure.tag, name: structure.name ?? structure.tag, kind: structure.kind, system: structure.system };
  const line = SUBSEA3D_LAYOUT.lines.find((candidate) => candidate.id === id);
  return line ? { id, tag: line.tag, name: line.name ?? line.tag, kind: line.kind, system: line.system } : null;
}

const SUBSEA3D_ITEMS: readonly Subsea3dItem[] = SUBSEA3D_RANKED.flatMap((id) => {
  const item = subsea3dItem(id);
  return item ? [item] : [];
});

const SUBSEA3D_ACTION_COUNT = SUBSEA3D_RECORDS.filter((record) => integrityTone(record) === 'critical').length;

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

function Subsea3dNetworkKey() {
  return (
    <ul aria-label="Networks" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[var(--kit-text-2)]">
      {SUBSEA3D_NETWORKS.map((network) => (
        <li key={network.label} className="flex items-center gap-2 whitespace-nowrap">
          <span aria-hidden="true" className={`h-1 w-5 rounded-full ${network.swatch}`} />
          {network.label}
        </li>
      ))}
    </ul>
  );
}

function Subsea3dFallback() {
  return (
    <ul className="flex flex-col gap-1.5 p-3 text-sm">
      {SUBSEA3D_LAYOUT.structures.map((structure) => (
        <li key={structure.id} className="flex items-center justify-between gap-3">
          <TagId>{structure.tag}</TagId>
          <span className="truncate text-[var(--kit-text-2)]">{structure.name}</span>
        </li>
      ))}
    </ul>
  );
}

/** The integrity of one asset: state in words, design life as a ring, operating figures and the findings. */
function Subsea3dAssetDetail({ item, record, rov, wide = false }: { item: Subsea3dItem; record: IntegrityRecord; rov?: 'flying' | 'on-station'; wide?: boolean }) {
  const tone = integrityTone(record);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <TagId variant="chip">{item.tag}</TagId>
        <StatusPill tone={tone}>{integritySummary(record)}</StatusPill>
      </div>
      <div className="flex items-center gap-5">
        <RingGauge label="Design life left" value={record.remainingLife} max={DESIGN_LIFE_YEARS} unit="y" tone={record.remainingLife < SHORT_LIFE_YEARS ? 'warning' : 'accent'} size={104} />
        <div className={`grid min-w-0 flex-1 gap-3 ${wide ? 'grid-cols-3' : 'grid-cols-1'}`}>
          <Stat variant="plain" size={wide ? 'md' : 'sm'} label="Operating pressure" value={record.pressure} unit="bar" />
          <Stat variant="plain" size={wide ? 'md' : 'sm'} label="Temperature" value={record.temperature} unit="°C" />
          {wide ? <Stat variant="plain" size="md" label="Since inspection" value={record.inspectedDaysAgo} unit="days" /> : null}
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-[var(--kit-text-2)]">
        {rov ? (
          <StatusPill tone={rov === 'on-station' ? 'success' : 'info'} icon={<IconRadar />}>
            {rov === 'on-station' ? 'ROV on station' : 'ROV flying in'}
          </StatusPill>
        ) : null}
        <span>
          Inspected {formatDate(REFERENCE_NOW - record.inspectedDaysAgo * DAY)}, {record.inspectedDaysAgo} days ago
        </span>
      </p>
      <div className="flex min-h-0 flex-col gap-1">
        <h4 className="text-sm font-semibold text-[var(--kit-text)]">Inspection findings</h4>
        {record.findings.length === 0 ? (
          <p className="text-sm text-[var(--kit-text-2)]">Nothing found in the last campaign. Next inspection follows the five-year plan.</p>
        ) : (
          <ul>
            {record.findings.map((finding) => (
              <ListRow key={finding.text} tone={SEVERITY_TONE[finding.severity]} title={finding.text} meta={`${SEVERITY_LABEL[finding.severity]} · found ${formatDate(REFERENCE_NOW - finding.foundDaysAgo * DAY)}`} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** The field when nothing is selected: an index, the findings by severity and where to look first. */
function Subsea3dFieldSummary({ onSelect }: { onSelect?: (id: string) => void }) {
  const total = SUBSEA3D_RECORDS.reduce((sum, record) => sum + record.findings.length, 0);
  const affected = SUBSEA3D_RECORDS.filter((record) => record.findings.length > 0).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center gap-5">
        <RingGauge label="Integrity index" value={fieldIntegrityIndex(SUBSEA3D_RECORDS)} unit="" tone="accent" size={104} hideLabel />
        <p className="min-w-0 text-sm text-[var(--kit-text-2)]">
          <span className="block text-sm font-medium text-[var(--kit-text)]">Integrity index</span>
          <span className="block text-2xl font-semibold tabular-nums text-[var(--kit-text)]">{total} findings</span>
          open on {affected} of {SUBSEA3D_RECORDS.length} assets
        </p>
      </div>
      <Bars
        label="Open findings by severity"
        orientation="horizontal"
        categories={SUBSEA3D_SEVERITIES.map((entry) => SEVERITY_LABEL[entry.severity])}
        series={[{ id: 'findings', label: 'Open findings', values: SUBSEA3D_SEVERITIES.map((entry) => entry.count) }]}
        tones={SUBSEA3D_SEVERITIES.map((entry) => SEVERITY_TONE[entry.severity])}
        showValues
        showLegend={false}
        height={112}
      />
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-semibold text-[var(--kit-text)]">Look at these first</h4>
        <ul className="flex flex-col">
          {SUBSEA3D_ITEMS.slice(0, 3).map((item) => {
            const record = SUBSEA3D_INTEGRITY[item.id];
            if (!record) return null;
            return (
              <li key={item.id} className="border-b border-[var(--kit-rule)] last:border-b-0">
                <button
                  type="button"
                  onClick={() => onSelect?.(item.id)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[var(--kit-radius-sm)] py-2 text-left outline-none hover:bg-[var(--kit-well)] focus-visible:ring-2 focus-visible:ring-[var(--ring-default)]"
                >
                  <span className="flex min-w-0 flex-col">
                    <TagId>{item.tag}</TagId>
                    <span className="truncate text-sm text-[var(--kit-text-2)]">{integritySummary(record)}</span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-[var(--kit-text-2)]">{record.remainingLife} y left</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** The dock: every asset as a card, highest risk first. Keeps the selected card in view. */
function Subsea3dCardStrip({ selectedId, filter, onSelect }: { selectedId: string | null; filter: SubseaSystemFilter; onSelect: (id: string) => void }) {
  const strip = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = strip.current;
    const card = selectedId ? list?.querySelector<HTMLElement>(`[data-card="${selectedId}"]`) : null;
    if (!list || !card || typeof list.scrollTo !== 'function') return;
    list.scrollTo({ left: card.offsetLeft - (list.clientWidth - card.clientWidth) / 2, behavior: 'smooth' });
  }, [selectedId]);

  return (
    <ul ref={strip} aria-label="Assets, highest risk first" className="relative flex gap-3 overflow-x-auto px-4 pb-4 pt-1">
      {SUBSEA3D_ITEMS.map((item) => {
        const record = SUBSEA3D_INTEGRITY[item.id];
        if (!record) return null;
        return (
          <li key={item.id} data-card={item.id} className="shrink-0">
            <IntegrityCard
              tag={item.tag}
              name={item.name}
              kind={SUBSEA3D_KIND_LABEL[item.kind]}
              record={record}
              selected={item.id === selectedId}
              dimmed={filter !== 'all' && filter !== item.system}
              onSelect={() => onSelect(item.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}

function Subsea3dField({ initial = {}, still = false }: { initial?: Subsea3dInitial; still?: boolean }) {
  // Archetype: the scene is the whole screen; glass chrome floats on it. A depth rail on the left
  //   moves the camera, the dock holds one integrity card per asset, the right panel explains
  //   either the field or the selected asset.
  // Interaction: click an asset in the scene or its card; the camera and the inspection vehicle
  //   fly to it. Click again or press Escape to let go.
  const scope = useRef<HTMLDivElement>(null);
  const colors = useTokenColors(SUBSEA_TOKENS, scope);
  const [level, setLevel] = useState<DepthLevel>(initial.level ?? 'water-column');
  const [filter, setFilter] = useState<SubseaSystemFilter>(initial.filter ?? 'all');
  const [selectedId, setSelectedId] = useState<string | null>(initial.selectedId ?? null);
  const [flow, setFlow] = useState(initial.flow ?? false);
  const [arrived, setArrived] = useState(still);
  const selected = selectedId ? subsea3dItem(selectedId) : null;
  const record = selectedId ? SUBSEA3D_INTEGRITY[selectedId] : undefined;

  const select = (id: string) => {
    setArrived(still);
    setSelectedId(id === selectedId ? null : id);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && selectedId !== null) {
      event.preventDefault();
      setSelectedId(null);
    }
  };

  return (
    <Canvas padding="none" className="relative h-[54rem] overflow-hidden">
      <div
        ref={scope}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onPointerDownCapture={(event) => {
          // Orbit controls swallow the pointer event, so take focus by hand to keep Escape working.
          if (event.target instanceof HTMLCanvasElement) event.currentTarget.focus({ preventScroll: true });
        }}
        className={`absolute inset-0 outline-none ${SUBSEA3D_SCENE}`}
      >
        <SceneCanvas
          label={`3D model of the Nordkapp Vest subsea field at ${SUBSEA3D_DEPTH} metres of water: templates, flowlines and umbilicals on the seabed, three lazy-wave risers to a floating production vessel and six mooring lines. Camera at ${level.replace('-', ' ')}${selected ? `, ${selected.tag} selected` : ''}`}
          fallback={<Subsea3dFallback />}
          onPointerMissed={() => setSelectedId(null)}
        >
          <StillScene still={still}>
            <SubseaFieldScene
              layout={SUBSEA3D_LAYOUT}
              height={subseaHeight}
              colors={colors}
              filter={filter}
              level={level}
              selectedId={selectedId}
              onSelect={select}
              flow={flow}
              rov
              onRovArrive={() => setArrived(true)}
              insets={{ top: 96, left: 200, right: 380, bottom: 220 }}
            />
          </StillScene>
        </SceneCanvas>

        <div className="pointer-events-none absolute inset-4 z-30 grid grid-cols-[11.5rem_minmax(0,1fr)_22rem] grid-rows-[auto_minmax(0,1fr)_auto] gap-4">
          <header className={`col-span-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 ${SUBSEA3D_GLASS}`}>
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(140deg,var(--sky-400),var(--dusk-400))] text-[var(--mountain-950)] shadow-[0_0_22px_-2px_var(--sky-400)]">
              <IconAnchor className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-6 text-[var(--kit-text)]">Nordkapp Vest</h2>
              <p className="text-sm text-[var(--kit-text-2)]">Subsea field · {SUBSEA3D_DEPTH} m water depth</p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
              <Subsea3dSystemSwitch value={filter} onChange={setFilter} />
              <Switch label="Flow direction" checked={flow} onCheckedChange={(checked) => setFlow(checked)} />
              <StatusPill tone="critical" size="lg">
                {SUBSEA3D_ACTION_COUNT} assets need action
              </StatusPill>
            </div>
          </header>

          <Panel className={SUBSEA3D_SMOKED} title="Depth" subtitle="Camera level">
            <DepthRail
              label="Camera depth"
              stops={SUBSEA3D_STOPS}
              value={level}
              onChange={(next) => {
                setSelectedId(null);
                setLevel(next);
              }}
              className="flex-1"
            />
          </Panel>

          <div className="flex min-w-0 flex-col justify-end">
            <div className={`self-start px-4 py-2.5 ${SUBSEA3D_GLASS}`}>
              <Subsea3dNetworkKey />
            </div>
          </div>

          {selected && record ? (
            <Panel
              key={selected.id}
              className={`min-h-0 overflow-y-auto ${SUBSEA3D_SMOKED}`}
              title={selected.name}
              subtitle={`${SUBSEA3D_KIND_LABEL[selected.kind]} · ${SUBSEA3D_SYSTEM_LABEL[selected.system]} system`}
              actions={
                <Button variant="ghost" size="icon-sm" aria-label="Close asset" onClick={() => setSelectedId(null)}>
                  <IconX />
                </Button>
              }
            >
              <Subsea3dAssetDetail item={selected} record={record} rov={arrived ? 'on-station' : 'flying'} />
            </Panel>
          ) : (
            <Panel className={`min-h-0 overflow-y-auto ${SUBSEA3D_SMOKED}`} title="Field integrity" subtitle="15 assets · campaign of February 2026">
              <Subsea3dFieldSummary onSelect={select} />
            </Panel>
          )}

          <section aria-label="Integrity cards" className={`col-span-3 flex min-w-0 flex-col ${SUBSEA3D_GLASS}`}>
            <div className="flex items-baseline justify-between gap-4 px-4 pb-2 pt-3">
              <h3 className="text-[0.9375rem] font-semibold text-[var(--kit-text)]">Integrity cards</h3>
              <p className="text-sm text-[var(--kit-text-2)]">Highest risk first · the ring is design life left, out of {DESIGN_LIFE_YEARS} years</p>
            </div>
            <Subsea3dCardStrip selectedId={selectedId} filter={filter} onSelect={select} />
          </section>
        </div>
      </div>
    </Canvas>
  );
}

function Subsea3dSignature() {
  return (
    <LookScope look="glass">
      <Subsea3dField />
    </LookScope>
  );
}

/** A small still view of the field with one asset selected, for screens where the scene is the preview. */
function Subsea3dPreview({ selectedId, level = 'seabed', rov = false, label }: { selectedId: string | null; level?: DepthLevel; rov?: boolean; label: string }) {
  const scope = useRef<HTMLDivElement>(null);
  const colors = useTokenColors(SUBSEA_TOKENS, scope);

  return (
    <div ref={scope} className={`size-full min-h-0 ${SUBSEA3D_SCENE}`}>
      <SceneCanvas label={label} fallback={<Subsea3dFallback />}>
        <StillScene>
          <SubseaFieldScene layout={SUBSEA3D_LAYOUT} height={subseaHeight} colors={colors} level={level} selectedId={selectedId} rov={rov} />
        </StillScene>
      </SceneCanvas>
    </div>
  );
}

type Subsea3dRow = { item: Subsea3dItem; record: IntegrityRecord };

const SUBSEA3D_ROWS: readonly Subsea3dRow[] = SUBSEA3D_ITEMS.flatMap((item) => (SUBSEA3D_INTEGRITY[item.id] ? [{ item, record: SUBSEA3D_INTEGRITY[item.id] }] : []));

function Subsea3dLifeBar({ years }: { years: number }) {
  const short = years < SHORT_LIFE_YEARS;
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden="true" className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--kit-track)]">
        <span className="block h-full rounded-full" style={{ width: `${(years / DESIGN_LIFE_YEARS) * 100}%`, background: `var(--kit-line-${short ? 'warning' : 'accent'})` }} />
      </span>
      <span className="w-9 tabular-nums">{years} y</span>
    </span>
  );
}

function Subsea3dRegister() {
  // A different screen of the same product: the register. The table leads and the scene is the
  // preview — picking a row frames that asset on the seabed and lists its findings.
  const [selectedId, setSelectedId] = useState('fl-c');
  const selected = subsea3dItem(selectedId);
  const record = SUBSEA3D_INTEGRITY[selectedId];
  const columns: DataTableColumn<Subsea3dRow>[] = [
    {
      id: 'asset',
      header: 'Asset',
      cell: (row) => (
        <button
          type="button"
          aria-pressed={row.item.id === selectedId}
          onClick={() => setSelectedId(row.item.id)}
          className="flex w-full max-w-[19rem] cursor-pointer flex-col rounded-[var(--kit-radius-sm)] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-default)]"
        >
          <TagId>{row.item.tag}</TagId>
          <span className="truncate text-sm text-[var(--kit-text-2)]">
            {row.item.name} · {SUBSEA3D_SYSTEM_LABEL[row.item.system]}
          </span>
        </button>
      ),
    },
    { id: 'life', header: 'Design life left', cell: (row) => <Subsea3dLifeBar years={row.record.remainingLife} />, nowrap: true },
    {
      id: 'state',
      header: 'Findings',
      cell: (row) => <StatusPill tone={integrityTone(row.record)}>{row.record.findings.length === 0 ? 'Clear' : `${row.record.findings.length} open`}</StatusPill>,
      nowrap: true,
    },
    { id: 'inspected', header: 'Inspected', cell: (row) => `${row.record.inspectedDaysAgo} d ago`, numeric: true, muted: true, nowrap: true },
  ];

  return (
    <LookScope look="glass">
      <Canvas className="grid h-[46rem] grid-cols-12 grid-rows-[minmax(0,1fr)] gap-4">
        <Panel className="col-span-7 min-h-0 overflow-y-auto" title="Integrity register" subtitle="15 assets, highest risk first · pick a row" padding="none">
          <DataTable
            label="Subsea assets by risk"
            flush
            density="default"
            columns={columns}
            rows={SUBSEA3D_ROWS}
            rowKey={(row) => row.item.id}
            rowTone={(row) => (row.item.id === selectedId ? 'accent' : integrityTone(row.record) === 'critical' ? 'critical' : undefined)}
          />
        </Panel>
        <div className="col-span-5 flex min-h-0 flex-col gap-4">
          <Panel className="h-56 shrink-0 overflow-hidden" padding="none">
            <Subsea3dPreview selectedId={selectedId} label={`Subsea field on the seabed with ${selected?.tag ?? 'no asset'} selected`} />
          </Panel>
          {selected && record ? (
            <Panel className="min-h-0 flex-1 overflow-y-auto" title={selected.name} subtitle={`${SUBSEA3D_KIND_LABEL[selected.kind]} · ${SUBSEA3D_SYSTEM_LABEL[selected.system]} system`}>
              <Subsea3dAssetDetail item={selected} record={record} />
            </Panel>
          ) : null}
        </div>
      </Canvas>
    </LookScope>
  );
}

/** The order the inspection vehicle visits the assets with open findings on this dive. */
const SUBSEA3D_DIVE: readonly string[] = ['rs-1', 'ru-1', 'um-1', 'fl-c', 't-c'];

function Subsea3dDive() {
  // The dive plan at tablet width: one column for the vehicle pilot. Step through the stops; the
  // scene frames each asset with the vehicle on station and the card under it says what to look at.
  const [stop, setStop] = useState(3);
  const id = SUBSEA3D_DIVE[stop] ?? SUBSEA3D_DIVE[0] ?? 'fl-c';
  const item = subsea3dItem(id);
  const record = SUBSEA3D_INTEGRITY[id];

  return (
    <LookScope look="glass">
      <Canvas className="flex justify-center">
        <div className="flex w-full max-w-[46rem] flex-col gap-4">
          <header className={`flex items-center justify-between gap-4 px-4 py-3 ${SUBSEA3D_GLASS}`}>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-6 text-[var(--kit-text)]">Dive 14 · follow-up inspection</h2>
              <p className="text-sm text-[var(--kit-text-2)]">
                Stop {stop + 1} of {SUBSEA3D_DIVE.length} · Nordkapp Vest, {SUBSEA3D_DEPTH} m
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" disabled={stop === 0} onClick={() => setStop(stop - 1)}>
                <IconChevronLeft /> Previous
              </Button>
              <Button size="sm" disabled={stop === SUBSEA3D_DIVE.length - 1} onClick={() => setStop(stop + 1)}>
                Next stop <IconChevronRight />
              </Button>
            </div>
          </header>
          <Panel className="h-80 overflow-hidden" padding="none">
            <Subsea3dPreview selectedId={id} rov label={`Inspection vehicle on station at ${item?.tag ?? 'the asset'}`} />
          </Panel>
          <ol aria-label="Stops of the dive" className="grid grid-cols-5 gap-3">
            {SUBSEA3D_DIVE.map((stopId, index) => {
              const stopItem = subsea3dItem(stopId);
              const state = index < stop ? 'Done' : index === stop ? 'On station' : 'Ahead';
              return (
                <li key={stopId}>
                  <button
                    type="button"
                    aria-current={index === stop ? 'step' : undefined}
                    onClick={() => setStop(index)}
                    className={`flex w-full cursor-pointer flex-col gap-0.5 rounded-[var(--kit-radius-sm)] border px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-default)] ${
                      index === stop ? 'border-[var(--kit-accent)] bg-[color-mix(in_oklab,var(--kit-accent)_22%,transparent)]' : 'border-[var(--kit-rule)] bg-[var(--kit-surface)] hover:border-[var(--kit-rule-strong)]'
                    }`}
                  >
                    <span className="text-xs text-[var(--kit-text-3)]">
                      {index + 1} · {state}
                    </span>
                    <TagId>{stopItem?.tag ?? stopId}</TagId>
                  </button>
                </li>
              );
            })}
          </ol>
          {item && record ? (
            <Panel className="h-auto" title={item.name} subtitle={`${SUBSEA3D_KIND_LABEL[item.kind]} · ${SUBSEA3D_SYSTEM_LABEL[item.system]} system`}>
              <Subsea3dAssetDetail item={item} record={record} rov="on-station" wide />
            </Panel>
          ) : null}
        </div>
      </Canvas>
    </LookScope>
  );
}

function Subsea3dPartCards() {
  const [selectedId, setSelectedId] = useState<string | null>('fl-c');

  return (
    <LookScope look="glass">
      <Canvas>
        <ul aria-label="Integrity cards in four states" className="flex flex-wrap justify-center gap-4">
          {['fl-c', 'rs-1', 'rs-2', 't-b'].map((id) => {
            const item = subsea3dItem(id);
            const record = SUBSEA3D_INTEGRITY[id];
            if (!item || !record) return null;
            return (
              <li key={id}>
                <IntegrityCard tag={item.tag} name={item.name} kind={SUBSEA3D_KIND_LABEL[item.kind]} record={record} selected={id === selectedId} onSelect={() => setSelectedId(id === selectedId ? null : id)} />
              </li>
            );
          })}
        </ul>
      </Canvas>
    </LookScope>
  );
}

function Subsea3dPartAsset() {
  const item = subsea3dItem('rs-1');
  const record = SUBSEA3D_INTEGRITY['rs-1'];

  return (
    <LookScope look="glass">
      <Canvas>
        {item && record ? (
          <Panel title={item.name} subtitle={`${SUBSEA3D_KIND_LABEL[item.kind]} · ${SUBSEA3D_SYSTEM_LABEL[item.system]} system`}>
            <Subsea3dAssetDetail item={item} record={record} rov="flying" />
          </Panel>
        ) : null}
      </Canvas>
    </LookScope>
  );
}

function Subsea3dPartSummary() {
  return (
    <LookScope look="glass">
      <Canvas>
        <Panel title="Field integrity" subtitle="15 assets · campaign of February 2026">
          <Subsea3dFieldSummary />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function Subsea3dPartDepth() {
  const [level, setLevel] = useState<DepthLevel>('water-column');

  return (
    <LookScope look="glass">
      <Canvas className="flex justify-center">
        <Panel className="h-80 w-48" title="Depth" subtitle="Camera level">
          <DepthRail label="Camera depth, on its own" stops={SUBSEA3D_STOPS} value={level} onChange={setLevel} className="flex-1" />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function Subsea3dStage({ label, title, subtitle, children }: { label: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <LookScope look="glass">
      <Canvas>
        <Panel className="h-80 overflow-hidden" title={title} subtitle={subtitle} padding="none">
          <div className="min-h-0 flex-1">
            <SceneCanvas label={label}>
              <StillScene>{children}</StillScene>
            </SceneCanvas>
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function Subsea3dPartTemplate() {
  return (
    <Subsea3dStage title="Template" subtitle="Four trees under a protection frame" label="Subsea template with four christmas trees under a tubular protection frame">
      <TurntableStage subjectSize={[9, 3.6, 7]} padding={1.1}>
        <SubseaTemplate3d id="stage-template" position={[0, 0, 0]} slots={4} />
      </TurntableStage>
    </Subsea3dStage>
  );
}

function Subsea3dPartFpso() {
  return (
    <Subsea3dStage title="Production vessel" subtitle="Turret-moored, flare boom forward" label="Floating production vessel with a turret at the bow, topside modules, a flare boom and the accommodation aft">
      <TurntableStage subjectSize={[56, 16, 16]} padding={1.05}>
        <Fpso position={[0, 3.4, 0]} length={52} />
      </TurntableStage>
    </Subsea3dStage>
  );
}

export default definePage({
  id: 'subsea-field-3d',
  title: 'Subsea field',
  summary:
    'A subsea field as one full-screen 3D scene under glass: a depth rail moves the camera from the vessel to the seabed, and a dock of integrity cards — one per template, flowline and riser — selects what the camera, the inspection vehicle and the side panel show.',
  guidance: {
    use: [
      'For assets nobody can walk up to, where position and depth explain the inspection findings.',
      'Order the cards by risk so the first one is the one to open.',
      'Say the state in words on every card and in the panel; the ring and the colour only support it.',
    ],
    avoid: [
      'Covering the subject with chrome: give the scene the insets of the floating panels.',
      'Colour as the only cue for a network — name the lines in the key and on the labels.',
      'A card strip that reorders on selection; keep the order and move the highlight.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Click an asset in the scene or its card in the dock: the camera and the inspection vehicle fly to it and the panel shows its integrity. The depth rail moves the camera; Escape or a second click lets go. Drag to orbit, scroll to zoom.',
      specimens: [
        {
          id: 'Subsea3dSignature',
          title: 'Field under glass',
          note: 'Pick it as the showpiece view of a subsea field, where the scene is the map and the cards are the worklist.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: [
            'kit/subsea-field-3d/IntegrityCard.tsx',
            'kit/subsea-field-3d/DepthRail.tsx',
            'kit/subsea-field-3d/integrity.ts',
            'kit/Panel.tsx',
            'kit/RingGauge.tsx',
            'kit/Bars.tsx',
            'three/fields/SubseaFieldScene.tsx',
            'three/SceneCanvas.tsx',
          ],
          Component: Subsea3dSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The register, where the table leads and the scene is the preview, and the dive plan for the vehicle pilot at tablet width.',
      specimens: [
        {
          id: 'Subsea3dRegister',
          title: 'Integrity register',
          note: 'Pick it for the integrity engineer who works through every asset in order and wants the scene only to confirm where it is.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/Panel.tsx', 'kit/subsea-field-3d/integrity.ts', 'three/fields/SubseaFieldScene.tsx'],
          Component: Subsea3dRegister,
        },
        {
          id: 'Subsea3dDive',
          title: 'Dive plan on a tablet',
          note: 'Pick it for the pilot of the inspection vehicle: one stop at a time, with the findings to re-check at that stop.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/TagId.tsx', 'three/fields/SubseaFieldScene.tsx'],
          Component: Subsea3dDive,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The panels and models of the field on their own.',
      specimens: [
        {
          id: 'Subsea3dPartCards',
          title: 'Integrity cards',
          note: 'Pick a card per asset when the list is the way into a scene: selected, findings open, minor finding and clear.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/subsea-field-3d/IntegrityCard.tsx', 'kit/RingGauge.tsx', 'kit/StatusPill.tsx'],
          Component: Subsea3dPartCards,
        },
        {
          id: 'Subsea3dPartAsset',
          title: 'Asset integrity panel',
          note: 'Pick it for the selected asset: state in words, design life, operating figures and the findings by severity.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/RingGauge.tsx', 'kit/Stat.tsx', 'kit/ListRow.tsx'],
          Component: Subsea3dPartAsset,
        },
        {
          id: 'Subsea3dPartSummary',
          title: 'Field summary',
          note: 'Pick it for the state with nothing selected, so the panel never sits empty.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/RingGauge.tsx', 'kit/Bars.tsx', 'kit/subsea-field-3d/integrity.ts'],
          Component: Subsea3dPartSummary,
        },
        {
          id: 'Subsea3dPartDepth',
          title: 'Depth rail',
          note: 'Pick it as the camera control of a scene that is mostly vertical: the stops read as a depth scale.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/subsea-field-3d/DepthRail.tsx'],
          Component: Subsea3dPartDepth,
        },
        {
          id: 'Subsea3dPartTemplate',
          title: 'Template model',
          note: 'Pick it to show one seabed structure on a stage, for a legend or a detail card.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['three/fields/SubseaTemplate3d.tsx', 'three/TurntableStage.tsx'],
          Component: Subsea3dPartTemplate,
        },
        {
          id: 'Subsea3dPartFpso',
          title: 'Production vessel model',
          note: 'Pick it where the surface end of the field needs its own picture.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['three/fields/Fpso.tsx', 'three/TurntableStage.tsx'],
          Component: Subsea3dPartFpso,
        },
      ],
    },
  ],
});
