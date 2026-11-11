import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { IconActivity, IconAlertOctagon, IconBuildingFactory2, IconFlame, IconPlayerPause, IconPower, IconTool } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { IsoCylinder } from '../../../library/experiences/spatial/IsoCylinder';
import { IsoPrism } from '../../../library/experiences/spatial/IsoPrism';
import { boxAnchor, cylinderBounds, iso, sortBackToFront, toFractions, toPoints, unionBox } from '../../../library/experiences/spatial/isoProjection';
import type { IsoBox, IsoCylinderSpec, IsoPoint, IsoView } from '../../../library/experiences/spatial/isoProjection';
import type { IsoTone, IsoVariant } from '../../../library/experiences/spatial/isoStyle';
import { Canvas } from '../../../library/kit/Canvas';
import { IconChip } from '../../../library/kit/IconChip';
import { Panel } from '../../../library/kit/Panel';
import { ToggleChip } from '../../../library/kit/scene/ToggleChip';
import { SparkLine } from '../../../library/kit/SparkLine';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber, type StatusTone, type Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import type { RunState } from '../../data/plant';
import { HOUR, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './isometric-plant.tsx?raw';

type IsoPlantLayer = 'equipment' | 'piping' | 'status' | 'heat';
type IsoPlantDeck = 'ground' | 'deck';
type IsoPlantService = 'gas' | 'liquid' | 'water';

type IsoPlantShape = { kind: 'prism' } | { kind: 'cylinder'; spec: IsoCylinderSpec; level?: number; contentTone?: IsoTone };

/** One drawable solid. It carries its own bounding box so the whole scene can be depth sorted. */
type IsoPlantItem = IsoBox & {
  id: string;
  role: 'unit' | 'pipe' | 'structure';
  deck: IsoPlantDeck;
  shape: IsoPlantShape;
  unitId?: string;
  service?: IsoPlantService;
};

type IsoPlantReading = { label: string; value: number; unit: string; decimals: number };

type IsoPlantUnit = { id: string; tag: string; name: string; area: string; deck: IsoPlantDeck; state: RunState; readings: readonly IsoPlantReading[] };

type IsoPlantArea = { id: string; code: string; name: string; x: number; y: number; w: number; d: number; temperature: number };

const ISO_PLANT_VIEW: IsoView = { scale: 24, originX: 320, originY: 78 };
const ISO_PLANT_WIDTH = 810;
const ISO_PLANT_HEIGHT = 540;

const ISO_PLANT_AREAS: readonly IsoPlantArea[] = [
  { id: 'a20', code: 'NK-20', name: 'Inlet and separation', x: 1, y: 1, w: 7.3, d: 5.1, temperature: 34 },
  { id: 'a23', code: 'NK-23', name: 'Gas compression', x: 8.9, y: 1, w: 9, d: 5.1, temperature: 58 },
  { id: 'a29', code: 'NK-29', name: 'Flare', x: 18.5, y: 1, w: 3.2, d: 5.1, temperature: 47 },
  { id: 'a21', code: 'NK-21', name: 'Storage', x: 1, y: 8, w: 7.3, d: 5.6, temperature: 19 },
  { id: 'a27', code: 'NK-27', name: 'Gas export', x: 8.9, y: 8, w: 6.6, d: 5.6, temperature: 28 },
  { id: 'a40', code: 'NK-40', name: 'Cooling water', x: 16.1, y: 8, w: 5.6, d: 5.6, temperature: 22 },
];

const ISO_PLANT_UNITS: readonly IsoPlantUnit[] = [
  { id: 'va1001', tag: '20-VA-1001', name: 'Inlet separator', area: 'NK-20', deck: 'ground', state: 'running', readings: [{ label: 'Level', value: 54.3, unit: '%', decimals: 1 }, { label: 'Pressure', value: 13.1, unit: 'barg', decimals: 1 }, { label: 'Temperature', value: 62, unit: '°C', decimals: 0 }] },
  { id: 'va1002', tag: '20-VA-1002', name: 'Test separator', area: 'NK-20', deck: 'ground', state: 'standby', readings: [{ label: 'Level', value: 12, unit: '%', decimals: 0 }, { label: 'Pressure', value: 0.4, unit: 'barg', decimals: 1 }, { label: 'Temperature', value: 18, unit: '°C', decimals: 0 }] },
  { id: 'xv1105', tag: '20-XV-1105', name: 'Inlet shutdown valve', area: 'NK-20', deck: 'ground', state: 'running', readings: [{ label: 'Position', value: 100, unit: '% open', decimals: 0 }, { label: 'Upstream pressure', value: 13.4, unit: 'barg', decimals: 1 }, { label: 'Last stroke test', value: 2, unit: 'd ago', decimals: 0 }] },
  { id: 'ka9101', tag: '23-KA-9101', name: '1st stage compressor', area: 'NK-23', deck: 'ground', state: 'running', readings: [{ label: 'Discharge pressure', value: 48.6, unit: 'barg', decimals: 1 }, { label: 'Discharge temperature', value: 146.3, unit: '°C', decimals: 1 }, { label: 'Vibration', value: 6.8, unit: 'mm/s', decimals: 1 }] },
  { id: 'ka9102', tag: '23-KA-9102', name: '2nd stage compressor', area: 'NK-23', deck: 'ground', state: 'running', readings: [{ label: 'Discharge pressure', value: 96.2, unit: 'barg', decimals: 1 }, { label: 'Discharge temperature', value: 128.4, unit: '°C', decimals: 1 }, { label: 'Vibration', value: 3.9, unit: 'mm/s', decimals: 1 }] },
  { id: 'ka9103', tag: '23-KA-9103', name: 'Recompressor', area: 'NK-23', deck: 'ground', state: 'tripped', readings: [{ label: 'Shaft speed', value: 0, unit: 'rpm', decimals: 0 }, { label: 'Vibration at trip', value: 11.6, unit: 'mm/s', decimals: 1 }, { label: 'Casing temperature', value: 74, unit: '°C', decimals: 0 }] },
  { id: 'gt9001', tag: '23-GT-9001', name: 'Compressor gas turbine', area: 'NK-23', deck: 'ground', state: 'running', readings: [{ label: 'Power', value: 21.4, unit: 'MW', decimals: 1 }, { label: 'Exhaust temperature', value: 512, unit: '°C', decimals: 0 }, { label: 'Fuel gas', value: 6.2, unit: 'kSm³/h', decimals: 1 }] },
  { id: 'ha9114', tag: '23-HA-9114', name: 'Interstage cooler', area: 'NK-23', deck: 'deck', state: 'running', readings: [{ label: 'Outlet temperature', value: 38.9, unit: '°C', decimals: 1 }, { label: 'Fan speed', value: 86, unit: '%', decimals: 0 }, { label: 'Duty', value: 4.8, unit: 'MW', decimals: 1 }] },
  { id: 'ha9115', tag: '23-HA-9115', name: 'Aftercooler', area: 'NK-23', deck: 'deck', state: 'running', readings: [{ label: 'Outlet temperature', value: 34.2, unit: '°C', decimals: 1 }, { label: 'Fan speed', value: 72, unit: '%', decimals: 0 }, { label: 'Duty', value: 3.9, unit: 'MW', decimals: 1 }] },
  { id: 'fa0001', tag: '29-FA-0001', name: 'Flare stack', area: 'NK-29', deck: 'ground', state: 'running', readings: [{ label: 'Flare rate', value: 12.4, unit: 'kSm³/d', decimals: 1 }, { label: 'Pilot temperature', value: 642, unit: '°C', decimals: 0 }, { label: 'Purge flow', value: 38, unit: 'Sm³/h', decimals: 0 }] },
  { id: 'vd0002', tag: '29-VD-0002', name: 'Flare knock-out drum', area: 'NK-29', deck: 'ground', state: 'running', readings: [{ label: 'Level', value: 18, unit: '%', decimals: 0 }, { label: 'Pressure', value: 0.3, unit: 'barg', decimals: 1 }, { label: 'Temperature', value: 24, unit: '°C', decimals: 0 }] },
  { id: 'ta3001', tag: '21-TA-3001', name: 'Condensate tank A', area: 'NK-21', deck: 'ground', state: 'running', readings: [{ label: 'Level', value: 68, unit: '%', decimals: 0 }, { label: 'Volume', value: 2040, unit: 'm³', decimals: 0 }, { label: 'Temperature', value: 21, unit: '°C', decimals: 0 }] },
  { id: 'ta3002', tag: '21-TA-3002', name: 'Condensate tank B', area: 'NK-21', deck: 'ground', state: 'standby', readings: [{ label: 'Level', value: 34, unit: '%', decimals: 0 }, { label: 'Volume', value: 1020, unit: 'm³', decimals: 0 }, { label: 'Temperature', value: 19, unit: '°C', decimals: 0 }] },
  { id: 'ta5001', tag: '44-TA-5001', name: 'Produced water tank', area: 'NK-21', deck: 'ground', state: 'running', readings: [{ label: 'Level', value: 81, unit: '%', decimals: 0 }, { label: 'Volume', value: 960, unit: 'm³', decimals: 0 }, { label: 'Oil in water', value: 14, unit: 'mg/l', decimals: 0 }] },
  { id: 'pa2001a', tag: '27-PA-2001A', name: 'Export pump A', area: 'NK-27', deck: 'ground', state: 'running', readings: [{ label: 'Flow', value: 412, unit: 'm³/h', decimals: 0 }, { label: 'Motor current', value: 86.2, unit: 'A', decimals: 1 }, { label: 'Discharge pressure', value: 131.4, unit: 'barg', decimals: 1 }] },
  { id: 'pa2001b', tag: '27-PA-2001B', name: 'Export pump B', area: 'NK-27', deck: 'ground', state: 'standby', readings: [{ label: 'Flow', value: 0, unit: 'm³/h', decimals: 0 }, { label: 'Motor current', value: 0, unit: 'A', decimals: 1 }, { label: 'Days since start test', value: 34, unit: 'd', decimals: 0 }] },
  { id: 'fq2010', tag: '27-FQ-2010', name: 'Export metering skid', area: 'NK-27', deck: 'ground', state: 'running', readings: [{ label: 'Gas export', value: 4.38, unit: 'MSm³/d', decimals: 2 }, { label: 'Line pressure', value: 131.2, unit: 'barg', decimals: 1 }, { label: 'Line temperature', value: 31, unit: '°C', decimals: 0 }] },
  { id: 'pa4001', tag: '40-PA-4001', name: 'Cooling water pump', area: 'NK-40', deck: 'ground', state: 'maintenance', readings: [{ label: 'Flow', value: 0, unit: 'm³/h', decimals: 0 }, { label: 'Work order progress', value: 35, unit: '%', decimals: 0 }, { label: 'Hours isolated', value: 9, unit: 'h', decimals: 0 }] },
  { id: 'ha4002', tag: '40-HA-4002', name: 'Seawater cooler', area: 'NK-40', deck: 'ground', state: 'running', readings: [{ label: 'Supply temperature', value: 18.4, unit: '°C', decimals: 1 }, { label: 'Return temperature', value: 29.6, unit: '°C', decimals: 1 }, { label: 'Flow', value: 1240, unit: 'm³/h', decimals: 0 }] },
];

function isoPlantPrism(id: string, box: IsoBox, extra: Partial<Pick<IsoPlantItem, 'role' | 'deck' | 'unitId' | 'service'>> = {}): IsoPlantItem {
  return { ...box, id, role: extra.unitId ? 'unit' : 'structure', deck: 'ground', shape: { kind: 'prism' }, ...extra };
}

function isoPlantCylinder(
  id: string,
  spec: IsoCylinderSpec,
  unitId: string,
  extra: { deck?: IsoPlantDeck; level?: number; contentTone?: IsoTone } = {}
): IsoPlantItem {
  return {
    ...cylinderBounds(spec),
    id,
    role: 'unit',
    deck: extra.deck ?? 'ground',
    unitId,
    shape: { kind: 'cylinder', spec, level: extra.level, contentTone: extra.contentTone },
  };
}

function isoPlantBox(x: number, y: number, z: number, w: number, d: number, h: number): IsoBox {
  return { x, y, z, w, d, h };
}

/** A horizontal vessel along x on two saddles. */
function isoPlantVessel(unitId: string, x: number, y: number, length: number, radius: number): IsoPlantItem[] {
  const z = radius + 0.4;
  return [
    isoPlantPrism(`${unitId}-saddle-1`, isoPlantBox(x + length * 0.2, y - radius * 0.7, 0, 0.35, radius * 1.4, 0.4), { unitId }),
    isoPlantPrism(`${unitId}-saddle-2`, isoPlantBox(x + length * 0.72, y - radius * 0.7, 0, 0.35, radius * 1.4, 0.4), { unitId }),
    isoPlantCylinder(`${unitId}-shell`, { x, y, z, radius, length, axis: 'x' }, unitId),
  ];
}

/** A skid with a motor and a pump casing. */
function isoPlantPump(unitId: string, x: number, y: number): IsoPlantItem[] {
  return [
    isoPlantPrism(`${unitId}-skid`, isoPlantBox(x, y, 0, 2.5, 1, 0.25), { unitId }),
    isoPlantCylinder(`${unitId}-motor`, { x: x + 0.2, y: y + 0.5, z: 0.65, radius: 0.38, length: 1.05, axis: 'x' }, unitId),
    isoPlantPrism(`${unitId}-casing`, isoPlantBox(x + 1.4, y + 0.12, 0.25, 0.8, 0.76, 0.85), { unitId }),
  ];
}

/** A fin-fan cooler on the upper deck: a bundle with two fan rings on top. */
function isoPlantCooler(unitId: string, x: number): IsoPlantItem[] {
  return [
    isoPlantPrism(`${unitId}-bundle`, isoPlantBox(x, 1.5, 2.6, 3.2, 2.4, 0.7), { unitId, deck: 'deck' }),
    isoPlantCylinder(`${unitId}-fan-1`, { x: x + 0.85, y: 2.7, z: 3.3, radius: 0.55, length: 0.12 }, unitId, { deck: 'deck' }),
    isoPlantCylinder(`${unitId}-fan-2`, { x: x + 2.35, y: 2.7, z: 3.3, radius: 0.55, length: 0.12 }, unitId, { deck: 'deck' }),
  ];
}

/** A branch at pipe height that runs along y between the edge of the rack and a unit, then drops to the ground. */
function isoPlantBranch(id: string, service: IsoPlantService, x: number, unitY: number): IsoPlantItem[] {
  const back = unitY < ISO_PLANT_RACK.back;
  const from = back ? unitY : ISO_PLANT_RACK.front;
  const to = back ? ISO_PLANT_RACK.back : unitY;
  return [
    isoPlantPrism(`${id}-run`, isoPlantBox(x, from, ISO_PLANT_RACK.z, 0.16, to - from, 0.16), { role: 'pipe', service }),
    isoPlantPrism(`${id}-drop`, isoPlantBox(x, back ? unitY - 0.16 : unitY, 0, 0.16, 0.16, ISO_PLANT_RACK.z), { role: 'pipe', service }),
  ];
}

/** One header on the rack, cut at the frames so no single solid spans the whole plant. */
function isoPlantHeader(service: IsoPlantService, y: number): IsoPlantItem[] {
  const stops = [1.2, ...ISO_PLANT_RACK_FRAMES.slice(1), 20.8];
  return stops.slice(0, -1).map((x, index) =>
    isoPlantPrism(`header-${service}-${index}`, isoPlantBox(x, y, ISO_PLANT_RACK.z, stops[index + 1] - x, 0.16, 0.16), { role: 'pipe', service })
  );
}

const ISO_PLANT_RACK = { back: 6.68, front: 7.38, z: 1.5 };
const ISO_PLANT_RACK_FRAMES = [1.4, 5.1, 8.5, 12, 15.4, 19];
const ISO_PLANT_DECK_POSTS: readonly [number, number][] = [[9.3, 1.1], [17.1, 1.1], [9.3, 4.1], [17.1, 4.1]];

const ISO_PLANT_ITEMS: readonly IsoPlantItem[] = [
  ...isoPlantVessel('va1001', 1.8, 2.6, 4.4, 0.8),
  ...isoPlantVessel('va1002', 2.4, 4.9, 3.2, 0.6),
  isoPlantPrism('xv1105-body', isoPlantBox(6.95, 4.5, 0, 0.6, 0.6, 0.8), { unitId: 'xv1105' }),
  isoPlantCylinder('xv1105-actuator', { x: 7.25, y: 4.8, z: 0.8, radius: 0.24, length: 0.55 }, 'xv1105'),
  isoPlantPrism('ka9101-house', isoPlantBox(9.6, 1.4, 0, 2.2, 2.6, 2), { unitId: 'ka9101' }),
  isoPlantPrism('ka9102-house', isoPlantBox(12.2, 1.4, 0, 2.2, 2.6, 2), { unitId: 'ka9102' }),
  isoPlantPrism('ka9103-house', isoPlantBox(14.8, 1.4, 0, 2.2, 2.6, 2), { unitId: 'ka9103' }),
  isoPlantPrism('gt9001-enclosure', isoPlantBox(9.6, 4.5, 0, 2.8, 1.2, 1.3), { unitId: 'gt9001' }),
  isoPlantCylinder('gt9001-stack', { x: 12.9, y: 5.1, z: 0, radius: 0.3, length: 3.4 }, 'gt9001'),
  ...ISO_PLANT_DECK_POSTS.map(([x, y], index) => isoPlantPrism(`deck-post-${index}`, isoPlantBox(x, y, 0, 0.2, 0.2, 2.4), { deck: 'deck' })),
  isoPlantPrism('deck-slab', isoPlantBox(9.3, 1.1, 2.4, 8, 3.2, 0.2), { deck: 'deck' }),
  ...isoPlantCooler('ha9114', 9.8),
  ...isoPlantCooler('ha9115', 13.6),
  isoPlantPrism('fa0001-base', isoPlantBox(19.9, 1.9, 0, 1.2, 1.2, 0.5), { unitId: 'fa0001' }),
  isoPlantCylinder('fa0001-stack', { x: 20.5, y: 2.5, z: 0.5, radius: 0.2, length: 7.2 }, 'fa0001'),
  isoPlantCylinder('fa0001-tip', { x: 20.5, y: 2.5, z: 7.7, radius: 0.38, length: 0.45 }, 'fa0001'),
  isoPlantPrism('vd0002-saddle', isoPlantBox(20.05, 4.6, 0, 0.9, 0.4, 0.3), { unitId: 'vd0002' }),
  isoPlantCylinder('vd0002-shell', { x: 20.5, y: 4, z: 0.8, radius: 0.5, length: 1.6, axis: 'y' }, 'vd0002'),
  isoPlantCylinder('ta3001-shell', { x: 2.6, y: 9.8, z: 0, radius: 1.3, length: 2.6 }, 'ta3001', { level: 0.68, contentTone: 'liquid' }),
  isoPlantCylinder('ta3002-shell', { x: 5.8, y: 9.8, z: 0, radius: 1.3, length: 2.6 }, 'ta3002', { level: 0.34, contentTone: 'liquid' }),
  isoPlantCylinder('ta5001-shell', { x: 4.2, y: 12.3, z: 0, radius: 1, length: 2 }, 'ta5001', { level: 0.81, contentTone: 'water' }),
  ...isoPlantPump('pa2001a', 9.6, 8.6),
  ...isoPlantPump('pa2001b', 9.6, 10.8),
  isoPlantPrism('fq2010-skid', isoPlantBox(12.8, 8.8, 0, 1.9, 2.6, 0.7), { unitId: 'fq2010' }),
  isoPlantCylinder('fq2010-run', { x: 13.2, y: 9, z: 1, radius: 0.22, length: 2.2, axis: 'y' }, 'fq2010'),
  ...isoPlantPump('pa4001', 16.8, 8.6),
  isoPlantPrism('ha4002-shell', isoPlantBox(16.8, 10.8, 0, 3.6, 1.8, 1.1), { unitId: 'ha4002' }),
  ...ISO_PLANT_RACK_FRAMES.map((x) => isoPlantPrism(`rack-frame-${x}`, isoPlantBox(x, 6.6, 0, 0.14, 0.86, 1.5))),
  ...isoPlantHeader('gas', 6.68),
  ...isoPlantHeader('liquid', 6.95),
  ...isoPlantHeader('water', 7.22),
  ...isoPlantBranch('gas-inlet', 'gas', 6.5, 3),
  ...isoPlantBranch('liquid-inlet', 'liquid', 1.4, 3.6),
  ...isoPlantBranch('gas-stage-1', 'gas', 10.7, 4.5),
  ...isoPlantBranch('gas-stage-2', 'gas', 13.7, 4.5),
  ...isoPlantBranch('gas-recompressor', 'gas', 16.2, 4.5),
  ...isoPlantBranch('gas-flare', 'gas', 19.6, 3.4),
  ...isoPlantBranch('liquid-tank', 'liquid', 2.6, 8.3),
  ...isoPlantBranch('liquid-export', 'liquid', 10.4, 8.4),
  ...isoPlantBranch('gas-export', 'gas', 14.1, 8.6),
  ...isoPlantBranch('water-cooling', 'water', 18, 8.4),
];

const ISO_PLANT_DRAW_ORDER = sortBackToFront(ISO_PLANT_ITEMS);

type IsoPlantStateMeta = { label: string; tone: StatusTone; iso: IsoTone; icon: ReactNode; note: string };

const ISO_PLANT_STATES: Record<RunState, IsoPlantStateMeta> = {
  running: { label: 'Running', tone: 'success', iso: 'success', icon: <IconActivity />, note: 'Running steadily, every reading inside its limits.' },
  standby: { label: 'Standby', tone: 'info', iso: 'info', icon: <IconPlayerPause />, note: 'Ready to start. Held on standby for its duty partner.' },
  stopped: { label: 'Stopped', tone: 'neutral', iso: 'neutral', icon: <IconPower />, note: 'Stopped by the operator.' },
  tripped: { label: 'Tripped', tone: 'critical', iso: 'critical', icon: <IconAlertOctagon />, note: 'Tripped on high vibration 14 minutes ago. Inspection is under way.' },
  maintenance: { label: 'Maintenance', tone: 'warning', iso: 'warning', icon: <IconTool />, note: 'Isolated for planned work. Due back in service on Friday.' },
};

const ISO_PLANT_STATE_ORDER: readonly RunState[] = ['tripped', 'maintenance', 'standby', 'running'];

/** Each area keeps one decorative family across the drawing, its label and its tile. */
const ISO_PLANT_AREA_TONE: Record<string, Tone> = { 'NK-20': 'blue', 'NK-23': 'purple', 'NK-29': 'amber', 'NK-21': 'teal', 'NK-27': 'green', 'NK-40': 'sky' };

/** Where each area's name sits: a point in the drawing clear of the equipment, and which way the label hangs. */
const ISO_PLANT_AREA_LABEL: Record<string, { at: readonly [number, number, number]; hang: 'above' | 'aboveLeft' | 'below' | 'right' }> = {
  'NK-20': { at: [1, 1, 0.9], hang: 'aboveLeft' },
  'NK-23': { at: [8.9, 1, 5.3], hang: 'above' },
  'NK-29': { at: [20, 1, 0.9], hang: 'right' },
  'NK-21': { at: [8.3, 13.75, 0], hang: 'below' },
  'NK-27': { at: [15.5, 13.75, 0], hang: 'below' },
  'NK-40': { at: [21.7, 13.75, 0], hang: 'below' },
};

const ISO_PLANT_HANG = { above: '-translate-x-1/2 -translate-y-full', aboveLeft: '-translate-x-[88%] -translate-y-full', below: '-translate-x-1/2 translate-y-1', right: '-translate-y-1/2' };

const ISO_PLANT_HEAT_FILL = ['fill-heat-map-mild', 'fill-heat-map-moderate', 'fill-heat-map-strong', 'fill-heat-map-intense'];
const ISO_PLANT_HEAT_SWATCH = ['bg-heat-map-mild', 'bg-heat-map-moderate', 'bg-heat-map-strong', 'bg-heat-map-intense'];

const ISO_PLANT_SERVICES: readonly { id: IsoPlantService; label: string; swatch: string }[] = [
  { id: 'gas', label: 'Gas', swatch: 'bg-chart-1-450' },
  { id: 'liquid', label: 'Condensate', swatch: 'bg-chart-2-450' },
  { id: 'water', label: 'Cooling water', swatch: 'bg-chart-3-450' },
];

const ISO_PLANT_LAYERS: readonly { value: IsoPlantLayer; label: string }[] = [
  { value: 'status', label: 'Status' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'piping', label: 'Piping' },
  { value: 'heat', label: 'Heat' },
];

const ISO_PLANT_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring-default)]';

