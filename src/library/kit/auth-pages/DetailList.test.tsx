import { render, screen } from '@testing-library/react';

import { DetailList } from './DetailList';

const ITEMS = [
  { label: 'Device', value: 'Chrome on Windows' },
  { label: 'Location', value: 'Hammerfest, Norway' },
];

describe(DetailList.name, () => {
  it('pairs every label with its value', () => {
    render(<DetailList items={ITEMS} />);

    expect(screen.getByText('Device').tagName).toBe('DT');
    expect(screen.getByText('Chrome on Windows').tagName).toBe('DD');
    expect(screen.getAllByRole('term')).toHaveLength(2);
  });

  it('lays figures out in the asked number of columns', () => {
    const { container } = render(<DetailList items={ITEMS} layout="columns" columns={3} />);

    expect(container.querySelector('dl')).toHaveStyle({
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    });
  });
});
