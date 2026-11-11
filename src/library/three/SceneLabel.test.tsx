import { fireEvent } from '@testing-library/react';

import { renderScene } from './renderScene.fixture';
import { SceneLabel } from './SceneLabel';

const label = () => document.querySelector('[data-slot="scene-label"]');

describe(SceneLabel.name, () => {
  it('shows tag, name and value', async () => {
    const view = await renderScene(<SceneLabel position={[0, 2, 0]} tag="23-KA-9103" name="Recompressor" value="Tripped" tone="critical" />);
    await view.advance();

    expect(label()).toHaveTextContent('23-KA-9103RecompressorTripped');
    expect(label()?.querySelector('[data-slot="scene-label-tag"]')).toHaveTextContent('23-KA-9103');

    await view.unmount();
  });

  it('is hidden from assistive technology, because the canvas is one image', async () => {
    const view = await renderScene(<SceneLabel position={[0, 2, 0]} tag="NK-23" />);
    await view.advance();

    expect(label()).toHaveAttribute('aria-hidden', 'true');

    await view.unmount();
  });

  it('becomes a pointer-only button when given onClick', async () => {
    const onClick = vi.fn();
    const view = await renderScene(<SceneLabel position={[0, 2, 0]} tag="NK-23" onClick={onClick} />);
    await view.advance();
    const button = label()?.querySelector('button');

    expect(button).toHaveAttribute('tabindex', '-1');
    if (button) fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();

    await view.unmount();
  });

  it('hides beyond its maximum distance', async () => {
    const view = await renderScene(<SceneLabel position={[0, 2, 500]} tag="NK-23" maxDistance={50} />);
    await view.advance();
    await view.advance();

    expect(label()).toBeNull();

    await view.unmount();
  });

  it('uses the UI typeface, never monospace or capitals', async () => {
    const view = await renderScene(<SceneLabel position={[0, 2, 0]} tag="23-KA-9103" name="Recompressor" />);
    await view.advance();

    expect(label()?.innerHTML).not.toMatch(/font-mono|uppercase/);

    await view.unmount();
  });
});
