import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { ActivityRow } from './ActivityRow';

describe(ActivityRow.name, () => {
  it('reads as actor, verb, object and time', () => {
    renderRow({});

    expect(screen.getByRole('listitem')).toHaveTextContent('Ingrid Haugen acknowledged alm-4811');
    expect(screen.getByText('13:46')).toBeInTheDocument();
  });

  it('gives a person their avatar and no automated label', () => {
    renderRow({});

    expect(screen.getByLabelText('Ingrid Haugen')).toBeInTheDocument();
    expect(screen.queryByText('Automated')).not.toBeInTheDocument();
  });

  it('labels a system actor in words and drops the avatar', () => {
    renderRow({ actor: 'Alarm rule', actorKind: 'system', verb: 'raised' });

    expect(screen.getByText('Automated')).toBeInTheDocument();
    expect(screen.queryByLabelText('Alarm rule')).not.toBeInTheDocument();
  });

  it('shows the summary line without interaction', () => {
    renderRow({ summary: <span>P3 to P1</span> });

    expect(screen.getByText('P3 to P1')).toBeVisible();
  });

  it('has no expand button without details', () => {
    renderRow({});

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps details hidden until expanded', async () => {
    renderRow({ details: <span>Source: operator console</span> });
    const button = screen.getByRole('button', { name: 'Show details: Ingrid Haugen acknowledged' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Source: operator console')).not.toBeVisible();

    await userEvent.click(button);

    expect(screen.getByRole('button', { name: 'Hide details: Ingrid Haugen acknowledged' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Source: operator console')).toBeVisible();
  });

  it('collapses again on a second press', async () => {
    renderRow({ details: <span>Source: operator console</span>, defaultOpen: true });

    await userEvent.click(screen.getByRole('button', { name: /Hide details/ }));

    expect(screen.getByText('Source: operator console')).not.toBeVisible();
  });
});

function renderRow(props: Partial<ComponentProps<typeof ActivityRow>>) {
  return render(
    <ul>
      <ActivityRow actor="Ingrid Haugen" verb="acknowledged" object="alm-4811" time="13:46" {...props} />
    </ul>
  );
}
