import { render, screen } from '@testing-library/react';

import { FormSection } from './FormSection';

describe(FormSection.name, () => {
  it('exposes the fields as a region named after the title', () => {
    render(
      <FormSection title="Schedule">
        <input aria-label="Cron expression" />
      </FormSection>
    );

    const section = screen.getByRole('region', { name: 'Schedule' });
    expect(section).toContainElement(screen.getByRole('textbox', { name: 'Cron expression' }));
  });

  it('describes the region with the description', () => {
    render(
      <FormSection title="Schedule" description="When the transformation runs.">
        <input aria-label="Cron expression" />
      </FormSection>
    );

    expect(screen.getByRole('region', { name: 'Schedule' })).toHaveAccessibleDescription('When the transformation runs.');
  });

  it('marks the aside layout so the heading can sit beside the fields', () => {
    render(
      <FormSection title="Schedule" layout="aside">
        <input aria-label="Cron expression" />
      </FormSection>
    );

    expect(screen.getByRole('region', { name: 'Schedule' })).toHaveAttribute('data-layout', 'aside');
  });
});
