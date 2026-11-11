import { render, screen } from '@testing-library/react';

import { SettingRow } from './SettingRow';

describe(SettingRow.name, () => {
  it('shows title, description, badge and control', () => {
    const { container } = render(
      <SettingRow title="Daily digest" description="Sent at 06:30." badge={<span>Admin only</span>} control={<button type="button">Change</button>} tone="warning" />
    );

    expect(screen.getByText('Daily digest')).toBeInTheDocument();
    expect(screen.getByText('Sent at 06:30.')).toBeInTheDocument();
    expect(screen.getByText('Admin only')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'warning');
  });
});
