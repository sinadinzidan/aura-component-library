import { render, screen, within } from '@testing-library/react';

import { DangerTag } from './DangerTag';
import type { DangerTagProps } from './DangerTag';

const BASE: DangerTagProps = {
  tagNo: 'DT-1182',
  point: 'Suction block valve',
  pointTag: '23-HV-9106',
  position: 'Closed',
  reason: 'Dry gas seal replacement, IC-2304',
  lockNo: 'L-0431',
  placedBy: 'Ingrid Haugen',
  placedAt: '12 Mar 2026, 06:40',
};

describe(DangerTag.name, () => {
  it('has an accessible name with the tag number, the instruction and the point', () => {
    render(<DangerTag {...BASE} />);

    expect(screen.getByRole('article', { name: 'Danger tag DT-1182: do not operate 23-HV-9106' })).toBeInTheDocument();
  });

  it('prints the heading and the instruction', () => {
    render(<DangerTag {...BASE} />);

    expect(screen.getByText('Danger')).toBeVisible();
    expect(screen.getByText('Do not operate')).toBeVisible();
  });

  it('prints every hand-filled field', () => {
    render(<DangerTag {...BASE} />);

    const tag = screen.getByRole('article');
    for (const text of ['Suction block valve', '23-HV-9106', 'Closed', 'Dry gas seal replacement, IC-2304', 'DT-1182', 'L-0431', 'Ingrid Haugen', '12 Mar 2026, 06:40']) {
      expect(within(tag).getByText(text)).toBeVisible();
    }
  });

  it('leaves the lock number out when the point has no lock', () => {
    render(<DangerTag {...BASE} lockNo={undefined} />);

    expect(screen.queryByText('Lock no.')).not.toBeInTheDocument();
  });

  it('takes another heading and instruction', () => {
    render(<DangerTag {...BASE} heading="Caution" instruction="Do not close" />);

    expect(screen.getByText('Caution')).toBeVisible();
    expect(screen.getByRole('article', { name: /do not close/ })).toBeInTheDocument();
  });

  it('says who may remove it', () => {
    render(<DangerTag {...BASE} />);

    expect(screen.getByText('Only the person named may remove this tag.')).toBeVisible();
  });
});
