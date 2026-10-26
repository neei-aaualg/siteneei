import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminShopPanel } from '../components/admin/AdminShopPanel';
import * as shopService from '../services/shopService';

vi.mock('../services/shopService', () => ({
  fetchAdminShopOrders: vi.fn(),
  fetchAdminShopStats: vi.fn(),
  updateAdminOrderStatus: vi.fn(),
  updateMultipleAdminOrderStatus: vi.fn(),
  resendOrderEmail: vi.fn(),
  fetchShopCampaign: vi.fn(),
  createAdminManualOrder: vi.fn(),
  fetchAdminProducts: vi.fn(),
  createAdminProduct: vi.fn(),
  updateAdminProduct: vi.fn(),
  deleteAdminProduct: vi.fn(),
  fetchShopProfitMargins: vi.fn(),
}));

describe('AdminShopPanel - showFeedback optional handling', () => {
  const sampleProducts = [
    {
      id: 'prod-1',
      title: 'Sweat NEEI 2026',
      description: 'Sweat oficial',
      item_name: 'Sweat Oficial',
      item_price: 25,
      shipping_fee: 3.5,
      image_url: '/assets/mockup.png',
      is_active: true,
      sizes_available: ['M', 'L'],
      colors_available: ['Preto'],
      features: ['100% Algodão'],
      category: 'Vestuário',
      display_order: 1,
      priority: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (shopService.fetchAdminShopOrders as ReturnType<typeof vi.fn>).mockResolvedValue({ orders: [] });
    (shopService.fetchAdminShopStats as ReturnType<typeof vi.fn>).mockResolvedValue({
      totalOrders: 0,
      totalRevenue: 0,
      totalPaidOrders: 0,
    });
    (shopService.fetchAdminProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
      products: sampleProducts,
    });
    (shopService.fetchShopCampaign as ReturnType<typeof vi.fn>).mockResolvedValue({
      campaign: sampleProducts[0],
      showTestShop: false,
    });
  });

  it('permite abrir modal de edição e guardar produto sem erro mesmo se showFeedback for omitido', async () => {
    const user = userEvent.setup();
    (shopService.updateAdminProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      product: { ...sampleProducts[0], title: 'Sweat NEEI 2026 Atualizada' },
    });

    render(<AdminShopPanel token="test-token" />);

    // Alterna para o separador de produtos
    const productsTabBtn = await screen.findByRole('button', { name: /Gerir Produtos no Catálogo/i });
    await user.click(productsTabBtn);

    // Clica no botão Editar
    const editBtn = await screen.findByRole('button', { name: /Editar/i });
    await user.click(editBtn);

    // Verifica que o modal abriu
    expect(await screen.findByText('Editar Produto do Catálogo')).toBeInTheDocument();

    // Submete o formulário
    const submitBtn = screen.getByRole('button', { name: /Guardar Alterações/i });
    await user.click(submitBtn);

    // Verifica que updateAdminProduct foi chamado
    await waitFor(() => {
      expect(shopService.updateAdminProduct).toHaveBeenCalled();
    });

    // O modal deve fechar e NÃO deve exibir alerta de erro "is not a function"
    await waitFor(() => {
      expect(screen.queryByText(/is not a function/i)).not.toBeInTheDocument();
    });
  });

  it('chama showFeedback quando a função é fornecida', async () => {
    const user = userEvent.setup();
    const showFeedbackMock = vi.fn();
    (shopService.updateAdminProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      product: { ...sampleProducts[0], title: 'Sweat NEEI 2026 Atualizada' },
    });

    render(<AdminShopPanel token="test-token" showFeedback={showFeedbackMock} />);

    // Alterna para produtos
    const productsTabBtn = await screen.findByRole('button', { name: /Gerir Produtos no Catálogo/i });
    await user.click(productsTabBtn);

    // Clica em Editar
    const editBtn = await screen.findByRole('button', { name: /Editar/i });
    await user.click(editBtn);

    // Submete
    const submitBtn = screen.getByRole('button', { name: /Guardar Alterações/i });
    await user.click(submitBtn);

    // Verifica que showFeedback foi chamado com o ID do produto
    await waitFor(() => {
      expect(showFeedbackMock).toHaveBeenCalledWith('prod-1', expect.stringContaining('sucesso'));
    });
  });
});
