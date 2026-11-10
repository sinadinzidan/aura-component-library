import { AirCooler } from './AirCooler';
import { Building } from './Building';
import { Column } from './Column';
import { CompressorSkid } from './CompressorSkid';
import type { EquipmentProps } from './equipmentProps';
import { FlareStack } from './FlareStack';
import { GasTurbine } from './GasTurbine';
import { HeatExchanger } from './HeatExchanger';
import { HorizontalVessel } from './HorizontalVessel';
import { PipeRack } from './PipeRack';
import type { PlantEquipment } from './plantLayout';
import { PumpSkid } from './PumpSkid';
import { ShutdownValve } from './ShutdownValve';
import { StorageTank } from './StorageTank';
import { VerticalVessel } from './VerticalVessel';

export type EquipmentModelProps = Pick<EquipmentProps, 'tone' | 'pulse' | 'selected' | 'hovered' | 'dimmed'> & {
  /** One entry of a `PlantLayout`: kind, position, rotation and scale. */
  equipment: PlantEquipment;
};

/** Renders the procedural model for a layout entry, so a scene can be driven entirely by data. */
export function EquipmentModel({ equipment, ...state }: EquipmentModelProps) {
  const placement = {
    position: equipment.position,
    rotation: [0, equipment.rotationY ?? 0, 0] as const,
    scale: equipment.scale ?? 1,
    ...state,
  };

  switch (equipment.kind) {
    case 'horizontal-vessel':
      return <HorizontalVessel {...placement} />;
    case 'vertical-vessel':
      return <VerticalVessel {...placement} />;
    case 'column':
      return <Column {...placement} />;
    case 'storage-tank':
      return <StorageTank {...placement} fill={equipment.fill} />;
    case 'compressor':
      return <CompressorSkid {...placement} />;
    case 'pump':
      return <PumpSkid {...placement} />;
    case 'heat-exchanger':
      return <HeatExchanger {...placement} />;
    case 'air-cooler':
      return <AirCooler {...placement} />;
    case 'turbine':
      return <GasTurbine {...placement} />;
    case 'valve':
      return <ShutdownValve {...placement} />;
    case 'flare':
      return <FlareStack {...placement} />;
    case 'building':
      return <Building {...placement} />;
    case 'control-room':
      return <Building {...placement} variant="control-room" />;
    case 'pipe-rack':
      return <PipeRack position={placement.position} rotation={placement.rotation} scale={placement.scale} dimmed={state.dimmed} length={equipment.length} />;
  }
}
