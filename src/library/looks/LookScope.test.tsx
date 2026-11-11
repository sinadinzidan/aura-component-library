import { render, screen } from '@testing-library/react';

import { LookProvider, LookScope } from './LookScope';
import { useLook, useLookDefinition } from './useLook';

function Probe() {
  const look = useLook();
  const { chart } = useLookDefinition();
  return (
    <span>
      {look}/{chart.area}
    </span>
  );
}

describe(LookScope.name, () => {
  it('defaults to studio outside any scope', () => {
    render(<Probe />);

    expect(screen.getByText('studio/gradient')).toBeInTheDocument();
  });

  it('sets data-look on a wrapper and provides the look', () => {
    render(
      <LookScope look="blueprint">
        <Probe />
      </LookScope>
    );

    expect(screen.getByText('blueprint/none').parentElement).toHaveAttribute('data-look', 'blueprint');
  });

  it('applies the accent and typeface the look was drawn with', () => {
    render(
      <LookScope look="soft">
        <Probe />
      </LookScope>
    );

    const scope = screen.getByText('soft/gradient').parentElement;
    expect(scope).toHaveAttribute('data-accent', 'dusk');
    expect(scope).toHaveAttribute('data-typeface', 'manrope');
  });

  it('forces dark for dark-only looks', () => {
    render(
      <LookScope look="console">
        <Probe />
      </LookScope>
    );

    expect(screen.getByText('console/none').parentElement).toHaveClass('dark');
  });

  it('keeps the surrounding theme when told to inherit', () => {
    render(
      <LookScope look="console" inheritTheme>
        <Probe />
      </LookScope>
    );

    const scope = screen.getByText('console/none').parentElement;
    expect(scope).not.toHaveClass('dark');
    expect(scope).not.toHaveAttribute('data-accent');
  });

  it('lets the nearest scope win', () => {
    render(
      <LookScope look="poster">
        <LookScope look="glass">
          <Probe />
        </LookScope>
      </LookScope>
    );

    expect(screen.getByText('glass/gradient')).toBeInTheDocument();
  });
});

describe(LookProvider.name, () => {
  it('provides a look without a wrapper element', () => {
    const { container } = render(
      <LookProvider look="signal">
        <Probe />
      </LookProvider>
    );

    expect(container.firstElementChild).toHaveTextContent('signal/solid');
  });
});
