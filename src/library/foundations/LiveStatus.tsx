import { IconAlertTriangle, IconCircleCheck, IconInfoCircle } from '@cognite/aura/icons';

export type LiveStatusTone = 'neutral' | 'success' | 'critical';

export type LiveStatusProps = {
  /** The current message. An empty string keeps the region mounted but silent. */
  message: string;
  tone?: LiveStatusTone;
  /**
   * `polite` waits for the screen reader to finish; `assertive` interrupts. Use assertive only for
   * errors the user must act on, never for routine updates.
   */
  politeness?: 'polite' | 'assertive';
  /** Hides the message visually and keeps it for assistive technology only. */
  visuallyHidden?: boolean;
  className?: string;
};

const TONE_TEXT: Record<LiveStatusTone, string> = {
  neutral: 'text-medium-foreground',
  success: 'text-success-foreground-strong',
  critical: 'text-critical-foreground-strong',
};

/**
 * A live region for async status: the element stays mounted and only its text changes, which is
 * what makes screen readers announce it. The icon repeats the tone so it never rests on colour.
 */
export function LiveStatus({
  message,
  tone = 'neutral',
  politeness = 'polite',
  visuallyHidden = false,
  className = '',
}: LiveStatusProps) {
  const Icon = tone === 'success' ? IconCircleCheck : tone === 'critical' ? IconAlertTriangle : IconInfoCircle;

  return (
    <p
      data-slot="live-status"
      data-tone={tone}
      role={politeness === 'assertive' ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic="true"
      className={
        visuallyHidden ? 'sr-only' : `flex min-h-5 items-center gap-1.5 text-sm ${TONE_TEXT[tone]} ${className}`.trim()
      }
    >
      {message && !visuallyHidden ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
      {message}
    </p>
  );
}
