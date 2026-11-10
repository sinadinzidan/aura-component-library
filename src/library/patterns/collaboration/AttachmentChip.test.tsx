import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { AttachmentChip } from './AttachmentChip';

describe(AttachmentChip.name, () => {
  it('shows the file name and size', () => {
    renderChip({ size: '2.4 MB' });

    expect(screen.getByText('Borescope.jpg')).toBeInTheDocument();
    expect(screen.getByText('2.4 MB')).toBeInTheDocument();
  });

  it('is plain text without handlers', () => {
    renderChip({});

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('opens the file from its name', async () => {
    const onOpen = vi.fn();
    renderChip({ onOpen });

    await userEvent.click(screen.getByRole('button', { name: 'Open Borescope.jpg' }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('removes the file without opening it', async () => {
    const onOpen = vi.fn();
    const onRemove = vi.fn();
    renderChip({ onOpen, onRemove });

    await userEvent.click(screen.getByRole('button', { name: 'Remove Borescope.jpg' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });
});

function renderChip(props: Partial<ComponentProps<typeof AttachmentChip>>) {
  return render(
    <TooltipProvider>
      <AttachmentChip name="Borescope.jpg" {...props} />
    </TooltipProvider>
  );
}
