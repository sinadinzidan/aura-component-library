import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WidgetSettingsPopover } from './WidgetSettingsPopover';

const SIZES = [
  { id: 's', label: 'Small', w: 3, h: 2 },
  { id: 'm', label: 'Medium', w: 4, h: 3 },
];
const RANGES = [
  { value: '8h', label: 'Last 8 hours' },
  { value: '24h', label: 'Last 24 hours' },
];
const VALUE = { title: 'Discharge pressure', w: 4, h: 3, range: '24h' };

describe(WidgetSettingsPopover.name, () => {
  it('stays closed behind a named trigger', () => {
    render(<WidgetSettingsPopover value={VALUE} sizes={SIZES} ranges={RANGES} onApply={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Edit settings for Discharge pressure' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });

  it('applies an edited title as one change', async () => {
    const onApply = vi.fn();
    render(<WidgetSettingsPopover value={VALUE} sizes={SIZES} ranges={RANGES} onApply={onApply} />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit settings for Discharge pressure' }));
    const title = await screen.findByLabelText('Title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Stage 1 discharge');
    await userEvent.click(screen.getByRole('button', { name: 'Apply settings' }));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({ title: 'Stage 1 discharge', w: 4, h: 3, range: '24h' });
  });

  it('does not apply an empty title and says what is missing', async () => {
    const onApply = vi.fn();
    render(<WidgetSettingsPopover value={VALUE} sizes={SIZES} onApply={onApply} defaultOpen />);

    await userEvent.clear(await screen.findByLabelText('Title'));

    expect(screen.getByText('Enter a title.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply settings' })).toBeDisabled();
  });

  it('discards the draft on cancel', async () => {
    const onApply = vi.fn();
    render(<WidgetSettingsPopover value={VALUE} sizes={SIZES} onApply={onApply} defaultOpen />);

    await userEvent.type(await screen.findByLabelText('Title'), ' A');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onApply).not.toHaveBeenCalled();
  });

  it('offers a time range only for widgets that cover a period', async () => {
    render(<WidgetSettingsPopover value={VALUE} sizes={SIZES} onApply={vi.fn()} defaultOpen />);

    expect(await screen.findByLabelText('Size')).toBeInTheDocument();
    expect(screen.queryByLabelText('Time range')).not.toBeInTheDocument();
  });

  it('labels a size that matches no preset as custom', async () => {
    render(<WidgetSettingsPopover value={{ ...VALUE, w: 5, h: 5 }} sizes={SIZES} onApply={vi.fn()} defaultOpen />);

    expect(await screen.findByLabelText('Size')).toHaveTextContent('Custom · 5 × 5');
  });
});
