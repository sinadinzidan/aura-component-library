import { render, screen } from '@testing-library/react';

import { Properties } from './Properties';

describe(Properties.name, () => {
  it('pairs each label with its value', () => {
    render(
      <Properties
        label="Asset properties"
        items={[
          { label: 'Tag', value: '23-KA-9103' },
          { label: 'Criticality', value: 'A' },
        ]}
      />
    );

    expect(screen.getByLabelText('Asset properties')).toBeInTheDocument();
    expect(screen.getByText('Tag').nextElementSibling).toHaveTextContent('23-KA-9103');
    expect(screen.getByText('Criticality').nextElementSibling).toHaveTextContent('A');
  });

  it('carries layout and column count', () => {
    render(<Properties label="Asset properties" layout="stacked" columns={3} items={[{ label: 'Tag', value: '23-KA-9103' }]} />);

    const list = screen.getByLabelText('Asset properties');
    expect(list).toHaveAttribute('data-layout', 'stacked');
    expect(list).toHaveStyle({ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' });
  });
});
