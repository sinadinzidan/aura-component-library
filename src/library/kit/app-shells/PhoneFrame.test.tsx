import { render, screen } from '@testing-library/react';

import { PhoneFrame } from './PhoneFrame';

describe(PhoneFrame.name, () => {
  it('names the screen, shows content and footer', () => {
    render(
      <PhoneFrame label="Alarms on a phone" look="soft" footer={<nav aria-label="Primary">Nav</nav>}>
        <p>Rows</p>
      </PhoneFrame>
    );

    expect(screen.getByRole('group', { name: 'Alarms on a phone' })).toHaveTextContent('Rows');
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByText('Alarms on a phone')).toBeInTheDocument();
  });

  it('can hide the caption', () => {
    render(
      <PhoneFrame label="Alarms on a phone" look="studio" caption={false}>
        <p>Rows</p>
      </PhoneFrame>
    );

    expect(screen.queryByText('Alarms on a phone')).toBeNull();
  });
});
