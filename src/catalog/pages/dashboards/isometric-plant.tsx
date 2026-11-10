import { Button } from '@cognite/aura/components/button';
import { useState } from 'react';

import { IsoCallout } from '../../../library/experiences/spatial/IsoCallout';
import { IsoCylinder } from '../../../library/experiences/spatial/IsoCylinder';
import { IsoPrism } from '../../../library/experiences/spatial/IsoPrism';
import { boxAnchor, cylinderBounds, iso, sortBackToFront, toFractions, toPoints, unionBox } from '../../../library/experiences/spatial/isoProjection';
import type { IsoBox, IsoCylinderSpec, IsoPoint, IsoView } from '../../../library/experiences/spatial/isoProjection';
import type { IsoTone, IsoVariant } from '../../../library/experiences/spatial/isoStyle';
import { LayerSwitch } from '../../../library/experiences/spatial/LayerSwitch';
import { HeatScaleLegend } from '../../../library/industrial/charts/HeatScaleLegend';
import { formatReading, runStateStatus } from '../../../library/industrial/status';
import type { DotShape, RunState } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ThemeScope } from '../../../library/themes/ThemeScope';
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

const ISO_PLANT_LAYERS = [
  { value: 'equipment', label: 'Equipment' },
  { value: 'piping', label: 'Piping' },
  { value: 'status', label: 'Status' },
  { value: 'heat', label: 'Heat' },
] as const;

const ISO_PLANT_DECKS = [
  { value: 'ground', label: 'Ground' },
  { value: 'deck', label: 'Upper deck' },
] as const;

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

const ISO_PLANT_STATE_TONE: Record<RunState, IsoTone> = { running: 'success', standby: 'info', stopped: 'neutral', tripped: 'critical', maintenance: 'warning' };

const ISO_PLANT_HEAT_FILL = ['fill-heat-map-mild', 'fill-heat-map-moderate', 'fill-heat-map-strong', 'fill-heat-map-intense'];

const ISO_PLANT_SERVICES: readonly { id: IsoPlantService; label: string; swatch: string }[] = [
  { id: 'gas', label: 'Gas', swatch: 'bg-chart-1-450' },
  { id: 'liquid', label: 'Condensate', swatch: 'bg-chart-2-450' },
  { id: 'water', label: 'Cooling water', swatch: 'bg-chart-3-450' },
];

const ISO_PLANT_GROUND_TEXT = '[paint-order:stroke] stroke-[color:var(--card-background)] font-mono uppercase tracking-wide';

function isoPlantHeatLevel(temperature: number): number {
  if (temperature < 25) return 0;
  if (temperature < 40) return 1;
  return temperature < 50 ? 2 : 3;
}

function isoPlantUnitAnchor(unitId: string): IsoPoint {
  return boxAnchor(unionBox(ISO_PLANT_ITEMS.filter((item) => item.unitId === unitId)), ISO_PLANT_VIEW);
}

function isoPlantLook(item: IsoPlantItem, layer: IsoPlantLayer, deck: IsoPlantDeck, state: RunState | undefined): { tone: IsoTone; variant: IsoVariant } {
  if (item.deck !== deck) return { tone: 'neutral', variant: 'ghost' };
  if (item.role === 'pipe') {
    if (layer === 'piping') return { tone: item.service ?? 'neutral', variant: 'solid' };
    return { tone: 'neutral', variant: layer === 'heat' ? 'ghost' : 'solid' };
  }
  if (item.role === 'structure') return { tone: 'neutral', variant: layer === 'equipment' || layer === 'status' ? 'solid' : 'ghost' };
  if (layer === 'status') return { tone: state ? ISO_PLANT_STATE_TONE[state] : 'neutral', variant: 'solid' };
  return { tone: 'accent', variant: layer === 'equipment' ? 'solid' : 'ghost' };
}

