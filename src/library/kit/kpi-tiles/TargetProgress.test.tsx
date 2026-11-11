import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { TargetProgress } from './TargetProgress';

describe(TargetProgress.name, () => {
  it('reports the value, the share reached and the target', () => {
    render(<TargetProgress label="Gas export" value={4.38} target={4.5} unit="MSm³/d" decimals={2} />);

    const meter = screen.getByRole('meter', { name: 'Gas export' });
    expect(meter).toHaveAttribute('aria-valuenow', '4.38');
    expect(meter).toHaveAttribute('aria-valuetext', '4.38 MSm³/d, 97 % of target');
    expect(screen.getByText('97 % of target')).toBeInTheDocument();
    expect(screen.getByText('Target 4.50 MSm³/d')).toBeInTheDocument();
  });

  it('draws a bar by default', () => {
    render(<TargetProgress label="OEE" value={82.7} target={85} />);

    expect(screen.getByRole('meter')).toHaveAttribute('data-variant', 'bar');
  });

  it('draws blocks in a block-built look and fills them by value', () => {
    const { container } = render(
      <LookScope look="poster">
        <TargetProgress label="OEE" value={50} target={80} max={100} blocks={10} />
      </LookScope>,
    );

    expect(screen.getByRole('meter')).toHaveAttribute('data-variant', 'blocks');
    expect(container.querySelectorAll('[data-filled]')).toHaveLength(5);
  });

  it('draws a ruled scale on a blueprint and lets the variant be forced', () => {
    const { rerender } = render(
      <LookScope look="blueprint">
        <TargetProgress label="MTBF" value={412} target={450} unit="h" />
      </LookScope>,
    );
    expect(screen.getByRole('meter')).toHaveAttribute('data-variant', 'scale');

    rerender(
      <LookScope look="blueprint">
        <TargetProgress label="MTBF" value={412} target={450} unit="h" variant="bar" />
      </LookScope>,
    );
    expect(screen.getByRole('meter')).toHaveAttribute('data-variant', 'bar');
  });
});
