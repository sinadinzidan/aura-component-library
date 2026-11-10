import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { MemberRow } from './MemberRow';

describe(MemberRow.name, () => {
  it('shows the name, the detail and the role', () => {
    renderRow(<MemberRow name="Aisha Khan" detail="aisha.khan@nordkapp.example" role={<span>Editor</span>} />);

    expect(screen.getByText('Aisha Khan')).toBeInTheDocument();
    expect(screen.getByText('aisha.khan@nordkapp.example')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('shows no status for an active member', () => {
    renderRow(<MemberRow name="Aisha Khan" />);

    expect(screen.queryByText('Invited')).not.toBeInTheDocument();
    expect(screen.queryByText('Suspended')).not.toBeInTheDocument();
  });

  it('flags a pending invitation', () => {
    renderRow(<MemberRow name="Nora Dahl" status="invited" />);

    expect(screen.getByText('Invited')).toBeInTheDocument();
  });

  it('flags and dims a suspended member', () => {
    renderRow(<MemberRow name="Jonas Nyberg" status="suspended" />);

    expect(screen.getByText('Suspended')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveAttribute('data-disabled');
  });

  it('marks the signed-in person and external people', () => {
    renderRow(<MemberRow name="Liv Wold" isYou external />);

    expect(screen.getByText('(you)')).toBeInTheDocument();
    expect(screen.getByText('External')).toBeInTheDocument();
  });

  it('offers a named checkbox when selectable', async () => {
    const onChange = vi.fn();
    renderRow(<MemberRow name="Liv Wold" selection={{ checked: false, onChange }} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Liv Wold' }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders the actions', () => {
    renderRow(<MemberRow name="Liv Wold" actions={<button type="button">Remove</button>} />);

    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });
});

function renderRow(row: ReactNode) {
  return render(<ul>{row}</ul>);
}
