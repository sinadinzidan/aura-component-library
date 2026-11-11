import { cn } from '../../../lib/utils';
import { TONE_BORDER, TONE_SURFACE } from '../status';
import type { Tone } from '../status';

import { formatConfidence, statusOf } from './detections';
import type { Detection, DetectionReview, DetectionStatus } from './detections';

export type DetectionOverlayProps = {
  detections: readonly Detection[];
  review: DetectionReview;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

const STATUS_TONE: Record<DetectionStatus, Tone> = { pending: 'info', accepted: 'success', rejected: 'neutral' };
const STATUS_WORD: Record<DetectionStatus, string> = { pending: 'To review', accepted: 'Accepted', rejected: 'Rejected' };

/**
 * Bounding boxes over a frame, each with a label and confidence tab. The state of the review is in
 * words (to review, accepted, rejected) as well as colour, and a rejected box dims and dashes.
 * Place it as a child of `CameraFrame`; boxes are also buttons, for keyboard selection.
 */
export function DetectionOverlay({ detections, review, selectedId = null, onSelect }: DetectionOverlayProps) {
  return (
    <ul aria-label="Detections on this frame" data-slot="detection-overlay" className="absolute inset-0">
      {detections.map((detection) => {
        const status = statusOf(review, detection.id);
        const tone = STATUS_TONE[status];
        const selected = detection.id === selectedId;
        return (
          <li
            key={detection.id}
            className="absolute"
            style={{ left: `${detection.box.x * 100}%`, top: `${detection.box.y * 100}%`, width: `${detection.box.w * 100}%`, height: `${detection.box.h * 100}%` }}
          >
            <button
              type="button"
              aria-pressed={selected}
              aria-label={`${detection.label}, ${formatConfidence(detection.confidence)} confidence, ${STATUS_WORD[status].toLowerCase()}`}
              onClick={() => onSelect?.(detection.id)}
              data-status={status}
              className={cn(
                'relative size-full cursor-pointer rounded-xs border-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring-default)]',
                TONE_BORDER[tone],
                status === 'rejected' && 'border-dashed opacity-60',
                selected && 'outline-2 outline-offset-2 outline-[var(--primary-background)]'
              )}
            >
              <span className={cn('absolute -top-6 left-[-2px] flex items-center gap-1.5 whitespace-nowrap rounded-xs px-1.5 py-1 text-xs font-medium leading-none tabular-nums', TONE_SURFACE[tone])}>
                {detection.label}
                <span className="font-normal">{formatConfidence(detection.confidence)}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
