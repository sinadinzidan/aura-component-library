import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BowTieDiagram } from './BowTieDiagram';
import type { BowTieModel } from './bowTieLayout';

const MODEL: BowTieModel = {
  hazard: 'Hydrocarbon gas under pressure',
  topEvent: 'Gas release',
  barriers: [
    { id: 'trip', name: 'High pressure trip', type: 'engineered', state: 'healthy' },
    { id: 'psv', name: 'Relief valve', type: 'engineered', state: 'degraded', escalation: 'Recertification overdue' },
    { id: 'esd', name: 'Emergency shutdown', type: 'engineered', state: 'impaired' },
  ],
  threats: [
    { id: 't-overpressure', name: 'Overpressure', barrierIds: ['trip', 'psv'] },
    { id: 't-corrosion', name: 'Internal corrosion', barrierIds: ['trip'] },
  ],
  consequences: [{ id: 'c-fire', name: 'Jet fire', severity: 'severe', barrierIds: ['esd'] }],
};

const LABEL = 'Bow-tie for loss of containment';

describe(BowTieDiagram.name, () => {
  it('names the drawing', () => {
    render(<BowTieDiagram label={LABEL} model={MODEL} />);

    expect(screen.getByRole('group', { name: LABEL })).toBeInTheDocument();
  });

  it('draws the hazard, the top event, every threat and every consequence', () => {
    render(<BowTieDiagram label={LABEL} model={MODEL} />);

    const drawing = screen.getByRole('group', { name: LABEL });
    for (const text of ['Hazard', 'Top event', 'Gas release', 'Overpressure', 'Internal corrosion', 'Jet fire']) {
      expect(within(drawing).getByText(text)).toBeInTheDocument();
    }
  });

  it('draws a barrier once for every path it sits on', () => {
    const { container } = render(<BowTieDiagram label={LABEL} model={MODEL} />);

    expect(container.querySelectorAll('[data-slot="bow-tie-barrier"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-slot="bow-tie-line"]')).toHaveLength(3);
  });

  it('writes the state of every barrier as a word and carries it on the node', () => {
    const { container } = render(<BowTieDiagram label={LABEL} model={MODEL} legend={false} />);

    const impaired = container.querySelector('[data-slot="bow-tie-barrier"][data-state="impaired"]');
    expect(impaired).toHaveTextContent('Impaired');
    expect(container.querySelectorAll('[data-state="degraded"]')).toHaveLength(1);
  });

  it('writes the severity of a consequence', () => {
    render(<BowTieDiagram label={LABEL} model={MODEL} />);

    expect(screen.getByText('Severe')).toBeInTheDocument();
  });

  it('draws the escalation factor under its barrier', () => {
    const { container } = render(<BowTieDiagram label={LABEL} model={MODEL} />);

    expect(container.querySelectorAll('[data-slot="bow-tie-escalation"]')).toHaveLength(1);
    expect(container.querySelector('[data-slot="bow-tie-escalation"]')).toHaveTextContent('Recertification');
  });

  it('shows barriers as images, not buttons, when nothing can be selected', () => {
    render(<BowTieDiagram label={LABEL} model={MODEL} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Relief valve, engineered barrier, degraded, on path Overpressure/ })).toBeInTheDocument();
  });

  it('reports the barrier that was clicked', async () => {
    const onSelect = vi.fn();
    render(<BowTieDiagram label={LABEL} model={MODEL} onSelectBarrier={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /Relief valve/ }));

    expect(onSelect).toHaveBeenCalledWith('psv');
  });

  it('selects a barrier from the keyboard with Enter and Space', async () => {
    const onSelect = vi.fn();
    render(<BowTieDiagram label={LABEL} model={MODEL} onSelectBarrier={onSelect} />);

    screen.getByRole('button', { name: /Emergency shutdown/ }).focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenLastCalledWith('esd');
  });

  it('marks every placement of the selected barrier as pressed', () => {
    render(<BowTieDiagram label={LABEL} model={MODEL} selectedBarrierId="trip" onSelectBarrier={() => undefined} />);

    const pressed = screen.getAllByRole('button', { pressed: true });
    expect(pressed).toHaveLength(2);
  });

  it('picks out the path of a hovered barrier', () => {
    const { container } = render(<BowTieDiagram label={LABEL} model={MODEL} onSelectBarrier={() => undefined} />);
    const node = container.querySelector('[data-slot="bow-tie-barrier"][data-state="impaired"]');
    expect(node).not.toBeNull();

    if (node) fireEvent.mouseEnter(node);

    const active = container.querySelectorAll('[data-slot="bow-tie-line"][data-active="true"]');
    expect(active).toHaveLength(1);
    expect(container.querySelector('[data-slot="bow-tie-path"][data-active="true"]')).toHaveTextContent('Jet fire');
  });

  it('picks out the path of a focused barrier and lets go on blur', () => {
    const { container } = render(<BowTieDiagram label={LABEL} model={MODEL} onSelectBarrier={() => undefined} />);
    const button = screen.getByRole('button', { name: /Relief valve/ });

    fireEvent.focus(button);
    expect(container.querySelectorAll('[data-slot="bow-tie-line"][data-active="true"]')).toHaveLength(1);

    fireEvent.blur(button);
    expect(container.querySelectorAll('[data-slot="bow-tie-line"][data-active="true"]')).toHaveLength(0);
  });

  it('counts the barriers per state in the key', () => {
    render(<BowTieDiagram label={LABEL} model={MODEL} />);

    const key = screen.getByRole('list', { name: 'Key' });
    expect(within(key).getByText('Healthy').closest('li')).toHaveTextContent('2');
    expect(within(key).getByText('Escalation factor')).toBeVisible();
  });

  it('keeps names in the accessible name and drops escalation factors in the compact form', () => {
    const { container } = render(<BowTieDiagram label={LABEL} model={MODEL} compact />);

    expect(screen.getByRole('img', { name: /Emergency shutdown, engineered barrier, impaired/ })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="bow-tie-escalation"]')).toHaveLength(0);
  });

  it('says so when there is no path to draw', () => {
    render(<BowTieDiagram label={LABEL} model={{ ...MODEL, threats: [], consequences: [] }} emptyText="No weakened paths." />);

    expect(screen.getByText('No weakened paths.')).toBeVisible();
    expect(screen.queryByRole('group', { name: LABEL })).not.toBeInTheDocument();
  });
});
