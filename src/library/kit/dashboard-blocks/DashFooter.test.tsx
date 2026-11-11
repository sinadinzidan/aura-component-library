import { render, screen } from '@testing-library/react';

import { DashFooter } from './DashFooter';

describe(DashFooter.name, () => {
  it('lists the facts about the data as terms and values', () => {
    render(<DashFooter items={[{ label: 'Source', value: 'Nordkapp historian' }, { label: 'Refreshed', value: '14:00 UTC' }]} />);

    expect(screen.getByText('Source').tagName).toBe('DT');
    expect(screen.getByText('Nordkapp historian').tagName).toBe('DD');
    expect(screen.getByText('14:00 UTC')).toBeInTheDocument();
  });

  it('shows the note and the actions', () => {
    render(<DashFooter items={[]} note="Availability excludes planned stops." actions={<button type="button">Export</button>} />);

    expect(screen.getByRole('contentinfo')).toHaveTextContent('Availability excludes planned stops.');
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });
});
