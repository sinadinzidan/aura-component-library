import type { ReactNode } from 'react';

const ELEMENTS = [
  '[&>:first-child]:mt-0 [&>:last-child]:mb-0',
  '[&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-7 [&_h2]:tracking-tight',
  '[&_h3]:mt-5 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:leading-6',
  '[&_h4]:mt-4 [&_h4]:mb-1 [&_h4]:text-sm [&_h4]:font-semibold',
  '[&_p]:my-3',
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5',
  '[&_li]:my-1 [&_li]:pl-1 [&_li>ul]:my-1 [&_li>ol]:my-1 [&_li::marker]:text-muted-foreground',
  '[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-emphasized [&_blockquote]:pl-4 [&_blockquote]:text-medium-foreground',
  '[&_code]:rounded-sm [&_code]:bg-medium-background [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs',
  '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted-background [&_pre]:p-3 [&_pre]:leading-5',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_a]:rounded-sm [&_a]:text-link-foreground [&_a]:underline [&_a]:underline-offset-2 [&_a]:outline-none [&_a:hover]:text-link-foreground-hover [&_a:focus-visible]:shadow-focus-ring',
  '[&_strong]:font-semibold',
  '[&_hr]:my-6 [&_hr]:border-default',
  '[&_sup]:text-xs [&_sup]:tabular-nums',
  '[&_dt]:mt-3 [&_dt]:font-medium [&_dd]:text-medium-foreground',
].join(' ');

const SIZES = {
  sm: 'text-sm leading-6',
  base: 'text-base leading-7',
} as const;

type ProseProps = {
  children: ReactNode;
  /** `sm` for notes and panels inside the product, `base` for long reading such as docs. */
  size?: keyof typeof SIZES;
  /** Caps the line length at 600px, Aura's reading measure. Turn off only inside a narrower column. */
  measure?: boolean;
  /** Element to render. Use `article` for a note that stands on its own. */
  as?: 'div' | 'article' | 'section';
};

/**
 * Styles plain semantic HTML (headings, paragraphs, lists, quotes, code, links) from tokens, for
 * text that comes from people or from Markdown rather than from components. It owns the vertical
 * rhythm and the 600px reading measure, so written content looks the same wherever it appears.
 */
export function Prose({ children, size = 'sm', measure = true, as: Element = 'div' }: ProseProps) {
  return (
    <Element
      data-slot="prose"
      className={`w-full min-w-0 break-words text-base-foreground ${SIZES[size]} ${measure ? 'max-w-[37.5rem]' : ''} ${ELEMENTS}`}
    >
      {children}
    </Element>
  );
}
