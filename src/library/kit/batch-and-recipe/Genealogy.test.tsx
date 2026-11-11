import { render, screen } from '@testing-library/react';

import { Genealogy } from './Genealogy';

describe(Genealogy.name, () => {
  it('lists the lots that went in, the batch and the lots that came out', () => {
    const { container } = render(
      <Genealogy
        label="Genealogy of batch B-2603-118"
        inputs={[
          { id: 'SV-9012-2602-07', label: 'Solvent' },
          { id: 'AM-3307-2602-12', label: 'Amine', detail: '640.4 kg' },
        ]}
        batch={{ id: 'B-2603-118', label: 'Corrosion inhibitor CI-40' }}
        outputs={[{ id: 'CI40-260312-A', label: 'IBC 0451' }]}
      />
    );

    const diagram = screen.getByRole('group', { name: 'Genealogy of batch B-2603-118' });
    expect(diagram).toHaveTextContent('Raw material lots');
    expect(diagram).toHaveTextContent('SV-9012-2602-07');
    expect(diagram).toHaveTextContent('640.4 kg');
    expect(diagram).toHaveTextContent('B-2603-118');
    expect(diagram).toHaveTextContent('CI40-260312-A');
    expect(container.querySelectorAll('path')).toHaveLength(3);
  });
});
