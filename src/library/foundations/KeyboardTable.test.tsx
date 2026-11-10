import { render, screen, within } from '@testing-library/react';

import { KeyboardTable } from './KeyboardTable';

const PATTERNS = [
  {
    id: 'tabs',
    component: 'Tabs',
    bindings: [
      { keys: ['←', '→'], action: 'Move between tabs' },
      { keys: ['Home'], action: 'First tab' },
    ],
  },
  { id: 'dialog', component: 'Dialog', bindings: [{ keys: ['Esc'], action: 'Close' }] },
];

describe(KeyboardTable.name, () => {
  it('names the table with its caption', () => {
    render(<KeyboardTable caption="Keyboard patterns" patterns={PATTERNS} />);

    expect(screen.getByRole('table', { name: 'Keyboard patterns' })).toBeInTheDocument();
  });

  it('renders one row per component family', () => {
    render(<KeyboardTable caption="Keyboard patterns" patterns={PATTERNS} />);

    expect(screen.getByRole('rowheader', { name: 'Tabs' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Dialog' })).toBeInTheDocument();
  });

  it('lists each binding with its keys and action', () => {
    render(<KeyboardTable caption="Keyboard patterns" patterns={PATTERNS} />);

    const row = screen.getByRole('row', { name: /Tabs/ });
    const items = within(row).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Move between tabs');
    expect(within(items[0]).getByText('←').tagName).toBe('KBD');
  });

  it('joins alternative keys with "or"', () => {
    render(<KeyboardTable caption="Keyboard patterns" patterns={PATTERNS} />);

    const row = screen.getByRole('row', { name: /Tabs/ });
    expect(within(row).getAllByText('or')).toHaveLength(1);
  });
});
