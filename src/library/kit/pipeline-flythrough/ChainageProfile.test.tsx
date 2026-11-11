import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChainageProfile } from './ChainageProfile';

const ELEVATION = [
  { kp: 0, value: 10 },
  { kp: 40, value: 120 },
  { kp: 80, value: 20 },
];

const PRESSURE = [
  { kp: 0, value: 120 },
  { kp: 80, value: 90 },
];

const STATIONS = [
  { id: 'start', label: 'PL-01', kp: 0 },
  { id: 'mid', label: 'CS-01', kp: 40 },
  { id: 'end', label: 'Terminal', kp: 80 },
];

const MARKS = [{ id: 'a-1', kp: 20, tone: 'warning' as const, label: 'Metal loss at kilometre 20' }];

describe(ChainageProfile.name, () => {
  it('names the drawing and labels the stations and the limit', () => {
    render(<ChainageProfile label="Profile of the export line" totalKm={80} elevation={ELEVATION} pressure={PRESSURE} maop={132} cursorKp={40} stations={STATIONS} />);
    expect(screen.getByRole('img', { name: 'Profile of the export line' })).toBeTruthy();
    expect(screen.getByText('CS-01')).toBeTruthy();
    expect(screen.getByText('Terminal')).toBeTruthy();
    expect(screen.getByText('Allowable pressure 132 barg')).toBeTruthy();
  });

  it('puts the cursor at the reader position', () => {
    render(<ChainageProfile label="Profile" totalKm={80} elevation={ELEVATION} pressure={PRESSURE} cursorKp={20} />);
    const cursor = document.querySelector<HTMLElement>('[data-slot="chainage-cursor"]');
    expect(cursor?.style.left).toBe('25.000%');
  });

  it('makes each finding a button that reports its id', () => {
    const onSelectMark = vi.fn();
    render(<ChainageProfile label="Profile" totalKm={80} elevation={ELEVATION} pressure={PRESSURE} cursorKp={20} marks={MARKS} selectedMarkId="a-1" onSelectMark={onSelectMark} />);
    const mark = screen.getByRole('button', { name: 'Metal loss at kilometre 20' });
    expect(mark.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(mark);
    expect(onSelectMark).toHaveBeenCalledWith('a-1');
  });

  it('names a shaded stretch', () => {
    render(<ChainageProfile label="Profile" totalKm={80} elevation={ELEVATION} pressure={PRESSURE} cursorKp={20} band={{ from: 50, to: 70, label: 'Segment isolated', tone: 'warning' }} />);
    expect(screen.getByText('Segment isolated')).toBeTruthy();
  });

  it('labels the kilometre axis', () => {
    render(<ChainageProfile label="Profile" totalKm={80} elevation={ELEVATION} pressure={PRESSURE} cursorKp={20} />);
    expect(screen.getByText('km 0')).toBeTruthy();
    expect(screen.getByText('70')).toBeTruthy();
  });
});
