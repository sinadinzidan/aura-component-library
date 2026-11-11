import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { COMPRESSION_SHEET, COMPRESSION_SHEET_READINGS } from './compressionSheet';
import { PidSheet } from './PidSheet';

describe(PidSheet.name, () => {
  it('names the sheet and draws its tags', () => {
    render(<PidSheet drawing={COMPRESSION_SHEET} readings={COMPRESSION_SHEET_READINGS} />);
    expect(screen.getByRole('group', { name: 'P&ID NK-23-PID-1004, Gas compression, stages 1 and 2' })).toBeTruthy();
    expect(screen.getByText('23-KA-9101')).toBeTruthy();
    expect(screen.getByText('Interstage cooler')).toBeTruthy();
  });

  it('never draws smaller than one unit per pixel and caps how far it grows', () => {
    render(<PidSheet drawing={COMPRESSION_SHEET} maxScale={1.5} />);
    const sheet = screen.getByRole('group', { name: /P&ID/ });
    expect(sheet.style.minWidth).toBe('480px');
    expect(sheet.style.minHeight).toBe('430px');
    expect(sheet.style.maxWidth).toBe('720px');
    expect(sheet.style.maxHeight).toBe('645px');
    expect(sheet.getAttribute('viewBox')).toBe('0 0 480 430');
  });

  it('reports the element that was picked', () => {
    const onSelect = vi.fn();
    render(<PidSheet drawing={COMPRESSION_SHEET} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /23-KA-9102/ }));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'tag', id: 'S-105' });
  });
});
