import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import Header from '../components/Header';

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  const renderHeader = (initialPath = '/') =>
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      </MemoryRouter>
    );

  it('apresenta a navegação principal', () => {
    renderHeader();
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Merch')).toBeInTheDocument();
    expect(screen.getByText('Atividades')).toBeInTheDocument();
    expect(screen.getByText('Colaborar')).toBeInTheDocument();
  });

  it('alterna o tema através do botão', async () => {
    const user = userEvent.setup();
    renderHeader();

    const darkButton = screen.getAllByLabelText('Mudar para Tema Escuro');
    expect(darkButton).toHaveLength(2);

    await user.click(darkButton[0]);
    expect(screen.getAllByLabelText('Mudar para Tema Claro')).toHaveLength(2);
    expect(document.documentElement).toHaveClass('dark');

    await user.click(screen.getAllByLabelText('Mudar para Tema Claro')[0]);
    expect(screen.getAllByLabelText('Mudar para Tema Escuro')).toHaveLength(2);
  });

  it('abre e fecha o dropdown Explorar (desktop)', async () => {
    const user = userEvent.setup();
    renderHeader();

    expect(screen.queryByText('Sobre')).not.toBeInTheDocument();
    expect(screen.queryByText('Vagas')).not.toBeInTheDocument();

    await user.click(screen.getAllByText('Explorar')[0]);
    expect(screen.getByText('Sobre')).toBeInTheDocument();
    expect(screen.getByText('Vagas')).toBeInTheDocument();
    expect(screen.getByText('Constrói e personaliza o teu currículo')).toBeInTheDocument();
    expect(screen.getAllByText('CV Builder').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Links')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByText('Sobre')).not.toBeInTheDocument();
    expect(screen.queryByText('Vagas')).not.toBeInTheDocument();
    expect(screen.queryByText('Constrói e personaliza o teu currículo')).not.toBeInTheDocument();
  });

  it('liga para o CV Builder, o NEEIBox e o Quack', () => {
    renderHeader();
    const cvButtons = screen.getAllByTitle('CV Builder do NEEI (cv.neei.online)');
    expect(cvButtons.length).toBeGreaterThan(0);
    expect(cvButtons[0]).toHaveAttribute('href', 'https://cv.neei.online');

    expect(screen.getByTitle('NEEIBox (box.neei.online)')).toHaveAttribute(
      'href',
      'https://box.neei.online'
    );
    expect(screen.getByText('Quack').closest('a')).toHaveAttribute('href', '/quack');
  });
});
