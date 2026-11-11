import { fireEvent, render, screen } from '@testing-library/react';
import { useReducer } from 'react';

import { AnnotationCanvas } from './AnnotationCanvas';
import { annotationReducer, createAnnotationState } from './annotations';
import type { Annotation } from './annotations';

function Harness({ items = [], readOnly = false }: { items?: Annotation[]; readOnly?: boolean }) {
  const [state, dispatch] = useReducer(annotationReducer, items, createAnnotationState);
  return (
    <AnnotationCanvas state={state} dispatch={dispatch} readOnly={readOnly} defaultLabel="Defect">
      <div style={{ width: 200, height: 100 }}>Frame</div>
      <output aria-label="count">{state.items.length}</output>
      <output aria-label="selected">{state.selectedId ?? 'none'}</output>
    </AnnotationCanvas>
  );
}

const surface = () => screen.getByRole('application');
const seeded: Annotation[] = [{ id: 'a1', label: 'Corrosion', shape: { kind: 'rect', x: 0.2, y: 0.2, w: 0.2, h: 0.2 } }];

describe(AnnotationCanvas.name, () => {
  it('adds a rectangle and a point from the keyboard and announces them', () => {
    render(<Harness />);

    fireEvent.keyDown(surface(), { key: 'r' });
    fireEvent.keyDown(surface(), { key: 'p' });

    expect(screen.getByLabelText('count')).toHaveTextContent('2');
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toContain('Added. Point at 50 % across, 50 % down.');
  });

  it('labels new annotations with the default label', () => {
    render(<Harness />);

    fireEvent.keyDown(surface(), { key: 'r' });

    expect(screen.getAllByText('Defect').length).toBeGreaterThan(0);
  });

  it('moves and resizes the selection with arrow keys', () => {
    render(<Harness />);
    fireEvent.keyDown(surface(), { key: 'r' });

    fireEvent.keyDown(surface(), { key: 'ArrowRight', shiftKey: true });
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('Moved Defect.');
    fireEvent.keyDown(surface(), { key: 'ArrowRight', altKey: true });
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('Resized Defect.');
  });

  it('deletes the selection with Delete and undoes with Ctrl+Z', () => {
    render(<Harness />);
    fireEvent.keyDown(surface(), { key: 'r' });

    fireEvent.keyDown(surface(), { key: 'Delete' });
    expect(screen.getByLabelText('count')).toHaveTextContent('0');
    fireEvent.keyDown(surface(), { key: 'z', ctrlKey: true });
    expect(screen.getByLabelText('count')).toHaveTextContent('1');
  });

  it('clears the selection with Escape', () => {
    render(<Harness />);
    fireEvent.keyDown(surface(), { key: 'r' });

    fireEvent.keyDown(surface(), { key: 'Escape' });

    expect(screen.getByLabelText('selected')).toHaveTextContent('none');
  });

  it('ignores arrow keys with nothing selected', () => {
    render(<Harness items={seeded} />);

    fireEvent.keyDown(surface(), { key: 'ArrowLeft' });

    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('');
  });

  it('draws a rectangle by dragging', () => {
    render(<Harness />);
    const canvas = surface();
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    canvas.setPointerCapture = vi.fn();
    canvas.hasPointerCapture = () => false;
    fireEvent.click(screen.getByRole('button', { name: 'Draw rectangle' }));

    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 60, pointerId: 1 });
    expect(document.querySelector('[data-slot="annotation-draft"]')).toBeInTheDocument();
    fireEvent.pointerUp(canvas, { clientX: 100, clientY: 60, pointerId: 1 });

    expect(screen.getByLabelText('count')).toHaveTextContent('1');
  });

  it('does not add a rectangle for a click', () => {
    render(<Harness />);
    const canvas = surface();
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    canvas.setPointerCapture = vi.fn();
    canvas.hasPointerCapture = () => false;
    fireEvent.click(screen.getByRole('button', { name: 'Draw rectangle' }));

    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 21, clientY: 11, pointerId: 1 });

    expect(screen.getByLabelText('count')).toHaveTextContent('0');
  });

  it('places a point with a click in point mode', () => {
    render(<Harness />);
    const canvas = surface();
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.click(screen.getByRole('button', { name: 'Place point' }));

    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 50, pointerId: 1 });

    expect(screen.getByLabelText('count')).toHaveTextContent('1');
  });

  it('selects an annotation by clicking it in select mode', () => {
    render(<Harness items={seeded} />);
    const canvas = surface();
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    canvas.setPointerCapture = vi.fn();
    canvas.hasPointerCapture = () => false;

    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 30, pointerId: 1 });

    expect(screen.getByLabelText('selected')).toHaveTextContent('a1');
  });

  it('ignores everything when read only', () => {
    render(<Harness readOnly />);

    fireEvent.keyDown(surface(), { key: 'r' });

    expect(screen.getByLabelText('count')).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: 'Draw rectangle' })).toBeDisabled();
  });

  it('enables undo and delete only when they can do something', () => {
    render(<Harness />);

    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete selected annotation' })).toBeDisabled();
    fireEvent.keyDown(surface(), { key: 'p' });
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Delete selected annotation' })).toBeEnabled();
  });
});
