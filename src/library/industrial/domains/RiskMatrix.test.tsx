import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RiskMatrix } from './RiskMatrix';

describe(RiskMatrix.name, () => {
  it('renders 25 cells in a named radio group', () => {
    render(<RiskMatrix label="Residual risk" value={null} onChange={vi.fn()} />);

    expect(within(screen.getByRole('radiogroup', { name: 'Residual risk' })).getAllByRole('radio')).toHaveLength(25);
  });

  it('names each cell with both ratings, the level and the score', () => {
    render(<RiskMatrix label="Residual risk" value={null} onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'Likelihood likely, consequence moderate: high risk, score 12' })).toBeInTheDocument();
  });

  it('reports the picked cell', async () => {
    const onChange = vi.fn();
    render(<RiskMatrix label="Residual risk" value={null} onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: /^Likelihood possible, consequence major/ }));

    expect(onChange).toHaveBeenCalledWith({ likelihood: 3, consequence: 4 });
  });

  it('checks the selected cell and spells the result out', () => {
    const { container } = render(<RiskMatrix label="Residual risk" value={{ likelihood: 2, consequence: 4 }} onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { checked: true })).toHaveAccessibleName(/medium risk, score 8$/);
    expect(container.querySelector('[data-slot="risk-result"]')).toHaveTextContent('Residual risk:Mediumscore 8Unlikely × major');
  });

  it('prompts for a choice while nothing is picked', () => {
    render(<RiskMatrix label="Residual risk" value={null} onChange={vi.fn()} />);

    expect(screen.getByText('Pick the cell that matches likelihood and consequence.')).toBeInTheDocument();
  });

  it('moves focus between cells with the arrow keys', async () => {
    render(<RiskMatrix label="Residual risk" value={{ likelihood: 2, consequence: 2 }} onChange={vi.fn()} />);

    await userEvent.tab();
    await userEvent.keyboard('{ArrowUp}{ArrowRight}');

    expect(screen.getByRole('radio', { name: /^Likelihood possible, consequence moderate/ })).toHaveFocus();
  });

  it('stays on the edge cell when an arrow points off the grid', async () => {
    render(<RiskMatrix label="Residual risk" value={{ likelihood: 5, consequence: 5 }} onChange={vi.fn()} />);

    await userEvent.tab();
    await userEvent.keyboard('{ArrowUp}');

    expect(screen.getByRole('radio', { name: /^Likelihood almost certain, consequence severe/ })).toHaveFocus();
  });

  it('does not report clicks when read-only', async () => {
    const onChange = vi.fn();
    render(<RiskMatrix label="Residual risk" value={{ likelihood: 2, consequence: 2 }} onChange={onChange} readOnly />);

    await userEvent.click(screen.getByRole('radio', { name: /^Likelihood possible, consequence major/ }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-readonly', 'true');
  });

  it('marks and names the reference assessment', () => {
    const { container } = render(
      <RiskMatrix label="Residual risk" value={{ likelihood: 2, consequence: 4 }} reference={{ likelihood: 4, consequence: 4, label: 'Initial risk' }} readOnly />
    );

    expect(container.querySelectorAll('[data-slot="risk-reference"]')).toHaveLength(1);
    expect(screen.getByRole('radio', { name: /high risk, score 16, initial risk$/ })).toBeInTheDocument();
  });
});
