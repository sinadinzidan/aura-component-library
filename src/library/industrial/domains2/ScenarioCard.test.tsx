import { render, screen, within } from '@testing-library/react';

import { ScenarioCard } from './ScenarioCard';

const ASSUMPTIONS = [
  { label: 'Flow', value: '195 kSm³/h' },
  { label: 'Efficiency', value: '81 %' },
];

describe(ScenarioCard.name, () => {
  it('names the scenario and its run status', () => {
    render(<ScenarioCard name="Higher throughput" status="done" assumptions={ASSUMPTIONS} />);

    expect(screen.getByRole('article', { name: 'Scenario Higher throughput, done' })).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('lists the assumptions that differ from the baseline', () => {
    render(<ScenarioCard name="Higher throughput" status="done" assumptions={ASSUMPTIONS} />);

    const assumptions = within(screen.getByLabelText('Assumptions'));
    expect(assumptions.getByText('Flow').nextElementSibling).toHaveTextContent('195 kSm³/h');
    expect(assumptions.getByText('Efficiency').nextElementSibling).toHaveTextContent('81 %');
  });

  it('shows the result with its change against the baseline', () => {
    render(
      <ScenarioCard
        name="Higher throughput"
        status="done"
        assumptions={ASSUMPTIONS}
        result={{ label: 'Shaft power', value: 10.6, unit: 'MW', baseline: 10.3, goodDirection: 'down' }}
      />
    );

    expect(screen.getByText('Shaft power')).toBeInTheDocument();
    expect(screen.getByText('10.6')).toBeInTheDocument();
    expect(screen.getByText('+0.3')).toBeInTheDocument();
    expect(screen.getByText('vs baseline')).toBeInTheDocument();
  });

  it('has no result block before the run is done', () => {
    const { container } = render(<ScenarioCard name="Higher throughput" status="running" statusDetail="62 %" assumptions={ASSUMPTIONS} />);

    expect(container.querySelector('[data-slot="scenario-result"]')).toBeNull();
    expect(screen.getByText('62 %')).toBeInTheDocument();
  });

  it('says why a run failed', () => {
    render(<ScenarioCard name="Higher throughput" status="failed" statusDetail="Did not converge" assumptions={ASSUMPTIONS} />);

    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Did not converge')).toBeInTheDocument();
  });

  it('renders meta and actions in the footer', () => {
    render(<ScenarioCard name="Higher throughput" status="draft" assumptions={ASSUMPTIONS} meta="Aisha Khan · 12 Mar, 11:20" actions={<button type="button">Run scenario</button>} />);

    expect(screen.getByText('Aisha Khan · 12 Mar, 11:20')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run scenario' })).toBeInTheDocument();
  });
});
