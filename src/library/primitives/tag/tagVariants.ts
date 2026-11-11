export const TAG_DECORATIVE_VARIANTS = [
  'decorative-1',
  'decorative-2',
  'decorative-3',
  'decorative-4',
  'decorative-5',
  'decorative-6',
  'decorative-7',
] as const;

export type TagDecorativeVariant = (typeof TAG_DECORATIVE_VARIANTS)[number];
export type TagVariant = 'neutral' | 'outline' | TagDecorativeVariant;
export type TagStatus = 'neutral' | 'info' | 'success' | 'warning' | 'critical';
export type TagSize = 'sm' | 'md' | 'lg';

/** Surface and text of each variant, and the hover it gets when the tag can be clicked. */
export const TAG_VARIANT: Record<TagVariant, { rest: string; hover: string }> = {
  neutral: {
    rest: 'border-transparent bg-secondary-background text-secondary-foreground',
    hover: 'hover:bg-secondary-background-hover',
  },
  outline: {
    rest: 'border-default bg-transparent text-medium-foreground',
    hover: 'hover:bg-accent-background',
  },
  'decorative-1': {
    rest: 'border-transparent bg-decorative-1-background text-decorative-1-foreground',
    hover: 'hover:bg-decorative-1-background-hover',
  },
  'decorative-2': {
    rest: 'border-transparent bg-decorative-2-background text-decorative-2-foreground',
    hover: 'hover:bg-decorative-2-background-hover',
  },
  'decorative-3': {
    rest: 'border-transparent bg-decorative-3-background text-decorative-3-foreground',
    hover: 'hover:bg-decorative-3-background-hover',
  },
  'decorative-4': {
    rest: 'border-transparent bg-decorative-4-background text-decorative-4-foreground',
    hover: 'hover:bg-decorative-4-background-hover',
  },
  'decorative-5': {
    rest: 'border-transparent bg-decorative-5-background text-decorative-5-foreground',
    hover: 'hover:bg-decorative-5-background-hover',
  },
  'decorative-6': {
    rest: 'border-transparent bg-decorative-6-background text-decorative-6-foreground',
    hover: 'hover:bg-decorative-6-background-hover',
  },
  'decorative-7': {
    rest: 'border-transparent bg-decorative-7-background text-decorative-7-foreground',
    hover: 'hover:bg-decorative-7-background-hover',
  },
};

/** Status tints. Only ever applied through the explicit `status` prop. */
export const TAG_STATUS: Record<TagStatus, string> = {
  neutral: 'border-transparent bg-neutral-background text-neutral-foreground',
  info: 'border-transparent bg-info-background text-info-foreground',
  success: 'border-transparent bg-success-background text-success-foreground',
  warning: 'border-transparent bg-warning-background text-warning-foreground',
  critical: 'border-transparent bg-critical-background text-critical-foreground',
};

/** Heights 20, 24 and 28 px: `sm` matches Badge, `lg` matches a small Button. */
export const TAG_SIZE: Record<TagSize, { root: string; main: string; icon: string; remove: string }> = {
  sm: {
    root: 'h-5 text-xs',
    main: 'gap-1 px-1',
    icon: '[&>svg]:size-3',
    remove: 'w-4',
  },
  md: {
    root: 'h-6 text-sm',
    main: 'gap-1 px-1.5',
    icon: '[&>svg]:size-3.5',
    remove: 'w-5',
  },
  lg: {
    root: 'h-7 text-sm',
    main: 'gap-1.5 px-2',
    icon: '[&>svg]:size-4',
    remove: 'w-6',
  },
};

/**
 * The decorative variant for a category key. The same key always gets the same colour, so a
 * discipline or a label keeps its colour on every screen without anyone assigning one.
 */
export function tagVariantFromKey(key: string): TagDecorativeVariant {
  let hash = 0;
  for (const character of key.trim().toLowerCase()) {
    hash = (hash * 131 + character.charCodeAt(0)) % 1009;
  }
  return TAG_DECORATIVE_VARIANTS[hash % TAG_DECORATIVE_VARIANTS.length];
}
