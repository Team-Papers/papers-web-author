import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Sans ceci, chaque test rend son composant dans le DOM laisse par le
// precedent et les selecteurs remontent deux occurrences.
afterEach(() => cleanup());

// jsdom n'implemente pas matchMedia, dont useTheme depend des le montage de
// n'importe quelle page. Sans ce comblement, aucun composant de l'application
// n'est rendable en test.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
