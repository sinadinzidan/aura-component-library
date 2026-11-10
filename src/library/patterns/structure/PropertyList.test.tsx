import { render, screen, within } from '@testing-library/react';

import { PropertyList } from './PropertyList';
import type { Property } from './PropertyList';

const ITEMS: readonly Property[] = [
  { label: 'Tag', value: '23-KA-9101' },
  { label: 'Criticality', value: 'A' },
  { label: 'Manufacturer' },
];

describe(PropertyList.name, () => {
  it('pairs every label with its value', () => {
    render(<PropertyList items={ITEMS} />);

    const terms = screen.getAllByRole('term');
    const definitions = screen.getAllByRole('definition');
    expect(terms.map((term) => term.textContent)).toEqual(['Tag', 'Criticality', 'Manufacturer']);
    expect(definitions[0]).toHaveTextContent('23-KA-9101');
    expect(definitions[1]).toHaveTextContent('A');
  });

  it('shows a placeholder for a missing value', () => {
    render(<PropertyList items={ITEMS} />);

    expect(screen.getAllByRole('definition')[2]).toHaveTextContent('—');
  });

  it('uses the given placeholder', () => {
    render(<PropertyList items={ITEMS} emptyValue="Not set" />);

    expect(screen.getAllByRole('definition')[2]).toHaveTextContent('Not set');
  });

  it('keeps a value of zero', () => {
    render(<PropertyList items={[{ label: 'Open alarms', value: 0 }]} />);

    expect(screen.getByRole('definition')).toHaveTextContent('0');
  });

  it('renders the hint with the label and the action with the value', () => {
    render(
      <PropertyList
        items={[
          {
            label: 'External ID',
            value: 'nk:23-ka-9101',
            hint: <button type="button">About external ID</button>,
            action: <button type="button">Copy external ID</button>,
          },
        ]}
      />
    );

    expect(within(screen.getByRole('term')).getByRole('button', { name: 'About external ID' })).toBeInTheDocument();
    expect(within(screen.getByRole('definition')).getByRole('button', { name: 'Copy external ID' })).toBeInTheDocument();
  });

  it('lays stacked properties out in the requested number of columns', () => {
    const { container } = render(<PropertyList items={ITEMS} layout="stacked" columns={3} />);

    expect(container.querySelector('dl')).toHaveClass('grid-cols-3');
  });
});
