import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SliderField } from './SliderField';

describe(SliderField.name, () => {
  it('names the slider after its label', () => {
    render(<SliderField label="Alarm limit" value={[52]} onValueChange={vi.fn()} />);

    expect(getThumb()).toHaveAttribute('aria-labelledby', screen.getByText('Alarm limit').id);
  });

  it('shows the current value with its unit', () => {
    render(<SliderField label="Alarm limit" value={[52]} onValueChange={vi.fn()} unit="barg" />);

    expect(screen.getByRole('status')).toHaveTextContent('52 barg');
  });

  it('shows both ends of a range', () => {
    render(<SliderField label="Operating window" value={[40, 52]} onValueChange={vi.fn()} unit="barg" />);

    expect(screen.getByRole('status')).toHaveTextContent('40 – 52 barg');
    expect(screen.getAllByRole('slider', { hidden: true })).toHaveLength(2);
  });

  it('formats the readout and the scale ends with the given formatter', () => {
    render(
      <SliderField
        label="Sampling rate"
        value={[0.5]}
        onValueChange={vi.fn()}
        min={0}
        max={2}
        step={0.1}
        formatValue={(value) => value.toFixed(1)}
        showScale
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent('0.5');
    expect(screen.getByText('0.0')).toBeInTheDocument();
    expect(screen.getByText('2.0')).toBeInTheDocument();
  });

  it('reports a new value when a thumb is moved with the keyboard', async () => {
    const onValueChange = vi.fn();
    render(<SliderField label="Alarm limit" value={[52]} onValueChange={onValueChange} max={60} />);

    getThumb().focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(onValueChange).toHaveBeenCalledWith([53]);
  });

  it('describes the slider with the helper text', () => {
    render(
      <SliderField label="Alarm limit" value={[52]} onValueChange={vi.fn()} helperText="Applies when you save." />
    );

    expect(screen.getByRole('group', { name: 'Alarm limit' })).toHaveAccessibleDescription('Applies when you save.');
  });

  it('disables the thumb', () => {
    render(<SliderField label="Alarm limit" value={[52]} onValueChange={vi.fn()} disabled />);

    expect(getThumb()).toBeDisabled();
  });
});

// The thumb stays `visibility: hidden` until Base UI has measured the track, which never happens
// without layout. Hidden elements have no computed name, so the thumb is found by role alone.
function getThumb() {
  return screen.getByRole('slider', { hidden: true });
}
