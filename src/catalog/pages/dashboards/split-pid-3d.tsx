import { Button } from '@cognite/aura/components/button';
import { Switch } from '@cognite/aura/components/switch';
import { IconAlertTriangle } from '@cognite/aura/icons';
import { useReducer, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { valvePositionStatus } from '../../../library/industrial/diagrams/symbolState';
import { runStateStatus } from '../../../library/industrial/status';
import type { StatusDescriptor } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { DrillBreadcrumb } from '../../../library/three/DrillBreadcrumb';
import { COMPRESSION_INFO, COMPRESSION_LINKS, drawingTags, sceneTags } from '../../../library/three/fields/compressionArea';
import { INITIAL_LINKED_SELECTION, hoverTagOn, linkedSelectionReducer, primaryTag } from '../../../library/three/fields/linkedSelection';
import type { LinkedSelectionAction, LinkedSelectionState } from '../../../library/three/fields/linkedSelection';
import { LinkedSplit } from '../../../library/three/fields/LinkedSplit';
import { diffTagSets, matchRate, modelCheckFindings } from '../../../library/three/fields/modelCheck';
import { PidDrawing } from '../../../library/three/fields/PidDrawing';
import type { PidInstrument } from '../../../library/three/fields/PidDrawing';
import { SplitScene } from '../../../library/three/fields/SplitScene';
import { idForTag } from '../../../library/three/fields/tagMapping';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { SceneLegend } from '../../../library/three/SceneLegend';
import { StillScene } from '../../../library/three/scenes/StillScene';
import { SENSORS } from '../../data/plant';
import { definePage } from '../../types';

import source from './split-pid-3d.tsx?raw';

const SPLITPID_DIFF = diffTagSets(drawingTags(), sceneTags());
const SPLITPID_FINDINGS = modelCheckFindings(SPLITPID_DIFF);
const SPLITPID_MISSING_IN_MODEL = SPLITPID_DIFF.drawingOnly;

const SPLITPID_GLASS = 'border border-default bg-[color-mix(in_oklab,var(--card-background)_80%,transparent)] backdrop-blur-md';
const SPLITPID_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]';

function splitPidSensor(id: string) {
  return SENSORS.find((sensor) => sensor.id === id);
}

const SPLITPID_PT = splitPidSensor('pt-92531');
const SPLITPID_TT = splitPidSensor('tt-91141');

const SPLITPID_INSTRUMENTS: readonly PidInstrument[] = [
  { id: 'pt-92531', letters: 'PT', loop: '92531', tag: '23-KA-9101', value: SPLITPID_PT?.value ?? null, unit: SPLITPID_PT?.unit ?? 'barg', decimals: 1 },
  { id: 'tt-91141', letters: 'TT', loop: '91141', tag: '23-HA-9114', value: SPLITPID_TT?.value ?? null, unit: SPLITPID_TT?.unit ?? '°C', decimals: 1, flag: 'U' },
  { id: 'pt-92631', letters: 'PT', loop: '92631', tag: '23-KA-9102', value: 96.2, unit: 'barg', decimals: 1 },
];

function splitPidState(tag: string): StatusDescriptor | null {
  const info = COMPRESSION_INFO[tag];
  if (!info) return null;
  if (info.valve) return valvePositionStatus(info.valve);
  return info.run ? runStateStatus(info.run) : null;
}

function splitPidSide(tag: string): string {
  const drawing = idForTag(COMPRESSION_LINKS, tag, 'drawing');
  const scene = idForTag(COMPRESSION_LINKS, tag, 'scene');
  if (drawing && scene) return `${drawing} on the drawing, ${scene} in the model`;
  return drawing ? `${drawing} on the drawing only` : `${scene} in the model only`;
}

