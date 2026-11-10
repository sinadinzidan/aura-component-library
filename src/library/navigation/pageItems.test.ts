import { getPageItems } from './pageItems';

describe(getPageItems.name, () => {
  it('lists every page when they all fit', () => {
    expect(getPageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('collapses the end when the current page is near the start', () => {
    expect(getPageItems(2, 20)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 20]);
  });

  it('collapses the start when the current page is near the end', () => {
    expect(getPageItems(19, 20)).toEqual([1, 'start-ellipsis', 16, 17, 18, 19, 20]);
  });

  it('collapses both sides around a page in the middle', () => {
    expect(getPageItems(10, 20)).toEqual([1, 'start-ellipsis', 9, 10, 11, 'end-ellipsis', 20]);
  });

  it('keeps the same number of slots while paging through a long list', () => {
    const lengths = new Set(Array.from({ length: 20 }, (_, index) => getPageItems(index + 1, 20).length));

    expect([...lengths]).toEqual([7]);
  });

  it('clamps a page outside the range', () => {
    expect(getPageItems(99, 3)).toEqual([1, 2, 3]);
    expect(getPageItems(0, 0)).toEqual([1]);
  });
});
