import type { ReactNode } from 'react';

import type { DotShape } from '../../industrial/status';
import { Building } from '../Building';
import { CameraRig } from '../CameraRig';
import type { CameraTarget, Vec3, ViewInsetsValue } from '../cameraTargets';
import { Column } from '../Column';
import { CompressorSkid } from '../CompressorSkid';
import type { EquipmentProps } from '../equipmentProps';
import { FlareStack } from '../FlareStack';
import { GasTurbine } from '../GasTurbine';
import { Ground } from '../Ground';
import { HorizontalVessel } from '../HorizontalVessel';
import { PipeRack } from '../PipeRack';
import { PipeRun } from '../PipeRun';
import { SceneLabel } from '../SceneLabel';
import { SceneLights } from '../SceneLights';
import type { SceneTone } from '../scenePalette';
import { IndicatorRing } from '../scenes/IndicatorRing';
import { SeaPlane } from '../scenes/SeaPlane';
import { Selectable } from '../Selectable';
import { VerticalVessel } from '../VerticalVessel';
import { ViewInsets } from '../ViewInsets';

import { AirCoolerBank } from './AirCoolerBank';
import { ContainmentTank } from './ContainmentTank';
import { CryogenicExchanger } from './CryogenicExchanger';
import { LngCarrier } from './LngCarrier';
import { lngLabelAnchor, lngUnitRingRadius } from './lngSite';
import type { LngUnit } from './lngSite';
import { LoadingArms } from './LoadingArms';
import { SlugCatcher } from './SlugCatcher';
import { formatTemperature, temperatureRampKey } from './temperatureRamp';
import type { TemperatureRampKey, TemperatureScale } from './temperatureRamp';

/** A status shown on one unit: a ring on the ground and words on its label. */
export type LngUnitStatus = { tone: SceneTone; shape?: DotShape; text: string; pulse?: boolean };

/** A stretch of pipe rack or jetty trestle: scenery that ties the units together. */
export type LngRack = { id: string; position: Vec3; length: number; rotationY?: number };

export type LngLine = { id: string; points: readonly Vec3[]; radius?: number };

export type LngSiteProps = {
  units: readonly LngUnit[];
  racks?: readonly LngRack[];
  /** Trunk lines with flow chevrons: feed, rundown, loading. */
  lines?: readonly LngLine[];
  /** The land plot: centre (x, z) and size (width, depth). */
  land: { center: readonly [number, number]; size: readonly [number, number] };
  /** Open water beside the plot, for the jetty and the carrier. */
  sea?: { center: readonly [number, number]; size: readonly [number, number]; level?: number };
  /** Where the camera is. Change it and the camera flies there. */
  target: CameraTarget;
  /** Pixels that overlays cover on each edge of the canvas. */
  insets?: ViewInsetsValue;
  /** The tour stop in focus: its units get labels. `null` labels only the landmarks. */
  activeStageId?: string | null;
  selectedUnitId?: string | null;
  /** Called with a unit id on click. */
  onSelect?: (unitId: string) => void;
  /** `status` rings abnormal units in their status tone; `temperature` rings every unit in its ramp colour. */
  colourBy?: 'status' | 'temperature';
  statuses?: Readonly<Record<string, LngUnitStatus>>;
  /** The temperature ramp resolved to colours (see `TEMPERATURE_RAMP_TOKENS`). Needed for `temperature`. */
  rampColors?: Readonly<Record<TemperatureRampKey, string>> | null;
  scale?: TemperatureScale;
  showLabels?: boolean;
  /** Extra three.js content in site coordinates. */
  children?: ReactNode;
};

const DEFAULT_SCALE: TemperatureScale = { warm: 30, cold: -162 };

