import { render, screen } from '@testing-library/react';

import { ConditionList, allConditionsMet } from './ConditionList';
import type { Condition } from './ConditionList';

const CONDITIONS: readonly Condition[] = [
  { id: 'lube', label: 'Lube oil pressure above 1.8 barg', detail: '23-PT-92570 · 2.4 barg', state: 'met' },
  { id: 'vib', label: 'Vibration trip reset', state: 'unmet' },
  { id: 'seal', label: 'Seal gas differential healthy', detail: 'Bypassed by Liv Wold', state: 'bypassed' },
];

describe(ConditionList.name, () => {
  it('lists every condition with its state in words', () => {
    render(<ConditionList label="Start permissives" conditions={CONDITIONS} />);
    expect(screen.getByRole('list', { name: 'Start permissives' })).toBeInTheDocument();
    expect(screen.getByText('Met')).toBeInTheDocument();
    expect(screen.getByText('Not met')).toBeInTheDocument();
    expect(screen.getByText('Bypassed')).toBeInTheDocument();
  });

  it('shows the evidence for a condition', () => {
    render(<ConditionList label="Start permissives" conditions={CONDITIONS} />);
    expect(screen.getByText('23-PT-92570 · 2.4 barg')).toBeInTheDocument();
  });

  it('accepts other state words', () => {
    render(<ConditionList label="Interlocks" conditions={CONDITIONS} stateLabels={{ met: 'Healthy', unmet: 'Tripped' }} />);
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Tripped')).toBeInTheDocument();
    expect(screen.getByText('Bypassed')).toBeInTheDocument();
  });
});

describe(allConditionsMet.name, () => {
  it('is true only when every condition is met', () => {
    expect(allConditionsMet([{ state: 'met' }, { state: 'met' }])).toBe(true);
    expect(allConditionsMet([{ state: 'met' }, { state: 'bypassed' }])).toBe(false);
    expect(allConditionsMet(CONDITIONS)).toBe(false);
  });
});
