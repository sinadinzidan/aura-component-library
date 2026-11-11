import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GanttChart } from './GanttChart';
import { CONFLICT_TASKS, GANTT_TODAY, MAINTENANCE_WEEK_TASKS, TURNAROUND_TASKS } from './ganttFixtures';

function renderChart(props: Partial<Parameters<typeof GanttChart>[0]> = {}) {
  return render(
    <div style={{ height: 600 }}>
      <GanttChart tasks={TURNAROUND_TASKS} today={GANTT_TODAY} label="Turnaround plan" {...props} />
    </div>
  );
}

const bar = (name: RegExp | string) => within(screen.getByRole('group', { name: 'Turnaround plan, time grid' })).getByRole('button', { name });
const activity = () => screen.getByRole('status', { name: 'Chart activity' });

describe(GanttChart.name, () => {
  it('lists the tasks as an outline and draws a bar for each', () => {
    const { container } = renderChart();

    expect(within(screen.getByRole('list', { name: 'Tasks' })).getAllByRole('listitem')).toHaveLength(TURNAROUND_TASKS.length);
    expect(container.querySelectorAll('[data-slot="gantt-bar"]')).toHaveLength(TURNAROUND_TASKS.length);
    expect(container.querySelectorAll('[data-kind="milestone"]')).toHaveLength(2);
  });

  it('describes a bar with its dates, duration and progress', () => {
    renderChart();

    expect(bar(/^Shut down compression train, 12 Mar, 1 days, 60 percent complete/)).toBeInTheDocument();
    expect(bar(/^Turnaround starts, milestone, 16 Mar/)).toBeInTheDocument();
  });

  it('draws weekends, today and the dependencies', () => {
    const { container } = renderChart();

    expect(container.querySelectorAll('[data-slot="gantt-weekend"]').length).toBeGreaterThan(5);
    expect(container.querySelector('[data-slot="gantt-today"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-dependency]').length).toBeGreaterThan(15);
  });

  it('collapses and expands a group in the list and the grid', async () => {
    const { container } = renderChart();

    await userEvent.click(screen.getByRole('button', { name: 'Collapse Mechanical work' }));
    expect(container.querySelector('[data-task="ka1"]')).not.toBeInTheDocument();
    expect(activity()).toHaveTextContent('Mechanical work collapsed');

    await userEvent.click(screen.getByRole('button', { name: 'Expand Mechanical work' }));
    expect(container.querySelector('[data-task="ka1"]')).toBeInTheDocument();
  });

  it('selects a bar and shows the detail panel', async () => {
    renderChart();

    bar(/^Overhaul 1st stage compressor/).focus();
    await userEvent.keyboard('{Enter}');

    expect(screen.getByRole('complementary', { name: 'Overhaul 1st stage compressor' })).toBeInTheDocument();
  });

  it('moves the focused bar a day with the arrow keys and announces it', async () => {
    renderChart();

    bar(/^Overhaul 2nd stage compressor/).focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(activity()).toHaveTextContent('Moved Overhaul 2nd stage compressor, 17 Mar to 24 Mar.');
    expect(bar(/^Overhaul 2nd stage compressor, 17 Mar to 24 Mar/)).toBeInTheDocument();
  });

  it('changes the duration with Shift and the arrow keys', async () => {
    renderChart();

    bar(/^Overhaul 2nd stage compressor/).focus();
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');

    expect(bar(/^Overhaul 2nd stage compressor, 16 Mar to 24 Mar, 9 days/)).toBeInTheDocument();
  });

  it('refuses to start a task before its predecessor finishes and says why', async () => {
    renderChart();

    bar(/^Overhaul 1st stage compressor/).focus();
    await userEvent.keyboard('{ArrowLeft}');

    expect(screen.getByRole('alert')).toHaveTextContent('cannot start before Turnaround starts finishes. Earliest start is 16 Mar.');
    expect(bar(/^Overhaul 1st stage compressor, 16 Mar to 25 Mar/)).toBeInTheDocument();
  });

  it('pushes later tasks when a bar is lengthened', async () => {
    renderChart();

    bar(/^Overhaul 1st stage compressor/).focus();
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');

    expect(activity()).toHaveTextContent(/later tasks pushed/);
  });

  it('undoes with the button and with Ctrl+Z', async () => {
    renderChart();

    bar(/^Overhaul 2nd stage compressor/).focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(bar(/^Overhaul 2nd stage compressor, 17 Mar/)).toBeInTheDocument();

    bar(/^Overhaul 2nd stage compressor/).focus();
    await userEvent.keyboard('{Control>}z{/Control}');
    expect(bar(/^Overhaul 2nd stage compressor, 16 Mar to 23 Mar/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('drags a bar by whole days with the pointer', () => {
    renderChart();
    const target = bar(/^Overhaul 2nd stage compressor/);

    fireEvent.pointerDown(target, { clientX: 100, pointerId: 1, button: 0 });
    fireEvent.pointerMove(target, { clientX: 190, pointerId: 1 });
    fireEvent.pointerUp(target, { clientX: 190, pointerId: 1 });

    expect(bar(/^Overhaul 2nd stage compressor, 18 Mar to 25 Mar/)).toBeInTheDocument();
  });

  it('resizes from the end handle with the pointer', () => {
    const { container } = renderChart();
    const handle = container.querySelector('[data-task="ka2"] [data-handle="end"]');
    expect(handle).not.toBeNull();
    if (!handle) return;
    const target = bar(/^Overhaul 2nd stage compressor/);

    fireEvent.pointerDown(handle, { clientX: 500, pointerId: 2, button: 0 });
    fireEvent.pointerMove(target, { clientX: 580, pointerId: 2 });
    fireEvent.pointerUp(target, { clientX: 580, pointerId: 2 });

    expect(bar(/^Overhaul 2nd stage compressor, 16 Mar to 25 Mar, 10 days/)).toBeInTheDocument();
  });

  it('cancels a drag with Escape', () => {
    renderChart();
    const target = bar(/^Overhaul 2nd stage compressor/);

    fireEvent.pointerDown(target, { clientX: 100, pointerId: 3, button: 0 });
    fireEvent.pointerMove(target, { clientX: 220, pointerId: 3 });
    fireEvent.keyDown(target, { key: 'Escape' });

    expect(activity()).toHaveTextContent('Change cancelled');
    expect(bar(/^Overhaul 2nd stage compressor, 16 Mar to 23 Mar/)).toBeInTheDocument();
  });

  it('highlights the critical path on demand, in words as well as colour', async () => {
    const { container } = renderChart();
    expect(container.querySelector('[data-critical="true"]')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Critical path/ }));

    expect(container.querySelectorAll('[data-critical="true"]').length).toBeGreaterThan(5);
    expect(screen.getAllByText('Critical').length).toBeGreaterThan(5);
    expect(bar(/^Overhaul 1st stage compressor.*on the critical path/)).toBeInTheDocument();
  });

  it('shows baseline bars on demand and names the slip', async () => {
    const { container } = renderChart();
    expect(container.querySelector('[data-slot="gantt-baseline"]')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Baseline/ }));

    expect(container.querySelectorAll('[data-slot="gantt-baseline"]').length).toBeGreaterThan(10);
    expect(bar(/^Shut down compression train.*2 days later than baseline/)).toBeInTheDocument();
  });

  it('marks a task that breaks a dependency', () => {
    const { container } = renderChart({ tasks: CONFLICT_TASKS });

    expect(container.querySelector('[data-conflict="true"]')).toHaveAttribute('data-task', 'ka2');
    expect(container.querySelector('[data-broken="true"]')).toBeInTheDocument();
    expect(screen.getByText('Starts before a predecessor finishes')).toBeInTheDocument();
  });

  it('changes zoom and the width of the grid', async () => {
    const { container } = renderChart();
    const before = container.querySelector('[data-slot="gantt-grid"]')?.getAttribute('width');

    await userEvent.click(screen.getByRole('tab', { name: 'Month' }));

    expect(container.querySelector('[data-slot="gantt-grid"]')?.getAttribute('width')).not.toBe(before);
    expect(activity()).toHaveTextContent('Zoom: months');
  });

  it('cannot be changed when read-only, but still selects', async () => {
    renderChart({ readOnly: true });

    expect(screen.getByText('Read-only')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
    bar(/^Overhaul 2nd stage compressor/).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(bar(/^Overhaul 2nd stage compressor, 16 Mar to 23 Mar/)).toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('is a plain timeline when compact', () => {
    const { container } = renderChart({ tasks: MAINTENANCE_WEEK_TASKS, variant: 'compact' });

    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Critical path/ })).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="gantt-bar"]')).toHaveLength(MAINTENANCE_WEEK_TASKS.length);
  });

  it('can hide the task list', () => {
    renderChart({ hideList: true });

    expect(screen.queryByRole('list', { name: 'Tasks' })).not.toBeInTheDocument();
  });

  it('says so when the plan is empty', () => {
    renderChart({ tasks: [] });

    expect(screen.getByText('This plan has no tasks yet.')).toBeInTheDocument();
  });
});
