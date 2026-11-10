import { ItemGroup } from '@cognite/aura/components/item';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { FileRow } from './FileRow';

function renderRow(props: Partial<ComponentProps<typeof FileRow>> = {}) {
  return render(
    <ItemGroup aria-label="Files">
      <FileRow name="P&ID 23-KA-9101 rev C.pdf" size={2_400_000} modified="4 Mar" owner="Aisha Khan" {...props} />
    </ItemGroup>
  );
}

describe(FileRow.name, () => {
  it('reads the type from the file name', () => {
    renderRow();

    expect(screen.getByRole('img', { name: 'PDF' })).toBeInTheDocument();
  });

  it('writes type, size and owner on the second line', () => {
    renderRow();

    expect(screen.getByText('PDF · 2.4 MB · Aisha Khan')).toBeInTheDocument();
    expect(screen.getByText('4 Mar')).toBeInTheDocument();
  });

  it('leaves out facts it was not given', () => {
    renderRow({ size: undefined, owner: undefined });

    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('uses the given kind over the extension', () => {
    renderRow({ kind: 'drawing' });

    expect(screen.getByRole('img', { name: 'Drawing' })).toBeInTheDocument();
  });

  it('says who has the file checked out', () => {
    renderRow({ lockedBy: 'Magnus Solberg' });

    expect(screen.getByText('Checked out by Magnus Solberg')).toBeInTheDocument();
  });

  it('moves the size to the end of a dense row', () => {
    renderRow({ density: 'dense' });

    expect(screen.queryByText('PDF · 2.4 MB · Aisha Khan')).not.toBeInTheDocument();
    expect(screen.getByText('2.4 MB')).toBeInTheDocument();
  });

  it('opens the file from the row', async () => {
    const onOpen = vi.fn();
    renderRow({ onOpen });

    await userEvent.click(screen.getByRole('button', { name: /P&ID 23-KA-9101 rev C\.pdf/ }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
