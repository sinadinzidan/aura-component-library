import { approvalStateLabel, isOpenApproval } from './approvalState';

describe(approvalStateLabel.name, () => {
  it('returns the word for a state', () => {
    expect(approvalStateLabel('changes-requested')).toBe('Changes requested');
    expect(approvalStateLabel('expired')).toBe('Expired');
  });
});

describe(isOpenApproval.name, () => {
  it('is true only while a request is pending', () => {
    expect(isOpenApproval('pending')).toBe(true);
    expect(isOpenApproval('approved')).toBe(false);
    expect(isOpenApproval('changes-requested')).toBe(false);
  });
});
