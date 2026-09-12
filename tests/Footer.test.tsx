import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../components/Footer';

describe('Footer', () => {
  it('apresenta a identificação e os contactos', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByText('NEEI')).toBeInTheDocument();
    expect(screen.getByText('Links Rápidos')).toBeInTheDocument();
    expect(screen.getByText('Sobre Nós')).toBeInTheDocument();
    expect(screen.getByText('neei@aaualg.pt')).toBeInTheDocument();
    expect(screen.getByText('Oportunidades')).toBeInTheDocument();
  });

  it('inclui as redes sociais com os links corretos', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Instagram')).toHaveAttribute(
      'href',
      'https://instagram.com/neeiualg'
    );
    expect(screen.getByLabelText('Discord')).toHaveAttribute(
      'href',
      'https://discord.gg/HzBuRFCAb5'
    );
    expect(screen.getByLabelText('LinkedIn')).toHaveAttribute(
      'href',
      'https://www.linkedin.com/company/neeiualg'
    );
    expect(screen.getByLabelText('GitHub')).toHaveAttribute(
      'href',
      'https://github.com/neei-aaualg'
    );
  });

  it('volta ao topo da página quando clicas num link da página atual', async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, 'scrollTo');
    render(
      <MemoryRouter initialEntries={['/sobre']}>
        <Footer />
      </MemoryRouter>
    );

    await user.click(screen.getByText('Sobre Nós'));
    expect(scrollTo).toHaveBeenCalled();
  });
});
