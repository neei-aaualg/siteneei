import React, { createContext, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: (event?: React.MouseEvent | MouseEvent) => void;
  setTheme: (theme: Theme, event?: React.MouseEvent | MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEME_STORAGE_KEY = 'neei_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const isDark = theme === 'dark';

  const applyThemeClass = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      // ignore
    }
  };

  // Sync theme class on mount and theme change
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  // Listen to system preference changes if user hasn't explicitly set preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (!saved) {
        const nextTheme = e.matches ? 'dark' : 'light';
        applyThemeClass(nextTheme);
        setThemeState(nextTheme);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const switchThemeWithAnimation = (nextTheme: Theme, event?: React.MouseEvent | MouseEvent) => {
    if (nextTheme === theme) return;

    const doc = document as any;
    const isViewTransitionSupported =
      typeof doc !== 'undefined' &&
      typeof doc.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isViewTransitionSupported) {
      // Fallback for browsers without View Transitions:
      // Apply a temporary class to synchronize 300ms transition for all elements
      const root = document.documentElement;
      root.classList.add('theme-transition');
      applyThemeClass(nextTheme);
      setThemeState(nextTheme);
      window.setTimeout(() => {
        root.classList.remove('theme-transition');
      }, 350);
      return;
    }

    // View Transitions API: circular expanding reveal animation
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (event && (event.clientX !== 0 || event.clientY !== 0)) {
      x = event.clientX;
      y = event.clientY;
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const root = document.documentElement;
    root.classList.add('is-view-transitioning');

    const transition = doc.startViewTransition(() => {
      flushSync(() => {
        applyThemeClass(nextTheme);
        setThemeState(nextTheme);
      });
    });

    transition.ready
      .then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];

        root.animate(
          {
            clipPath: clipPath,
          },
          {
            duration: 480,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      })
      .catch(() => {
        // Fallback in case of any animation error
      });

    transition.finished.finally(() => {
      root.classList.remove('is-view-transitioning');
    });
  };

  const toggleTheme = (event?: React.MouseEvent | MouseEvent) => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    switchThemeWithAnimation(nextTheme, event);
  };

  const setTheme = (newTheme: Theme, event?: React.MouseEvent | MouseEvent) => {
    switchThemeWithAnimation(newTheme, event);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
