import { sankeyLayout, sankeyLinkId, sankeyNodeValues, sankeyPath, sankeyRibbon } from './sankeyLayout';
import type { SankeyLinkInput, SankeyNodeInput } from './sankeyLayout';

const NODES: SankeyNodeInput[] = [
  { id: 'fuel', label: 'Fuel gas', column: 0 },
  { id: 'power', label: 'Power import', column: 0 },
  { id: 'turbine', label: 'Gas turbine', column: 1 },
  { id: 'pumps', label: 'Pumps', column: 1 },
  { id: 'work', label: 'Useful work', column: 2 },
  { id: 'loss', label: 'Losses', column: 2 },
];

const LINKS: SankeyLinkInput[] = [
  { source: 'fuel', target: 'turbine', value: 60 },
  { source: 'power', target: 'pumps', value: 20 },
  { source: 'turbine', target: 'work', value: 20 },
  { source: 'turbine', target: 'loss', value: 40 },
  { source: 'pumps', target: 'work', value: 15 },
  { source: 'pumps', target: 'loss', value: 5 },
];

const BOX = { width: 1000, height: 420, nodeWidth: 20, nodeGap: 20 };

describe('sankeyLinkId', () => {
  it('derives an id from the ends unless one is given', () => {
    expect(sankeyLinkId({ source: 'a', target: 'b', value: 1 })).toBe('a->b');
    expect(sankeyLinkId({ id: 'x', source: 'a', target: 'b', value: 1 })).toBe('x');
  });
});

describe('sankeyNodeValues', () => {
  it('takes the larger of inflow and outflow', () => {
    const values = sankeyNodeValues(NODES, LINKS);
    expect(values.get('fuel')).toBe(60);
    expect(values.get('turbine')).toBe(60);
    expect(values.get('work')).toBe(35);
    expect(values.get('loss')).toBe(45);
  });
});

describe('sankeyLayout', () => {
  const layout = sankeyLayout(NODES, LINKS, BOX);
  const node = (id: string) => layout.nodes.find((candidate) => candidate.id === id);
  const link = (id: string) => layout.links.find((candidate) => candidate.id === id);

  it('uses one scale set by the fullest column', () => {
    // Every column carries 80 with one gap: (420 - 20) / 80.
    expect(layout.scale).toBe(5);
  });

  it('spreads the columns from the left edge to the right edge', () => {
    expect(node('fuel')?.x).toBe(0);
    expect(node('turbine')?.x).toBe(490);
    expect(node('work')?.x).toBe(980);
  });

  it('sizes nodes by throughput and stacks them with the gap', () => {
    expect(node('fuel')).toMatchObject({ y: 0, height: 300, value: 60 });
    expect(node('power')).toMatchObject({ y: 320, height: 100 });
  });

  it('centres a column that needs less than the full height', () => {
    const narrow = sankeyLayout(
      [
        { id: 'a', label: 'A', column: 0 },
        { id: 'b', label: 'B', column: 1 },
        { id: 'c', label: 'C', column: 1 },
      ],
      [
        { source: 'a', target: 'b', value: 5 },
        { source: 'a', target: 'c', value: 5 },
      ],
      { width: 100, height: 120, nodeWidth: 10, nodeGap: 20 }
    );
    // Scale 10: column 0 is 100 tall and centred; column 1 is 50 + 20 + 50 and fills the box.
    expect(narrow.nodes.find((candidate) => candidate.id === 'a')).toMatchObject({ y: 10, height: 100 });
    expect(narrow.nodes.find((candidate) => candidate.id === 'b')).toMatchObject({ y: 0, height: 50 });
  });

  it('gives every link a thickness in proportion to its value', () => {
    expect(link('fuel->turbine')?.thickness).toBe(300);
    expect(link('pumps->loss')?.thickness).toBe(25);
  });

  it('stacks outgoing ribbons down the source in the order of their targets', () => {
    expect(link('turbine->work')).toMatchObject({ x0: 510, y0: 0 });
    expect(link('turbine->loss')).toMatchObject({ y0: 100 });
  });

  it('stacks incoming ribbons down the target in the order of their sources', () => {
    const work = node('work');
    expect(link('turbine->work')?.y1).toBe(work?.y);
    expect(link('pumps->work')?.y1).toBe((work?.y ?? 0) + 100);
  });

  it('produces a closed ribbon path per link', () => {
    expect(link('fuel->turbine')?.path).toBe(sankeyRibbon(20, 0, 490, 0, 300));
    expect(link('fuel->turbine')?.path.endsWith('Z')).toBe(true);
  });

  it('ignores empty links and links to unknown nodes', () => {
    const result = sankeyLayout(NODES, [...LINKS, { source: 'fuel', target: 'nowhere', value: 5 }, { source: 'fuel', target: 'pumps', value: 0 }], BOX);
    expect(result.links).toHaveLength(6);
  });

  it('returns a flat layout when nothing flows', () => {
    const result = sankeyLayout(NODES, [], BOX);
    expect(result.scale).toBe(0);
    expect(result.nodes.every((candidate) => candidate.height === 0)).toBe(true);
  });
});

describe('sankeyRibbon', () => {
  it('bends through the midpoint with horizontal tangents', () => {
    expect(sankeyRibbon(0, 0, 100, 40, 10)).toBe('M 0 0 C 50 0 50 40 100 40 L 100 50 C 50 50 50 10 0 10 Z');
  });
});

describe('sankeyPath', () => {
  const links = LINKS.map((link) => ({ ...link, id: sankeyLinkId(link) }));

  it('is empty without a selection', () => {
    const path = sankeyPath(links, null);
    expect(path.nodes.size + path.links.size).toBe(0);
  });

  it('follows a middle node up to its source and down to its sinks', () => {
    const path = sankeyPath(links, { kind: 'node', id: 'pumps' });
    expect([...path.nodes].sort()).toEqual(['loss', 'power', 'pumps', 'work']);
    expect([...path.links].sort()).toEqual(['power->pumps', 'pumps->loss', 'pumps->work']);
  });

  it('follows a source all the way downstream', () => {
    const path = sankeyPath(links, { kind: 'node', id: 'fuel' });
    expect([...path.links].sort()).toEqual(['fuel->turbine', 'turbine->loss', 'turbine->work']);
  });

  it('follows a sink all the way upstream', () => {
    const path = sankeyPath(links, { kind: 'node', id: 'work' });
    expect([...path.nodes].sort()).toEqual(['fuel', 'power', 'pumps', 'turbine', 'work']);
  });

  it('highlights a link with what feeds it and what it feeds', () => {
    const path = sankeyPath(links, { kind: 'link', id: 'turbine->loss' });
    expect([...path.links].sort()).toEqual(['fuel->turbine', 'turbine->loss']);
    expect([...path.nodes].sort()).toEqual(['fuel', 'loss', 'turbine']);
  });

  it('is empty for an unknown link', () => {
    expect(sankeyPath(links, { kind: 'link', id: 'nope' }).links.size).toBe(0);
  });
});
