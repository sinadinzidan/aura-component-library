import { ToggleGroup } from '../../actions/ToggleGroup';

import { PID_LAYERS } from './pidModel';
import type { PidLayer, PidLayers } from './pidModel';

export type PidLayerTogglesProps = {
  layers: PidLayers;
  onToggle: (layer: PidLayer) => void;
  /** Number of open alarms, shown on the alarm layer. */
  alarmCount?: number;
  /** Number of pins and notes, shown on the annotation layer. */
  annotationCount?: number;
  size?: 'sm' | 'default';
  disabled?: boolean;
};

const isLayer = (value: string): value is PidLayer => PID_LAYERS.some((layer) => layer.id === value);

/**
 * The layer switch of a P&ID viewer: process lines, instruments, live values, alarms and
 * annotations, each on or off. Equipment has no switch; a drawing without it is not a drawing.
 */
export function PidLayerToggles({ layers, onToggle, alarmCount, annotationCount, size = 'sm', disabled = false }: PidLayerTogglesProps) {
  const pressed = PID_LAYERS.filter((layer) => layers[layer.id]).map((layer) => layer.id);
  const counts: Partial<Record<PidLayer, number | undefined>> = { alarms: alarmCount || undefined, annotations: annotationCount || undefined };

  const change = (next: string[]) => {
    const changed = PID_LAYERS.find((layer) => next.includes(layer.id) !== layers[layer.id]);
    if (changed && isLayer(changed.id)) onToggle(changed.id);
  };

  return (
    <ToggleGroup
      label="Layers"
      size={size}
      disabled={disabled}
      value={pressed}
      onValueChange={change}
      options={PID_LAYERS.map((layer) => ({ value: layer.id, label: layer.label, count: counts[layer.id] }))}
    />
  );
}
