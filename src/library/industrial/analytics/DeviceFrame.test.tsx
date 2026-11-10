import { render, screen } from '@testing-library/react';

import { DeviceFrame } from './DeviceFrame';

describe(DeviceFrame.name, () => {
  it('names the screen and renders its content', () => {
    render(
      <DeviceFrame label="Checkpoint screen on a phone">
        <p>Check oil level</p>
      </DeviceFrame>
    );

    expect(screen.getByRole('region', { name: 'Checkpoint screen on a phone' })).toHaveAttribute('data-device', 'phone');
    expect(screen.getByText('Check oil level')).toBeInTheDocument();
  });

  it('shows the time and the connection in words', () => {
    const { rerender } = render(<DeviceFrame label="Screen" time="06:42">content</DeviceFrame>);
    expect(screen.getByText('06:42')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();

    rerender(<DeviceFrame label="Screen" connection="offline">content</DeviceFrame>);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('sizes the frame by device', () => {
    render(<DeviceFrame label="Tablet screen" device="tablet">content</DeviceFrame>);

    expect(screen.getByRole('region', { name: 'Tablet screen' })).toHaveClass('max-w-3xl');
  });

  it('keeps the device height unless cropped to its content', () => {
    const { rerender } = render(<DeviceFrame label="Screen">content</DeviceFrame>);
    expect(screen.getByRole('region', { name: 'Screen' })).toHaveClass('min-h-144');

    rerender(<DeviceFrame label="Screen" height="content">content</DeviceFrame>);
    expect(screen.getByRole('region', { name: 'Screen' })).not.toHaveClass('min-h-144');
  });

  it('renders header and footer slots around the content', () => {
    const { container } = render(
      <DeviceFrame label="Screen" header={<p>Round 3</p>} footer={<button type="button">Complete step</button>}>
        content
      </DeviceFrame>
    );

    expect(container.querySelector('[data-slot="device-header"]')).toHaveTextContent('Round 3');
    expect(container.querySelector('[data-slot="device-footer"]')).toContainElement(screen.getByRole('button', { name: 'Complete step' }));
  });

  it('leaves the slots out when they are not given', () => {
    const { container } = render(<DeviceFrame label="Screen">content</DeviceFrame>);

    expect(container.querySelector('[data-slot="device-header"]')).toBeNull();
    expect(container.querySelector('[data-slot="device-footer"]')).toBeNull();
  });
});
