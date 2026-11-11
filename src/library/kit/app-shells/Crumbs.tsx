import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './shells.css';

type CrumbsProps = {
  /** The path from the top, ending with the current page. */
  items: readonly string[];
  className?: string;
};

/** Where the page sits: a breadcrumb trail whose last entry is the current page. */
export function Crumbs({ items, className }: CrumbsProps) {
  const look = useLook();
  return (
    <nav aria-label="Breadcrumb" data-look={look} className={cx('shell-crumbs', className)}>
      <ol>
        {items.map((item, index) => (
          <li key={item}>
            <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
