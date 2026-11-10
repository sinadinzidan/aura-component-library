import { render, screen, within } from '@testing-library/react';

import { PredictionCard } from './PredictionCard';

const DRIVERS = [
  { id: 'load', label: 'Compressor load', weight: 0.2, direction: 'down' as const },
  { id: 'cooler', label: 'Cooler outlet temperature rising', weight: 0.5, direction: 'up' as const, detail: '23-TT-91141' },
];

describe(PredictionCard.name, () => {
  it('shows what is predicted, the headline and its range', () => {
    render(<PredictionCard title="Time to high limit" subject="23-TT-92532" headline="~6 h" range="between 4 and 9 h" />);

    expect(screen.getByRole('group', { name: 'Time to high limit' })).toBeInTheDocument();
    expect(screen.getByText('~6 h')).toBeInTheDocument();
    expect(screen.getByText('between 4 and 9 h')).toBeInTheDocument();
    expect(screen.getByText('23-TT-92532')).toBeInTheDocument();
  });

  it('colours the headline only when given a tone', () => {
    const { container, rerender } = render(<PredictionCard title="Time to limit" headline="~6 h" />);
    expect(container.querySelector('[data-slot="prediction-headline"]')).toHaveClass('text-base-foreground');

    rerender(<PredictionCard title="Time to limit" headline="~6 h" tone="warning" />);
    expect(container.querySelector('[data-slot="prediction-headline"]')).toHaveClass('text-warning-foreground-strong');
  });

  it('states the confidence as a word and a percentage', () => {
    render(<PredictionCard title="Time to limit" headline="~6 h" confidence={0.86} />);

    expect(screen.getByText('High confidence')).toBeInTheDocument();
    expect(screen.getByText('86 %')).toBeInTheDocument();
  });

  it('marks low confidence as a warning', () => {
    const { container } = render(<PredictionCard title="Time to limit" headline="~6 h" confidence={0.3} />);

    expect(screen.getByText('Low confidence')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="status-indicator"]')).toHaveAttribute('data-tone', 'warning');
  });

  it('lists the drivers strongest first with their weight and direction', () => {
    render(<PredictionCard title="Time to limit" headline="~6 h" drivers={DRIVERS} />);

    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Cooler outlet temperature rising');
    expect(items[0]).toHaveTextContent('50 %');
    expect(items[0]).toHaveTextContent('pushes the prediction up');
    expect(items[0]).toHaveTextContent('23-TT-91141');
    expect(items[1]).toHaveTextContent('Compressor load');
  });

  it('renders the model line and actions in the footer', () => {
    render(<PredictionCard title="Time to limit" headline="~6 h" meta="Model v3.2 · updated 13:55" actions={<button type="button">Open trend</button>} />);

    expect(screen.getByText('Model v3.2 · updated 13:55')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open trend' })).toBeInTheDocument();
  });
});
