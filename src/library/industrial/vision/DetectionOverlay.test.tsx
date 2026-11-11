import { fireEvent, render, screen } from '@testing-library/react';

import { DetectionOverlay } from './DetectionOverlay';

const detections = [
  { id: 'd1', label: 'Corrosion', confidence: 0.91, box: { x: 0.1, y: 0.2, w: 0.2, h: 0.2 } },
  { id: 'd2', label: 'Leak', confidence: 0.55, box: { x: 0.5, y: 0.5, w: 0.1, h: 0.1 } },
];

describe(DetectionOverlay.name, () => {
  it('draws a labelled box with confidence for each detection', () => {
    render(<DetectionOverlay detections={detections} review={{}} />);

    expect(screen.getByRole('button', { name: 'Corrosion, 91 % confidence, to review' })).toBeInTheDocument();
    expect(screen.getByText('55 %')).toBeInTheDocument();
  });

  it('positions boxes in percent of the frame', () => {
    render(<DetectionOverlay detections={detections} review={{}} />);

    expect(screen.getByRole('button', { name: /Corrosion/ }).closest('li')).toHaveStyle({ left: '10%', top: '20%', width: '20%', height: '20%' });
  });

  it('says the review state in words', () => {
    render(<DetectionOverlay detections={detections} review={{ d1: 'accepted', d2: 'rejected' }} />);

    expect(screen.getByRole('button', { name: /Corrosion.*accepted/ })).toHaveAttribute('data-status', 'accepted');
    expect(screen.getByRole('button', { name: /Leak.*rejected/ })).toHaveAttribute('data-status', 'rejected');
  });

  it('selects a box on click and marks the selected one', () => {
    const onSelect = vi.fn();
    render(<DetectionOverlay detections={detections} review={{}} selectedId="d2" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /Corrosion/ }));

    expect(onSelect).toHaveBeenCalledWith('d1');
    expect(screen.getByRole('button', { name: /Leak/ })).toHaveAttribute('aria-pressed', 'true');
  });
});
