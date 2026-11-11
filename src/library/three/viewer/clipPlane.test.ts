import { INITIAL_CLIP, clampUnit, clipHelperPose, clipPlaneFor, clipReducer, clipWorldPosition, describeClip, isKept } from './clipPlane';

const bounds = { min: [-10, 0, -5], max: [10, 4, 5] } as const;

describe('clipWorldPosition', () => {
  it('maps the 0–1 position across the bounds of the axis', () => {
    expect(clipWorldPosition(bounds, { ...INITIAL_CLIP, axis: 'x', position: 0.5 })).toBe(0);
    expect(clipWorldPosition(bounds, { ...INITIAL_CLIP, axis: 'y', position: 0.25 })).toBe(1);
    expect(clipWorldPosition(bounds, { ...INITIAL_CLIP, axis: 'z', position: 1 })).toBe(5);
  });

  it('clamps out-of-range positions', () => {
    expect(clipWorldPosition(bounds, { ...INITIAL_CLIP, position: 4 })).toBe(10);
    expect(clampUnit(-3)).toBe(0);
  });
});

describe('clipPlaneFor and isKept', () => {
  const on = { ...INITIAL_CLIP, enabled: true };

  it('removes the far side by default', () => {
    const state = { ...on, axis: 'x' as const, position: 0.75 };
    expect(isKept([2, 1, 0], bounds, state)).toBe(true);
    expect(isKept([8, 1, 0], bounds, state)).toBe(false);
    expect(clipPlaneFor(bounds, state)).toEqual({ normal: [-1, 0, 0], constant: 5 });
  });

  it('keeps the far side when flipped', () => {
    const state = { ...on, axis: 'x' as const, position: 0.75, flip: true };
    expect(isKept([2, 1, 0], bounds, state)).toBe(false);
    expect(isKept([8, 1, 0], bounds, state)).toBe(true);
  });

  it('works on each axis', () => {
    expect(isKept([0, 3, 0], bounds, { ...on, axis: 'y', position: 0.5 })).toBe(false);
    expect(isKept([0, 1, 0], bounds, { ...on, axis: 'y', position: 0.5 })).toBe(true);
    expect(isKept([0, 1, 4], bounds, { ...on, axis: 'z', position: 0.5 })).toBe(false);
  });

  it('keeps everything when off', () => {
    expect(isKept([100, 100, 100], bounds, { ...INITIAL_CLIP, position: 0 })).toBe(true);
  });
});

describe('clipHelperPose', () => {
  it('places the helper on the plane and spans the other two axes', () => {
    const pose = clipHelperPose(bounds, { ...INITIAL_CLIP, axis: 'x', position: 0.75 });
    expect(pose.position).toEqual([5, 2, 0]);
    expect(pose.size).toEqual([11, 5]);
  });

  it('lays a height plane flat', () => {
    const pose = clipHelperPose(bounds, { ...INITIAL_CLIP, axis: 'y', position: 0.5 });
    expect(pose.position[1]).toBe(2);
    expect(pose.rotation[0]).toBeCloseTo(-Math.PI / 2);
  });

  it('faces a north–south plane towards the viewer', () => {
    const pose = clipHelperPose(bounds, { ...INITIAL_CLIP, axis: 'z', position: 0 });
    expect(pose.position[2]).toBe(-5);
    expect(pose.rotation).toEqual([0, 0, 0]);
  });
});

describe('describeClip and reducer', () => {
  it('describes the section in words', () => {
    expect(describeClip(bounds, INITIAL_CLIP)).toBe('Section plane off');
    expect(describeClip(bounds, { ...INITIAL_CLIP, enabled: true, position: 0.75 })).toBe('Section across east–west at 5 m, keeping the near side');
    expect(describeClip(bounds, { ...INITIAL_CLIP, enabled: true, axis: 'y', flip: true })).toBe('Section across height at 2 m, keeping the far side');
  });

  it('changes one thing at a time', () => {
    let state = clipReducer(INITIAL_CLIP, { type: 'enable', enabled: true });
    state = clipReducer(state, { type: 'position', position: 2 });
    expect(state).toMatchObject({ enabled: true, position: 1 });
    state = clipReducer(state, { type: 'flip', flip: true });
    expect(state.flip).toBe(true);
  });

  it('recentres the plane when the axis changes and resets fully', () => {
    const moved = clipReducer({ ...INITIAL_CLIP, position: 0.9 }, { type: 'axis', axis: 'z' });
    expect(moved).toMatchObject({ axis: 'z', position: 0.5 });
    expect(clipReducer(moved, { type: 'reset' })).toEqual(INITIAL_CLIP);
  });
});
