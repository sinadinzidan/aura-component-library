import { render, screen } from '@testing-library/react';

import { LevelTank } from './LevelTank';

describe(LevelTank.name, () => {
  it('fills the vessel to the share of its range', () => {
    const { container } = render(<LevelTank label="Inlet separator" value={54.3} decimals={1} />);

    expect(screen.getByRole('meter', { name: 'Inlet separator' })).toHaveAttribute('aria-valuetext', '54.3 %');
    expect(container.querySelector<HTMLElement>('[data-part="liquid"]')?.style.height).toMatch(/^54\.[23]\d*%$/);
  });

  it('labels its limit lines', () => {
    render(<LevelTank label="Inlet separator" value={54} marks={[{ value: 70, label: 'High 70', tone: 'warning' }, { value: 85, label: 'Trip 85', tone: 'critical' }]} />);

    expect(screen.getByText('High 70')).toBeInTheDocument();
    expect(screen.getByText('Trip 85')).toBeInTheDocument();
  });

  it('lies down as a drum with a caption', () => {
    const { container } = render(<LevelTank label="Test separator" value={20} shape="drum" caption="20-VA-1002" />);

    expect(container.firstElementChild).toHaveAttribute('data-shape', 'drum');
    expect(screen.getByText('20-VA-1002')).toBeInTheDocument();
  });
});
