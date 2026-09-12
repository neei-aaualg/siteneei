import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Com `globals: false`, o cleanup automático do Testing Library não é registado.
afterEach(() => {
  cleanup();
});

// Mocks apenas necessários no ambiente jsdom (componentes React).
if (typeof window !== 'undefined') {
  // matchMedia usado no tema (index.html / ThemeContext)
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  // ResizeObserver usado no carrossel da Home
  if (!window.ResizeObserver) {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver =
      window.ResizeObserver || (ResizeObserverMock as unknown as typeof ResizeObserver);
  }

  // URL.createObjectURL / revokeObjectURL usados no download .ics
  if (!window.URL.createObjectURL) {
    Object.defineProperty(window.URL, 'createObjectURL', {
      writable: true,
      value: () => 'blob:mock',
    });
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      writable: true,
      value: () => {},
    });
  }

  window.scrollTo = window.scrollTo || (() => {});
  window.HTMLElement.prototype.scrollIntoView =
    window.HTMLElement.prototype.scrollIntoView || (() => {});
}
