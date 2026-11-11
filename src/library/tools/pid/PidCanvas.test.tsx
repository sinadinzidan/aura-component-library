import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PID_FIXTURE, PID_FIXTURE_ALARMS, PID_FIXTURE_READINGS } from './pidFixture';
import { ALL_LAYERS_ON } from './pidModel';
import { PidCanvas } from './PidCanvas';

function renderCanvas(props: Partial<Parameters<typeof PidCanvas>[0]> = {}) {
  return render(
    <svg>
      <PidCanvas drawing={PID_FIXTURE} readings={PID_FIXTURE_READINGS} alarms={PID_FIXTURE_ALARMS} {...props} />
    </svg>
  );
}

describe(PidCanvas.name, () => {
  it('draws equipment, a valve, instruments and lines', () => {
    const { container } = renderCanvas();

    expect(screen.getByRole('img', { name: '20-VA-1001 Inlet separator, running' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /23-HV-9105, open/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '23-PT-92530 Suction pressure' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="pipe-line"]')).toHaveLength(2);
    expect(screen.getByText('8"-PG-23-1004')).toBeInTheDocument();
  });

  it('shows live values with a letter flag when outside a limit', () => {
    const { container } = renderCanvas();

    const flags = [...container.querySelectorAll('[data-slot="value-tag-flag"]')].map((node) => node.textContent);
    expect(flags).toEqual(['H']);
    expect(screen.getByText('146.3')).toBeInTheDocument();
  });

  it('rings the worst alarm on each tag, once, with the severity in the tooltip', () => {
    const { container } = renderCanvas();

    const alarms = container.querySelectorAll('[data-slot="pid-alarm"]');
    expect(alarms).toHaveLength(2);
    expect([...alarms].map((alarm) => alarm.getAttribute('data-severity')).sort()).toEqual(['critical', 'high']);
    expect(screen.getByText('Critical alarm on 23-KA-9101: Compressor vibration trip')).toBeInTheDocument();
  });

  it('hides whole layers', () => {
    const { container } = renderCanvas({ layers: { ...ALL_LAYERS_ON, lines: false, values: false, alarms: false, annotations: false } });

    expect(container.querySelector('[data-slot="pipe-line"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="value-tag"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="pid-alarm"]')).not.toBeInTheDocument();
    expect(screen.queryByText(/Note 1/)).not.toBeInTheDocument();
  });

  it('removes instruments, their values and their alarms with the instrument layer', () => {
    const { container } = renderCanvas({ layers: { ...ALL_LAYERS_ON, instruments: false } });

    expect(screen.queryByRole('img', { name: /Suction pressure/ })).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="value-tag"]')).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="pid-alarm"]')).toHaveLength(1);
  });

  it('is only a picture without onSelect', () => {
    renderCanvas();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('selects a tag, a line and a pin', async () => {
    const onSelect = vi.fn();
    renderCanvas({ onSelect, pins: [{ id: 'pin-1', x: 50, y: 50, note: 'Check flange' }] });

    await userEvent.click(screen.getByRole('button', { name: '23-KA-9101, 1st stage compressor' }));
    await userEvent.click(screen.getByRole('button', { name: 'Line 8"-PG-23-1004, Process gas' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pin 1: Check flange' }));

    expect(onSelect.mock.calls).toEqual([[{ kind: 'tag', id: 'ka-9101' }], [{ kind: 'line', id: 'l-1004' }], [{ kind: 'pin', id: 'pin-1' }]]);
  });

  it('selects from the keyboard with Enter', async () => {
    const onSelect = vi.fn();
    renderCanvas({ onSelect });

    screen.getByRole('button', { name: '20-VA-1001, Inlet separator' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith({ kind: 'tag', id: 'va-1001' });
  });

  it('marks the selected tag and the selected line', () => {
    const { container } = renderCanvas({ onSelect: vi.fn(), selection: { kind: 'tag', id: 'ka-9101' } });

    expect(container.querySelector('[data-slot="pid-selection-ring"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '23-KA-9101, 1st stage compressor' })).toHaveAttribute('aria-pressed', 'true');

    const lineSelected = renderCanvas({ selection: { kind: 'line', id: 'l-1004' } });
    expect(lineSelected.container.querySelector('[data-line="l-1004"]')).toHaveAttribute('data-selected', 'true');
  });
});
