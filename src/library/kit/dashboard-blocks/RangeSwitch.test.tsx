import { fireEvent, render, screen } from '@testing-library/react';

import { RangeSwitch } from './RangeSwitch';

const OPTIONS = [
  { id: '8h', label: '8 h' },
  { id: '24h', label: '24 h' },
];

describe(RangeSwitch.name, () => {
  it('names the control and shows every option', () => {
    render(<RangeSwitch label="Time range" options={OPTIONS} value="24h" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Time range')).toBeInTheDocument();
    expect(screen.getByText('8 h')).toBeInTheDocument();
    expect(screen.getByText('24 h')).toBeInTheDocument();
  });

  it('reports the chosen option', () => {
    const onChange = vi.fn();
    render(<RangeSwitch label="Time range" options={OPTIONS} value="24h" onChange={onChange} />);

    fireEvent.click(screen.getByText('8 h'));

    expect(onChange).toHaveBeenCalledWith('8h');
  });
});
