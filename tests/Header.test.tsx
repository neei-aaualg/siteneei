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

  it('apresenta a navegação principal mais compacta', () => {
    renderHeader();
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getAllByText('Explorar')[0]).toBeInTheDocument();
    expect(screen.getByText('Merch')).toBeInTheDocument();
    expect(screen.getByText('Atividades')).toBeInTheDocument();
    expect(screen.getAllByText('NEEI-Tools')[0]).toBeInTheDocument();
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

  it('abre e fecha o dropdown Explorar (desktop) contendo Colaborar', async () => {
    const user = userEvent.setup();
    renderHeader();

    expect(screen.queryByText('Sobre')).not.toBeInTheDocument();
    expect(screen.queryByText('Colaborar')).not.toBeInTheDocument();
    expect(screen.queryByText('Vagas')).not.toBeInTheDocument();

    await user.click(screen.getAllByText('Explorar')[0]);
    expect(screen.getByText('Sobre')).toBeInTheDocument();
    expect(screen.getByText('Colaborar')).toBeInTheDocument();
    expect(screen.getByText('Candidaturas e voluntariado')).toBeInTheDocument();
    expect(screen.getByText('Vagas')).toBeInTheDocument();
    expect(screen.getByText('Links')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
    expect(screen.getByText('Projetos')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByText('Sobre')).not.toBeInTheDocument();
    expect(screen.queryByText('Colaborar')).not.toBeInTheDocument();
  });

  it('abre e fecha o dropdown NEEI-Tools com Quack, NEEI-CV e NEEIBox', async () => {
    const user = userEvent.setup();
    renderHeader();

    expect(screen.queryByText('IDE online & Tutor com IA')).not.toBeInTheDocument();

    // Clica no botão de dropdown NEEI-Tools desktop
    await user.click(screen.getAllByText('NEEI-Tools')[0]);

    expect(screen.getByText('Ferramentas Digitais')).toBeInTheDocument();
    expect(screen.getByText('Quack')).toBeInTheDocument();
    expect(screen.getByText('IDE online & Tutor com IA')).toBeInTheDocument();
    expect(screen.getByText('NEEI-CV')).toBeInTheDocument();
    expect(screen.getByText('NEEIBox')).toBeInTheDocument();

    const cvLink = screen.getByTitle('CV Builder do NEEI (cv.neei.online)');
    expect(cvLink).toHaveAttribute('href', 'https://cv.neei.online');

    const boxLink = screen.getByTitle('NEEIBox (box.neei.online)');
    expect(boxLink).toHaveAttribute('href', 'https://box.neei.online');

    const quackLink = screen.getByText('Quack').closest('a');
    expect(quackLink).toHaveAttribute('href', '/quack');

    await user.keyboard('{Escape}');
    expect(screen.queryByText('Ferramentas Digitais')).not.toBeInTheDocument();
  });
});

