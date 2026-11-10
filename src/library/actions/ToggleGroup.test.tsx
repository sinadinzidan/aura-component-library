import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ToggleGroup } from './ToggleGroup';

const OPTIONS = [
  { value: 'limits', label: 'Limits' },
  { value: 'events', label: 'Events' },
  { value: 'forecast', label: 'Forecast' },
];

describe(ToggleGroup.name, () => {
  it('marks the options in the value as pressed', () => {
    render(<ToggleGroup label="Chart overlays" options={OPTIONS} value={['events']} onValueChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Events' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Limits' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('adds an option to the value when several can be pressed', async () => {
    const onValueChange = vi.fn();
    render(<ToggleGroup label="Chart overlays" options={OPTIONS} value={['events']} onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Limits' }));

    expect(onValueChange).toHaveBeenCalledWith(['events', 'limits']);
  });

  it('removes an option from the value when it is pressed again', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleGroup label="Chart overlays" options={OPTIONS} value={['events', 'limits']} onValueChange={onValueChange} />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Events' }));

    expect(onValueChange).toHaveBeenCalledWith(['limits']);
  });

  it('replaces the value when only one can be pressed', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleGroup
        label="Chart overlays"
        selection="single"
        options={OPTIONS}
        value={['events']}
        onValueChange={onValueChange}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Forecast' }));

    expect(onValueChange).toHaveBeenCalledWith(['forecast']);
  });

  it('clears a single selection when it is pressed again', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleGroup
        label="Chart overlays"
        selection="single"
        options={OPTIONS}
        value={['events']}
        onValueChange={onValueChange}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Events' }));

    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  it('keeps a required single selection when it is pressed again', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleGroup
        label="Chart overlays"
        selection="single"
        required
        options={OPTIONS}
        value={['events']}
        onValueChange={onValueChange}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Events' }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('names icon-only options by their label', () => {
    render(
      <TooltipProvider>
        <ToggleGroup
          label="Chart type"
          iconOnly
          options={[{ value: 'line', label: 'Line chart', icon: <svg aria-hidden /> }]}
          value={[]}
          onValueChange={vi.fn()}
        />
      </TooltipProvider>
    );

    expect(screen.getByRole('group', { name: 'Chart type' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Line chart' })).toBeInTheDocument();
  });

  it('blocks a disabled option', () => {
    render(
      <ToggleGroup
        label="Chart overlays"
        options={[{ value: 'forecast', label: 'Forecast', disabled: true }]}
        value={[]}
        onValueChange={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Forecast' })).toBeDisabled();
  });
});
