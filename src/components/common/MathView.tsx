import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

// Cache global en memoria para evitar llamadas redundantes a KaTeX en cada frame o re-render
const KATEX_CACHE = new Map<string, string>();

export const MathView = React.memo(function MathView({
  math,
  displayMode = false,
  className = '',
}: MathViewProps) {
  const html = useMemo(() => {
    const cacheKey = `${math}__${displayMode}`;
    const cached = KATEX_CACHE.get(cacheKey);
    if (cached) return cached;

    try {
      const rendered = katex.renderToString(math, {
        displayMode,
        throwOnError: false,
        output: 'html',
      });
      KATEX_CACHE.set(cacheKey, rendered);
      return rendered;
    } catch (e) {
      console.error('Error rendering KaTeX:', e);
      return math;
    }
  }, [math, displayMode]);

  return (
    <span
      className={`inline-block select-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
