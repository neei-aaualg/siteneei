import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme, THEME_STORAGE_KEY } from '../context/ThemeContext';

const ThemeProbe: React.FC = () => {
  const { isDark, toggleTheme, theme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme} aria-label={`tema: ${theme}`}>
      {isDark ? 'escuro' : 'claro'}
    </button>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('usa o tema guardado no localStorage na inicialização', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(screen.getByRole('button')).toHaveTextContent('escuro');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('inicializa em claro sem preferência guardada', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(screen.getByRole('button')).toHaveTextContent('claro');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('alterna o tema e persiste no localStorage', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('escuro');
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('claro');
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('o class de transição é removido após o toggle', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button'));
    expect(document.documentElement).toHaveClass('theme-transition');
  });
});
