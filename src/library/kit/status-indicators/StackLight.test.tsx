import { render, screen } from '@testing-library/react';

import { StackLight, type StackLamp } from './StackLight';

const LAMPS: StackLamp[] = [
  { id: 'fault', label: 'Fault', tone: 'critical' },
  { id: 'attention', label: 'Attention', tone: 'warning' },
  { id: 'running', label: 'Running', tone: 'success' },
];

describe(StackLight.name, () => {
  it('lights one lamp and writes the state', () => {
    const { container } = render(<StackLight label="Export pump A" lamps={LAMPS} lit="running" />);

    expect(screen.getByRole('img', { name: 'Export pump A: Running' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(1);
    expect(container.querySelector('[data-lit="true"]')).toHaveAttribute('data-tone', 'success');
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('reads as off when no lamp matches, and can lie down without a caption', () => {
    const { container } = render(<StackLight label="Cooling water pump" lamps={LAMPS} lit="none" orientation="horizontal" hideCaption />);

    expect(screen.getByRole('img', { name: 'Cooling water pump: off' })).toHaveAttribute('data-orientation', 'horizontal');
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(0);
    expect(screen.queryByText('Cooling water pump')).not.toBeInTheDocument();
  });
});
