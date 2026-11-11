import { render, screen } from '@testing-library/react';

import { PID_FIXTURE } from './pidFixture';
import { PidTitleBlock } from './PidTitleBlock';

describe(PidTitleBlock.name, () => {
  it('prints the drawing number, revision, status and sign-off', () => {
    render(<PidTitleBlock drawing={PID_FIXTURE} />);

    expect(screen.getByText('NK-23-PID-0001')).toBeInTheDocument();
    expect(screen.getByText('Compression test loop')).toBeInTheDocument();
    expect(screen.getByText('Issued for operation')).toBeInTheDocument();
    expect(screen.getByText('AK / LW')).toBeInTheDocument();
    expect(screen.getByText('1 of 1')).toBeInTheDocument();
  });

  it('keeps only number, revision and status when compact', () => {
    render(<PidTitleBlock drawing={PID_FIXTURE} variant="compact" />);

    expect(screen.getByText('NK-23-PID-0001')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText('Compression test loop')).not.toBeInTheDocument();
  });
});
