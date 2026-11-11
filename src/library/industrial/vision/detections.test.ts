import { detectionReducer, filterByConfidence, formatConfidence, reviewCounts, statusOf } from './detections';
import type { Detection } from './detections';

const detections: Detection[] = [
  { id: 'd1', label: 'Corrosion', confidence: 0.91, box: { x: 0.1, y: 0.1, w: 0.2, h: 0.2 } },
  { id: 'd2', label: 'Leak', confidence: 0.55, box: { x: 0.5, y: 0.5, w: 0.1, h: 0.1 } },
  { id: 'd3', label: 'Missing guard', confidence: 0.72, box: { x: 0.7, y: 0.2, w: 0.2, h: 0.3 } },
];

describe('detectionReducer', () => {
  it('accepts, rejects and resets one detection', () => {
    let review = detectionReducer({}, { type: 'accept', id: 'd1' });
    review = detectionReducer(review, { type: 'reject', id: 'd2' });
    expect(review).toEqual({ d1: 'accepted', d2: 'rejected' });
    expect(detectionReducer(review, { type: 'reset', id: 'd1' })).toEqual({ d2: 'rejected' });
  });

  it('accepts all but keeps rejections', () => {
    const review = detectionReducer({ d2: 'rejected' }, { type: 'accept-all', ids: ['d1', 'd2', 'd3'] });
    expect(review).toEqual({ d1: 'accepted', d2: 'rejected', d3: 'accepted' });
  });

  it('clears the review', () => {
    expect(detectionReducer({ d1: 'accepted' }, { type: 'clear' })).toEqual({});
  });
});

describe('detection helpers', () => {
  it('defaults to pending', () => {
    expect(statusOf({}, 'd1')).toBe('pending');
    expect(statusOf({ d1: 'accepted' }, 'd1')).toBe('accepted');
  });

  it('filters by confidence, highest first', () => {
    expect(filterByConfidence(detections, 0.6).map((item) => item.id)).toEqual(['d1', 'd3']);
    expect(filterByConfidence(detections, 0)).toHaveLength(3);
  });

  it('counts review states', () => {
    expect(reviewCounts(detections, { d1: 'accepted', d2: 'rejected' })).toEqual({ pending: 1, accepted: 1, rejected: 1 });
  });

  it('formats confidence as a clamped percentage', () => {
    expect(formatConfidence(0.914)).toBe('91 %');
    expect(formatConfidence(1.4)).toBe('100 %');
    expect(formatConfidence(-1)).toBe('0 %');
  });
});
