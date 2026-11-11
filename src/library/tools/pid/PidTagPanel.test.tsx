import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PID_FIXTURE_ALARMS, PID_FIXTURE_DOCUMENTS } from './pidFixture';
import { alarmsFor, documentsFor } from './pidModel';
import { PidTagPanel } from './PidTagPanel';
import type { PidPanelReading } from './PidTagPanel';

const READING: PidPanelReading = {
  id: 'tt-92532',
  tag: '23-TT-92532',
  name: 'Discharge temperature',
  value: 146.3,
  unit: '°C',
  decimals: 1,
  limits: { low: 90, high: 145, highHigh: 155 },
};

const INSTRUMENT = { id: 'tt-92532', tag: '23-TT-92532', name: 'Discharge temperature', kind: 'instrument' as const };
const EQUIPMENT = { id: 'ka-9101', tag: '23-KA-9101', name: '1st stage compressor', kind: 'equipment' as const };

describe(PidTagPanel.name, () => {
  it('names the tag and shows the live value with its limit state', () => {
    render(<PidTagPanel tag={INSTRUMENT} reading={READING} />);

    expect(screen.getByRole('complementary', { name: '23-TT-92532' })).toBeInTheDocument();
    expect(screen.getByText('Discharge temperature · Instrument')).toBeInTheDocument();
    expect(screen.getByText('146.3')).toBeInTheDocument();
    expect(screen.getByText('High (H)')).toBeInTheDocument();
  });

  it('lists only the limits that are set', () => {
    render(<PidTagPanel tag={INSTRUMENT} reading={READING} />);

    expect(screen.getByText('High-high (trip)')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.queryByText('Low-low (trip)')).not.toBeInTheDocument();
  });

  it('draws a trend when values are given', () => {
    render(<PidTagPanel tag={INSTRUMENT} reading={READING} trend={[140, 142, 146.3]} />);

    expect(screen.getByRole('img', { name: /Discharge temperature, last 24 hours/ })).toBeInTheDocument();
  });

  it('lists open alarms with severity in words, or says there are none', () => {
    const { rerender } = render(<PidTagPanel tag={EQUIPMENT} alarms={alarmsFor(PID_FIXTURE_ALARMS, 'ka-9101')} />);

    expect(screen.getByText('Compressor vibration trip')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Active, 2 min ago')).toBeInTheDocument();

    rerender(<PidTagPanel tag={EQUIPMENT} />);
    expect(screen.getByText('No open alarms on this tag.')).toBeInTheDocument();
  });

  it('opens a linked document', async () => {
    const onOpenDocument = vi.fn();
    render(<PidTagPanel tag={EQUIPMENT} documents={documentsFor(PID_FIXTURE_DOCUMENTS, 'ka-9101')} onOpenDocument={onOpenDocument} />);

    await userEvent.click(screen.getByRole('button', { name: 'Open Compressor datasheet' }));

    expect(onOpenDocument).toHaveBeenCalledWith(PID_FIXTURE_DOCUMENTS[0]);
  });

  it('lists the measurements of equipment and jumps to one', async () => {
    const onSelectTag = vi.fn();
    render(<PidTagPanel tag={EQUIPMENT} status={{ tone: 'success', label: 'Running', shape: 'dot' }} measurements={[READING]} onSelectTag={onSelectTag} />);

    expect(screen.getByText('Running')).toBeInTheDocument();
    const row = screen.getByRole('button', { name: /Discharge temperature/ });
    expect(within(row).getByText('H')).toBeInTheDocument();

    await userEvent.click(row);
    expect(onSelectTag).toHaveBeenCalledWith('tt-92532');
  });

  it('closes from the header', async () => {
    const onClose = vi.fn();
    render(<PidTagPanel tag={INSTRUMENT} reading={READING} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Close panel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
