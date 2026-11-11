import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DashboardEditor } from './DashboardEditor';
import type { DashboardWidgetType } from './DashboardEditor';
import type { EditorWidget } from './editorReducer';

const TYPES: DashboardWidgetType[] = [
  { type: 'kpi', label: 'KPI', description: 'One number.', w: 4, h: 2, render: (widget) => <p>{widget.title} value</p> },
  { type: 'trend', label: 'Trend chart', description: 'One tag over time.', w: 6, h: 3, hasRange: true, render: (widget) => <p>{`${widget.title} over ${widget.range}`}</p> },
];

const WIDGETS: EditorWidget[] = [
  { id: 'a', type: 'kpi', title: 'Availability', range: '24h', x: 0, y: 0, w: 4, h: 2 },
  { id: 'b', type: 'trend', title: 'Discharge pressure', range: '24h', x: 4, y: 0, w: 8, h: 3 },
];

const SIZES = [{ id: 'm', label: 'Medium', w: 4, h: 3 }];
const RANGES = [
  { value: '8h', label: 'Last 8 hours' },
  { value: '24h', label: 'Last 24 hours' },
];

function setup(props: Partial<Parameters<typeof DashboardEditor>[0]> = {}) {
  return render(<DashboardEditor title="Gas compression" widgetTypes={TYPES} initialWidgets={WIDGETS} sizes={SIZES} ranges={RANGES} defaultMode="edit" layout="grid" {...props} />);
}

const tile = (title: string) => screen.getByRole('group', { name: new RegExp(`^${title} widget`) });

describe(DashboardEditor.name, () => {
  it('shows the widgets without handles in view mode', () => {
    const { container } = setup({ defaultMode: 'view' });

    expect(screen.getByText('Availability value')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="widget-chrome"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Edit dashboard' })).toBeInTheDocument();
  });

  it('switches to edit mode and back', async () => {
    const { container } = setup({ defaultMode: 'view' });

    await userEvent.click(screen.getByRole('button', { name: 'Edit dashboard' }));
    expect(container.querySelectorAll('[data-slot="widget-chrome"]')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Done editing' }));
    expect(container.querySelector('[data-slot="widget-chrome"]')).toBeNull();
  });

  it('adds a widget from the list and announces where it went', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Add widget' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add KPI' }));

    expect(screen.getByRole('group', { name: 'KPI widget, column 1, row 3, 4 wide by 2 tall' })).toBeInTheDocument();
    expect(screen.getByText('Added KPI at column 1, row 3, 4 wide by 2 tall.')).toBeInTheDocument();
  });

  it('removes and duplicates a widget from its actions', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Duplicate Availability' }));
    expect(screen.getByText('Availability copy value')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Remove Availability' }));
    expect(screen.queryByText('Availability value')).not.toBeInTheDocument();
  });

  it('moves a widget with the keyboard and undoes it with Ctrl+Z', () => {
    setup();

    fireEvent.keyDown(tile('Availability'), { key: 'ArrowDown' });
    expect(tile('Availability')).toHaveAccessibleName('Availability widget, column 1, row 2, 4 wide by 2 tall');

    fireEvent.keyDown(tile('Availability'), { key: 'z', ctrlKey: true });
    expect(tile('Availability')).toHaveAccessibleName('Availability widget, column 1, row 1, 4 wide by 2 tall');
  });

  it('undoes and redoes from the toolbar', async () => {
    setup();
    fireEvent.keyDown(tile('Availability'), { key: 'Delete' });

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText('Availability value')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(screen.queryByText('Availability value')).not.toBeInTheDocument();
  });

  it('counts unsaved changes and clears them on save', async () => {
    setup();
    fireEvent.keyDown(tile('Availability'), { key: 'Delete' });

    const bar = screen.getByRole('region', { name: 'Unsaved changes' });
    expect(within(bar).getByRole('status')).toHaveTextContent('1 unsaved change');

    await userEvent.click(within(bar).getByRole('button', { name: 'Save dashboard' }));
    expect(screen.queryByRole('region', { name: 'Unsaved changes' })).not.toBeInTheDocument();
  });

  it('restores the saved dashboard on discard', async () => {
    setup();
    fireEvent.keyDown(tile('Availability'), { key: 'Delete' });

    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));

    expect(screen.getByText('Availability value')).toBeInTheDocument();
  });

  it('resets to the default layout', async () => {
    setup();
    fireEvent.keyDown(tile('Availability'), { key: 'Delete' });

    await userEvent.click(screen.getByRole('button', { name: 'Reset layout' }));

    expect(screen.getByText('Availability value')).toBeInTheDocument();
  });

  it('applies settings from the popover', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Edit settings for Availability' }));
    const title = await screen.findByLabelText('Title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Uptime');
    await userEvent.click(screen.getByRole('button', { name: 'Apply settings' }));

    expect(screen.getByText('Uptime value')).toBeInTheDocument();
  });

  it('prompts for a first widget when the dashboard is empty', async () => {
    setup({ initialWidgets: [] });

    await userEvent.click(within(screen.getByRole('group', { name: 'Suggested widgets' })).getByRole('button', { name: 'Trend chart' }));

    expect(screen.getByText('Trend chart over 8h')).toBeInTheDocument();
  });

  it('cannot be edited when read-only and says why', () => {
    const { container } = setup({ readOnlyReason: 'Shared by Liv Wold.' });

    expect(screen.getByText('Shared by Liv Wold.')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="widget-chrome"]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit dashboard' })).not.toBeInTheDocument();
  });

  it('stacks the widgets in one column and turns arranging off', () => {
    const { container } = setup({ layout: 'stacked' });

    expect(screen.getByText(/Widgets are stacked at this width/)).toBeInTheDocument();
    expect(container.querySelector('[data-slot="widget-chrome"]')).toBeNull();
    expect(screen.getByRole('group', { name: 'Discharge pressure' }).style.gridRow).toBe('3 / span 3');
  });

  it('applies a layout preset', async () => {
    setup({
      presets: [{ id: 'wall', name: 'Wall board', description: 'One big trend.', widgets: [{ id: 'p1', type: 'trend', title: 'Export flow', range: '24h', x: 0, y: 0, w: 12, h: 4 }] }],
    });

    await userEvent.click(screen.getByRole('button', { name: 'Add widget' }));
    await userEvent.click(screen.getByRole('tab', { name: 'Layouts' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Apply Wall board layout' }));

    expect(screen.getByText('Export flow over 24h')).toBeInTheDocument();
    expect(screen.queryByText('Availability value')).not.toBeInTheDocument();
  });
});
