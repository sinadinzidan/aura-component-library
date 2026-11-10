import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GlassPanel } from './GlassPanel';

describe(GlassPanel.name, () => {
  it('is a named region with its title, caption and content', () => {
    render(
      <GlassPanel title="Train A" caption="23-KA-9101">
        <p>Running</p>
      </GlassPanel>
    );

    const region = screen.getByRole('region', { name: 'Train A' });
    expect(region).toHaveTextContent('23-KA-9101');
    expect(region).toHaveTextContent('Running');
  });

  it('has no focus toggle unless focus is handled', () => {
    render(<GlassPanel title="Train A">Content</GlassPanel>);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('asks to be focused when the toggle is pressed', async () => {
    const onFocusChange = vi.fn();
    render(
      <GlassPanel title="Train A" onFocusChange={onFocusChange}>
        Content
      </GlassPanel>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Focus Train A' }));

    expect(onFocusChange).toHaveBeenCalledWith(true);
  });

  it('asks to be released when it is already focused', async () => {
    const onFocusChange = vi.fn();
    render(
      <GlassPanel title="Train A" focused onFocusChange={onFocusChange}>
        Content
      </GlassPanel>
    );

    const toggle = screen.getByRole('button', { name: 'Release Train A' });
    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(onFocusChange).toHaveBeenCalledWith(false);
  });

  it('comes forward when a panel at rest is clicked anywhere', async () => {
    const onFocusChange = vi.fn();
    render(
      <GlassPanel title="Train A" onFocusChange={onFocusChange}>
        <p>Running</p>
      </GlassPanel>
    );

    await userEvent.click(screen.getByText('Running'));

    expect(onFocusChange).toHaveBeenCalledWith(true);
  });

  it('ignores clicks on its content once focused', async () => {
    const onFocusChange = vi.fn();
    render(
      <GlassPanel title="Train A" focused onFocusChange={onFocusChange}>
        <p>Running</p>
      </GlassPanel>
    );

    await userEvent.click(screen.getByText('Running'));

    expect(onFocusChange).not.toHaveBeenCalled();
  });

  it('marks focused and receded states', () => {
    render(
      <GlassPanel title="Train A" receded>
        Content
      </GlassPanel>
    );

    const region = screen.getByRole('region', { name: 'Train A' });
    expect(region).toHaveAttribute('data-receded', 'true');
    expect(region).toHaveClass('scale-[0.97]');
  });
});
