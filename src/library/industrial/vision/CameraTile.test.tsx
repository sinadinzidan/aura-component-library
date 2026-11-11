import { fireEvent, render, screen } from '@testing-library/react';

import { CameraTile } from './CameraTile';

const base = { name: 'Compressor hall, west', tag: '23-CAM-0101', scene: 'compressor-hall', timestamp: '14:02:05' } as const;

describe(CameraTile.name, () => {
  it('shows name, tag, state in words and health', () => {
    render(<CameraTile {...base} status="live" health={{ label: 'Healthy', tone: 'success' }} />);

    expect(screen.getByText('Compressor hall, west')).toBeInTheDocument();
    expect(screen.getByText('23-CAM-0101')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('names the frame with state and time', () => {
    render(<CameraTile {...base} status="recorded" />);

    expect(screen.getByRole('img', { name: 'Compressor hall, west, recorded, 14:02:05' })).toBeInTheDocument();
  });

  it('replaces the frame with an explanation when offline', () => {
    const { container } = render(<CameraTile {...base} status="offline" stateDetail="Since 11:42" />);

    expect(screen.getByText('Camera offline')).toBeInTheDocument();
    expect(screen.getByText('Since 11:42')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="camera-frame"]')).not.toBeInTheDocument();
  });

  it('explains no signal differently from offline', () => {
    render(<CameraTile {...base} status="no-signal" />);

    expect(screen.getByText('No signal', { selector: 'span.text-sm' })).toBeInTheDocument();
  });

  it('becomes a toggle button when selectable', () => {
    const onSelect = vi.fn();
    render(<CameraTile {...base} status="live" selected onSelect={onSelect} />);

    const tile = screen.getByRole('button');
    expect(tile).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(tile);
    expect(onSelect).toHaveBeenCalled();
  });
});
