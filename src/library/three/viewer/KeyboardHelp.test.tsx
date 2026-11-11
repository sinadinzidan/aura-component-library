import { fireEvent, render, screen } from '@testing-library/react';

import { KeyboardHelp } from './KeyboardHelp';

describe(KeyboardHelp.name, () => {
  it('stays closed behind its trigger', () => {
    render(<KeyboardHelp />);

    expect(screen.getByRole('button', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists the shortcuts by group when opened', () => {
    render(<KeyboardHelp />);

    fireEvent.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Navigate' })).toHaveTextContent('Orbit mode');
    expect(screen.getByRole('region', { name: 'Tools' })).toHaveTextContent('Measure tool');
    expect(screen.getByRole('region', { name: 'View' })).toHaveTextContent('Toggle x-ray');
  });

  it('can be opened from outside', () => {
    render(<KeyboardHelp open onOpenChange={() => undefined} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
