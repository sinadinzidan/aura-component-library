import { fireEvent, render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { SymbolTile } from './SymbolTile';

describe(SymbolTile.name, () => {
  it('names the equipment with its state and shows tag and reading', () => {
    render(<SymbolTile kind="compressor" name="Recompressor" tag="23-KA-9103" state="Tripped" tone="critical" value="11.6 mm/s" />);

    expect(screen.getByRole('group', { name: 'Recompressor, Tripped' })).toBeInTheDocument();
    expect(screen.getByText('23-KA-9103')).toBeInTheDocument();
    expect(screen.getByText('11.6 mm/s')).toBeInTheDocument();
  });

  it('becomes a toggle button when selectable', () => {
    const onSelect = vi.fn();
    render(<SymbolTile kind="centrifugal-pump" name="Export pump A" selected onSelect={onSelect} />);

    const button = screen.getByRole('button', { name: /Export pump A/ });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('changes anatomy with the look', () => {
    const { container } = render(
      <>
        <SymbolTile kind="motor" name="Motor" />
        <LookScope look="console">
          <SymbolTile kind="motor" name="Motor" />
        </LookScope>
        <LookScope look="signal">
          <SymbolTile kind="motor" name="Motor" />
        </LookScope>
        <LookScope look="blueprint">
          <SymbolTile kind="motor" name="Motor" />
        </LookScope>
      </>
    );

    expect([...container.querySelectorAll('[data-anatomy]')].map((tile) => tile.getAttribute('data-anatomy'))).toEqual(['card', 'strip', 'block', 'outline']);
  });
});
