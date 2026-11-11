import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tag } from './Tag';

describe(Tag.name, () => {
  it('is static text by default', () => {
    render(<Tag>Mechanical</Tag>);

    expect(screen.getByText('Mechanical')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses the neutral variant unless told otherwise', () => {
    const { container } = render(<Tag>Mechanical</Tag>);

    expect(container.firstElementChild).toHaveAttribute('data-variant', 'neutral');
  });

  it('derives a stable decorative variant from a colour key', () => {
    const { container, rerender } = render(<Tag colorKey="Mechanical">Mechanical</Tag>);
    const first = container.firstElementChild?.getAttribute('data-variant');

    rerender(<Tag colorKey="Mechanical">Mechanical discipline</Tag>);

    expect(first).toMatch(/^decorative-[1-7]$/);
    expect(container.firstElementChild).toHaveAttribute('data-variant', first);
  });

  it('takes a status tone only from the status prop', () => {
    const { container } = render(<Tag status="critical">Tripped</Tag>);

    expect(container.firstElementChild).toHaveAttribute('data-variant', 'critical');
    expect(container.firstElementChild).toHaveClass('bg-critical-background');
  });

  it('sets identifiers in monospace', () => {
    render(<Tag mono>23-KA-9101</Tag>);

    expect(screen.getByText('23-KA-9101')).toHaveClass('font-mono');
  });

  it('shows a count', () => {
    render(<Tag count={12}>Vibration</Tag>);

    expect(screen.getByText('12')).toHaveClass('tabular-nums');
  });

  it('has a remove button named after the tag', async () => {
    const onRemove = vi.fn();
    render(<Tag onRemove={onRemove}>Vibration</Tag>);

    await userEvent.click(screen.getByRole('button', { name: 'Remove Vibration' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('accepts a custom remove label', () => {
    render(
      <Tag onRemove={() => {}} removeLabel="Remove filter Site: Nordkapp">
        Nordkapp
      </Tag>
    );

    expect(screen.getByRole('button', { name: 'Remove filter Site: Nordkapp' })).toBeInTheDocument();
  });

  it('removes from the keyboard', async () => {
    const onRemove = vi.fn();
    render(<Tag onRemove={onRemove}>Vibration</Tag>);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('is a toggle button when selectable', () => {
    render(<Tag selected={false}>Corrective</Tag>);

    expect(screen.getByRole('button', { name: 'Corrective' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the next selected state', async () => {
    const onSelectedChange = vi.fn();
    render(
      <Tag selected={false} onSelectedChange={onSelectedChange}>
        Corrective
      </Tag>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Corrective' }));

    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  it('repeats the selected state with a check mark', () => {
    const { container } = render(<Tag selected>Corrective</Tag>);

    expect(screen.getByRole('button', { name: 'Corrective' })).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('[data-slot="tag-check"]')).toBeInTheDocument();
  });

  it('is a plain button with onClick', async () => {
    const onClick = vi.fn();
    render(
      <Tag mono onClick={onClick}>
        23-KA-9101
      </Tag>
    );

    await userEvent.click(screen.getByRole('button', { name: '23-KA-9101' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed');
  });

  it('stays focusable but inert when disabled, and reads out the reason', async () => {
    const onSelectedChange = vi.fn();
    render(
      <Tag selected={false} onSelectedChange={onSelectedChange} disabled disabledReason="No modification orders in this period">
        Modification
      </Tag>
    );
    const button = screen.getByRole('button', { name: /Modification/ });

    await userEvent.click(button);

    expect(onSelectedChange).not.toHaveBeenCalled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveTextContent('No modification orders in this period');
  });

  it('disables the remove button of a disabled tag', () => {
    render(
      <Tag disabled onRemove={() => {}}>
        Vibration
      </Tag>
    );

    expect(screen.getByRole('button', { name: 'Remove Vibration' })).toBeDisabled();
  });

  it('makes a static tag with a tooltip reachable by keyboard', async () => {
    render(<Tag tooltip="Inspect recompressor drive-end bearing">Inspect recompressor…</Tag>);

    await userEvent.tab();

    expect(screen.getByText('Inspect recompressor…').parentElement).toHaveFocus();
  });
});