function SplitPidSelectionBar({ state, dispatch }: { state: LinkedSelectionState; dispatch: (action: LinkedSelectionAction) => void }) {
  const tag = primaryTag(state);
  const info = tag ? COMPRESSION_INFO[tag] : undefined;
  const status = tag ? splitPidState(tag) : null;
  const crumbs = [
    { id: 'plant', label: 'Nordkapp', kind: 'Plant' },
    { id: 'area', label: 'Gas compression', kind: 'Area' },
    ...(tag ? [{ id: tag, label: tag }] : []),
  ];

  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-default bg-card-background px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <DrillBreadcrumb crumbs={crumbs} onNavigate={() => dispatch({ type: 'clear' })} onUp={() => dispatch({ type: 'clear' })} label="Selection" />
        {tag && info ? (
          <>
            <div className="flex min-w-0 flex-col">
              <span className="text-sm text-base-foreground">{info.name}</span>
              <span className="text-xs text-muted-foreground">{splitPidSide(tag)}</span>
            </div>
            {status ? <StatusIndicator {...status} size="sm" /> : null}
            <dl className="flex flex-wrap items-end gap-x-6 gap-y-2">
              {info.readings.map((reading) => (
                <div key={reading.label} className="flex min-w-0 flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">{reading.label}</dt>
                  <dd>
                    <ValueReadout value={reading.value} unit={reading.unit} decimals={reading.decimals ?? 0} size="sm" />
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a symbol on the drawing or a machine in the 3D model. The other side follows.</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Switch label="Sync views" checked={state.sync} onCheckedChange={(value) => dispatch({ type: 'setSync', value })} />
        <Switch label="Follow selection" checked={state.follow} onCheckedChange={(value) => dispatch({ type: 'setFollow', value })} />
        <Switch label="Show in 3D only what is on this drawing" checked={state.drawingOnly} onCheckedChange={(value) => dispatch({ type: 'setDrawingOnly', value })} />
      </div>
    </header>
  );
}

function SplitPidModelCheck({ onSelect }: { onSelect?: (tag: string, side: 'drawing' | 'scene') => void }) {
  return (
    <section aria-label="Model check" className="flex shrink-0 flex-col gap-1 border-t border-default bg-card-background px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <IconAlertTriangle aria-hidden="true" className="size-3.5" />
          Model check
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {SPLITPID_DIFF.matched.length} of {SPLITPID_DIFF.matched.length + SPLITPID_DIFF.drawingOnly.length + SPLITPID_DIFF.modelOnly.length} tags match ({Math.round(matchRate(SPLITPID_DIFF) * 100)} percent)
        </span>
      </div>
      <ul className="flex flex-col">
        {SPLITPID_FINDINGS.map((finding) => {
          const side = finding.kind === 'missing-in-model' ? 'drawing' : 'scene';
          const body = (
            <>
              <StatusIndicator tone="warning" shape={finding.kind === 'missing-in-model' ? 'square' : 'diamond'} label={finding.message} size="sm" />
              <span className="font-mono text-xs text-base-foreground">{finding.tag}</span>
            </>
          );
          return (
            <li key={finding.tag}>
              {onSelect ? (
                <button type="button" onClick={() => onSelect(finding.tag, side)} className={`-mx-1.5 flex w-[calc(100%+0.75rem)] items-center justify-between gap-3 rounded-md px-1.5 py-1 text-left hover:bg-secondary-background ${SPLITPID_FOCUS}`}>
                  {body}
                </button>
              ) : (
                <div className="flex items-center justify-between gap-3 py-1">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SplitPidFallback() {
  return (
    <ul className="flex flex-col gap-1.5 rounded-lg border border-default bg-card-background p-3 text-sm">
      {sceneTags().map((tag) => (
        <li key={tag} className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs">{tag}</span>
          <span className="text-muted-foreground">{COMPRESSION_INFO[tag]?.name}</span>
        </li>
      ))}
    </ul>
  );
}

function SplitPidViews({ state, dispatch }: { state: LinkedSelectionState; dispatch: (action: LinkedSelectionAction) => void }) {
  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <p className="shrink-0 px-4 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Drawing 23-PID-1004, compression</p>
        <div className="flex min-h-0 flex-1 items-center overflow-auto px-3 pb-3">
          <PidDrawing
            links={COMPRESSION_LINKS}
            selectedTag={state.selected.drawing}
            hoverTag={hoverTagOn(state, 'drawing')}
            onSelect={(tag) => dispatch({ type: 'select', side: 'drawing', tag })}
            onHover={(tag) => dispatch({ type: 'hover', side: 'drawing', tag })}
            instruments={SPLITPID_INSTRUMENTS}
            missingTags={SPLITPID_MISSING_IN_MODEL}
          />
        </div>
        <SplitPidModelCheck onSelect={(tag, side) => dispatch({ type: 'select', side, tag })} />
      </div>
    </>
  );
}

function SplitPidScenePane({ state, dispatch, still }: { state: LinkedSelectionState; dispatch: (action: LinkedSelectionAction) => void; still: boolean }) {
  return (
    <div className="relative h-full min-h-0 bg-[radial-gradient(ellipse_at_50%_35%,color-mix(in_oklab,var(--primary-background)_12%,transparent),transparent_70%)]">
      <SceneCanvas label={`3D model of the compression area${state.selected.scene ? `, ${state.selected.scene} selected` : ''}${state.drawingOnly ? ', showing only what is on the drawing' : ''}`} fallback={<SplitPidFallback />} onPointerMissed={() => dispatch({ type: 'clear' })}>
        <StillScene still={still}>
          <SplitScene
            links={COMPRESSION_LINKS}
            selectedTag={state.selected.scene}
            hoverTag={hoverTagOn(state, 'scene')}
            focusTag={state.focusTag}
            drawingOnly={state.drawingOnly}
            onSelect={(tag) => dispatch({ type: 'select', side: 'scene', tag })}
            onHover={(tag) => dispatch({ type: 'hover', side: 'scene', tag })}
          />
        </StillScene>
      </SceneCanvas>
      <p className="pointer-events-none absolute left-4 top-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">3D model</p>
      <div className={`pointer-events-auto absolute bottom-3 left-3 rounded-lg px-3 py-2 ${SPLITPID_GLASS}`}>
        <SceneLegend
          items={[
            { kind: 'selection', label: 'Selected' },
            { kind: 'status', label: 'Ghosted: not on the drawing', tone: 'neutral' },
          ]}
        />
      </div>
    </div>
  );
}

function SplitPidField({ initial = INITIAL_LINKED_SELECTION, initialRatio = 54, still = false }: { initial?: LinkedSelectionState; initialRatio?: number; still?: boolean }) {
  const [state, dispatch] = useReducer(linkedSelectionReducer, initial);
  const [ratio, setRatio] = useState(initialRatio);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && primaryTag(state) !== null) {
      event.preventDefault();
      dispatch({ type: 'clear' });
    }
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerDownCapture={(event) => {
        // Orbit controls swallow the pointer event, so take focus by hand to keep Escape working.
        if (event.target instanceof HTMLCanvasElement) event.currentTarget.focus({ preventScroll: true });
      }}
      className="flex h-[46rem] w-full flex-col overflow-hidden rounded-xl border border-default bg-base-background outline-none"
    >
      <SplitPidSelectionBar state={state} dispatch={dispatch} />
      <LinkedSplit
        startLabel="Drawing"
        endLabel="3D model"
        ratio={ratio}
        onRatioChange={setRatio}
        start={<SplitPidViews state={state} dispatch={dispatch} />}
        end={<SplitPidScenePane state={state} dispatch={dispatch} still={still} />}
      />
    </div>
  );
}

const SPLITPID_SELECTED: LinkedSelectionState = { ...INITIAL_LINKED_SELECTION, selected: { drawing: '23-KA-9102', scene: '23-KA-9102' }, focusTag: '23-KA-9102', origin: 'drawing' };
const SPLITPID_GHOSTED: LinkedSelectionState = { ...INITIAL_LINKED_SELECTION, drawingOnly: true, selected: { drawing: '23-HA-9114', scene: '23-HA-9114' }, focusTag: '23-HA-9114', origin: 'scene' };

function SplitPidFieldBlueprint() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <SplitPidField />
    </ThemeScope>
  );
}

function SplitPidFieldHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <SplitPidField still initial={SPLITPID_SELECTED} initialRatio={44} />
    </ThemeScope>
  );
}

function SplitPidFieldControlRoom() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <SplitPidField still initial={SPLITPID_GHOSTED} initialRatio={56} />
    </ThemeScope>
  );
}

function SplitPidPartDrawing() {
  const [selected, setSelected] = useState<string | null>('23-KA-9101');
  const [hover, setHover] = useState<string | null>(null);

  return (
    <ThemeScope preset="blueprint" className="w-full">
      <div className="flex w-full items-center rounded-xl border border-default bg-base-background p-4">
        <PidDrawing
          links={COMPRESSION_LINKS}
          selectedTag={selected}
          hoverTag={hover}
          onSelect={(tag) => setSelected(tag === selected ? null : tag)}
          onHover={setHover}
          instruments={SPLITPID_INSTRUMENTS}
          missingTags={SPLITPID_MISSING_IN_MODEL}
        />
      </div>
    </ThemeScope>
  );
}

function SplitPidPartScene() {
  const [state, dispatch] = useReducer(linkedSelectionReducer, SPLITPID_SELECTED);

  return (
    <ThemeScope preset="blueprint" className="w-full">
      <div className="h-80 w-full overflow-hidden rounded-xl border border-default bg-base-background">
        <SplitPidScenePane state={state} dispatch={dispatch} still />
      </div>
    </ThemeScope>
  );
}

function SplitPidPartGhost() {
  const [state, dispatch] = useReducer(linkedSelectionReducer, { ...SPLITPID_GHOSTED, focusTag: null, selected: { drawing: null, scene: null } });

  return (
    <ThemeScope preset="blueprint" className="w-full">
      <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
        <Switch label="Show in 3D only what is on this drawing" checked={state.drawingOnly} onCheckedChange={(value) => dispatch({ type: 'setDrawingOnly', value })} />
        <div className="h-72 w-full overflow-hidden rounded-lg border border-default">
          <SplitPidScenePane state={state} dispatch={dispatch} still />
        </div>
      </div>
    </ThemeScope>
  );
}

function SplitPidPartDivider() {
  const [ratio, setRatio] = useState(40);

  return (
    <ThemeScope preset="blueprint" className="w-full">
      <div className="flex h-48 w-full overflow-hidden rounded-xl border border-default bg-base-background">
        <LinkedSplit
          startLabel="Drawing"
          endLabel="3D model"
          ratio={ratio}
          onRatioChange={setRatio}
          start={
            <div className="flex h-full flex-col justify-center gap-1 px-4">
              <span className="text-sm font-medium text-base-foreground">Drawing</span>
              <span className="text-xs tabular-nums text-muted-foreground">{Math.round(ratio)} percent</span>
            </div>
          }
          end={
            <div className="flex h-full flex-col justify-center gap-1 px-4">
              <span className="text-sm font-medium text-base-foreground">3D model</span>
              <span className="text-xs tabular-nums text-muted-foreground">{100 - Math.round(ratio)} percent</span>
              <span className="text-xs text-muted-foreground">Drag the divider, or focus it and use the arrow keys.</span>
            </div>
          }
        />
      </div>
    </ThemeScope>
  );
}

function SplitPidPartSelectionBar() {
  const [state, dispatch] = useReducer(linkedSelectionReducer, SPLITPID_SELECTED);

  return (
    <ThemeScope preset="blueprint" className="w-full">
      <div className="w-full overflow-hidden rounded-xl border border-default bg-base-background">
        <SplitPidSelectionBar state={state} dispatch={dispatch} />
      </div>
    </ThemeScope>
  );
}

function SplitPidPartModelCheck() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <div className="w-full overflow-hidden rounded-xl border border-default bg-base-background">
        <SplitPidModelCheck />
      </div>
    </ThemeScope>
  );
}

function SplitPidPartMapping() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <div className="w-full overflow-x-auto rounded-xl border border-default bg-base-background p-4">
        <table className="w-full text-left text-sm">
          <caption className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Mapping between drawing ids and scene ids</caption>
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th scope="col" className="pb-1 pr-4 font-medium">Tag</th>
              <th scope="col" className="pb-1 pr-4 font-medium">Drawing id</th>
              <th scope="col" className="pb-1 font-medium">Scene id</th>
            </tr>
          </thead>
          <tbody>
            {COMPRESSION_LINKS.map((link) => (
              <tr key={link.tag}>
                <th scope="row" className="py-1 pr-4 font-mono text-xs font-normal text-base-foreground">{link.tag}</th>
                <td className="py-1 pr-4 font-mono text-xs tabular-nums text-medium-foreground">{link.drawingId ?? 'missing'}</td>
                <td className="py-1 font-mono text-xs tabular-nums text-medium-foreground">{link.sceneId ?? 'missing'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ThemeScope>
  );
}

function SplitPidPartClear() {
  const [state, dispatch] = useReducer(linkedSelectionReducer, SPLITPID_SELECTED);
  const tag = primaryTag(state);

  return (
    <ThemeScope preset="blueprint" className="w-full">
      <div className="flex w-full flex-col items-start gap-3 rounded-xl border border-default bg-base-background p-4">
        <p className="text-sm text-base-foreground">
          Selected: <span className="font-mono">{tag ?? 'nothing'}</span>
        </p>
        <p className="text-xs text-muted-foreground">Hover on either side is mirrored to the other while views are synced; selecting the selected tag again clears it.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'select', side: 'scene', tag: '23-HA-9114' })}>
            Select cooler in 3D
          </Button>
          <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'select', side: 'drawing', tag: '23-VA-9120' })}>
            Select scrubber on drawing
          </Button>
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'clear' })}>
            Clear selection
          </Button>
        </div>
      </div>
    </ThemeScope>
  );
}

