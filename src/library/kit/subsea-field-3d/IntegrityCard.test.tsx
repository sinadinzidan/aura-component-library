import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LookScope } from '../../looks/LookScope';

import type { IntegrityRecord } from './integrity';
import { IntegrityCard } from './IntegrityCard';

const RECORD: IntegrityRecord = { pressure: 144, temperature: 57, inspectedDaysAgo: 203, remainingLife: 7, findings: [{ text: 'Wall loss', severity: 'high', foundDaysAgo: 203 }] };

describe(IntegrityCard.name, () => {
  it('names the asset, its findings and its remaining life', () => {
    render(
      <LookScope look="glass">
        <IntegrityCard tag="23-FL-C" name="Flowline C to manifold" kind="Flowline" record={RECORD} />
      </LookScope>
    );
    expect(screen.getByText('23-FL-C')).toBeTruthy();
    expect(screen.getByText('Flowline C to manifold')).toBeTruthy();
    expect(screen.getByText('1 finding')).toBeTruthy();
    expect(screen.getByRole('button', { name: '23-FL-C, Flowline C to manifold: 1 open finding, worst high, 7 years of design life left' })).toBeTruthy();
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('7');
  });

  it('says clear when there are no findings', () => {
    render(<IntegrityCard tag="23-TB" name="Template B" kind="Template" record={{ ...RECORD, findings: [], remainingLife: 24 }} />);
    expect(screen.getByText('Clear')).toBeTruthy();
  });

  it('is a toggle button that reports the selection', () => {
    const onSelect = vi.fn();
    render(<IntegrityCard tag="23-FL-C" name="Flowline C" kind="Flowline" record={RECORD} selected onSelect={onSelect} />);
    const card = screen.getByRole('button');
    expect(card.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
