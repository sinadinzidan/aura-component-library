import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PID_FIXTURE, PID_FIXTURE_ALARMS, PID_FIXTURE_DOCUMENTS, PID_FIXTURE_READINGS } from './pidFixture';
import { PidViewer } from './PidViewer';

function renderViewer(props: Partial<Parameters<typeof PidViewer>[0]> = {}) {
  return render(
    <div style={{ height: 600 }}>
      <PidViewer drawing={PID_FIXTURE} readings={PID_FIXTURE_READINGS} alarms={PID_FIXTURE_ALARMS} documents={PID_FIXTURE_DOCUMENTS} animate={false} {...props} />
    </div>
  );
}

const activity = () => screen.getByRole('status', { name: '' });
const zoomLevel = () => screen.getByRole('status', { name: 'Zoom level' }).textContent;

describe(PidViewer.name, () => {
  it('shows the drawing, the revision stamp and the title block', () => {
    renderViewer();

    expect(screen.getByRole('group', { name: /^NK-23-PID-0001, Compression test loop/ })).toBeInTheDocument();
    expect(screen.getByText('REV B')).toBeInTheDocument();
    expect(screen.getByLabelText('Title block')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mini-map of NK-23-PID-0001' })).toBeInTheDocument();
  });

  it('opens the side panel with value, limits, alarms and documents when a tag is clicked', async () => {
    renderViewer();

    await userEvent.click(screen.getByRole('button', { name: '23-TT-92532, Discharge temperature' }));

    const panel = screen.getByRole('complementary', { name: '23-TT-92532' });
    expect(within(panel).getByText('146.3')).toBeInTheDocument();
    expect(within(panel).getByText('High (H)')).toBeInTheDocument();
    expect(within(panel).getByText('High-high (trip)')).toBeInTheDocument();
    expect(within(panel).getByText('Discharge temperature high')).toBeInTheDocument();
    expect(within(panel).getByText('Loop diagram 92532')).toBeInTheDocument();
  });

  it('lists the measurements of equipment in its panel and jumps to one', async () => {
    renderViewer();

    await userEvent.click(screen.getByRole('button', { name: '23-KA-9101, 1st stage compressor' }));
    const panel = screen.getByRole('complementary', { name: '23-KA-9101' });
    await userEvent.click(within(panel).getByRole('button', { name: /Suction pressure/ }));

    expect(screen.getByRole('complementary', { name: '23-PT-92530' })).toBeInTheDocument();
  });

  it('closes the panel with its button and with Escape', async () => {
    renderViewer();

    await userEvent.click(screen.getByRole('button', { name: '23-KA-9101, 1st stage compressor' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close panel' }));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '23-KA-9101, 1st stage compressor' }));
    screen.getByRole('group', { name: /^NK-23-PID-0001/ }).focus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('finds a tag, selects it and announces where it went', async () => {
    renderViewer();

    await userEvent.type(screen.getByRole('combobox', { name: 'Find a tag' }), 'pt92530');
    await userEvent.keyboard('{Enter}');

    expect(screen.getByRole('complementary', { name: '23-PT-92530' })).toBeInTheDocument();
  });

  it('zooms with the keyboard and the toolbar, and fits again', async () => {
    renderViewer();
    const group = screen.getByRole('group', { name: /^NK-23-PID-0001/ });
    const fitted = zoomLevel();

    group.focus();
    await userEvent.keyboard('+');
    const zoomed = zoomLevel();
    expect(zoomed).not.toBe(fitted);

    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fit to screen' }));
    expect(zoomLevel()).toBe(fitted);
  });

  it('pans with the arrow keys and announces nothing it did not do', async () => {
    renderViewer();
    const group = screen.getByRole('group', { name: /^NK-23-PID-0001/ });

    group.focus();
    await userEvent.keyboard('{ArrowLeft}');

    expect(group).toBeInTheDocument();
  });

  it('toggles a layer and says so', async () => {
    const { container } = renderViewer();

    await userEvent.click(screen.getByRole('button', { name: /Live values/ }));

    expect(container.querySelector('[data-slot="value-tag"]')).not.toBeInTheDocument();
    expect(screen.getByText('Live values hidden')).toBeInTheDocument();
  });

  it('adds a pin in pin mode, notes it and removes it again', async () => {
    renderViewer();

    await userEvent.click(screen.getByRole('button', { name: 'Add pin' }));
    screen.getByRole('group', { name: /^NK-23-PID-0001/ }).focus();
    await userEvent.keyboard('{Enter}');

    expect(screen.getByRole('button', { name: 'Pin 1' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Note'), 'Check gasket');
    expect(screen.getByRole('button', { name: 'Pin 1: Check gasket' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Remove pin/ }));
    expect(screen.queryByRole('button', { name: /^Pin 1/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Undo pin change' }));
    expect(screen.getByRole('button', { name: /^Pin 1/ })).toBeInTheDocument();
  });

  it('is read-only without pin tools but keeps tags clickable', async () => {
    renderViewer({ readOnly: true });

    expect(screen.getByText('Read-only')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add pin' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '23-KA-9101, 1st stage compressor' }));
    expect(screen.getByRole('complementary', { name: '23-KA-9101' })).toBeInTheDocument();
  });

  it('summarises the selection in one line when compact', async () => {
    renderViewer({ variant: 'compact' });

    await userEvent.click(screen.getByRole('button', { name: '23-TT-92532, Discharge temperature' }));

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.getByText(/23-TT-92532 · Discharge temperature · 146\.3.*°C H/)).toBeInTheDocument();
  });

  it('highlights a selected line and names it in the panel', async () => {
    const { container } = renderViewer();

    await userEvent.click(screen.getByRole('button', { name: 'Line 8"-PG-23-1004, Process gas' }));

    expect(container.querySelector('[data-line="l-1004"]')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByRole('complementary', { name: '8"-PG-23-1004' })).toBeInTheDocument();
  });

  it('starts with a given selection and layers', () => {
    renderViewer({ initialSelection: { kind: 'tag', id: 'ka-9101' }, initialLayers: { alarms: false } });

    expect(screen.getByRole('complementary', { name: '23-KA-9101' })).toBeInTheDocument();
    expect(activity()).toBeInTheDocument();
  });
});