function isoPlantHeatLevel(temperature: number): number {
  if (temperature < 25) return 0;
  if (temperature < 40) return 1;
  return temperature < 50 ? 2 : 3;
}

function isoPlantUnitAnchor(unitId: string): IsoPoint {
  return boxAnchor(unionBox(ISO_PLANT_ITEMS.filter((item) => item.unitId === unitId)), ISO_PLANT_VIEW);
}

function isoPlantUnit(id: string | null): IsoPlantUnit | undefined {
  return ISO_PLANT_UNITS.find((unit) => unit.id === id);
}

function isoPlantArea(code: string): IsoPlantArea | undefined {
  return ISO_PLANT_AREAS.find((area) => area.code === code);
}

function isoPlantCount(state: RunState): number {
  return ISO_PLANT_UNITS.filter((unit) => unit.state === state).length;
}

/** The unit an area tile opens: the one in the worst state. */
function isoPlantWorstUnit(areaCode: string): IsoPlantUnit | undefined {
  const units = ISO_PLANT_UNITS.filter((unit) => unit.area === areaCode);
  return ISO_PLANT_STATE_ORDER.flatMap((state) => units.filter((unit) => unit.state === state))[0];
}

function isoPlantLook(item: IsoPlantItem, layer: IsoPlantLayer, deck: IsoPlantDeck, state: RunState | undefined): { tone: IsoTone; variant: IsoVariant } {
  if (item.deck !== deck) return { tone: 'neutral', variant: 'ghost' };
  if (item.role === 'pipe') {
    if (layer === 'piping') return { tone: item.service ?? 'neutral', variant: 'solid' };
    return { tone: 'neutral', variant: layer === 'heat' ? 'ghost' : 'solid' };
  }
  if (item.role === 'structure') return { tone: 'neutral', variant: layer === 'equipment' || layer === 'status' ? 'solid' : 'ghost' };
  if (layer === 'status') return { tone: state ? ISO_PLANT_STATES[state].iso : 'neutral', variant: 'solid' };
  return { tone: 'accent', variant: layer === 'equipment' ? 'solid' : 'ghost' };
}

