import { render } from '@testing-library/react';

import { IconChip } from './IconChip';

describe(IconChip.name, () => {
  it('is decorative and carries its tone and size', () => {
    const { container } = render(
      <IconChip tone="teal" size="lg">
        <svg />
      </IconChip>
    );

    const chip = container.querySelector('.kit-chip');
    expect(chip).toHaveAttribute('aria-hidden', 'true');
    expect(chip).toHaveAttribute('data-tone', 'teal');
    expect(chip).toHaveAttribute('data-size', 'lg');
  });
});
