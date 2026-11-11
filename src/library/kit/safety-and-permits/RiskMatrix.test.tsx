import { fireEvent, render, screen } from '@testing-library/react';

import { RiskMatrix } from './RiskMatrix';

describe(RiskMatrix.name, () => {
  it('draws 25 rated cells and marks the initial and residual risk', () => {
    const { container } = render(<RiskMatrix label="Risk" initial={{ likelihood: 4, consequence: 4 }} residual={{ likelihood: 2, consequence: 3 }} />);

    expect(screen.getAllByRole('gridcell')).toHaveLength(25);
    expect(container.querySelector('[data-mark="initial"]')).toHaveAttribute('data-tone', 'critical');
    expect(container.querySelector('[data-mark="residual"]')).toHaveAttribute('data-tone', 'amber');
  });

  it('reports the picked cell', () => {
    const onSelect = vi.fn();
    render(<RiskMatrix label="Risk" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Likely, Major: Extreme 16' }));

    expect(onSelect).toHaveBeenCalledWith({ likelihood: 4, consequence: 4 });
  });

  it('shows register counts in place of scores', () => {
    render(<RiskMatrix label="Register" counts={{ '5-5': 7 }} />);

    expect(screen.getByLabelText('Frequent, Severe: Extreme 25')).toHaveTextContent('7');
  });
});
