import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { ResultStrip } from './ResultStrip';

describe(ResultStrip.name, () => {
  it('summarises the round in its accessible name', () => {
    render(<ResultStrip label="Compressor hall round" results={['pass', 'fail', 'skipped', 'pending']} />);

    expect(screen.getByRole('img', { name: 'Compressor hall round: 3 of 4 checkpoints done, 1 failed, 1 skipped' })).toBeInTheDocument();
  });

  it('draws one cell per checkpoint with its result', () => {
    const { container } = render(<ResultStrip label="Round" results={['pass', 'fail', 'pending']} />);

    const cells = container.querySelectorAll('[data-result]');
    expect(cells).toHaveLength(3);
    expect(cells[1]).toHaveAttribute('data-tone', 'critical');
  });

  it('changes cell shape with the look', () => {
    const { rerender } = render(<ResultStrip label="Round" results={['pass']} />);
    expect(screen.getByRole('img')).toHaveAttribute('data-shape', 'pill');

    rerender(
      <LookScope look="console">
        <ResultStrip label="Round" results={['pass']} />
      </LookScope>,
    );
    expect(screen.getByRole('img')).toHaveAttribute('data-shape', 'block');

    rerender(
      <LookScope look="blueprint">
        <ResultStrip label="Round" results={['pass']} />
      </LookScope>,
    );
    expect(screen.getByRole('img')).toHaveAttribute('data-shape', 'outline');
  });
});
