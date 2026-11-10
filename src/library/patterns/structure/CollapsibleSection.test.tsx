import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CollapsibleSection } from './CollapsibleSection';

describe(CollapsibleSection.name, () => {
  it('is open by default and names the toggle after the section', () => {
    render(<CollapsibleSection title="Readings">Discharge pressure</CollapsibleSection>);

    expect(screen.getByRole('button', { name: 'Readings' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Discharge pressure')).toBeVisible();
  });

  it('starts closed when asked', () => {
    render(
      <CollapsibleSection title="Readings" defaultOpen={false}>
        Discharge pressure
      </CollapsibleSection>
    );

    expect(screen.getByRole('button', { name: 'Readings' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles when the header is pressed', async () => {
    render(<CollapsibleSection title="Readings">Discharge pressure</CollapsibleSection>);

    await userEvent.click(screen.getByRole('button', { name: 'Readings' }));

    expect(screen.getByRole('button', { name: 'Readings' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('reports the change and stays put when controlled', async () => {
    const onOpenChange = vi.fn();
    render(
      <CollapsibleSection title="Readings" open onOpenChange={onOpenChange}>
        Discharge pressure
      </CollapsibleSection>
    );

    await userEvent.click(screen.getByRole('button', { name: /Readings/ }));

    expect(onOpenChange.mock.calls[0][0]).toBe(false);
    expect(screen.getByRole('button', { name: /Readings/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps the count and actions outside the content', async () => {
    const onAdd = vi.fn();
    render(
      <CollapsibleSection
        title="Documents"
        count={12}
        defaultOpen={false}
        actions={
          <button type="button" onClick={onAdd}>
            Add document
          </button>
        }
      >
        P&amp;ID
      </CollapsibleSection>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Add document' }));

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Documents/ })).toHaveAttribute('aria-expanded', 'false');
  });
});
