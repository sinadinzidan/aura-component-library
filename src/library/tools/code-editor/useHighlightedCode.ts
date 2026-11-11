import { useEffect, useState } from 'react';

import type { CodeLanguage } from './editing';

/** Turns code into HTML for the light and the dark theme. Injectable so tests need no highlighter. */
export type Highlighter = (code: string, language: Exclude<CodeLanguage, 'text'>) => Promise<readonly [string, string]>;

/** Loads Aura's Shiki-based highlighter on first use, so the editor itself stays small. */
export const auraHighlighter: Highlighter = async (code, language) => {
  const { highlightCode } = await import('@cognite/aura/highlight-code');
  return highlightCode(code, language);
};

export type Highlighted = { light: string; dark: string };

// The pre element is focusable by default; the mirror must never take a tab stop.
const withoutTabStop = (html: string): string => html.replace(/ tabindex="0"/g, '');

/**
 * Highlights `code` and returns the HTML only while it still matches the text, so the layer
 * under a text field never shows a stale line. While loading, after a failure, and for plain
 * text it returns `null` and the caller shows the text unhighlighted.
 */
export function useHighlightedCode(code: string, language: CodeLanguage, highlighter: Highlighter): Highlighted | null {
  const [result, setResult] = useState<{ code: string; language: CodeLanguage; light: string; dark: string } | null>(null);

  useEffect(() => {
    if (language === 'text') return;
    let cancelled = false;
    highlighter(code, language)
      .then(([light, dark]) => {
        if (!cancelled) setResult({ code, language, light: withoutTabStop(light), dark: withoutTabStop(dark) });
      })
      .catch(() => {
        if (!cancelled) setResult(null);
      });
    return () => {
      cancelled = true;
    };
  }, [code, language, highlighter]);

  return result && result.code === code && result.language === language ? { light: result.light, dark: result.dark } : null;
}
