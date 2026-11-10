import { act, createRoot, extend } from '@react-three/fiber';
import type { ReactNode } from 'react';
import * as THREE from 'three';
import type { Camera, Object3D, Scene } from 'three';

import { SceneEnvironmentContext } from './sceneEnvironment';
import { makeTestPalette } from './scenePalette.fixture';

// `Canvas` registers three's classes itself; a bare root needs it done by hand.
extend(THREE);

export type RenderedScene = {
  scene: Scene;
  camera: Camera;
  /** Every object in the scene graph, depth first. */
  objects: () => Object3D[];
  /** Runs one frame, so `useFrame` callbacks execute. */
  advance: (seconds?: number) => Promise<void>;
  rerender: (children: ReactNode) => Promise<void>;
  unmount: () => Promise<void>;
  canvas: HTMLCanvasElement;
};

/**
 * Test helper: mounts three.js content in a react-three-fiber root with a renderer that draws
 * nothing, so scene graphs can be asserted in a DOM without WebGL. Not for product code.
 */
export async function renderScene(children: ReactNode, options: { reducedMotion?: boolean } = {}): Promise<RenderedScene> {
  const host = document.createElement('div');
  const canvas = document.createElement('canvas');
  host.appendChild(canvas);
  document.body.appendChild(host);

  const renderer = {
    domElement: canvas,
    render: () => undefined,
    setSize: () => undefined,
    setPixelRatio: () => undefined,
    getPixelRatio: () => 1,
    dispose: () => undefined,
  };
  const root = createRoot(canvas);
  root.configure({ gl: renderer, frameloop: 'never', size: { width: 800, height: 600, top: 0, left: 0 }, events: undefined });
  const environment = { palette: makeTestPalette(), reducedMotion: options.reducedMotion ?? true };
  const wrap = (content: ReactNode) => <SceneEnvironmentContext.Provider value={environment}>{content}</SceneEnvironmentContext.Provider>;

  let store = root.render(wrap(children));
  await act(async () => {
    store = root.render(wrap(children));
  });
  let time = 0;

  return {
    scene: store.getState().scene,
    camera: store.getState().camera,
    canvas,
    objects: () => {
      const all: Object3D[] = [];
      store.getState().scene.traverse((object) => all.push(object));
      return all;
    },
    advance: async (seconds = 0.016) => {
      time += seconds;
      await act(async () => {
        store.getState().advance(time);
      });
    },
    rerender: async (next) => {
      await act(async () => {
        root.render(wrap(next));
      });
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      host.remove();
    },
  };
}

/** A construction parameter of an object's geometry, e.g. `height` of a cylinder; `undefined` when absent. */
export function geometryParameter(object: Object3D, name: string): unknown {
  if (!('geometry' in object)) return undefined;
  const geometry = object.geometry;
  if (typeof geometry !== 'object' || geometry === null || !('parameters' in geometry)) return undefined;
  const parameters = geometry.parameters;
  if (typeof parameters !== 'object' || parameters === null) return undefined;
  const record: Record<string, unknown> = { ...parameters };
  return record[name];
}
