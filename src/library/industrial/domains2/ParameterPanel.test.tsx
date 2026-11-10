import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ParameterPanel } from './ParameterPanel';
import type { ModelParameter } from './ParameterPanel';

const PARAMETERS: readonly ModelParameter[] = [
  { key: 'flow', label: 'Gas flow', min: 120, max: 210, step: 1, unit: 'kSm³/h', baseline: 182 },
  { key: 'efficiency', label: 'Efficiency', min: 70, max: 85, step: 0.5, unit: '%', decimals: 1, baseline: 78 },
];

describe(ParameterPanel.name, () => {
  it('shows a field per parameter with its baseline', () => {
    render(<ParameterPanel parameters={PARAMETERS} values={{}} onChange={vi.fn()} />);

    expect(screen.getByRole('textbox', { name: 'Gas flow' })).toHaveValue('182');
    expect(screen.getByRole('textbox', { name: 'Efficiency' })).toHaveValue('78');
    expect(screen.getByText('Baseline 182 kSm³/h')).toBeInTheDocument();
    expect(screen.getByText('Baseline 78.0 %')).toBeInTheDocument();
  });

  it('says it is at baseline and offers no reset when nothing has changed', () => {
    render(<ParameterPanel parameters={PARAMETERS} values={{}} onChange={vi.fn()} onReset={vi.fn()} />);

    expect(screen.getByText('At baseline')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset to baseline' })).not.toBeInTheDocument();
  });

  it('shows how far a parameter has moved from its baseline', () => {
    const { container } = render(<ParameterPanel parameters={PARAMETERS} values={{ flow: 195 }} onChange={vi.fn()} />);

    expect(screen.getByText('1 changed')).toBeInTheDocument();
    expect(screen.getByText('+13 kSm³/h')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-changed="true"]')).toHaveLength(1);
  });

  it('reports a typed value with the parameter key', async () => {
    const onChange = vi.fn();
    render(<ParameterPanel parameters={PARAMETERS} values={{}} onChange={onChange} />);
    const field = screen.getByRole('textbox', { name: 'Efficiency' });

    await userEvent.clear(field);
    await userEvent.type(field, '81.5{Enter}');

    expect(onChange).toHaveBeenCalledWith('efficiency', 81.5);
  });

  it('clamps a typed value to the range', async () => {
    const onChange = vi.fn();
    render(<ParameterPanel parameters={PARAMETERS} values={{}} onChange={onChange} />);
    const field = screen.getByRole('textbox', { name: 'Gas flow' });

    await userEvent.clear(field);
    await userEvent.type(field, '400{Enter}');

    expect(onChange).toHaveBeenCalledWith('flow', 210);
  });

  it('resets through the callback once something has changed', async () => {
    const onReset = vi.fn();
    render(<ParameterPanel parameters={PARAMETERS} values={{ flow: 195 }} onChange={vi.fn()} onReset={onReset} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reset to baseline' }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('takes a custom title as its accessible name', () => {
    render(<ParameterPanel title="Compressor inputs" parameters={PARAMETERS} values={{}} onChange={vi.fn()} />);

    expect(screen.getByRole('region', { name: 'Compressor inputs' })).toBeInTheDocument();
  });
});
