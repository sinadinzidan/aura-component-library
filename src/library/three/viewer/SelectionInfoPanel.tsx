import { cn } from '../../../lib/utils';
import { MetadataList } from '../../display/MetadataList';
import { formatValue, healthStatus, runStateStatus } from '../../industrial/status';
import { StatusIndicator } from '../../industrial/StatusIndicator';

import { systemLabel } from './colorBy';
import { partBounds } from './viewerModel';
import type { ViewerPart } from './viewerModel';

export type SelectionInfoPanelProps = {
  part: ViewerPart | null;
  className?: string;
};

/** Properties of the part selected in the viewer: name and tag, run state and health in words, size and a note. */
export function SelectionInfoPanel({ part, className }: SelectionInfoPanelProps) {
  if (!part) {
    return (
      <div data-slot="selection-info-panel" className={cn('flex flex-col gap-1', className)}>
        <p className="text-sm font-medium text-base-foreground">Nothing selected</p>
        <p className="text-sm text-muted-foreground">Click a part in the model, or choose one in the structure, to see its properties.</p>
      </div>
    );
  }
  const box = partBounds(part);
  const size = [0, 1, 2].map((axis) => formatValue(box.max[axis] - box.min[axis], 1));
  const run = part.status === 'tripped' ? runStateStatus('tripped') : part.status === 'stopped' ? runStateStatus('stopped') : part.status === 'standby' ? runStateStatus('standby') : runStateStatus('running');

  return (
    <div data-slot="selection-info-panel" className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-base-foreground">{part.name}</span>
        <span className="font-mono text-xs text-muted-foreground">{part.tag}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <StatusIndicator {...run} size="sm" />
        <StatusIndicator {...healthStatus(part.health)} label={`Health ${healthStatus(part.health).label.toLowerCase()}`} size="sm" />
      </div>
      <MetadataList
        items={[
          { label: 'System', value: systemLabel(part.system) },
          { label: 'Size (x, y, z)', value: <span className="tabular-nums">{size.join(' × ')} m</span> },
        ]}
      />
      <p className="text-sm text-medium-foreground">{part.note}</p>
    </div>
  );
}
