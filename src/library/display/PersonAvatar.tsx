import { Avatar, AvatarFallback, AvatarImage } from '@cognite/aura/components/avatar';

const COLORWAYS = [
  'decorative-1',
  'decorative-2',
  'decorative-3',
  'decorative-4',
  'decorative-5',
  'decorative-6',
  'decorative-7',
] as const;

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

function colorwayOf(key: string): (typeof COLORWAYS)[number] {
  let hash = 0;
  for (const character of key) {
    hash = (hash * 131 + character.charCodeAt(0)) % 1009;
  }
  return COLORWAYS[hash % COLORWAYS.length];
}

type PersonAvatarProps = {
  /** Full name. Becomes the accessible name and, unless `initials` is given, the initials. */
  name: string;
  initials?: string;
  /** Photo URL. Initials show while it loads and when it fails. */
  src?: string;
  /** What the colorway is derived from. Defaults to the name; pass a user ID to survive renames. */
  colorKey?: string;
  sizes?: 'default' | 'xsm' | 'xxsm';
};

/**
 * An Avatar for a person that always looks the same for the same person: initials are derived
 * from the name and the decorative colorway from a stable key, so nobody has to pick a colour.
 */
export function PersonAvatar({ name, initials, src, colorKey, sizes = 'default' }: PersonAvatarProps) {
  return (
    <Avatar variant={colorwayOf(colorKey ?? name)} sizes={sizes} aria-label={name}>
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback>{initials ?? initialsOf(name)}</AvatarFallback>
    </Avatar>
  );
}
