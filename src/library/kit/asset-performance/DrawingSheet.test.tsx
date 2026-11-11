import { render, screen } from '@testing-library/react';

import { DrawingSheet, TitleBlock } from './DrawingSheet';

describe(DrawingSheet.name, () => {
  it('is a named region with zone references and its content', () => {
    render(
      <DrawingSheet label="Asset performance, sheet 1" columns={['1', '2']} rows={['A', 'B']}>
        <p>Matrix</p>
      </DrawingSheet>
    );

    expect(screen.getByRole('region', { name: 'Asset performance, sheet 1' })).toBeInTheDocument();
    expect(screen.getByText('Matrix')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('draws the title block when given', () => {
    render(
      <DrawingSheet label="Sheet" titleBlock={<TitleBlock cells={[{ label: 'Drawing', value: 'NK-AP-002' }]} />}>
        <p>Body</p>
      </DrawingSheet>
    );

    expect(screen.getByText('NK-AP-002')).toBeInTheDocument();
  });
});

describe(TitleBlock.name, () => {
  it('pairs every label with its value', () => {
    render(
      <TitleBlock
        cells={[
          { label: 'Title', value: 'Asset performance', strong: true, grow: 2 },
          { label: 'Revision', value: 'C' },
        ]}
        end={<span>Sheet 1 of 3</span>}
      />
    );

    expect(screen.getByText('Title').tagName).toBe('DT');
    expect(screen.getByText('Asset performance').tagName).toBe('DD');
    expect(screen.getByText('Sheet 1 of 3')).toBeInTheDocument();
  });
});