function isoPlantStatePath(shape: DotShape, x: number, y: number): string {
  if (shape === 'diamond') return `M ${x} ${y - 6} L ${x + 6} ${y} L ${x} ${y + 6} L ${x - 6} ${y} Z`;
  if (shape === 'square') return `M ${x - 4.5} ${y - 4.5} h 9 v 9 h -9 Z`;
  return `M ${x - 5} ${y} a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0 Z`;
}

function IsoPlantSolid({ item, tone, variant, outlined }: { item: IsoPlantItem; tone: IsoTone; variant: IsoVariant; outlined: boolean }) {
  if (item.shape.kind === 'cylinder') {
    return (
      <IsoCylinder
        {...item.shape.spec}
        view={ISO_PLANT_VIEW}
        tone={tone}
        variant={variant}
        outlined={outlined}
        level={item.shape.level}
        contentTone={item.shape.contentTone}
      />
    );
  }
  return <IsoPrism box={item} view={ISO_PLANT_VIEW} tone={tone} variant={variant} outlined={outlined} />;
}

function IsoPlantGround({ layer }: { layer: IsoPlantLayer }) {
  const corner = (x: number, y: number) => iso(x, y, 0, ISO_PLANT_VIEW);
  const lines = [
    ...Array.from({ length: 23 }, (_, x) => [corner(x, 0), corner(x, 14)]),
    ...Array.from({ length: 15 }, (_, y) => [corner(0, y), corner(22, y)]),
  ];

  return (
    <g data-slot="iso-plant-ground">
      {lines.map(([from, to]) => (
        <line
          key={`${from.x}-${from.y}-${to.x}`}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          strokeWidth={1}
          className="stroke-[color-mix(in_oklab,var(--primary-background)_14%,transparent)]"
        />
      ))}
      {ISO_PLANT_AREAS.map((area) => {
        const label = area.y < 7 ? corner(area.x + 0.25, area.y - 0.25) : corner(area.x + 0.25, area.y + area.d + 0.8);
        return (
          <g key={area.id} data-area={area.code}>
            <polygon
              points={toPoints([corner(area.x, area.y), corner(area.x + area.w, area.y), corner(area.x + area.w, area.y + area.d), corner(area.x, area.y + area.d)])}
              strokeWidth={1}
              strokeDasharray={layer === 'heat' ? undefined : '5 4'}
              className={
                layer === 'heat'
                  ? `${ISO_PLANT_HEAT_FILL[isoPlantHeatLevel(area.temperature)]} stroke-[color:var(--card-background)]`
                  : 'fill-[color-mix(in_oklab,var(--primary-background)_5%,transparent)] stroke-[color-mix(in_oklab,var(--primary-background)_55%,transparent)]'
              }
            />
            <text
              transform={`matrix(0.866 0.5 -0.866 0.5 ${label.x} ${label.y})`}
              fontSize={12}
              strokeWidth={3}
              className={`${ISO_PLANT_GROUND_TEXT} ${layer === 'heat' ? 'fill-base-foreground font-semibold' : 'fill-medium-foreground'}`}
            >
              {layer === 'heat' ? `${area.code} ${area.temperature} °C` : `${area.code} ${area.name}`}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function IsoPlantLegend({ layer }: { layer: IsoPlantLayer }) {
  if (layer === 'heat') return <HeatScaleLegend title="Area temperature" lowLabel="15 °C" highLabel="60 °C" />;
  if (layer === 'piping') {
    return (
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {ISO_PLANT_SERVICES.map((service) => (
          <li key={service.id} className="inline-flex items-center gap-2">
            <span aria-hidden="true" className={`h-1 w-4 rounded-full ${service.swatch}`} />
            {service.label}
          </li>
        ))}
      </ul>
    );
  }
  if (layer === 'status') {
    return (
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {(['running', 'standby', 'maintenance', 'tripped'] as const).map((state) => (
          <li key={state}>
            <StatusIndicator {...runStateStatus(state)} size="sm" />
          </li>
        ))}
      </ul>
    );
  }
  return <p className="text-xs text-muted-foreground">Hover a unit to lift it, select it for readings</p>;
}

function IsoPlantScene({
  layer,
  deck,
  selectedId,
  onSelect,
}: {
  layer: IsoPlantLayer;
  deck: IsoPlantDeck;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selected = ISO_PLANT_UNITS.find((unit) => unit.id === selectedId);
  const anchor = selected ? isoPlantUnitAnchor(selected.id) : undefined;

  return (
    <div className="relative aspect-[3/2] w-full">
      <svg
        role="img"
        aria-label={`Isometric plot plan of the Nordkapp gas plant, ${layer} layer, ${deck === 'deck' ? 'upper deck' : 'ground level'}${selected ? `, ${selected.name} selected` : ''}`}
        viewBox={`0 0 ${ISO_PLANT_WIDTH} ${ISO_PLANT_HEIGHT}`}
        className="absolute inset-0 h-full w-full"
      >
        <IsoPlantGround layer={layer} />
        {ISO_PLANT_DRAW_ORDER.map((item) => {
          const unit = ISO_PLANT_UNITS.find((candidate) => candidate.id === item.unitId);
          const look = isoPlantLook(item, layer, deck, unit?.state);
          const active = unit !== undefined && (unit.id === selectedId || unit.id === hoveredId);
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
              onClick={() => onSelect(unit.id === selectedId ? null : unit.id)}
              onPointerEnter={() => setHoveredId(unit.id)}
              onPointerLeave={() => setHoveredId((current) => (current === unit.id ? null : current))}
              style={{ transform: unit.id === hoveredId ? 'translateY(-4px)' : undefined }}
              className="cursor-pointer transition-transform duration-200 motion-reduce:transition-none"
            >
              <IsoPlantSolid item={item} {...look} outlined={active} />
            </g>
          );
        })}
        {layer === 'status'
          ? ISO_PLANT_UNITS.filter((unit) => unit.deck === deck).map((unit) => {
              const at = isoPlantUnitAnchor(unit.id);
              const status = runStateStatus(unit.state);
              return (
                <path
                  key={unit.id}
                  data-slot="iso-plant-state"
                  d={isoPlantStatePath(status.shape, at.x, at.y - 12)}
                  strokeWidth={2}
                  className={`pointer-events-none [--iso:var(--${status.tone === 'neutral' ? 'muted-foreground' : `${status.tone}-foreground-strong`})] stroke-[color:var(--iso)] ${status.shape === 'ring' ? 'fill-card-background' : 'fill-[var(--iso)]'}`}
                />
              );
            })
          : null}
      </svg>
      {selected && anchor ? (
        <IsoCallout
          anchor={toFractions(anchor, ISO_PLANT_WIDTH, ISO_PLANT_HEIGHT)}
          title={selected.name}
          tag={selected.tag}
          status={<StatusIndicator {...runStateStatus(selected.state)} size="sm" />}
          onClose={() => onSelect(null)}
        >
          <dl className="flex flex-col gap-1 text-sm">
            {selected.readings.map((reading) => (
              <div key={reading.label} className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">{reading.label}</dt>
                <dd className="font-medium tabular-nums text-base-foreground">{formatReading(reading.value, reading.unit, reading.decimals)}</dd>
              </div>
            ))}
          </dl>
        </IsoCallout>
      ) : null}
    </div>
  );
}

function IsoPlantUnitList({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <ul aria-label="Units" className="flex min-h-0 flex-col overflow-y-auto">
      {ISO_PLANT_UNITS.map((unit) => (
        <li key={unit.id}>
          <Button
            variant={unit.id === selectedId ? 'secondary' : 'ghost'}
            size="sm"
            aria-pressed={unit.id === selectedId}
            onClick={() => onSelect(unit.id)}
            className="w-full justify-start"
          >
            <span className="truncate">{unit.name}</span>
          </Button>
        </li>
      ))}
    </ul>
  );
}

function IsoPlantScreen() {
  const [layer, setLayer] = useState<IsoPlantLayer>('equipment');
  const [deck, setDeck] = useState<IsoPlantDeck>('ground');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const select = (id: string | null) => {
    const unit = ISO_PLANT_UNITS.find((candidate) => candidate.id === id);
    if (unit) setDeck(unit.deck);
    setSelectedId(id);
  };

  return (
    <div className="grid h-[43rem] w-full grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden rounded-xl border border-default bg-card-background p-4">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div>
          <h3 className="text-sm font-semibold text-base-foreground">Nordkapp gas plant</h3>
          <p className="text-xs text-muted-foreground">Plot plan, looking north-west</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <LayerSwitch label="Level" value={deck} options={ISO_PLANT_DECKS} onValueChange={setDeck} />
          <LayerSwitch label="Layer" value={layer} options={ISO_PLANT_LAYERS} onValueChange={setLayer} />
        </div>
      </header>
      <div className="grid min-h-0 grid-cols-[13rem_minmax(0,1fr)] gap-4">
        <IsoPlantUnitList selectedId={selectedId} onSelect={select} />
        <div className="flex min-h-0 min-w-0 flex-col items-center justify-center gap-2">
          <div className="w-[min(100%,54rem)]">
            <IsoPlantScene layer={layer} deck={deck} selectedId={selectedId} onSelect={select} />
          </div>
          <div className="flex min-h-6 items-center">
            <IsoPlantLegend layer={layer} />
          </div>
        </div>
      </div>
    </div>
  );
}

function IsoPlantExperience() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <IsoPlantScreen />
    </ThemeScope>
  );
}

function IsoPlantHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <IsoPlantScreen />
    </ThemeScope>
  );
}

function IsoPlantSandstone() {
  return (
    <ThemeScope preset="sandstone" className="w-full">
      <IsoPlantScreen />
    </ThemeScope>
  );
}

const ISO_PLANT_PART_VIEW: IsoView = { scale: 30, originX: 150, originY: 70 };

function IsoPlantPrisms() {
  return (
    <svg role="img" aria-label="Three isometric boxes: solid, status toned and ghost" viewBox="0 0 320 200" className="w-full max-w-xs">
      <IsoPrism box={{ x: -1, y: 2.4, z: 0, w: 2, d: 2, h: 1.6 }} view={ISO_PLANT_PART_VIEW} tone="accent" />
      <IsoPrism box={{ x: 2, y: 2, z: 0, w: 2, d: 2, h: 2.4 }} view={ISO_PLANT_PART_VIEW} tone="critical" />
      <IsoPrism box={{ x: 5, y: 1.6, z: 0, w: 2, d: 2, h: 1.2 }} view={ISO_PLANT_PART_VIEW} variant="ghost" />
    </svg>
  );
}

function IsoPlantTanks() {
  return (
    <svg role="img" aria-label="Three tanks filled to 20, 55 and 90 percent" viewBox="0 0 320 200" className="w-full max-w-xs">
      <IsoCylinder x={0} y={3.2} z={0} radius={1.1} length={3} level={0.2} view={ISO_PLANT_PART_VIEW} tone="accent" />
      <IsoCylinder x={2.6} y={2.4} z={0} radius={1.1} length={3} level={0.55} view={ISO_PLANT_PART_VIEW} tone="accent" />
      <IsoCylinder x={5.2} y={1.6} z={0} radius={1.1} length={3} level={0.9} contentTone="water" view={ISO_PLANT_PART_VIEW} tone="accent" />
    </svg>
  );
}

function IsoPlantVessel() {
  return (
    <svg role="img" aria-label="A horizontal separator on two saddles beside a vertical column" viewBox="0 0 320 200" className="w-full max-w-xs">
      <IsoCylinder x={-0.4} y={4} z={0} radius={0.6} length={4.2} view={ISO_PLANT_PART_VIEW} tone="accent" />
      <IsoPrism box={{ x: 2.4, y: 2.1, z: 0, w: 0.4, d: 1.4, h: 0.5 }} view={ISO_PLANT_PART_VIEW} />
      <IsoPrism box={{ x: 5, y: 2.1, z: 0, w: 0.4, d: 1.4, h: 0.5 }} view={ISO_PLANT_PART_VIEW} />
      <IsoCylinder x={1.6} y={2.8} z={1.4} radius={0.9} length={4.6} axis="x" view={ISO_PLANT_PART_VIEW} tone="accent" />
    </svg>
  );
}

function IsoPlantPipeRack() {
  const view: IsoView = { scale: 26, originX: 60, originY: 60 };
  const frames = [0.5, 3.5, 6.5, 9.5];

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <svg role="img" aria-label="A pipe rack carrying gas, condensate and cooling water lines" viewBox="0 0 360 230" className="w-full">
        {frames.map((x) => (
          <IsoPrism key={x} box={{ x, y: 1, z: 0, w: 0.16, d: 1.3, h: 1.8 }} view={view} />
        ))}
        <IsoPrism box={{ x: 0, y: 1.1, z: 1.8, w: 11, d: 0.22, h: 0.22 }} view={view} tone="gas" />
        <IsoPrism box={{ x: 0, y: 1.55, z: 1.8, w: 11, d: 0.22, h: 0.22 }} view={view} tone="liquid" />
        <IsoPrism box={{ x: 0, y: 2, z: 1.8, w: 11, d: 0.22, h: 0.22 }} view={view} tone="water" />
      </svg>
      <IsoPlantLegend layer="piping" />
    </div>
  );
}

function IsoPlantCallout() {
  const unit = ISO_PLANT_UNITS[5];

  return (
    <div className="relative h-56 w-full max-w-md">
      <svg role="img" aria-label="A tripped compressor house with its callout" viewBox="0 0 360 224" className="absolute inset-0 h-full w-full">
        <IsoPrism box={{ x: 0, y: 2.2, z: 0, w: 2.2, d: 2.6, h: 2 }} view={{ scale: 26, originX: 110, originY: 90 }} tone="critical" outlined />
      </svg>
      <IsoCallout
        anchor={{ x: 0.3, y: 0.42 }}
        placement={{ side: 'right', vertical: 'above' }}
        title={unit.name}
        tag={unit.tag}
        status={<StatusIndicator {...runStateStatus(unit.state)} size="sm" />}
      >
        <dl className="flex flex-col gap-1 text-sm">
          {unit.readings.slice(0, 2).map((reading) => (
            <div key={reading.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">{reading.label}</dt>
              <dd className="font-medium tabular-nums text-base-foreground">{formatReading(reading.value, reading.unit, reading.decimals)}</dd>
            </div>
          ))}
        </dl>
      </IsoCallout>
    </div>
  );
}

function IsoPlantLayerSwitch() {
  const [layer, setLayer] = useState<IsoPlantLayer>('status');
  const [deck, setDeck] = useState<IsoPlantDeck>('ground');

  return (
    <div className="flex flex-col gap-4">
      <LayerSwitch label="Layer" value={layer} options={ISO_PLANT_LAYERS} onValueChange={setLayer} />
      <LayerSwitch label="Level" value={deck} options={ISO_PLANT_DECKS} onValueChange={setDeck} />
      <IsoPlantLegend layer={layer} />
    </div>
  );
}

function IsoPlantHeatTiles() {
  const view: IsoView = { scale: 22, originX: 150, originY: 24 };
  const tiles = [
    { code: 'NK-21', temperature: 19, x: 0, y: 0 },
    { code: 'NK-20', temperature: 34, x: 3.2, y: 0 },
    { code: 'NK-29', temperature: 47, x: 0, y: 3.2 },
    { code: 'NK-23', temperature: 58, x: 3.2, y: 3.2 },
  ];

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <svg role="img" aria-label="Four areas coloured by temperature from 19 to 58 degrees" viewBox="0 0 300 170" className="w-full">
        {tiles.map((tile) => {
          const corner = (dx: number, dy: number) => iso(tile.x + dx, tile.y + dy, 0, view);
          const label = corner(0.3, 2.75);
          return (
            <g key={tile.code}>
              <polygon
                points={toPoints([corner(0, 0), corner(3, 0), corner(3, 3), corner(0, 3)])}
                strokeWidth={1}
                className={`${ISO_PLANT_HEAT_FILL[isoPlantHeatLevel(tile.temperature)]} stroke-[color:var(--card-background)]`}
              />
              <text transform={`matrix(0.866 0.5 -0.866 0.5 ${label.x} ${label.y})`} fontSize={11} strokeWidth={3} className={`${ISO_PLANT_GROUND_TEXT} fill-base-foreground font-semibold`}>
                {tile.code} {tile.temperature} °C
              </text>
            </g>
          );
        })}
      </svg>
      <HeatScaleLegend title="Area temperature" lowLabel="15 °C" highLabel="60 °C" />
    </div>
  );
}

function IsoPlantDepthOrder() {
  const view: IsoView = { scale: 26, originX: 150, originY: 50 };
  const boxes = sortBackToFront([
    { id: 'front', x: 3.4, y: 3.4, z: 0, w: 1.6, d: 1.6, h: 1.2 },
    { id: 'tower', x: 1.6, y: 1.6, z: 0, w: 1.4, d: 1.4, h: 3.4 },
    { id: 'slab', x: 0, y: 3.4, z: 0, w: 3, d: 1.6, h: 0.5 },
    { id: 'back', x: 3.4, y: 0, z: 0, w: 1.6, d: 3, h: 2 },
  ]);

  return (
    <svg role="img" aria-label="Four boxes painted back to front so the near ones cover the far ones" viewBox="0 0 320 220" className="w-full max-w-xs">
      {boxes.map((box, index) => {
        const top = boxAnchor(box, view);
        return (
          <g key={box.id}>
            <IsoPrism box={box} view={view} tone="accent" />
            <text x={top.x} y={top.y} textAnchor="middle" dominantBaseline="central" fontSize={13} className="fill-base-foreground font-semibold tabular-nums">
              {index + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default definePage({
  id: 'isometric-plant',
  title: 'Isometric plant',
  summary:
    'The Nordkapp plot plan as a 2.5D drawing in plain SVG: separators, compressor houses, coolers, pumps, tanks, a flare and a pipe rack built from boxes and cylinders, with layers, deck levels and a callout for the selected unit.',
  guidance: {
    use: [
      'When people need to see where equipment stands, and WebGL is not available or not worth its cost.',
      'For a site overview with a few dozen units, each a simple recognisable shape.',
      'Switch layers to change the question: what is there, how it connects, how it runs, where it is hot.',
      'Keep the unit list beside the drawing; it is the keyboard and screen-reader path.',
    ],
    avoid: [
      'Hundreds of units or free camera movement — use the 3D plant for that.',
      'Shapes that intersect: painter ordering only works for solids that do not overlap.',
      'Colour as the only state signal; the status layer adds a shape above each unit.',
      'Fine engineering detail. This is a map for orientation, not a P&ID.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Shown in the Blueprint theme. Hover a unit to lift and outline it, click it or pick it from the list to open its callout, switch the layer between equipment, piping, status and heat, and step between ground level and the upper deck.',
      specimens: [
        {
          id: 'IsoPlantExperience',
          title: 'Isometric plant',
          note: 'Pick it for a plant overview that should feel spatial but stay light, printable and themeable.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'experiences/spatial/isoProjection.ts',
            'experiences/spatial/isoStyle.ts',
            'experiences/spatial/IsoPrism.tsx',
            'experiences/spatial/IsoCylinder.tsx',
            'experiences/spatial/IsoCallout.tsx',
            'experiences/spatial/LayerSwitch.tsx',
            'industrial/charts/HeatScaleLegend.tsx',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: IsoPlantExperience,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same drawing, unchanged, in a dark preset and a warm light one. Face shading swaps so tops stay brightest.',
      specimens: [
        {
          id: 'IsoPlantHologram',
          title: 'Hologram',
          note: 'Pick it next to digital-twin views: teal solids on black.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: IsoPlantHologram,
        },
        {
          id: 'IsoPlantSandstone',
          title: 'Sandstone',
          note: 'Pick it for reports and handover documents: warm paper tones that print well.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: IsoPlantSandstone,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'Each part on its own, in the theme of the page around it. All solids are projected with the same helper.',
      specimens: [
        {
          id: 'IsoPlantPrisms',
          title: 'Prisms',
          note: 'Pick it for buildings, skids and decks: solid, toned by state, or a ghost for what is not the subject.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/spatial/IsoPrism.tsx', 'experiences/spatial/isoProjection.ts', 'experiences/spatial/isoStyle.ts'],
          Component: IsoPlantPrisms,
        },
        {
          id: 'IsoPlantTanks',
          title: 'Tanks with fill level',
          note: 'Pick it when the level is the message: contents show through a translucent shell.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/spatial/IsoCylinder.tsx', 'experiences/spatial/isoProjection.ts'],
          Component: IsoPlantTanks,
        },
        {
          id: 'IsoPlantVessel',
          title: 'Vessel and column',
          note: 'Pick it for separators, drums and columns: a cylinder lying along an axis or standing.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/spatial/IsoCylinder.tsx', 'experiences/spatial/IsoPrism.tsx'],
          Component: IsoPlantVessel,
        },
        {
          id: 'IsoPlantPipeRack',
          title: 'Pipe rack',
          note: 'Pick it to show how areas connect: thin prisms on frames, coloured by service with a legend.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/spatial/IsoPrism.tsx', 'experiences/spatial/isoStyle.ts'],
          Component: IsoPlantPipeRack,
        },
        {
          id: 'IsoPlantCallout',
          title: 'Anchored callout',
          note: 'Pick it for the details of the one selected unit, pinned to it by a dot and a leader.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/spatial/IsoCallout.tsx', 'experiences/spatial/IsoPrism.tsx', 'industrial/StatusIndicator.tsx'],
          Component: IsoPlantCallout,
        },
        {
          id: 'IsoPlantLayerSwitch',
          title: 'Layer and level switches',
          note: 'Pick it to change what one scene emphasises; the legend follows the layer.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/spatial/LayerSwitch.tsx', 'industrial/charts/HeatScaleLegend.tsx', 'industrial/StatusIndicator.tsx'],
          Component: IsoPlantLayerSwitch,
        },
        {
          id: 'IsoPlantHeatTiles',
          title: 'Heat tiles',
          note: 'Pick it for one value per area on the ground plane, printed on each tile as well as coloured.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/spatial/isoProjection.ts', 'industrial/charts/HeatScaleLegend.tsx'],
          Component: IsoPlantHeatTiles,
        },
        {
          id: 'IsoPlantDepthOrder',
          title: 'Depth order',
          note: 'Pick the sorter whenever solids overlap on screen; the numbers show the order they are painted in.',
          origin: 'custom',
          size: 'sm',
          uses: ['experiences/spatial/isoProjection.ts', 'experiences/spatial/IsoPrism.tsx'],
          Component: IsoPlantDepthOrder,
        },
      ],
    },
  ],
});
