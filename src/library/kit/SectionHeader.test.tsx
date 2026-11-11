import { render, screen } from '@testing-library/react';

import { SectionHeader } from './SectionHeader';

describe(SectionHeader.name, () => {
  it('renders the title at the requested heading level', () => {
    render(<SectionHeader title="Plant overview" level={1} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Plant overview' })).toBeInTheDocument();
  });

  it('shows eyebrow, description and actions', () => {
    render(<SectionHeader title="Plant overview" eyebrow="Nordkapp" description="Updated 14:00" actions={<button type="button">Refresh</button>} />);

    expect(screen.getByText('Nordkapp')).toBeInTheDocument();
    expect(screen.getByText('Updated 14:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });
});