function LngUnitModel({ unit, ...state }: { unit: LngUnit } & Pick<EquipmentProps, 'tone' | 'pulse' | 'hovered' | 'selected'>) {
  const placement = { position: unit.position, rotation: [0, unit.rotationY ?? 0, 0] as const, ...state };
  switch (unit.kind) {
    case 'slug-catcher':
      return <SlugCatcher {...placement} fingers={unit.count} />;
    case 'separator':
      return <HorizontalVessel {...placement} />;
    case 'column':
      return <Column {...placement} height={unit.height} />;
    case 'vessel':
      return <VerticalVessel {...placement} height={unit.height} />;
    case 'mche':
      return <CryogenicExchanger {...placement} height={unit.height} />;
    case 'compressor':
      return <CompressorSkid {...placement} />;
    case 'turbine':
      return <GasTurbine {...placement} />;
    case 'cooler-bank':
      return <AirCoolerBank {...placement} bays={unit.count} />;
    case 'tank':
      return <ContainmentTank {...placement} fill={unit.fill} />;
    case 'loading-arms':
      return <LoadingArms {...placement} arms={unit.count} connected={unit.connected} />;
    case 'carrier':
      return <LngCarrier {...placement} />;
    case 'flare':
      return <FlareStack {...placement} height={unit.height} />;
    case 'building':
      return <Building {...placement} />;
    case 'control-room':
      return <Building {...placement} variant="control-room" />;
  }
}

/**
 * A whole LNG liquefaction site from data: land and sea, pipe racks, trunk lines and every unit
 * from the inlet facilities to the carrier at the jetty. Units are clickable; the camera is
 * driven from outside (see `tourState`), and one switch colours the site by status or by process
 * temperature — with ground rings, so the equipment itself stays steel. Render it inside `SceneCanvas`.
 */
export function LngSite({
  units,
  racks = [],
  lines = [],
  land,
  sea,
  target,
  insets,
  activeStageId = null,
  selectedUnitId = null,
  onSelect,
  colourBy = 'status',
  statuses = {},
  rampColors = null,
  scale = DEFAULT_SCALE,
  showLabels = true,
  children,
}: LngSiteProps) {
  const { top = 0, right = 0, bottom = 0, left = 0 } = insets ?? {};
  const byTemperature = colourBy === 'temperature';

  return (
    <>
      <SceneLights sunPosition={[90, 170, 130]} />
      <CameraRig target={target} duration={1.6} minDistance={18} maxDistance={520} />
      <ViewInsets top={top} right={right} bottom={bottom} left={left} />
      <Ground size={[land.size[0], land.size[1]]} center={[land.center[0], land.center[1]]} cell={6} />
      {sea ? <SeaPlane size={sea.size} center={sea.center} level={sea.level ?? -1} cell={12} opacity={0.42} /> : null}

      {racks.map((rack) => (
        <PipeRack key={rack.id} position={rack.position} rotation={[0, rack.rotationY ?? 0, 0]} length={rack.length} />
      ))}
      {lines.map((line) => (
        <PipeRun key={line.id} points={line.points} radius={line.radius ?? 0.4} flow spacing={9} speed={3} />
      ))}

      {units.map((unit) => {
        const status = statuses[unit.id];
        const isSelected = unit.id === selectedUnitId;
        const inStage = activeStageId !== null && unit.stageId === activeStageId;
        const labelled = showLabels && (isSelected || inStage || (activeStageId === null && unit.landmark === true));
        const rampColor = byTemperature && rampColors && unit.temperature !== null ? rampColors[temperatureRampKey(unit.temperature, scale)] : null;
        const value = byTemperature ? (unit.temperature === null ? undefined : formatTemperature(unit.temperature)) : status?.text;
        return (
          <group key={unit.id}>
            <Selectable id={unit.id} onSelect={onSelect} selected={isSelected} disabled={!onSelect}>
              {(state) => <LngUnitModel unit={unit} tone={byTemperature ? undefined : status?.tone} pulse={byTemperature ? undefined : status?.pulse} hovered={state.hovered} selected={state.selected} />}
            </Selectable>
            {rampColor ? <IndicatorRing position={[unit.position[0], Math.max(0, unit.position[1]), unit.position[2]]} radius={lngUnitRingRadius(unit)} width={1.4} color={rampColor} /> : null}
            {labelled ? (
              <SceneLabel
                position={lngLabelAnchor(unit)}
                tag={unit.tag}
                name={inStage || isSelected ? undefined : unit.name}
                value={value}
                tone={byTemperature ? undefined : status?.tone}
                shape={status?.shape}
                selected={isSelected}
                onClick={onSelect ? () => onSelect(unit.id) : undefined}
              />
            ) : null}
          </group>
        );
      })}

      {children}
    </>
  );
}
