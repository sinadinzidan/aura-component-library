import { render, screen } from '@testing-library/react';

import { EquipmentSymbol } from './EquipmentSymbol';
import { SYMBOLS, SYMBOL_KINDS } from './symbolPaths';

describe(EquipmentSymbol.name, () => {
  it.each(SYMBOL_KINDS)('draws %s as a named image', (kind) => {
    const { container } = render(<EquipmentSymbol kind={kind} />);

    expect(screen.getByRole('img', { name: SYMBOLS[kind].label })).toHaveAttribute('data-kind', kind);
    expect(container.querySelectorAll('path')).toHaveLength(SYMBOLS[kind].shapes.length);
  });

  it('takes a custom accessible name', () => {
    render(<EquipmentSymbol kind="compressor" label="23-KA-9101, running" />);

    expect(screen.getByRole('img', { name: '23-KA-9101, running' })).toBeInTheDocument();
  });

  it('is neutral grey and hollow by default', () => {
    const { container } = render(<EquipmentSymbol kind="centrifugal-pump" />);

    expect(screen.getByRole('img')).toHaveClass('text-medium-foreground', 'size-8');
    expect(container.querySelector('[data-role="body"]')).toHaveAttribute('fill-opacity', '0');
  });

  it('fills the body but not the detail lines', () => {
    const { container } = render(<EquipmentSymbol kind="centrifugal-pump" fill="solid" />);

    expect(container.querySelector('[data-role="body"]')).toHaveAttribute('fill-opacity', '0.35');
    expect(container.querySelector('[data-role="line"]')).toHaveAttribute('fill', 'none');
  });

  it('takes the status colour for an abnormal state', () => {
    render(<EquipmentSymbol kind="compressor" tone="critical" />);

    expect(screen.getByRole('img')).toHaveClass('text-critical-foreground-strong');
    expect(screen.getByRole('img')).not.toHaveClass('text-medium-foreground');
  });

  it('dashes the body outline when asked', () => {
    const { container } = render(<EquipmentSymbol kind="centrifugal-pump" dashed />);

    expect(container.querySelector('[data-role="body"]')).toHaveAttribute('stroke-dasharray');
    expect(container.querySelector('[data-role="line"]')).not.toHaveAttribute('stroke-dasharray');
  });

  it('prints the letter of a motor', () => {
    render(<EquipmentSymbol kind="motor" />);

    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('uses a size utility for each named size', () => {
    render(<EquipmentSymbol kind="fan" size="lg" />);

    expect(screen.getByRole('img')).toHaveClass('size-12');
  });

  it('centres itself in a diagram when given a position', () => {
    render(
      <svg>
        <EquipmentSymbol kind="fan" size={40} cx={100} cy={60} />
      </svg>
    );

    const symbol = screen.getByRole('img', { name: 'Fan' });
    expect(symbol).toHaveAttribute('x', '80');
    expect(symbol).toHaveAttribute('y', '40');
    expect(symbol).toHaveAttribute('width', '40');
  });

  it('keeps strokes from scaling', () => {
    const { container } = render(<EquipmentSymbol kind="filter" size="lg" />);

    expect(container.querySelector('path')).toHaveAttribute('vector-effect', 'non-scaling-stroke');
  });

  it('draws extra marks passed as children', () => {
    const { container } = render(
      <EquipmentSymbol kind="gate-valve">
        <path data-testid="mark" d="M 1 1 L 2 2" />
      </EquipmentSymbol>
    );

    expect(container.querySelector('[data-testid="mark"]')).toBeInTheDocument();
  });
});
