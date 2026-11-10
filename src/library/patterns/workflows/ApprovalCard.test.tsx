import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApprovalCard } from './ApprovalCard';

const REQUEST = {
  title: 'Raise high alarm limit on 23-TT-92532',
  kind: 'Alarm limit change',
  reference: 'MOC-2231',
  requester: { id: 'ak', name: 'Aisha Khan', role: 'Rotating equipment engineer' },
  requestedAt: '12 Mar, 09:40',
  reason: 'Nuisance alarms during warm start-up.',
};

describe(ApprovalCard.name, () => {
  it('says who asks, for what and why', () => {
    render(<ApprovalCard {...REQUEST} state="pending" />);

    expect(screen.getByRole('article', { name: REQUEST.title })).toBeInTheDocument();
    expect(screen.getByText('Aisha Khan')).toBeInTheDocument();
    expect(screen.getByText(/requested 12 Mar, 09:40/)).toBeInTheDocument();
    expect(screen.getByText('Nuisance alarms during warm start-up.')).toBeInTheDocument();
    expect(screen.getByText('MOC-2231')).toBeInTheDocument();
  });

  it('shows the state as a badge', () => {
    render(<ApprovalCard {...REQUEST} state="changes-requested" />);

    expect(screen.getByText('Changes requested')).toBeInTheDocument();
  });

  it('offers the decisions that have a handler while pending', async () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(<ApprovalCard {...REQUEST} state="pending" onApprove={onApprove} onReject={onReject} />);

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));

    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Request changes' })).not.toBeInTheDocument();
  });

  it('replaces the buttons with the decision once decided', () => {
    render(<ApprovalCard {...REQUEST} state="approved" decision="Approved by Liv Wold · 12 Mar, 10:05" footerNote="5 h left" onApprove={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.getByText('Approved by Liv Wold · 12 Mar, 10:05')).toBeInTheDocument();
    expect(screen.queryByText('5 h left')).not.toBeInTheDocument();
  });

  it('shows the footer note while pending', () => {
    render(<ApprovalCard {...REQUEST} state="pending" footerNote="5 h left" onApprove={vi.fn()} />);

    expect(screen.getByText('5 h left')).toBeInTheDocument();
  });

  it('renders the substance of the request', () => {
    render(
      <ApprovalCard {...REQUEST} state="pending">
        <p>145.0 to 148.0 °C</p>
      </ApprovalCard>
    );

    expect(screen.getByText('145.0 to 148.0 °C')).toBeInTheDocument();
  });
});
