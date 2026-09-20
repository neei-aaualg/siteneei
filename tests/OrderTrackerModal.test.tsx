import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderTrackerModal } from '../components/OrderTrackerModal';
import * as shopService from '../services/shopService';
import { OrderStatusResponse } from '../types/shop';

describe('OrderTrackerModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockOrderPickup: OrderStatusResponse = {
    orderId: 'SW-2026-9876',
    paymentStatus: 'paid',
    orderStatus: 'confirmed',
    paidAt: '2026-09-20T12:00:00.000Z',
    createdAt: '2026-09-20T11:58:00.000Z',
    studentName: 'Ana Silva',
    size: 'M',
    color: 'Preto',
    totalAmount: 25.0,
    deliveryType: 'pickup',
    pickupLocation: 'Gabinete NEEI (Sala 0.18, Edifício 1, Campus de Gambelas)',
  };

  const mockOrderShipping: OrderStatusResponse = {
    orderId: 'SW-2026-5432',
    paymentStatus: 'paid',
    orderStatus: 'shipped',
    paidAt: '2026-09-20T10:00:00.000Z',
    createdAt: '2026-09-20T09:55:00.000Z',
    studentName: 'Rui Costa',
    size: 'L',
    color: 'Preto',
    totalAmount: 28.5,
    deliveryType: 'shipping',
    shippingCity: 'Faro',
  };

  it('não renderiza conteúdo quando isOpen é false', () => {
    const { container } = render(
      <OrderTrackerModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza o formulário de pesquisa quando aberto', () => {
    render(<OrderTrackerModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Seguir Encomenda' })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Introduz o código (ex: SW-2026-1234)')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Consultar Estado/i })).toBeInTheDocument();
  });

  it('pesquisa encomenda e apresenta os detalhes e passos para levantamento no gabinete', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi
      .spyOn(shopService, 'fetchOrderStatus')
      .mockResolvedValue(mockOrderPickup);

    render(<OrderTrackerModal isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText('Introduz o código (ex: SW-2026-1234)');
    await user.type(input, 'sw-2026-9876');

    const submitBtn = screen.getByRole('button', { name: /Consultar Estado/i });
    await user.click(submitBtn);

    expect(fetchSpy).toHaveBeenCalledWith('sw-2026-9876');

    await waitFor(() => {
      expect(screen.getByText('SW-2026-9876')).toBeInTheDocument();
    });

    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('25.00€')).toBeInTheDocument();
    expect(screen.getByText('Gabinete NEEI')).toBeInTheDocument();
    expect(screen.getByText('Pronta p/ Levantamento no Gabinete')).toBeInTheDocument();
    expect(screen.getByText('Fase Atual')).toBeInTheDocument();
  });

  it('adapta os passos quando a modalidade é envio por CTT', async () => {
    const user = userEvent.setup();
    vi.spyOn(shopService, 'fetchOrderStatus').mockResolvedValue(mockOrderShipping);

    render(<OrderTrackerModal isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText('Introduz o código (ex: SW-2026-1234)');
    await user.type(input, 'SW-2026-5432');
    await user.click(screen.getByRole('button', { name: /Consultar Estado/i }));

    await waitFor(() => {
      expect(screen.getByText('SW-2026-5432')).toBeInTheDocument();
    });

    expect(screen.getByText('Envio CTT')).toBeInTheDocument();
    expect(screen.getAllByText('Enviada via CTT Nacional').length).toBeGreaterThanOrEqual(1);
  });

  it('apresenta mensagem de erro quando a encomenda não é encontrada', async () => {
    const user = userEvent.setup();
    vi.spyOn(shopService, 'fetchOrderStatus').mockRejectedValue(
      new Error('Encomenda não encontrada.')
    );

    render(<OrderTrackerModal isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText('Introduz o código (ex: SW-2026-1234)');
    await user.type(input, 'SW-INEXISTENTE');
    await user.click(screen.getByRole('button', { name: /Consultar Estado/i }));

    await waitFor(() => {
      expect(screen.getByText('Encomenda não localizada')).toBeInTheDocument();
      expect(screen.getByText('Encomenda não encontrada.')).toBeInTheDocument();
    });
  });

  it('carrega automaticamente quando é fornecido um initialOrderId', async () => {
    const fetchSpy = vi
      .spyOn(shopService, 'fetchOrderStatus')
      .mockResolvedValue(mockOrderPickup);

    render(
      <OrderTrackerModal
        isOpen={true}
        onClose={vi.fn()}
        initialOrderId="SW-2026-9876"
      />
    );

    expect(fetchSpy).toHaveBeenCalledWith('SW-2026-9876');
    await waitFor(() => {
      expect(screen.getByText('SW-2026-9876')).toBeInTheDocument();
    });
  });

  it('invoca onClose ao clicar no botão fechar', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<OrderTrackerModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByLabelText('Fechar rastreio');
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
