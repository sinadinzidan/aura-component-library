/** The five states an approval request can be in, and the word for each. */
export type ApprovalState = 'pending' | 'approved' | 'rejected' | 'changes-requested' | 'expired';

const LABEL: Record<ApprovalState, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  'changes-requested': 'Changes requested',
  expired: 'Expired',
};

/** The word for a state, for badges, sentences and accessible names. */
export const approvalStateLabel = (state: ApprovalState): string => LABEL[state];

/** A request that still waits for an answer. Every other state is final or back with the requester. */
export const isOpenApproval = (state: ApprovalState): boolean => state === 'pending';
