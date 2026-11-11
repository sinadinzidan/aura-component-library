import {
  CUBE_FACES,
  VIEW_PRESETS,
  activeFace,
  anglesFromDirection,
  cubeTransform,
  describeView,
  directionFromAngles,
  directionOfPose,
  faceTarget,
  findFace,
  findPreset,
  isFacingCamera,
  frameFromDirection,
  presetTarget,
} from './viewCube';
import { VIEWER_BOUNDS } from './viewerModel';

describe('angles and directions', () => {
  it('reads azimuth and elevation from a direction', () => {
    expect(anglesFromDirection([0, 0, 1])).toEqual({ azimuth: 0, elevation: 0 });
    expect(anglesFromDirection([1, 0, 0]).azimuth).toBeCloseTo(90);
    expect(anglesFromDirection([0, 1, 0]).elevation).toBeCloseTo(90);
    expect(anglesFromDirection([0, 0, -1]).azimuth).toBeCloseTo(180);
  });

  it('round-trips angles and directions', () => {
    const direction = directionFromAngles({ azimuth: 40, elevation: 25 });
    const back = anglesFromDirection(direction);
    expect(back.azimuth).toBeCloseTo(40);
    expect(back.elevation).toBeCloseTo(25);
  });

  it('takes the direction of a pose from lookAt to position', () => {
    expect(directionOfPose({ position: [0, 5, 5], lookAt: [0, 5, 0] })).toEqual([0, 0, 1]);
  });
});

describe('cubeTransform', () => {
  it('counter-rotates the cube by the view angles', () => {
    expect(cubeTransform({ azimuth: 30, elevation: 20 })).toBe('rotateX(-20deg) rotateY(-30deg)');
  });

  it('rounds to a tenth of a degree and avoids a negative zero string', () => {
    expect(cubeTransform({ azimuth: 12.345, elevation: 0 })).toBe('rotateX(0deg) rotateY(-12.3deg)');
  });
});

describe('activeFace', () => {
  it.each([
    ['front', [0, 0.12, 1]],
    ['right', [1, 0.1, 0]],
    ['top', [0, 1, 0.01]],
    ['back', [0.1, 0.1, -1]],
  ] as const)('recognises the %s face', (face, direction) => {
    expect(activeFace(direction)).toBe(face);
  });

  it('is null for an oblique view', () => {
    expect(activeFace([1, 0.82, 1])).toBeNull();
  });
});

describe('faces and presets', () => {
  it('has six faces and cannot reach the bottom', () => {
    expect(CUBE_FACES).toHaveLength(6);
    expect(findFace('bottom').reachable).toBe(false);
    expect(CUBE_FACES.filter((face) => face.reachable)).toHaveLength(5);
  });

  it('has four presets with unique shortcuts', () => {
    expect(VIEW_PRESETS.map((preset) => preset.shortcut)).toEqual(['1', '2', '3', '4']);
    expect(findPreset('top').label).toBe('Top');
  });

  it('frames the bounds from the preset direction, looking at the centre', () => {
    const target = presetTarget(VIEWER_BOUNDS, 'front');
    expect(target.lookAt[0]).toBeCloseTo((VIEWER_BOUNDS.min[0] + VIEWER_BOUNDS.max[0]) / 2);
    expect(target.position[2]).toBeGreaterThan(target.lookAt[2]);
    expect(activeFace(directionOfPose(target))).toBe('front');
  });

  it('stands further back with more padding', () => {
    const near = frameFromDirection(VIEWER_BOUNDS, [0, 0, 1], { padding: 1 });
    const far = frameFromDirection(VIEWER_BOUNDS, [0, 0, 1], { padding: 2 });
    expect(far.position[2]).toBeGreaterThan(near.position[2]);
  });

  it('frames the cube faces', () => {
    expect(activeFace(directionOfPose(faceTarget(VIEWER_BOUNDS, 'left')))).toBe('left');
  });

  it('describes a view in words', () => {
    expect(describeView([0, 0.12, 1])).toBe('From the front, 7° above');
    expect(describeView([0, 1, 0.012])).toBe('From the top');
    expect(describeView([1, 0.82, 1])).toMatch(/^Oblique, 45° round, \d+° above$/);
  });
});

describe('isFacingCamera', () => {
  it('shows the three faces an isometric camera sees', () => {
    const direction = directionFromAngles({ azimuth: 45, elevation: 30 });
    const facing = CUBE_FACES.filter((face) => isFacingCamera(face.id, direction)).map((face) => face.id);

    expect(facing.sort()).toEqual(['front', 'right', 'top']);
  });

  it('shows only the front face to a level camera in front', () => {
    expect(CUBE_FACES.filter((face) => isFacingCamera(face.id, [0, 0, 1])).map((face) => face.id)).toEqual(['front']);
  });

  it('treats an edge-on face as turned away', () => {
    expect(isFacingCamera('left', [0, 0, 1])).toBe(false);
  });
});
