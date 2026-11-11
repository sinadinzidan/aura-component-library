import { LOOKS } from '../../looks/looks';

import { BLOCK_ANATOMY, blockStyle, isSolidLook } from './anatomy';

describe('anatomy', () => {
  it('gives every look a block style', () => {
    for (const look of LOOKS) expect(Object.keys(blockStyle(look)).length).toBeGreaterThan(0);
  });

  it('fills blocks with their tone in poster and signal only', () => {
    expect(LOOKS.filter(isSolidLook)).toEqual(['poster', 'signal']);
  });

  it('switches text to the on-colour in a filled block', () => {
    expect(blockStyle('signal')['--kit-text']).toBe('var(--t-on-vivid)');
    expect(blockStyle('studio')['--kit-text']).toBeUndefined();
  });

  it('names the anatomy of each look', () => {
    expect(BLOCK_ANATOMY.blueprint).toBe('outline');
    expect(BLOCK_ANATOMY.editorial).toBe('rule');
  });
});
