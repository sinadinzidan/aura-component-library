import { render, screen } from '@testing-library/react';

import { Hero } from './Hero';

describe(Hero.name, () => {
  it('renders the headline as a heading of the given level', () => {
    render(<Hero title="Every tag in context" as="h1" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Every tag in context' })).toBeInTheDocument();
  });

  it('uses the display typeface for the headline by default', () => {
    render(<Hero title="Every tag in context" />);

    expect(screen.getByRole('heading').className).toContain('font-marketing');
  });

  it('keeps the UI typeface for a compact page opener', () => {
    render(<Hero title="Good afternoon" size="compact" />);

    expect(screen.getByRole('heading').className).not.toContain('font-marketing');
  });

  it('shows eyebrow, description, actions and footer when given', () => {
    render(
      <Hero
        title="Every tag in context"
        eyebrow="Asset performance"
        description="Trends, alarms and work orders on one page."
        actions={<button type="button">Open workspace</button>}
        footer={<p>4 sites connected</p>}
      />
    );

    expect(screen.getByText('Asset performance')).toBeInTheDocument();
    expect(screen.getByText('Trends, alarms and work orders on one page.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open workspace' })).toBeInTheDocument();
    expect(screen.getByText('4 sites connected')).toBeInTheDocument();
  });

  it('leaves out the slots that are not given', () => {
    const { container } = render(<Hero title="Every tag in context" />);

    expect(container.querySelector('[data-slot="hero-actions"]')).toBeNull();
    expect(container.querySelector('[data-slot="hero-visual"]')).toBeNull();
  });

  it('puts the visual beside the text only when left-aligned', () => {
    const { container, rerender } = render(<Hero title="Split" visual={<div>Visual</div>} />);
    const layoutOf = () => container.querySelector('[data-slot="hero"] > div')?.className ?? '';

    expect(layoutOf()).toContain('grid-cols-2');

    rerender(<Hero title="Centred" align="center" visual={<div>Visual</div>} />);

    expect(layoutOf()).not.toContain('grid-cols-2');
  });
});
