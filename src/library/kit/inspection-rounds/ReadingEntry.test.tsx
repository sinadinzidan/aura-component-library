import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReadingEntry } from './ReadingEntry';

describe(ReadingEntry.name, () => {
  it('labels the field with the unit and asks for a reading when empty', () => {
    render(<ReadingEntry label="Discharge pressure" unit="barg" value="" onChange={() => undefined} low={40} high={52} min={0} max={60} />);

    expect(screen.getByLabelText('Discharge pressure (barg)')).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('Enter a reading');
  });

  it('passes a reading inside the limits', () => {
    const { container } = render(<ReadingEntry label="Discharge pressure" unit="barg" value="48.6" onChange={() => undefined} low={40} high={52} min={0} max={60} />);

    expect(screen.getByRole('status')).toHaveTextContent('Within limits');
    expect(container.firstElementChild).toHaveAttribute('data-result', 'pass');
  });

  it('flags a reading outside the limits', () => {
    render(<ReadingEntry label="Discharge pressure" unit="barg" value="53.3" onChange={() => undefined} low={40} high={52} min={0} max={60} />);

    expect(screen.getByRole('status')).toHaveTextContent('1.3 above the high limit');
    expect(screen.getByLabelText('Discharge pressure (barg)')).toHaveAttribute('aria-invalid', 'true');
  });

  it('reports typing and shows the previous reading', async () => {
    const onChange = vi.fn();
    render(<ReadingEntry label="Vibration" unit="mm/s" value="" onChange={onChange} high={7.1} min={0} max={15} previous={6.2} />);

    await userEvent.type(screen.getByLabelText('Vibration (mm/s)'), '7');
    expect(onChange).toHaveBeenCalledWith('7');
    expect(screen.getByText('6.2 mm/s')).toBeInTheDocument();
  });
});
