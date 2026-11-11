import { render, screen } from '@testing-library/react';

import { FormSection } from './FormSection';

describe(FormSection.name, () => {
  it('is a region named by its title, with description and fields', () => {
    render(
      <FormSection title="Limits" description="Applied on the next scan.">
        <input aria-label="High limit" />
      </FormSection>
    );

    const section = screen.getByRole('region', { name: 'Limits' });
    expect(section).toHaveTextContent('Applied on the next scan.');
    expect(screen.getByRole('textbox', { name: 'High limit' })).toBeInTheDocument();
    expect(section).toHaveAttribute('data-layout', 'stacked');
  });

  it('carries the aside layout', () => {
    render(
      <FormSection title="Limits" layout="aside">
        <input aria-label="High limit" />
      </FormSection>
    );

    expect(screen.getByRole('region', { name: 'Limits' })).toHaveAttribute('data-layout', 'aside');
  });
});
