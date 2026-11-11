/** AI detections on a frame, and the review state of each. Boxes are in normalised frame coordinates. */

export type DetectionStatus = 'pending' | 'accepted' | 'rejected';

export type Detection = {
  id: string;
  label: string;
  /** 0 to 1. */
  confidence: number;
  box: { x: number; y: number; w: number; h: number };
};

export type DetectionReview = Readonly<Record<string, DetectionStatus>>;

export type DetectionAction = { type: 'accept'; id: string } | { type: 'reject'; id: string } | { type: 'reset'; id: string } | { type: 'accept-all'; ids: readonly string[] } | { type: 'clear' };

export function detectionReducer(state: DetectionReview, action: DetectionAction): DetectionReview {
  switch (action.type) {
    case 'accept':
      return { ...state, [action.id]: 'accepted' };
    case 'reject':
      return { ...state, [action.id]: 'rejected' };
    case 'reset': {
      return Object.fromEntries(Object.entries(state).filter(([id]) => id !== action.id));
    }
    case 'accept-all':
      return { ...state, ...Object.fromEntries(action.ids.filter((id) => state[id] !== 'rejected').map((id) => [id, 'accepted'])) };
    case 'clear':
      return {};
  }
}

export const statusOf = (review: DetectionReview, id: string): DetectionStatus => review[id] ?? 'pending';

/** Detections at or above a confidence, highest first. */
export function filterByConfidence(detections: readonly Detection[], minimum: number): Detection[] {
  return detections.filter((detection) => detection.confidence >= minimum).sort((a, b) => b.confidence - a.confidence);
}

/** How many detections are in each review state. */
export function reviewCounts(detections: readonly Detection[], review: DetectionReview): Record<DetectionStatus, number> {
  const counts: Record<DetectionStatus, number> = { pending: 0, accepted: 0, rejected: 0 };
  for (const detection of detections) counts[statusOf(review, detection.id)] += 1;
  return counts;
}

export const formatConfidence = (confidence: number): string => `${Math.round(Math.min(1, Math.max(0, confidence)) * 100)} %`;
