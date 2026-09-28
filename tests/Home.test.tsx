import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../pages/Home';

describe('Home - Destaques do Mandato', () => {
  it('apresenta o título dos destaques do mandato e os destaques de calendário e sweats', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText('Destaques do Mandato')).toBeInTheDocument();
    expect(screen.getByText('Apresentação do Calendário de Atividades')).toBeInTheDocument();
    expect(screen.getByText('Apresentação do Calendário de Sweats')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Apresentação oficial do calendário de atividades, workshops e convívios planeados para os estudantes.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Apresentação do calendário de pré-encomenda e fases de entrega das sweats oficiais do curso.'
      )
    ).toBeInTheDocument();
  });
});
