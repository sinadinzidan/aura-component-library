import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GanttDetailPanel } from './GanttDetailPanel';
import { CONFLICT_TASKS, TURNAROUND_TASKS } from './ganttFixtures';
import { byId, criticalPath, findConflicts, rollUp } from './ganttScheduler';

function renderPanel(id: string, tasks = TURNAROUND_TASKS, onClose = vi.fn()) {
  const task = byId(tasks).get(id);
  if (!task) throw new Error(id);
  const path = criticalPath(tasks);
  const span = rollUp(tasks).get(id);
  if (!span) throw new Error(id);
  return render(<GanttDetailPanel task={task} tasks={tasks} span={span} critical={path.critical.has(id)} float={path.float.get(id)} conflicts={findConflicts(tasks)} onClose={onClose} />);
}

describe(GanttDetailPanel.name, () => {
  it('shows dates, duration, progress and crew', () => {
    renderPanel('ka1');

    expect(screen.getByRole('complementary', { name: 'Overhaul 1st stage compressor' })).toBeInTheDocument();
    expect(screen.getByText('16 Mar to 25 Mar')).toBeInTheDocument();
    expect(screen.getByText('10 days')).toBeInTheDocument();
    expect(screen.getByText('Rotating crew')).toBeInTheDocument();
  });

  it('marks critical tasks in words and shows float for others', () => {
    renderPanel('ka1');
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('shows slip against the baseline', () => {
    renderPanel('shut');
    expect(screen.getByText(/\+2 days \(baseline 10 Mar\)/)).toBeInTheDocument();
  });

  it('lists predecessors and successors', () => {
    renderPanel('depr');
    expect(screen.getByText('Shut down compression train')).toBeInTheDocument();
    expect(screen.getByText('Lock out and tag out')).toBeInTheDocument();
  });

  it('explains a broken dependency', () => {
    renderPanel('ka2', CONFLICT_TASKS);
    expect(screen.getByRole('alert')).toHaveTextContent('Starts 2 days before Turnaround starts finishes.');
  });

  it('describes a milestone and closes', async () => {
    const onClose = vi.fn();
    renderPanel('start', TURNAROUND_TASKS, onClose);

    expect(screen.getByText('Milestone', { selector: 'p' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close panel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
