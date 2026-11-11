import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';

import { RATIONALISATION_COLUMNS, RationalisationRow } from './RationalisationRow';
import type { RationalisationRowProps } from './RationalisationRow';

const BASE: RationalisationRowProps = {
  tag: '23-TT-92532',
  alarmType: 'High',
  cause: 'Loss of cooling water to the interstage cooler',
  consequence: 'Compressor trips on high discharge temperature',
  severity: 'major',
  action: 'Start the standby cooling water pump',
  minutesToRespond: 8,
};

function renderRow(row: ReactNode) {
  return render(
    <table>
      <tbody>{row}</tbody>
    </table>
  );
}

describe(RationalisationRow.name, () => {
  it('prints tag, type, cause, consequence and action', () => {
    renderRow(<RationalisationRow {...BASE} />);

    const row = screen.getByRole('row');
    expect(within(row).getByRole('rowheader')).toHaveTextContent('23-TT-92532High');
    expect(within(row).getByText(BASE.cause)).toBeVisible();
    expect(within(row).getByText(BASE.consequence)).toBeVisible();
    expect(within(row).getByText(BASE.action)).toBeVisible();
  });

  it('works the priority out from severity and time to respond', () => {
    renderRow(<RationalisationRow {...BASE} />);

    expect(screen.getByRole('row')).toHaveAttribute('data-priority', 'medium');
    expect(screen.getByText('Medium')).toBeVisible();
  });

  it('shows the response band next to the time', () => {
    renderRow(<RationalisationRow {...BASE} />);

    expect(screen.getByText('8 min')).toBeVisible();
    expect(screen.getByText('3 to 10 min')).toBeVisible();
  });

  it('shows the old priority struck through when the review changes it', () => {
    const { container } = renderRow(<RationalisationRow {...BASE} currentPriority="high" />);

    expect(container.querySelector('[data-slot="current-priority"]')).toHaveTextContent('High');
    expect(screen.getByRole('row')).toHaveAttribute('data-changed', 'true');
  });

  it('shows only the result when the priority stays the same', () => {
    const { container } = renderRow(<RationalisationRow {...BASE} currentPriority="medium" />);

    expect(container.querySelector('[data-slot="current-priority"]')).toBeNull();
    expect(screen.getByRole('row')).toHaveAttribute('data-changed', 'false');
  });

  it('explains an alarm that should not be one', () => {
    const { container } = renderRow(<RationalisationRow {...BASE} severity="none" />);

    expect(screen.getByText('Not an alarm')).toBeVisible();
    expect(container.querySelector('[data-slot="rationalisation-finding"]')).toHaveTextContent('Remove the alarm');
  });

  it('flags a response time no operator can meet', () => {
    const { container } = renderRow(<RationalisationRow {...BASE} severity="severe" minutesToRespond={0.5} />);

    expect(screen.getByText('0.5 min')).toBeVisible();
    expect(container.querySelector('[data-slot="rationalisation-finding"]')).toHaveTextContent('automatic action');
  });

  it('exports one heading per cell', () => {
    renderRow(<RationalisationRow {...BASE} />);

    expect(screen.getByRole('row').children).toHaveLength(RATIONALISATION_COLUMNS.length);
  });
});
