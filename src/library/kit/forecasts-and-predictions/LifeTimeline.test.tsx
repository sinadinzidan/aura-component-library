import { render, screen } from '@testing-library/react';

import { LifeTimeline } from './LifeTimeline';

describe(LifeTimeline.name, () => {
  it('reads the likely day and the window', () => {
    render(<LifeTimeline label="Remaining useful life" span={90} earliest={24} likely={38} latest={55} endLabel="90 d" />);

    expect(screen.getByRole('img', { name: 'Remaining useful life: most likely 38 d, between 24 and 55 d' })).toBeInTheDocument();
    expect(screen.getByText('38 d')).toBeInTheDocument();
    expect(screen.getByText('24–55 d')).toBeInTheDocument();
  });

  it('places the window on the scale', () => {
    const { container } = render(<LifeTimeline label="Life" span={100} earliest={20} likely={40} latest={60} endLabel="100 d" />);

    expect(container.querySelector<HTMLElement>('[data-part="window"]')?.style.left).toBe('20%');
  });

  it('names planned events', () => {
    render(<LifeTimeline label="Life" span={90} earliest={24} likely={38} latest={55} endLabel="90 d" markers={[{ at: 30, label: 'Shutdown' }]} />);

    expect(screen.getByText('Shutdown')).toBeInTheDocument();
  });
});
