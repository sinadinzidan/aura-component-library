import { fireEvent, render, screen } from '@testing-library/react';

import { PTZ_HOME } from './ptz';
import { PtzControls } from './PtzControls';

const presets = [{ id: 'p1', name: 'Pump bay', state: { pan: 30, tilt: 5, zoom: 2 } }];

describe(PtzControls.name, () => {
  it('sends pan, tilt and zoom moves', () => {
    const dispatch = vi.fn();
    render(<PtzControls state={PTZ_HOME} dispatch={dispatch} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pan right' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tilt up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));

    expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'pan', by: 10 });
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'tilt', by: 10 });
    expect(dispatch).toHaveBeenNthCalledWith(3, { type: 'zoom', by: 0.5 });
  });

  it('moves in smaller steps when zoomed in', () => {
    const dispatch = vi.fn();
    render(<PtzControls state={{ pan: 0, tilt: 0, zoom: 16 }} dispatch={dispatch} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pan left' }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'pan', by: -3 });
  });

  it('disables a direction at its limit and home at home', () => {
    render(<PtzControls state={{ pan: 170, tilt: 0, zoom: 1 }} dispatch={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Pan right' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pan left' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
  });

  it('describes the position and the preset it is on', () => {
    render(<PtzControls state={presets[0].state} dispatch={() => undefined} presets={presets} />);

    expect(screen.getByText('Pan +30°, tilt +5°, zoom 2× · Pump bay')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pump bay' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('recalls a preset', () => {
    const dispatch = vi.fn();
    render(<PtzControls state={PTZ_HOME} dispatch={dispatch} presets={presets} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pump bay' }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'preset', state: presets[0].state });
  });

  it('disables everything with a reason in the group name', () => {
    render(<PtzControls state={PTZ_HOME} dispatch={() => undefined} presets={presets} disabledReason="camera offline" />);

    expect(screen.getByRole('group', { name: 'PTZ controls, unavailable: camera offline' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pan right' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pump bay' })).toBeDisabled();
  });
});
