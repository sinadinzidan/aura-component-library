import { TrendLine, type TrendLineProps } from './TrendLine';

type TrendAreaProps = Omit<TrendLineProps, 'fill'>;

/**
 * A trend whose first series is filled: a gradient in studio and glass, a solid block in poster.
 * Looks that draw with lines only (console, editorial, blueprint) keep it a line. Use it for one
 * quantity over time; for comparing several, use `TrendLine`.
 */
export function TrendArea(props: TrendAreaProps) {
  return <TrendLine {...props} fill />;
}
