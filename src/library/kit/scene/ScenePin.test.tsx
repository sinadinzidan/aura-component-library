import { fireEvent } from '@testing-library/react';

import { renderScene } from '../../three/renderScene.fixture';

import { ScenePin } from './ScenePin';

const pin = () => document.querySelector('[data-slot="scene-pin"]');

describe(ScenePin.name, () => {
  it('shows the name, the value with its unit and the state word', async () => {
    const view = await renderScene(<ScenePin position={[0, 2, 0]} label="Discharge temperature" value="146.3" unit="°C" state="High" tone="warning" />);
    await view.advance();

    expect(pin()).toHaveTextContent('Discharge temperature146.3°CHigh');
    expect(pin()).toHaveAttribute('data-tone', 'warning');

    await view.unmount();
  });

  it('uses no monospace', async () => {
    const view = await renderScene(<ScenePin position={[0, 2, 0]} label="Shaft speed" value="9 840" unit="rpm" />);
    await view.advance();

    expect(pin()?.querySelector('.font-mono')).toBeNull();

    await view.unmount();
  });

  it('is hidden from assistive technology, because the canvas is one image', async () => {
    const view = await renderScene(<ScenePin position={[0, 2, 0]} label="Shaft speed" value="9 840" />);
    await view.advance();

    expect(pin()).toHaveAttribute('aria-hidden', 'true');

    await view.unmount();
  });

  it('becomes a pointer-only button when given onSelect', async () => {
    const onSelect = vi.fn();
    const view = await renderScene(<ScenePin position={[0, 2, 0]} label="Shaft speed" value="9 840" onSelect={onSelect} selected />);
    await view.advance();
    const button = pin()?.querySelector('button');

    expect(button).toHaveAttribute('tabindex', '-1');
    expect(pin()).toHaveAttribute('data-selected', 'true');
    if (button) fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledOnce();

    await view.unmount();
  });
});
