import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import { CAUSE_STATES, type CauseState } from './causes';

export type FishboneCategory = {
  /** "Equipment", "Method", "People", … */
  name: string;
  causes: readonly { label: string; state: CauseState }[];
};

type FishboneProps = {
  /** The effect at the head of the fish. */
  effect: string;
  /** An even number reads best: half sit above the spine, half below. */
  categories: readonly FishboneCategory[];
  className?: string;
};

type RibProps = { category: FishboneCategory; side: 'top' | 'bottom' };

function Rib({ category, side }: RibProps) {
  return (
    <div data-category={category.name} className={cx('relative flex min-w-0 flex-1 gap-3 pr-4 pl-8', side === 'top' ? 'flex-col pb-3' : 'flex-col-reverse pt-3')}>
      <span aria-hidden="true" className={cx('absolute inset-y-0 left-10 w-0.5 bg-(--kit-text)', side === 'top' ? 'origin-bottom -skew-x-[24deg]' : 'origin-top skew-x-[24deg]')} />
      <span className="relative w-fit rounded-(--kit-radius-sm) border border-(--kit-text) bg-(--kit-halo) px-2.5 py-1 text-sm leading-5 font-semibold">{category.name}</span>
      <ul className={cx('relative flex flex-col gap-1.5 pl-10', side === 'top' ? '' : 'flex-col-reverse')}>
        {category.causes.map((cause) => {
          const { tone, word } = CAUSE_STATES[cause.state];
          return (
            <li key={cause.label} data-tone={tone} data-state={cause.state} className="flex items-baseline gap-2 text-sm leading-5">
              <span aria-hidden="true" className={cx('h-2.5 w-2.5 shrink-0 translate-y-px', cause.state === 'ruled-out' ? 'border border-(--kit-text-2)' : 'bg-(--t-solid)')} />
              <span className={cx('min-w-0', cause.state === 'ruled-out' ? 'text-(--kit-text-2) line-through' : cause.state === 'confirmed' ? 'font-semibold' : 'font-medium')}>
                {cause.label}
                <span className="sr-only">, {word.toLowerCase()}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * An Ishikawa diagram: the effect at the head, a spine, and one rib per category with the causes
 * considered under it. Each cause carries its state as a filled, open or struck-through mark, so
 * the diagram shows not only what was brainstormed but what survived.
 */
export function Fishbone({ effect, categories, className }: FishboneProps) {
  const look = useLook();
  const half = Math.ceil(categories.length / 2);
  const top = categories.slice(0, half);
  const bottom = categories.slice(half);

  return (
    <div role="group" aria-label={`Causes of: ${effect}`} data-look={look} className={cx('flex min-w-0 items-stretch text-(--kit-text)', className)}>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-1">
          {top.map((category) => (
            <Rib key={category.name} category={category} side="top" />
          ))}
        </div>
        <span aria-hidden="true" className="h-1 bg-(--kit-text)" />
        <div className="flex flex-1">
          {bottom.map((category) => (
            <Rib key={category.name} category={category} side="bottom" />
          ))}
        </div>
      </div>
      <div data-tone="critical" className="flex w-44 shrink-0 items-center">
        <span aria-hidden="true" className="h-0 w-0 border-y-8 border-l-[14px] border-y-transparent border-l-(--kit-text)" />
        <div className="flex-1 rounded-(--kit-radius-sm) bg-(--t-solid) px-3 py-3 text-(--t-on-solid)">
          <span className="block text-xs leading-4 font-medium">Effect</span>
          <span className="block text-sm leading-5 font-semibold">{effect}</span>
        </div>
      </div>
    </div>
  );
}