function IsoPlantSolid({ item, tone, variant, outlined }: { item: IsoPlantItem; tone: IsoTone; variant: IsoVariant; outlined: boolean }) {
  if (item.shape.kind === 'cylinder') {
    return <IsoCylinder {...item.shape.spec} view={ISO_PLANT_VIEW} tone={tone} variant={variant} outlined={outlined} level={item.shape.level} contentTone={item.shape.contentTone} />;
  }
  return <IsoPrism box={item} view={ISO_PLANT_VIEW} tone={tone} variant={variant} outlined={outlined} />;
}

function isoPlantCorner(x: number, y: number): IsoPoint {
  return iso(x, y, 0, ISO_PLANT_VIEW);
}

/** The plot: a faint survey grid and one tinted plot per area. In the heat layer the plots carry the temperature. */
function IsoPlantGround({ layer }: { layer: IsoPlantLayer }) {
  const lines = [
    ...Array.from({ length: 12 }, (_, index) => [isoPlantCorner(index * 2, 0), isoPlantCorner(index * 2, 14)]),
    ...Array.from({ length: 8 }, (_, index) => [isoPlantCorner(0, index * 2), isoPlantCorner(22, index * 2)]),
  ];

  return (
    <g data-slot="iso-plant-ground">
      {lines.map(([from, to]) => (
        <line key={`${from.x}-${from.y}-${to.x}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} strokeWidth={1} className="stroke-[color-mix(in_oklab,var(--kit-text)_7%,transparent)]" />
      ))}
      {ISO_PLANT_AREAS.map((area) => (
        <polygon
          key={area.id}
          data-area={area.code}
          data-tone={ISO_PLANT_AREA_TONE[area.code]}
          points={toPoints([isoPlantCorner(area.x, area.y), isoPlantCorner(area.x + area.w, area.y), isoPlantCorner(area.x + area.w, area.y + area.d), isoPlantCorner(area.x, area.y + area.d)])}
          strokeWidth={1.5}
          strokeLinejoin="round"
          className={
            layer === 'heat'
              ? `${ISO_PLANT_HEAT_FILL[isoPlantHeatLevel(area.temperature)]} stroke-[color:var(--card-background)]`
              : 'fill-[color-mix(in_oklab,var(--t-line)_13%,transparent)] stroke-[color-mix(in_oklab,var(--t-line)_42%,transparent)]'
          }
        />
      ))}
    </g>
  );
}

type IsoPlantBoardProps = {
  layer: IsoPlantLayer;
  deck: IsoPlantDeck;
  selectedId: string | null;
  onSelect: (unitId: string) => void;
  /** Area names on the plot. Leave them off when the drawing is small. */
  areaLabels?: boolean;
};

/** The isometric illustration: every unit can be hovered, focused and selected. */
function IsoPlantBoard({ layer, deck, selectedId, onSelect, areaLabels = true }: IsoPlantBoardProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selected = isoPlantUnit(selectedId);
  const hovered = isoPlantUnit(hoveredId);
  const fraction = (point: IsoPoint) => {
    const at = toFractions(point, ISO_PLANT_WIDTH, ISO_PLANT_HEIGHT);
    return { left: `${at.x * 100}%`, top: `${at.y * 100}%` };
  };

  return (
    <div data-slot="iso-plant-board" className="relative aspect-[3/2] w-full">
      <svg
        role="img"
        aria-label={`Isometric drawing of the Nordkapp gas plant, ${layer} layer, ${deck === 'deck' ? 'upper deck' : 'ground level'}${selected ? `, ${selected.name} selected` : ''}`}
        viewBox={`0 0 ${ISO_PLANT_WIDTH} ${ISO_PLANT_HEIGHT}`}
        className="absolute inset-0 h-full w-full"
      >
        <IsoPlantGround layer={layer} />
        {ISO_PLANT_DRAW_ORDER.map((item) => {
          const unit = isoPlantUnit(item.unitId ?? null);
          const look = isoPlantLook(item, layer, deck, unit?.state);
          if (!unit || unit.deck !== deck) {
            return (
              <g key={item.id} className="pointer-events-none">
                <IsoPlantSolid item={item} {...look} outlined={unit !== undefined && unit.id === selectedId} />
              </g>
            );
          }
          return (
            <g
              key={item.id}
              data-unit={unit.id}
              onClick={() => onSelect(unit.id)}
              onPointerEnter={() => setHoveredId(unit.id)}
              onPointerLeave={() => setHoveredId((current) => (current === unit.id ? null : current))}
              style={{ transform: unit.id === hoveredId ? 'translateY(-5px)' : undefined }}
              className="cursor-pointer transition-transform duration-200 motion-reduce:transition-none"
            >
              <IsoPlantSolid item={item} {...look} outlined={unit.id === selectedId || unit.id === hoveredId} />
            </g>
          );
        })}
      </svg>

      {areaLabels
        ? ISO_PLANT_AREAS.map((area) => {
            const label = ISO_PLANT_AREA_LABEL[area.code];
            return (
              <span
                key={area.id}
                data-tone={ISO_PLANT_AREA_TONE[area.code]}
                style={fraction(iso(label.at[0], label.at[1], label.at[2], ISO_PLANT_VIEW))}
                className={`pointer-events-none absolute whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${ISO_PLANT_HANG[label.hang]} ${
                  layer === 'heat' ? 'bg-[var(--card-background)] text-[color:var(--kit-text)] shadow-[0_1px_2px_var(--effect-shadow-md)]' : 'bg-[var(--t-soft)] text-[color:var(--t-on-soft)]'
                }`}
              >
                {area.name}
                {layer === 'heat' ? <span className="tabular-nums"> · {area.temperature} °C</span> : null}
              </span>
            );
          })
        : null}

      {ISO_PLANT_UNITS.filter((unit) => unit.deck === deck).map((unit) => (
        <button
          key={unit.id}
          type="button"
          aria-label={`${unit.name}, ${ISO_PLANT_STATES[unit.state].label.toLowerCase()}`}
          aria-pressed={unit.id === selectedId}
          onClick={() => onSelect(unit.id)}
          onFocus={() => setHoveredId(unit.id)}
          onBlur={() => setHoveredId((current) => (current === unit.id ? null : current))}
          style={fraction(isoPlantUnitAnchor(unit.id))}
          className={`pointer-events-none absolute size-6 -translate-x-1/2 translate-y-1 rounded-full focus-visible:pointer-events-auto ${ISO_PLANT_FOCUS}`}
        />
      ))}

      {hovered && hovered.id !== selectedId ? (
        <span
          data-slot="iso-plant-hover"
          style={fraction(isoPlantUnitAnchor(hovered.id))}
          className="pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-[calc(100%+0.5rem)] items-center gap-2 whitespace-nowrap rounded-full bg-[var(--card-background)] py-1.5 pl-3 pr-1.5 text-sm font-medium text-[color:var(--kit-text)] shadow-[0_8px_20px_-8px_var(--effect-shadow-xl),0_0_0_1px_var(--kit-rule)]"
        >
          {hovered.name}
          <StatusPill tone={ISO_PLANT_STATES[hovered.state].tone}>{ISO_PLANT_STATES[hovered.state].label}</StatusPill>
        </span>
      ) : null}
      {selected && selected.deck === deck ? (
        <span
          data-slot="iso-plant-selected"
          style={fraction(isoPlantUnitAnchor(selected.id))}
          className="pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-[calc(100%+0.5rem)] flex-col items-center"
        >
          <span className="whitespace-nowrap rounded-full bg-[var(--primary-background)] px-3 py-1.5 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-[0_8px_20px_-8px_var(--effect-shadow-xl)]">{selected.name}</span>
          <span aria-hidden="true" className="h-2 w-0.5 bg-[var(--primary-background)]" />
        </span>
      ) : null}
    </div>
  );
}

function IsoPlantLegend({ layer }: { layer: IsoPlantLayer }) {
  const item = 'inline-flex items-center gap-2 whitespace-nowrap text-sm text-[color:var(--kit-text-2)]';
  if (layer === 'heat') {
    return (
      <ul aria-label="Area temperature legend" className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {['Below 25 °C', '25 to 40 °C', '40 to 50 °C', 'Above 50 °C'].map((label, index) => (
          <li key={label} className={item}>
            <span aria-hidden="true" className={`size-3.5 rounded-md ${ISO_PLANT_HEAT_SWATCH[index]}`} />
            {label}
          </li>
        ))}
      </ul>
    );
  }
  if (layer === 'piping') {
    return (
      <ul aria-label="Service legend" className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {ISO_PLANT_SERVICES.map((service) => (
          <li key={service.id} className={item}>
            <span aria-hidden="true" className={`h-1.5 w-6 rounded-full ${service.swatch}`} />
            {service.label}
          </li>
        ))}
      </ul>
    );
  }
  if (layer === 'status') {
    return (
      <ul aria-label="State legend" className="flex flex-wrap items-center gap-2">
        {ISO_PLANT_STATE_ORDER.map((state) => (
          <li key={state}>
            <StatusPill tone={ISO_PLANT_STATES[state].tone} icon={ISO_PLANT_STATES[state].icon}>
              {ISO_PLANT_STATES[state].label} {isoPlantCount(state)}
            </StatusPill>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="text-sm text-[color:var(--kit-text-2)]">Process equipment in colour, structure and piping in grey. Tanks show their level.</p>;
}

function isoPlantIsLayer(value: unknown): value is IsoPlantLayer {
  return ISO_PLANT_LAYERS.some((layer) => layer.value === value);
}

function IsoPlantLayerPills({ value, onChange }: { value: IsoPlantLayer; onChange: (layer: IsoPlantLayer) => void }) {
  return (
    <SegmentedControl
      value={value}
      onValueChange={(next) => {
        if (isoPlantIsLayer(next)) onChange(next);
      }}
    >
      <SegmentedControlList aria-label="Layer">
        {ISO_PLANT_LAYERS.map((layer) => (
          <SegmentedControlButton key={layer.value} value={layer.value}>
            {layer.label}
          </SegmentedControlButton>
        ))}
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function IsoPlantDeckChips({ value, onChange }: { value: IsoPlantDeck; onChange: (deck: IsoPlantDeck) => void }) {
  return (
    <div role="group" aria-label="Level" className="flex items-center gap-2">
      <ToggleChip pressed={value === 'ground'} onPressedChange={() => onChange('ground')}>
        Ground
      </ToggleChip>
      <ToggleChip pressed={value === 'deck'} onPressedChange={() => onChange('deck')}>
        Upper deck
      </ToggleChip>
    </div>
  );
}

function isoPlantReading(reading: IsoPlantReading): string {
  return formatNumber(reading.value, reading.decimals);
}

/** Last 24 hours of a unit's lead reading. A unit that is down ran steadily, then fell to zero. */
function isoPlantHistory(unit: IsoPlantUnit): number[] {
  const lead = unit.readings[0];
  const seed = ISO_PLANT_UNITS.findIndex((candidate) => candidate.id === unit.id) + 31;
  if (lead.value === 0) return [...makeValues({ seed, points: 21, base: 100, amplitude: 3, noise: 1.5, cycles: 2, stepMs: HOUR, decimals: 1 }), 62, 8, 0];
  const raw = makeValues({ seed, points: 24, base: lead.value, amplitude: Math.abs(lead.value) * 0.05, noise: Math.abs(lead.value) * 0.02, cycles: 2, stepMs: HOUR, decimals: 2 });
  return raw.map((value) => value + lead.value - raw[raw.length - 1]);
}

type IsoPlantUnitCardProps = {
  unit: IsoPlantUnit;
  onStep?: (direction: 1 | -1) => void;
  /** Lists the other units of the area as buttons. */
  onSelect?: (unitId: string) => void;
  className?: string;
};

/** The selected unit: state first, then its lead reading large and two supporting ones. */
function IsoPlantUnitCard({ unit, onStep, onSelect, className }: IsoPlantUnitCardProps) {
  const state = ISO_PLANT_STATES[unit.state];
  const [lead, ...rest] = unit.readings;
  const position = ISO_PLANT_UNITS.findIndex((candidate) => candidate.id === unit.id) + 1;
  const stepper = 'flex size-9 items-center justify-center rounded-full bg-[var(--card-background)] text-base font-semibold text-[color:var(--kit-text)] shadow-[0_1px_2px_var(--effect-shadow-md)] hover:bg-[var(--kit-well)]';

  return (
    <Panel
      className={className}
      tone={state.tone}
      title={unit.name}
      subtitle={`${isoPlantArea(unit.area)?.name ?? unit.area} · ${unit.deck === 'deck' ? 'upper deck' : 'ground level'}`}
      icon={<IconChip tone={state.tone}>{state.icon}</IconChip>}
      footer={
        onStep ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm tabular-nums text-[color:var(--kit-text-2)]">
              Unit {position} of {ISO_PLANT_UNITS.length}
            </span>
            <span className="flex gap-2">
              <button type="button" aria-label="Previous unit" onClick={() => onStep(-1)} className={`${stepper} ${ISO_PLANT_FOCUS}`}>
                ‹
              </button>
              <button type="button" aria-label="Next unit" onClick={() => onStep(1)} className={`${stepper} ${ISO_PLANT_FOCUS}`}>
                ›
              </button>
            </span>
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={state.tone} size="lg" variant="filled" icon={state.icon}>
            {state.label}
          </StatusPill>
          <TagId variant="chip">{unit.tag}</TagId>
        </div>
        <p className="text-sm text-[color:var(--kit-text-2)]">{state.note}</p>
        <div className="flex flex-col">
          <span className="text-sm text-[color:var(--kit-text-2)]">{lead.label}</span>
          <span className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight tabular-nums text-[color:var(--kit-text)]">{isoPlantReading(lead)}</span>
            <span className="text-base text-[color:var(--kit-text-2)]">{lead.unit}</span>
          </span>
          <SparkLine values={isoPlantHistory(unit)} label={`${lead.label} over the last 24 hours`} tone={state.tone} className="mt-2 h-16 w-full" />
          <span className="mt-1 flex justify-between text-xs text-[color:var(--kit-text-2)]">
            <span>24 h ago</span>
            <span>Now</span>
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          {rest.map((reading) => (
            <div key={reading.label} className="flex flex-col rounded-[var(--kit-radius-sm)] bg-[color-mix(in_oklab,var(--card-background)_70%,transparent)] px-3.5 py-2.5">
              <dt className="text-xs text-[color:var(--kit-text-2)]">{reading.label}</dt>
              <dd className="flex items-baseline gap-1">
                <span className="text-xl font-bold tabular-nums text-[color:var(--kit-text)]">{isoPlantReading(reading)}</span>
                <span className="text-xs text-[color:var(--kit-text-2)]">{reading.unit}</span>
              </dd>
            </div>
          ))}
        </dl>
        {onSelect ? (
          <div className="mt-auto flex flex-col gap-2 pt-2">
            <h4 className="text-sm font-bold text-[color:var(--kit-text)]">Also in {isoPlantArea(unit.area)?.name.toLowerCase() ?? 'this area'}</h4>
            <ul className="flex flex-col gap-1.5">
              {ISO_PLANT_UNITS.filter((other) => other.area === unit.area && other.id !== unit.id).map((other) => (
                <li key={other.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(other.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-full bg-[color-mix(in_oklab,var(--card-background)_70%,transparent)] py-1.5 pl-4 pr-1.5 text-left text-sm font-medium text-[color:var(--kit-text)] hover:bg-[var(--card-background)] ${ISO_PLANT_FOCUS}`}
                  >
                    <span className="min-w-0 truncate">{other.name}</span>
                    <StatusPill tone={ISO_PLANT_STATES[other.state].tone}>{ISO_PLANT_STATES[other.state].label}</StatusPill>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

/** One pastel tile per area. A tile opens the unit in that area that most needs a look. */
function IsoPlantAreaTiles({ selectedId, onSelect, columns = 2 }: { selectedId: string | null; onSelect: (unitId: string) => void; columns?: 2 | 3 }) {
  const selectedArea = isoPlantUnit(selectedId)?.area;

  return (
    <ul aria-label="Areas" className={`grid gap-3 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {ISO_PLANT_AREAS.map((area) => {
        const units = ISO_PLANT_UNITS.filter((unit) => unit.area === area.code);
        const worst = isoPlantWorstUnit(area.code);
        const state = ISO_PLANT_STATES[worst?.state ?? 'running'];
        return (
          <li key={area.id} className="min-w-0">
            <button
              type="button"
              data-tone={ISO_PLANT_AREA_TONE[area.code]}
              aria-pressed={selectedArea === area.code}
              aria-label={`${area.name}, ${units.length} units, ${worst && worst.state !== 'running' ? `${worst.name} ${state.label.toLowerCase()}` : 'all running'}`}
              onClick={() => (worst ? onSelect(worst.id) : undefined)}
              className={`flex h-full w-full flex-col gap-1.5 rounded-[var(--kit-radius-sm)] bg-[var(--t-soft)] px-3.5 py-3 text-left text-[color:var(--t-on-soft)] outline-offset-2 hover:brightness-[0.97] aria-pressed:shadow-[0_0_0_2px_var(--t-ink)] ${ISO_PLANT_FOCUS}`}
            >
              <span className="text-sm font-bold leading-tight">{area.name}</span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums">{units.length}</span>
                <span className="text-xs">units</span>
              </span>
              <span className="text-xs font-semibold">{worst && worst.state !== 'running' ? `${state.label}: ${worst.name}` : 'All running'}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function IsoPlantHeadline() {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <IconChip tone="accent" size="lg">
          <IconBuildingFactory2 />
        </IconChip>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[color:var(--kit-text)]">Nordkapp at a glance</h2>
          <p className="text-sm text-[color:var(--kit-text-2)]">Gas plant, drawn looking north-west · Thursday 12 March, 14:00 UTC</p>
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-2 text-base text-[color:var(--kit-text)]">
        <span>
          <span className="font-bold tabular-nums">{ISO_PLANT_UNITS.length}</span> units in six areas:
        </span>
        {ISO_PLANT_STATE_ORDER.slice()
          .reverse()
          .map((state) => (
            <StatusPill key={state} tone={ISO_PLANT_STATES[state].tone} size="lg" icon={ISO_PLANT_STATES[state].icon}>
              {isoPlantCount(state)} {ISO_PLANT_STATES[state].label.toLowerCase()}
            </StatusPill>
          ))}
      </p>
    </header>
  );
}

function IsoPlantBoardCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`flex min-w-0 flex-col gap-4 rounded-[var(--kit-radius)] bg-[var(--kit-surface)] p-5 shadow-[var(--kit-panel-shadow)] ${className}`}>{children}</section>;
}

type IsoPlantScreenState = { layer: IsoPlantLayer; deck: IsoPlantDeck; selectedId: string };

function isoPlantStep(selectedId: string, direction: 1 | -1): IsoPlantUnit {
  const index = ISO_PLANT_UNITS.findIndex((unit) => unit.id === selectedId);
  return ISO_PLANT_UNITS[(index + direction + ISO_PLANT_UNITS.length) % ISO_PLANT_UNITS.length];
}

function useIsoPlantScreen(initial: IsoPlantScreenState) {
  const [state, setState] = useState(initial);
  const select = (unitId: string) => {
    const unit = isoPlantUnit(unitId);
    if (unit) setState((current) => ({ ...current, selectedId: unit.id, deck: unit.deck }));
  };
  return {
    ...state,
    unit: isoPlantUnit(state.selectedId) ?? ISO_PLANT_UNITS[0],
    select,
    step: (direction: 1 | -1) => select(isoPlantStep(state.selectedId, direction).id),
    setLayer: (layer: IsoPlantLayer) => setState((current) => ({ ...current, layer })),
    setDeck: (deck: IsoPlantDeck) => setState((current) => ({ ...current, deck })),
  };
}

function IsometricPlantSignature() {
  const screen = useIsoPlantScreen({ layer: 'status', deck: 'ground', selectedId: 'ka9103' });

  return (
    <LookScope look="soft">
      <Canvas className="flex flex-col gap-[var(--kit-gap)]">
        <IsoPlantHeadline />
        <div className="grid grid-cols-[minmax(0,1fr)_21rem] items-stretch gap-[var(--kit-gap)]">
          <div className="flex min-w-0 flex-col gap-[var(--kit-gap)]">
            <IsoPlantBoardCard>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <IsoPlantLayerPills value={screen.layer} onChange={screen.setLayer} />
                <IsoPlantDeckChips value={screen.deck} onChange={screen.setDeck} />
              </div>
              <IsoPlantBoard layer={screen.layer} deck={screen.deck} selectedId={screen.selectedId} onSelect={screen.select} />
              <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
                <IsoPlantLegend layer={screen.layer} />
                <p className="text-sm text-[color:var(--kit-text-3)]">Hover a unit to lift it · click to open it</p>
              </div>
            </IsoPlantBoardCard>
            <IsoPlantAreaTiles selectedId={screen.selectedId} onSelect={screen.select} columns={3} />
          </div>
          <IsoPlantUnitCard key={screen.unit.id} unit={screen.unit} onStep={screen.step} onSelect={screen.select} />
        </div>
      </Canvas>
    </LookScope>
  );
}

const ISO_PLANT_HEAT_RANK = [...ISO_PLANT_AREAS].sort((a, b) => b.temperature - a.temperature);

/** Another screen of the same product: the thermal walk, with the plots coloured by temperature. */
function IsometricPlantHeat() {
  const screen = useIsoPlantScreen({ layer: 'heat', deck: 'ground', selectedId: 'ka9101' });
  const hottest = ISO_PLANT_HEAT_RANK[0];

  return (
    <LookScope look="soft">
      <Canvas className="grid grid-cols-[22rem_minmax(0,1fr)] items-stretch gap-[var(--kit-gap)]">
        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-[var(--kit-gap)]">
          <Panel
            tone="amber"
            title="Thermal walk"
            subtitle="Skin temperature by area, 14:00 UTC"
            icon={
              <IconChip tone="amber">
                <IconFlame />
              </IconChip>
            }
          >
            <p className="text-sm text-[color:var(--kit-text-2)]">Hottest area</p>
            <p className="flex items-baseline gap-2">
              <span className="text-6xl font-bold tracking-tight tabular-nums text-[color:var(--kit-text)]">{hottest.temperature}</span>
              <span className="text-xl text-[color:var(--kit-text-2)]">°C</span>
            </p>
            <p className="mt-1 text-base font-bold text-[color:var(--kit-text)]">{hottest.name}</p>
            <p className="mt-2 text-sm text-[color:var(--kit-text-2)]">Eight degrees above the review line while the first stage runs hot. Flare and compression share the warm side of the plot.</p>
          </Panel>
          <Panel title="Areas, warmest first" subtitle="Review line at 50 °C">
            <ol className="flex flex-1 flex-col justify-between gap-3">
              {ISO_PLANT_HEAT_RANK.map((area) => (
                <li key={area.id} className="flex flex-col gap-1.5">
                  <span className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold text-[color:var(--kit-text)]">{area.name}</span>
                    <span className="tabular-nums text-[color:var(--kit-text)]">
                      <span className="font-bold">{area.temperature}</span> °C{area.temperature >= 50 ? <span className="font-semibold text-[color:var(--kit-line-warning)]"> · review</span> : null}
                    </span>
                  </span>
                  <span aria-hidden="true" className="relative h-3.5 overflow-hidden rounded-full bg-[var(--kit-track)]">
                    <span className={`block h-full rounded-full ${ISO_PLANT_HEAT_SWATCH[isoPlantHeatLevel(area.temperature)]}`} style={{ width: `${(area.temperature / 60) * 100}%` }} />
                    <span className="absolute inset-y-0 w-0.5 bg-[var(--kit-text)]" style={{ left: `${(50 / 60) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
        <IsoPlantBoardCard className="justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <IsoPlantLayerPills value={screen.layer} onChange={screen.setLayer} />
            <IsoPlantDeckChips value={screen.deck} onChange={screen.setDeck} />
          </div>
          <IsoPlantBoard layer={screen.layer} deck={screen.deck} selectedId={screen.selectedId} onSelect={screen.select} />
          <IsoPlantLegend layer={screen.layer} />
        </IsoPlantBoardCard>
      </Canvas>
    </LookScope>
  );
}

/** The same product on a phone: the drawing on top, the selected unit as a sheet under it. */
function IsometricPlantPhone() {
  const screen = useIsoPlantScreen({ layer: 'status', deck: 'ground', selectedId: 'pa4001' });

  return (
    <LookScope look="soft" className="mx-auto w-full max-w-[26rem]">
      <Canvas className="flex flex-col gap-4 rounded-[2.5rem] border-8 border-[color:var(--kit-text)]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[color:var(--kit-text)]">Nordkapp</h2>
          <p className="text-sm text-[color:var(--kit-text-2)]">19 units · 1 tripped · 1 in maintenance</p>
        </div>
        <IsoPlantLayerPills value={screen.layer} onChange={screen.setLayer} />
        <IsoPlantBoardCard className="!p-3">
          <IsoPlantBoard layer={screen.layer} deck={screen.deck} selectedId={screen.selectedId} onSelect={screen.select} areaLabels={false} />
        </IsoPlantBoardCard>
        <IsoPlantUnitCard key={screen.unit.id} unit={screen.unit} onStep={screen.step} />
      </Canvas>
    </LookScope>
  );
}

function IsometricPlantPartUnitCard() {
  const [unitId, setUnitId] = useState('ta3001');
  const unit = isoPlantUnit(unitId) ?? ISO_PLANT_UNITS[0];

  return (
    <LookScope look="soft" className="w-full">
      <Canvas className="flex h-[32rem] flex-col">
        <IsoPlantUnitCard key={unit.id} unit={unit} onStep={(direction) => setUnitId(isoPlantStep(unit.id, direction).id)} />
      </Canvas>
    </LookScope>
  );
}

function IsometricPlantPartAreas() {
  const [unitId, setUnitId] = useState('pa4001');
  const unit = isoPlantUnit(unitId) ?? ISO_PLANT_UNITS[0];

  return (
    <LookScope look="soft" className="w-full">
      <Canvas className="flex h-[32rem] flex-col justify-between gap-4">
        <IsoPlantAreaTiles selectedId={unitId} onSelect={setUnitId} />
        <p className="text-sm text-[color:var(--kit-text-2)]">
          Opens <span className="font-bold text-[color:var(--kit-text)]">{unit.name}</span>, {ISO_PLANT_STATES[unit.state].label.toLowerCase()}: the unit in the area that most needs a look.
        </p>
      </Canvas>
    </LookScope>
  );
}

const ISO_PLANT_PART_VIEW: IsoView = { scale: 30, originX: 170, originY: 64 };

function IsometricPlantPartSolids() {
  return (
    <LookScope look="soft" className="w-full">
      <Canvas className="flex h-[30rem] flex-col gap-3">
        <IsoPlantBoardCard className="min-h-0 flex-1 items-center justify-center">
          <svg role="img" aria-label="Isometric solids: a tripped compressor house, a tank at 68 percent, a standby vessel and a running pump skid" viewBox="0 0 420 240" className="h-full w-full">
            <IsoPrism box={{ x: 0, y: 0, z: 0, w: 2.2, d: 2.6, h: 2 }} view={ISO_PLANT_PART_VIEW} tone="critical" />
            <IsoCylinder x={4.3} y={1.3} z={0} radius={1.2} length={2.6} view={ISO_PLANT_PART_VIEW} tone="success" level={0.68} contentTone="liquid" />
            <IsoCylinder x={0.4} y={4.6} z={1} radius={0.6} length={3} axis="x" view={ISO_PLANT_PART_VIEW} tone="info" />
            <IsoPrism box={{ x: 5, y: 4.2, z: 0, w: 2.5, d: 1, h: 0.25 }} view={ISO_PLANT_PART_VIEW} tone="success" />
            <IsoCylinder x={5.2} y={4.7} z={0.65} radius={0.38} length={1.05} axis="x" view={ISO_PLANT_PART_VIEW} tone="success" />
            <IsoPrism box={{ x: 6.4, y: 4.32, z: 0.25, w: 0.8, d: 0.76, h: 0.85 }} view={ISO_PLANT_PART_VIEW} tone="success" outlined />
          </svg>
        </IsoPlantBoardCard>
      </Canvas>
    </LookScope>
  );
}

function IsometricPlantPartLayers() {
  const [layer, setLayer] = useState<IsoPlantLayer>('piping');
  const [deck, setDeck] = useState<IsoPlantDeck>('ground');

  return (
    <LookScope look="soft" className="w-full">
      <Canvas className="flex flex-wrap items-center justify-between gap-5">
        <IsoPlantLayerPills value={layer} onChange={setLayer} />
        <IsoPlantBoardCard className="!gap-0 !px-5 !py-3">
          <IsoPlantLegend layer={layer} />
        </IsoPlantBoardCard>
        <IsoPlantDeckChips value={deck} onChange={setDeck} />
      </Canvas>
    </LookScope>
  );
}

function IsometricPlantPartBoard() {
  const [selectedId, setSelectedId] = useState('ha9114');

  return (
    <LookScope look="soft" className="w-full">
      <Canvas className="flex min-h-[30rem] flex-col justify-center gap-3">
        <IsoPlantBoardCard>
          <IsoPlantBoard layer="equipment" deck="deck" selectedId={selectedId} onSelect={setSelectedId} areaLabels={false} />
          <p className="text-sm text-[color:var(--kit-text-2)]">Upper deck: the two coolers stand out and everything at ground level is ghosted.</p>
        </IsoPlantBoardCard>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'isometric-plant',
  title: 'Isometric plant',
  summary:
    'The plant as a friendly isometric illustration, drawn in SVG with no WebGL. Units lift on hover, open on click, and can be coloured by state, service or area temperature. The drawing is the screen; a unit card and six area tiles sit beside it.',
  guidance: {
    use: [
      'When people need to recognise the plant at a glance and the exact geometry does not matter.',
      'For occasional users and personal start pages: big targets, plain words, one unit open at a time.',
      'With one layer at a time, each with its own legend, so colour always means one thing.',
      'Where WebGL is not available or a 3D scene would be too heavy.',
    ],
    avoid: [
      'Engineering work that needs true positions, clearances or free rotation: use a 3D scene.',
      'More than a few dozen solids. Depth sorting is done by hand and dense drawings become unreadable.',
      'State by colour alone: every hover and selection label says the state in words.',
      'Tiny text inside the drawing. Labels are HTML on top of it and keep their size when the drawing shrinks.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Hover a unit to lift it and read its state; click it, or tab to it, to open its card. Switch layer to recolour the drawing, pick Upper deck to bring the coolers forward, and use an area tile to jump to the unit that most needs a look.',
      specimens: [
        {
          id: 'IsometricPlantSignature',
          title: 'Isometric plant',
          note: 'Pick it as a welcoming way into a plant for people who know it by sight, not by tag.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: [
            'experiences/spatial/IsoPrism.tsx',
            'experiences/spatial/IsoCylinder.tsx',
            'experiences/spatial/isoProjection.ts',
            'kit/Panel.tsx',
            'kit/StatusPill.tsx',
            'kit/IconChip.tsx',
            'kit/scene/ToggleChip.tsx',
            'looks/LookScope.tsx',
          ],
          Component: IsometricPlantSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The thermal walk, where the plots carry temperature and a ranking sits beside the drawing, and the same product on a phone.',
      specimens: [
        {
          id: 'IsometricPlantHeat',
          title: 'Thermal walk',
          note: 'Pick it when the question is where the plant runs warm: plots coloured by temperature, ranked against a review line.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['experiences/spatial/IsoPrism.tsx', 'experiences/spatial/isoProjection.ts', 'kit/Bars.tsx', 'kit/Panel.tsx', 'looks/LookScope.tsx'],
          Component: IsometricPlantHeat,
        },
        {
          id: 'IsometricPlantPhone',
          title: 'Phone',
          note: 'Pick it for a quick look on the way to site: the drawing without area labels and the selected unit as a sheet.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/spatial/IsoPrism.tsx', 'experiences/spatial/IsoCylinder.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: IsometricPlantPhone,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The card, the tiles, the controls and the solids the drawing is built from.',
      specimens: [
        {
          id: 'IsometricPlantPartUnitCard',
          title: 'Unit card',
          note: 'Pick it as the detail of one selected unit: the card takes the colour of the state and leads with one reading.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx', 'kit/IconChip.tsx'],
          Component: IsometricPlantPartUnitCard,
        },
        {
          id: 'IsometricPlantPartAreas',
          title: 'Area tiles',
          note: 'Pick pastel tiles as shortcuts into a drawing: one decorative family per area, and the tile says what needs attention.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/tones.ts'],
          Component: IsometricPlantPartAreas,
        },
        {
          id: 'IsometricPlantPartBoard',
          title: 'Upper deck',
          note: 'Pick a level switch when equipment is stacked: the chosen level is solid and the rest is ghosted, never hidden.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['experiences/spatial/IsoPrism.tsx', 'experiences/spatial/IsoCylinder.tsx', 'experiences/spatial/isoProjection.ts'],
          Component: IsometricPlantPartBoard,
        },
        {
          id: 'IsometricPlantPartSolids',
          title: 'Isometric solids',
          note: 'Pick boxes and cylinders shaded from one colour as the building blocks: houses, vessels, skids and tanks with a level.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['experiences/spatial/IsoPrism.tsx', 'experiences/spatial/IsoCylinder.tsx', 'experiences/spatial/isoStyle.ts'],
          Component: IsometricPlantPartSolids,
        },
        {
          id: 'IsometricPlantPartLayers',
          title: 'Layers and legend',
          note: 'Pick one-of-many pills for layers that recolour a drawing; the legend changes with the layer.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/scene/ToggleChip.tsx', 'kit/StatusPill.tsx'],
          Component: IsometricPlantPartLayers,
        },
      ],
    },
  ],
});
