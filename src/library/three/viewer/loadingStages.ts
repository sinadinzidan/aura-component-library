/** Stages of loading a 3D model and the overall progress they add up to. */
export type StageState = 'pending' | 'active' | 'done' | 'error';

export type LoadingStage = {
  id: string;
  label: string;
  state: StageState;
  /** What it is doing: "12 of 48 geometry files". */
  detail?: string;
  /** Share of the whole load this stage accounts for. */
  weight: number;
};

export const DEFAULT_STAGES: readonly Omit<LoadingStage, 'state' | 'detail'>[] = [
  { id: 'index', label: 'Reading model index', weight: 1 },
  { id: 'geometry', label: 'Fetching geometry', weight: 6 },
  { id: 'scene', label: 'Building the scene', weight: 2 },
  { id: 'ready', label: 'Preparing the first view', weight: 1 },
];

/** Overall progress, 0–100: finished stages count in full and the active one by its own fraction. */
export function overallProgress(stages: readonly LoadingStage[], activeFraction = 0): number {
  const total = stages.reduce((sum, stage) => sum + stage.weight, 0);
  if (total === 0) return 0;
  const done = stages.reduce((sum, stage) => sum + (stage.state === 'done' ? stage.weight : stage.state === 'active' ? stage.weight * Math.min(1, Math.max(0, activeFraction)) : 0), 0);
  return Math.round((done / total) * 100);
}

/** Stages as they stand when the one at `index` is active, with `activeFraction` of it done. Past the end all are done. */
export function stagesAt(index: number, details: Readonly<Record<string, string>> = {}): LoadingStage[] {
  return DEFAULT_STAGES.map((stage, position) => ({ ...stage, state: position < index ? 'done' : position === index ? 'active' : 'pending', detail: details[stage.id] }));
}

export function failedAt(stages: readonly LoadingStage[], id: string, detail: string): LoadingStage[] {
  return stages.map((stage) => (stage.id === id ? { ...stage, state: 'error', detail } : stage));
}

/** The one-line status: "Fetching geometry, 62 %". */
export function describeLoading(stages: readonly LoadingStage[], activeFraction = 0): string {
  const failed = stages.find((stage) => stage.state === 'error');
  if (failed) return `${failed.label} failed`;
  const active = stages.find((stage) => stage.state === 'active');
  if (!active) return stages.every((stage) => stage.state === 'done') ? 'Model ready' : 'Waiting to start';
  return `${active.label}, ${overallProgress(stages, activeFraction)} %`;
}
