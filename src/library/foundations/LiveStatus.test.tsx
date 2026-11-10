import { render, screen } from '@testing-library/react';

import { LiveStatus } from './LiveStatus';

describe(LiveStatus.name, () => {
  it('is a polite status region by default', () => {
    render(<LiveStatus message="12 alarms loaded" />);

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('12 alarms loaded');
  });

  it('becomes an alert when assertive', () => {
    render(<LiveStatus message="Could not load alarms" politeness="assertive" tone="critical" />);

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });

  it('stays mounted and empty when there is no message', () => {
    render(<LiveStatus message="" />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('keeps the same element when the message changes, so the change is announced', () => {
    const { rerender } = render(<LiveStatus message="Loading alarms" />);
    const region = screen.getByRole('status');

    rerender(<LiveStatus message="12 alarms loaded" tone="success" />);

    expect(screen.getByRole('status')).toBe(region);
    expect(region).toHaveTextContent('12 alarms loaded');
  });

  it('can be hidden visually while staying available to assistive technology', () => {
    render(<LiveStatus message="Saved" visuallyHidden />);

    expect(screen.getByRole('status')).toHaveClass('sr-only');
  });
});
