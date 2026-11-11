import { render, screen } from '@testing-library/react';

import { SelectionInfoPanel } from './SelectionInfoPanel';
import { findPart } from './viewerModel';

describe(SelectionInfoPanel.name, () => {
  it('asks for a selection when there is none', () => {
    render(<SelectionInfoPanel part={null} />);

    expect(screen.getByText('Nothing selected')).toBeInTheDocument();
  });

  it('shows name, tag, system and size', () => {
    render(<SelectionInfoPanel part={findPart('compressor') ?? null} />);

    expect(screen.getByText('1st stage compressor')).toBeInTheDocument();
    expect(screen.getByText('23-KA-9101')).toBeInTheDocument();
    expect(screen.getByText('Compression')).toBeInTheDocument();
    expect(screen.getByText('4.6 × 2.2 × 2.6 m')).toBeInTheDocument();
  });

  it('says run state and health in words', () => {
    render(<SelectionInfoPanel part={findPart('antisurge') ?? null} />);

    expect(screen.getByText('Tripped')).toBeInTheDocument();
    expect(screen.getByText('Health poor')).toBeInTheDocument();
  });
});
