import { wellFieldCameraTarget } from './wellFieldCamera';

const BLOCK = { halfExtent: 20, depth: 30 };

describe(wellFieldCameraTarget.name, () => {
  it('looks at the middle of the block, below the seabed', () => {
    expect(wellFieldCameraTarget('perspective', BLOCK).lookAt).toEqual([0, -15, 0]);
  });

  it('stands above and to the side for the perspective view', () => {
    const { position } = wellFieldCameraTarget('perspective', BLOCK);

    expect(position[0]).toBeGreaterThan(0);
    expect(position[1]).toBeGreaterThan(-15);
    expect(position[2]).toBeGreaterThan(0);
  });

  it('looks level from the south for the side section', () => {
    const { position, lookAt } = wellFieldCameraTarget('section', BLOCK);

    expect(position[0]).toBeCloseTo(0);
    expect(Math.abs(position[1] - lookAt[1])).toBeLessThan(position[2] * 0.1);
    expect(position[2]).toBeGreaterThan(BLOCK.halfExtent);
  });

  it('looks straight down for the plan view', () => {
    const { position } = wellFieldCameraTarget('plan', BLOCK);

    expect(position[1]).toBeGreaterThan(0);
    expect(Math.abs(position[2])).toBeLessThan(2);
  });

  it('stands further back with more padding', () => {
    const near = wellFieldCameraTarget('section', BLOCK, { padding: 1 }).position[2];
    const far = wellFieldCameraTarget('section', BLOCK, { padding: 1.5 }).position[2];

    expect(far).toBeGreaterThan(near);
  });
});
