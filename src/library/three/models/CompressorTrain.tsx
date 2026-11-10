import type { ReactNode } from 'react';

import type { Vec3 } from '../cameraTargets';
import type { EquipmentVisualState } from '../equipmentMaterials';
import type { SceneTone } from '../scenePalette';
import { Selectable } from '../Selectable';

import { BarrelCasing } from './BarrelCasing';
import { BearingHousing } from './BearingHousing';
import { COMPRESSOR_TRAIN_EXPLODE, TRAIN_ASSEMBLY_IDS, isTrainAssemblyId } from './compressorTrainLayout';
import type { TrainAssemblyId } from './compressorTrainLayout';
import { CouplingGuard } from './CouplingGuard';
import { ExplodeGroup } from './ExplodeGroup';
import { explodeOffsets } from './explodeOffsets';
import { Hotspot } from './Hotspot';
import { InstrumentStand } from './InstrumentStand';
import { LubeOilSkid } from './LubeOilSkid';
import { RotorBundle } from './RotorBundle';
import { SealGasPanel } from './SealGasPanel';
import { TrainBaseFrame } from './TrainBaseFrame';
import { TrainGearbox } from './TrainGearbox';
import { TurbineDriver } from './TurbineDriver';

/** A numbered measurement point mounted on one sub-assembly; it travels with that part when exploded. */
export type CompressorTrainHotspot = {
  id: string;
  index: number;
  assemblyId: TrainAssemblyId;
  /** Assembled position, in the train's coordinates. */
  position: Vec3;
  tag: string;
  value?: string;
  tone?: SceneTone;
  pulse?: boolean;
};

export type CompressorTrainProps = {
  /** 0 is assembled, 1 fully exploded along the shaft axis. */
  explode?: number;
  /** Removes the top half of the barrel casing to show the impellers. */
  sectionCut?: boolean;
  /** Sub-assemblies that stay solid while the rest are ghosted. `null` keeps everything solid. */
  activeIds?: readonly string[] | null;
  /** Sub-assemblies lit as hovered from outside the scene, e.g. from a parts tree. */
  hoveredIds?: readonly string[];
  /** Sub-assemblies drawn as selected. */
  selectedIds?: readonly string[];
  onSelect?: (id: TrainAssemblyId) => void;
  onHoverChange?: (id: TrainAssemblyId | null) => void;
  hotspots?: readonly CompressorTrainHotspot[];
  selectedHotspotId?: string | null;
  onSelectHotspot?: (id: string) => void;
};

function renderPart(id: TrainAssemblyId, state: EquipmentVisualState, sectionCut: boolean): ReactNode {
  switch (id) {
    case 'turbine':
      return <TurbineDriver {...state} />;
    case 'gearbox':
      return <TrainGearbox {...state} />;
    case 'coupling':
      return <CouplingGuard {...state} />;
    case 'casing':
      return <BarrelCasing {...state} sectionCut={sectionCut} />;
    case 'rotor':
      return <RotorBundle {...state} />;
    case 'bearing-de':
      return <BearingHousing x={-1.8} {...state} />;
    case 'bearing-nde':
      return <BearingHousing x={-7.1} endCap {...state} />;
    case 'seal-gas':
      return <SealGasPanel {...state} />;
    case 'lube-oil':
      return <LubeOilSkid {...state} />;
    case 'instruments':
      return (
        <>
          <InstrumentStand x={-5.6} z={2.3} {...state} />
          <InstrumentStand x={-3.4} z={2.3} transmitters={2} {...state} />
          <InstrumentStand x={-1.8} z={2.3} {...state} />
        </>
      );
    case 'base-frame':
      return <TrainBaseFrame {...state} />;
  }
}

/**
 * A centrifugal compressor train in detail, built from eleven sub-assemblies: gas turbine driver,
 * gearbox, coupling, barrel casing, rotor, two bearings, seal gas panel, lube oil skid,
 * instrument stands and base frame. It can be exploded along the shaft, sectioned, and have any
 * set of parts isolated; numbered hotspots ride on the parts they measure. The shaft runs along x
 * and the train stands on the ground at the origin.
 */
export function CompressorTrain({
  explode = 0,
  sectionCut = false,
  activeIds = null,
  hoveredIds = [],
  selectedIds = [],
  onSelect,
  onHoverChange,
  hotspots = [],
  selectedHotspotId = null,
  onSelectHotspot,
}: CompressorTrainProps) {
  const offsets = explodeOffsets(COMPRESSOR_TRAIN_EXPLODE, explode);

  return (
    <group>
      {TRAIN_ASSEMBLY_IDS.map((id) => {
        const ghosted = activeIds !== null && !activeIds.includes(id);
        return (
          <ExplodeGroup key={id} offset={offsets[id]}>
            <Selectable
              id={id}
              selected={selectedIds.includes(id)}
              onSelect={onSelect ? (selected) => (isTrainAssemblyId(selected) ? onSelect(selected) : undefined) : undefined}
              onHoverChange={onHoverChange ? (hovered) => onHoverChange(hovered !== null && isTrainAssemblyId(hovered) ? hovered : null) : undefined}
            >
              {(state) => renderPart(id, { hovered: state.hovered || hoveredIds.includes(id), selected: state.selected, dimmed: ghosted }, sectionCut)}
            </Selectable>
            {hotspots
              .filter((hotspot) => hotspot.assemblyId === id)
              .map((hotspot) => (
                <Hotspot
                  key={hotspot.id}
                  position={hotspot.position}
                  index={hotspot.index}
                  tag={hotspot.tag}
                  value={hotspot.value}
                  tone={hotspot.tone}
                  pulse={hotspot.pulse}
                  selected={hotspot.id === selectedHotspotId}
                  dimmed={ghosted}
                  onSelect={onSelectHotspot ? () => onSelectHotspot(hotspot.id) : undefined}
                />
              ))}
          </ExplodeGroup>
        );
      })}
    </group>
  );
}
