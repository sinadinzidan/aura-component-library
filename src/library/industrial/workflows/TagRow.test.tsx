import { render, screen } from '@testing-library/react';

import { TagRow } from './TagRow';

describe(TagRow.name, () => {
  it('shows tag, description, value and unit', () => {
    render(<TagRow tag="23-PT-92531" name="Discharge pressure" value={48.6} unit="barg" decimals={1} />);
    expect(screen.getByText('23-PT-92531')).toBeInTheDocument();
    expect(screen.getByText('Discharge pressure')).toBeInTheDocument();
    expect(screen.getByText('48.6')).toBeInTheDocument();
    expect(screen.getByText('barg')).toBeInTheDocument();
  });

  it('says the signal quality in words', () => {
    render(<TagRow tag="23-TT-91141" name="Cooler outlet temperature" value={38.9} quality="uncertain" />);
    expect(screen.getByText('Uncertain')).toBeInTheDocument();
  });

  it('shows the age only when the value is stale', () => {
    const { rerender } = render(<TagRow tag="40-TT-40015" name="Bearing temperature" value={61.2} age="14 min" />);
    expect(screen.queryByText(/Stale/)).not.toBeInTheDocument();
    rerender(<TagRow tag="40-TT-40015" name="Bearing temperature" value={61.2} age="14 min" stale />);
    expect(screen.getByText('Stale · 14 min')).toBeInTheDocument();
  });

  it('renders an em dash when there is no value', () => {
    render(<TagRow tag="40-TT-40015" name="Bearing temperature" value={null} unit="°C" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders leading and trailing content', () => {
    render(<TagRow tag="23-PT-92531" name="Discharge pressure" value={1} leading={<span>lead</span>} trailing={<span>trail</span>} />);
    expect(screen.getByText('lead')).toBeInTheDocument();
    expect(screen.getByText('trail')).toBeInTheDocument();
  });
});
