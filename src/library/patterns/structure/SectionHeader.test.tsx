import { render, screen } from '@testing-library/react';

import { SectionHeader } from './SectionHeader';

describe(SectionHeader.name, () => {
  it('renders the title as a level 2 heading by default', () => {
    render(<SectionHeader title="Open work orders" />);

    expect(screen.getByRole('heading', { level: 2, name: 'Open work orders' })).toBeInTheDocument();
  });

  it('uses the requested heading level', () => {
    render(<SectionHeader title="Readings" as="h3" />);

    expect(screen.getByRole('heading', { level: 3, name: 'Readings' })).toBeInTheDocument();
  });

  it('shows the count next to the title without making it part of the heading', () => {
    render(<SectionHeader title="Alarms" count={4} />);

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Alarms' })).toHaveTextContent(/^Alarms$/);
  });

  it('shows a count of zero', () => {
    render(<SectionHeader title="Alarms" count={0} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders overline, description, info and actions when given', () => {
    render(
      <SectionHeader
        title="Health score"
        overline="Condition"
        description="From vibration and temperature."
        info={<button type="button">About health score</button>}
        actions={<a href="https://example.test/health">View all</a>}
      />
    );

    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('From vibration and temperature.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'About health score' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all' })).toBeInTheDocument();
  });

  it('draws a rule only when asked', () => {
    const { container, rerender } = render(<SectionHeader title="Alarms" />);
    expect(container.firstElementChild).not.toHaveClass('border-b');

    rerender(<SectionHeader title="Alarms" divider />);

    expect(container.firstElementChild).toHaveClass('border-b');
  });
});
