import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { StateTextSwitch } from './StateTextSwitch';

describe(StateTextSwitch.name, () => {
  it('names the switch after its visible label', () => {
    render(<StateTextSwitch label="Alarm sounds" />);

    expect(screen.getByRole('switch', { name: 'Alarm sounds' })).toBeInTheDocument();
  });

  it('uses the aria-label when there is no visible label', () => {
    render(<StateTextSwitch aria-label="Anomaly detection" />);

    expect(screen.getByRole('switch', { name: 'Anomaly detection' })).toBeInTheDocument();
  });

  it('shows the unchecked text while off', () => {
    render(<StateTextSwitch label="Extractor" checkedText="Running" uncheckedText="Paused" />);

    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.queryByText('Running')).not.toBeInTheDocument();
  });

  it('switches the text when toggled without being controlled', async () => {
    render(<StateTextSwitch label="Extractor" checkedText="Running" uncheckedText="Paused" />);

    await userEvent.click(screen.getByRole('switch', { name: 'Extractor' }));

    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('reports the next state', async () => {
    const onCheckedChange = vi.fn();
    render(<StateTextSwitch label="Extractor" defaultChecked onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Extractor' }));

    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('follows the checked prop when controlled', async () => {
    render(<StateTextSwitch label="Extractor" checked={false} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Extractor' }));

    expect(screen.getByText('Off')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Extractor' })).not.toBeChecked();
  });

  it('hides the state text from assistive tech, which reads the switch state instead', () => {
    render(<StateTextSwitch label="Extractor" defaultChecked />);

    expect(screen.getByText('On')).toHaveAttribute('aria-hidden', 'true');
  });
});
