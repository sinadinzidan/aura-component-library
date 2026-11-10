import { render, screen } from '@testing-library/react';

import { FeatureCard } from './FeatureCard';

describe(FeatureCard.name, () => {
  it('renders the title as a heading with its description', () => {
    render(<FeatureCard title="Contextualised data" description="Tags are linked to the asset they measure." />);

    expect(screen.getByRole('heading', { level: 3, name: 'Contextualised data' })).toBeInTheDocument();
    expect(screen.getByText('Tags are linked to the asset they measure.')).toBeInTheDocument();
  });

  it('hides the icon tile from assistive technology', () => {
    const { container } = render(
      <FeatureCard title="Trends" description="Plot any tag." icon={<svg data-testid="icon" />} />
    );

    expect(container.querySelector('[data-slot="feature-lead"]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows a marker when there is no icon', () => {
    render(<FeatureCard title="Connect a source" description="Pick an extractor." marker="1" />);

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders no lead tile without icon or marker', () => {
    const { container } = render(<FeatureCard title="Trends" description="Plot any tag." />);

    expect(container.querySelector('[data-slot="feature-lead"]')).toBeNull();
  });

  it('renders children under the description', () => {
    render(
      <FeatureCard title="Trends" description="Plot any tag." as="h4" layout="inline" surface="card">
        <a href="https://docs.cognite.com">Read the guide</a>
      </FeatureCard>
    );

    expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Read the guide' })).toBeInTheDocument();
  });
});
