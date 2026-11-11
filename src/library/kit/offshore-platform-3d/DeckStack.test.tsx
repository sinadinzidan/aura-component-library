import { fireEvent, render, screen } from '@testing-library/react';

import type { DeckStackLevel } from './deckLevels';
import { DeckStack } from './DeckStack';

const LEVELS: readonly DeckStackLevel[] = [
  { id: 'upper', name: 'Upper deck', elevation: '+25 m', people: 31, alarms: [{ tone: 'info', count: 1, label: 'advisory' }] },
  {
    id: 'main',
    name: 'Main deck',
    elevation: '+18 m',
    people: 9,
    alarms: [
      { tone: 'critical', count: 1, label: 'critical' },
      { tone: 'warning', count: 2, label: 'warning' },
    ],
  },
  { id: 'cellar', name: 'Cellar deck', elevation: '+12 m', detail: 'Export pumps and drains', people: 4, alarms: [] },
];

describe(DeckStack.name, () => {
  it('draws the levels top first, each as a button', () => {
    render(<DeckStack label="Decks" levels={LEVELS} />);

    const names = screen.getAllByRole('button').map((button) => button.getAttribute('aria-label')?.split(',')[0]);
    expect(names).toEqual(['Upper deck', 'Main deck', 'Cellar deck']);
  });

  it('marks the selected level as pressed', () => {
    render(<DeckStack label="Decks" levels={LEVELS} selectedId="main" />);

    expect(screen.getByRole('button', { name: /Main deck/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Upper deck/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the level that was picked', () => {
    const onSelect = vi.fn();
    render(<DeckStack label="Decks" levels={LEVELS} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /Cellar deck/ }));

    expect(onSelect).toHaveBeenCalledWith('cellar');
  });

  it('says a level without alarms is normal, in words', () => {
    render(<DeckStack label="Decks" levels={LEVELS} />);

    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cellar deck.*no open alarms/ })).toBeInTheDocument();
  });

  it('writes each alarm class as a count and a word', () => {
    render(<DeckStack label="Decks" levels={LEVELS} />);

    expect(screen.getByText('2 warning')).toBeInTheDocument();
  });

  it('shows what a level carries when told', () => {
    render(<DeckStack label="Decks" levels={LEVELS} />);

    expect(screen.getByText('Export pumps and drains')).toBeInTheDocument();
  });
});