export default definePage({
  id: 'split-pid-3d',
  title: 'P&ID beside 3D',
  summary:
    'A drawing and a 3D model of the same compression area side by side and linked by tag. Select a symbol and the camera flies to the machine; select a machine and the symbol lights up. A model check lists the valves that exist on only one side.',
  guidance: {
    use: [
      'When engineers cross-check a drawing against a model: a digital twin is only as good as the match between the two.',
      'With one mapping table keyed by functional location tag, so neither side needs the other\'s ids.',
      'With a model check beside the drawing. A mismatch you can see is one you can fix.',
      'With a divider that can be dragged and moved from the keyboard, because the right balance depends on the task.',
    ],
    avoid: [
      'Linking by position or by name. Tags are the key; names drift.',
      'Syncing by default with no way out. Sync and follow are switches so people can compare two places at once.',
      'Hiding items that are on one side only. Flag them and ghost them instead.',
      'Colour as the only sign of a mismatch. The model check says what is missing in words and shape.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Click a symbol on the drawing, or a machine in the 3D view: the other side highlights it and the camera flies there. Hovering mirrors across. Drag the divider, or focus it and use the arrow keys, to give one side more room. Turn off Sync views to compare two items, Follow selection to keep the camera still, and use the filter to ghost what the drawing does not show.',
      specimens: [
        {
          id: 'SplitPidFieldBlueprint',
          title: 'P&ID beside 3D',
          note: 'Pick it for quality work on a digital twin: two views of one asset that must agree, linked by tag.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/fields/LinkedSplit.tsx',
            'three/fields/PidDrawing.tsx',
            'three/fields/SplitScene.tsx',
            'three/fields/tagMapping.ts',
            'three/fields/modelCheck.ts',
            'three/fields/linkedSelection.ts',
            'three/fields/splitRatio.ts',
            'three/fields/compressionArea.ts',
            'industrial/diagrams/EquipmentSymbol.tsx',
            'industrial/diagrams/ValveSymbol.tsx',
            'industrial/diagrams/DiagramHotspot.tsx',
            'three/DrillBreadcrumb.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: SplitPidFieldBlueprint,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same split in a dark teal preset with a machine selected, and in a dense control-room preset with the 3D view ghosting what the drawing does not show.',
      specimens: [
        {
          id: 'SplitPidFieldHologram',
          title: 'Hologram, machine selected',
          note: 'Pick it for a presentation where the drawing and the model are shown to a room.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/fields/LinkedSplit.tsx', 'three/fields/SplitScene.tsx', 'themes/ThemeScope.tsx'],
          Component: SplitPidFieldHologram,
        },
        {
          id: 'SplitPidFieldControlRoom',
          title: 'Control room, drawing only',
          note: 'Pick it for a dense operator workstation: sharp corners, and everything the drawing lacks ghosted in 3D.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/fields/LinkedSplit.tsx', 'three/fields/SplitScene.tsx', 'themes/ThemeScope.tsx'],
          Component: SplitPidFieldControlRoom,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The drawing, the scene, the divider, the shared selection bar, the model check and the mapping table, each on its own.',
      specimens: [
        {
          id: 'SplitPidPartDrawing',
          title: 'P&ID drawing',
          note: 'Pick it for a drawing whose symbols are selectable by tag, with live values on the instrument bubbles.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['three/fields/PidDrawing.tsx', 'industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/InstrumentBubble.tsx', 'industrial/diagrams/ValueTag.tsx'],
          Component: SplitPidPartDrawing,
        },
        {
          id: 'SplitPidPartScene',
          title: 'Linked 3D scene',
          note: 'Pick it for the model side: it reports clicks and hover as tags, and flies to whichever tag is in focus.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/fields/SplitScene.tsx', 'three/fields/compressionArea.ts', 'three/Selectable.tsx'],
          Component: SplitPidPartScene,
        },
        {
          id: 'SplitPidPartGhost',
          title: 'Ghost what is not on the drawing',
          note: 'Pick it to see the difference between the two sources: the turbine and the export valve fade when the filter is on.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/fields/SplitScene.tsx', 'three/fields/tagMapping.ts'],
          Component: SplitPidPartGhost,
        },
        {
          id: 'SplitPidPartDivider',
          title: 'Resizable divider',
          note: 'Pick it for any split view: pointer and keyboard resize, limits, and a spoken result.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/fields/LinkedSplit.tsx', 'three/fields/splitRatio.ts'],
          Component: SplitPidPartDivider,
        },
        {
          id: 'SplitPidPartSelectionBar',
          title: 'Shared selection bar',
          note: 'Pick it to say what is selected, in what state and with which three readings, above both views.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['three/DrillBreadcrumb.tsx', 'three/fields/linkedSelection.ts', 'industrial/ValueReadout.tsx'],
          Component: SplitPidPartSelectionBar,
        },
        {
          id: 'SplitPidPartModelCheck',
          title: 'Model check',
          note: 'Pick it for a quality list: tags that exist on only one side, with the rate of agreement.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/fields/modelCheck.ts', 'industrial/StatusIndicator.tsx'],
          Component: SplitPidPartModelCheck,
        },
        {
          id: 'SplitPidPartMapping',
          title: 'Mapping table',
          note: 'Pick it as the single source of truth between the two id spaces: one row per tag, a gap where a side lacks it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/fields/tagMapping.ts', 'three/fields/compressionArea.ts'],
          Component: SplitPidPartMapping,
        },
        {
          id: 'SplitPidPartClear',
          title: 'Selection from either side',
          note: 'Pick it to see the rules without the views: selecting from either side lands on both, and again clears it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/fields/linkedSelection.ts'],
          Component: SplitPidPartClear,
        },
      ],
    },
  ],
});
