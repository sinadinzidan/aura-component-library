import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BillingToggle } from './BillingToggle';

describe(BillingToggle.name, () => {
  it('offers monthly and annual, with the current one selected', () => {
    render(<BillingToggle value="monthly" onValueChange={vi.fn()} />);

    expect(screen.getByRole('tablist', { name: 'Billing period' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Monthly' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Annual' })).toHaveAttribute('aria-selected', 'false');
  });

  it('reports the chosen period', async () => {
    const onValueChange = vi.fn();
    render(<BillingToggle value="monthly" onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('tab', { name: 'Annual' }));

    expect(onValueChange).toHaveBeenCalledWith('annual');
  });

  it('states the annual saving next to the control', () => {
    render(<BillingToggle value="annual" onValueChange={vi.fn()} annualNote="Two months free" />);

    expect(screen.getByText('Two months free')).toBeInTheDocument();
  });
});
