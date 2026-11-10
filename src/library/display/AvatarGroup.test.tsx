import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen, within } from '@testing-library/react';

import { AvatarGroup } from './AvatarGroup';
import type { AvatarGroupPerson } from './AvatarGroup';

describe(AvatarGroup.name, () => {
  it('shows everyone when the group fits', () => {
    renderGroup(PEOPLE.slice(0, 3), 4);

    expect(screen.getByLabelText('Ingrid Haugen')).toBeInTheDocument();
    expect(screen.getByLabelText('Aisha Khan')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('collapses people past the maximum into an overflow count', () => {
    renderGroup(PEOPLE, 3);

    expect(screen.getByRole('button')).toHaveTextContent('+2');
    expect(screen.queryByLabelText('Tomás Barros')).not.toBeInTheDocument();
  });

  it('names the hidden people on the overflow avatar', () => {
    renderGroup(PEOPLE, 3);

    expect(screen.getByRole('button', { name: '2 more: Tomás Barros, Liv Wold' })).toBeInTheDocument();
  });

  it('does not collapse a group that is exactly at the maximum', () => {
    renderGroup(PEOPLE, 5);

    expect(screen.getByLabelText('Liv Wold')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('labels the group', () => {
    renderGroup(PEOPLE, 2);

    const group = screen.getByRole('group', { name: 'Assignees' });
    expect(within(group).getByLabelText('Magnus Solberg')).toBeInTheDocument();
  });
});

const PEOPLE: readonly AvatarGroupPerson[] = [
  { id: 'ih', name: 'Ingrid Haugen' },
  { id: 'ms', name: 'Magnus Solberg' },
  { id: 'ak', name: 'Aisha Khan' },
  { id: 'tb', name: 'Tomás Barros' },
  { id: 'lw', name: 'Liv Wold' },
];

function renderGroup(people: readonly AvatarGroupPerson[], max: number) {
  return render(
    <TooltipProvider>
      <AvatarGroup people={people} max={max} label="Assignees" />
    </TooltipProvider>
  );
}
