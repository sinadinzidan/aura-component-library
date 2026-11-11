import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ListRow } from './ListRow';

describe(ListRow.name, () => {
  it('renders title, meta, leading and trailing content in a list item', () => {
    render(
      <ul>
        <ListRow title="Discharge temperature high" meta="23-TT-92532" leading={<span>!</span>} trailing="38 min ago" tone="warning" />
      </ul>
    );

    const row = screen.getByRole('listitem');
    expect(row).toHaveTextContent('Discharge temperature high');
    expect(row).toHaveTextContent('23-TT-92532');
    expect(row).toHaveTextContent('38 min ago');
    expect(row).toHaveAttribute('data-tone', 'warning');
  });

  it('has no button unless it is clickable', () => {
    render(
      <ul>
        <ListRow title="Discharge temperature high" />
      </ul>
    );

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('becomes one button that reports the click and the selection', async () => {
    const onClick = vi.fn();
    render(
      <ul>
        <ListRow title="Discharge temperature high" meta="23-TT-92532" onClick={onClick} selected />
      </ul>
    );

    const button = screen.getByRole('button', { name: /Discharge temperature high/ });
    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('listitem')).toHaveAttribute('data-selected', 'true');
  });

  it('is operable from the keyboard', async () => {
    const onClick = vi.fn();
    render(
      <ul>
        <ListRow title="Discharge temperature high" onClick={onClick} />
      </ul>
    );

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
