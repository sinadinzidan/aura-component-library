import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IsoCallout } from './IsoCallout';

describe(IsoCallout.name, () => {
  it('is a named region with title, tag, status and content', () => {
    render(
      <IsoCallout anchor={{ x: 0.3, y: 0.5 }} title="Inlet separator" tag="20-VA-1001" status={<span>Running</span>}>
        <p>Level 54.3 %</p>
      </IsoCallout>
    );

    const region = screen.getByRole('region', { name: 'Inlet separator' });
    expect(region).toHaveTextContent('20-VA-1001');
    expect(region).toHaveTextContent('Running');
    expect(region).toHaveTextContent('Level 54.3 %');
  });

  it('is pinned at its anchor', () => {
    const { container } = render(<IsoCallout anchor={{ x: 0.3, y: 0.5 }} title="Inlet separator" />);

    const callout = container.querySelector<HTMLElement>('[data-slot="iso-callout"]');
    expect(callout?.style.left).toBe('30%');
    expect(callout?.style.top).toBe('50%');
  });

  it('opens away from the nearest edges', () => {
    const { container, rerender } = render(<IsoCallout anchor={{ x: 0.2, y: 0.2 }} title="Flare" />);
    expect(container.querySelector('[data-slot="iso-callout"]')).toHaveAttribute('data-side', 'right');
    expect(container.querySelector('[data-slot="iso-callout"]')).toHaveAttribute('data-vertical', 'below');

    rerender(<IsoCallout anchor={{ x: 0.9, y: 0.9 }} title="Flare" />);

    expect(container.querySelector('[data-slot="iso-callout"]')).toHaveAttribute('data-side', 'left');
    expect(container.querySelector('[data-slot="iso-callout"]')).toHaveAttribute('data-vertical', 'above');
  });

  it('honours an explicit placement', () => {
    const { container } = render(<IsoCallout anchor={{ x: 0.2, y: 0.2 }} title="Flare" placement={{ side: 'left', vertical: 'above' }} />);

    expect(container.querySelector('[data-slot="iso-callout"]')).toHaveAttribute('data-side', 'left');
  });

  it('closes from its button', async () => {
    const onClose = vi.fn();
    render(<IsoCallout anchor={{ x: 0.3, y: 0.5 }} title="Inlet separator" onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Close Inlet separator' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has no close button unless closing is handled', () => {
    render(<IsoCallout anchor={{ x: 0.3, y: 0.5 }} title="Inlet separator" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
