import { render, screen } from '@testing-library/react';

import { DiagramCanvas } from './DiagramCanvas';

describe(DiagramCanvas.name, () => {
  it('is an image named by its label', () => {
    render(
      <DiagramCanvas label="Gas compression train" width={640} height={200}>
        <path d="M 0 0 H 10" />
      </DiagramCanvas>
    );

    expect(screen.getByRole('img', { name: 'Gas compression train' })).toBeInTheDocument();
  });

  it('uses its size as the coordinate system and the largest drawn width', () => {
    render(
      <DiagramCanvas label="Cooling loop" width={640} height={200}>
        <path d="M 0 0 H 10" />
      </DiagramCanvas>
    );

    const canvas = screen.getByRole('img');
    expect(canvas).toHaveAttribute('viewBox', '0 0 640 200');
    expect(canvas).toHaveAttribute('width', '100%');
    expect(canvas).toHaveStyle({ maxWidth: '640px' });
  });

  it('becomes a labelled group when it holds controls', () => {
    render(
      <DiagramCanvas label="Select a unit" width={100} height={100} interactive>
        <g role="button" aria-label="Inlet separator" tabIndex={0} />
      </DiagramCanvas>
    );

    expect(screen.getByRole('group', { name: 'Select a unit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inlet separator' })).toBeInTheDocument();
  });

  it('draws its children', () => {
    const { container } = render(
      <DiagramCanvas label="Pump skid" width={100} height={100}>
        <circle data-testid="mark" cx={5} cy={5} r={2} />
      </DiagramCanvas>
    );

    expect(container.querySelector('[data-testid="mark"]')).toBeInTheDocument();
  });
});
