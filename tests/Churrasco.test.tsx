import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Churrasco from '../pages/Churrasco';
import * as churrascoService from '../services/churrascoService';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('qr-code-styling', () => {
  return {
    default: class MockQRCode {
      append() {}
    },
  };
});

describe('Churrasco Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(churrascoService, 'fetchChurrascoStatus').mockResolvedValue({
      visible: true,
      unitPrice: 4.5,
      includes: {
        food: '1 Bifana no pão',
        drinks: '2 Copos de cerveja ou refrigerante',
      },
      location: 'Campus de Gambelas (Gabinete NEEI / Pátio)',
    });
  });

  const renderChurrasco = (initialEntries = ['/churrasco']) =>
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <Churrasco />
      </MemoryRouter>
    );

  it('apresenta a informação principal do churrasco e o preço de 4,50€', async () => {
    renderChurrasco();

    await waitFor(() => {
      expect(screen.getByText(/Churrasco de/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Entrada 100% Gratuita/i)).toBeInTheDocument();
    expect(screen.getAllByText(/NEISE/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/1 Bifana no Pão/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/2 Copos de Bebida/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/4,50€ Tudo Incluído/i)).toBeInTheDocument();
  });

  it('permite preencher o formulário e selecionar bebida e quantidade', async () => {
    const user = userEvent.setup();
    renderChurrasco();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ex: Diogo Rodrigues/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/Ex: Diogo Rodrigues/i);
    const emailInput = screen.getByPlaceholderText(/a12345@ualg.pt ou pessoal/i);
    const phoneInput = screen.getByPlaceholderText(/912 345 678/i);

    await user.type(nameInput, 'João Silva');
    await user.type(emailInput, 'joao@ualg.pt');
    await user.type(phoneInput, '912345678');

    // Seleciona Refrigerante
    const refriBtn = screen.getByRole('button', { name: 'Refrigerante' });
    await user.click(refriBtn);

    // Aumenta quantidade para 2
    const plusBtn = screen.getByRole('button', { name: '+' });
    await user.click(plusBtn);

    // Total deve ser 9.00€
    expect(screen.getByText(/Total a Pagar \(2x passes\):/i)).toBeInTheDocument();
    expect(screen.getByText('9.00€')).toBeInTheDocument();
  });

  it('apresenta mensagem de encerramento se o admin tiver desativado a visibilidade', async () => {
    vi.spyOn(churrascoService, 'fetchChurrascoStatus').mockResolvedValue({
      visible: false,
      unitPrice: 4.5,
      includes: { food: '1 Bifana', drinks: '2 Copos' },
      location: 'Campus de Gambelas',
    });

    renderChurrasco();

    await waitFor(() => {
      expect(screen.getByText(/Inscrições Temporariamente Encerradas/i)).toBeInTheDocument();
    });

    expect(screen.queryByPlaceholderText(/Ex: Diogo Rodrigues/i)).not.toBeInTheDocument();
  });

  it('apresenta o bilhete digital confirmado quando redirecionado com success=1', async () => {
    vi.spyOn(churrascoService, 'confirmChurrascoPayment').mockResolvedValue({
      success: true,
      order: {
        id: 'churr_12345',
        ticket_code: 'CH-8K2P',
        student_name: 'Diogo Rodrigues',
        student_email: 'diogo@ualg.pt',
        quantity: 1,
        total_amount: 4.5,
        drink_preference: 'Cerveja',
        payment_status: 'paid',
        check_in: 0,
      },
    });

    renderChurrasco(['/churrasco?success=1&order_id=churr_12345']);

    await waitFor(() => {
      expect(screen.getByText(/O teu Passe está Confirmado!/i)).toBeInTheDocument();
    });

    expect(screen.getByText('CH-8K2P')).toBeInTheDocument();
    expect(screen.getByText(/Pago com Sucesso/i)).toBeInTheDocument();
    expect(screen.getByText(/Imprimir \/ Guardar Bilhete/i)).toBeInTheDocument();
  });
});
