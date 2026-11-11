import { render, screen, within } from '@testing-library/react';

import { ConditionBoard, type ConditionItem } from './ConditionBoard';

const ITEMS: ConditionItem[] = [
  { id: 'lube', label: 'Lube oil pressure above 1.8 barg', detail: '2.4 barg', state: 'met' },
  { id: 'seal', label: 'Seal gas differential above 0.5 bar', detail: '0.3 bar', state: 'unmet' },
  { id: 'surge', label: 'Surge detection', state: 'bypassed' },
];

describe(ConditionBoard.name, () => {
  it('counts what is met and says what blocks', () => {
    const { container } = render(<ConditionBoard label="Start permissives" items={ITEMS} />);

    const summary = container.querySelector('[data-slot="condition-summary"]');
    expect(summary).toHaveTextContent('1 of 3');
    expect(summary).toHaveTextContent('1 bypassed');
    expect(summary).toHaveTextContent('1 blocks');
    expect(summary).toHaveAttribute('data-tone', 'critical');
  });

  it('gives every condition a state word', () => {
    render(<ConditionBoard label="Interlocks" items={ITEMS} words={{ met: 'Healthy', unmet: 'Tripped', bypassed: 'Bypassed' }} />);

    const rows = within(screen.getByRole('list', { name: 'Interlocks' })).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Healthy');
    expect(rows[1]).toHaveTextContent('Tripped');
  });

  it('lays out as tiles without the summary', () => {
    const { container } = render(<ConditionBoard label="Interlocks" items={ITEMS} layout="tiles" hideSummary />);

    expect(container.firstElementChild).toHaveAttribute('data-layout', 'tiles');
    expect(container.querySelector('[data-slot="condition-summary"]')).toBeNull();
  });
});
