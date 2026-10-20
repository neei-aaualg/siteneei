import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShopProductModal } from '../components/admin/shop/ShopProductModal';
import { ShopProductCatalog } from '../components/admin/shop/ShopProductCatalog';
import { ShopOrdersTable } from '../components/admin/shop/ShopOrdersTable';
import { Shop } from '../pages/Shop';
import { ShopCampaign, ProductFormData, ShopOrder } from '../types/shop';
import * as shopService from '../services/shopService';
import { ThemeProvider } from '../context/ThemeContext';

// Mock de canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('Merch Packs / Bundles Feature', () => {
  const mockAvailableProducts: ShopCampaign[] = [
    {
      id: 'sweat-camp',
      title: 'Sweat Oficial NEEI',
      item_name: 'Sweat Oficial',
      item_price: 25.0,
      category: 'Vestuário',
      shipping_fee: 4.5,
      is_active: true,
      sizes_available: ['S', 'M', 'L'],
      colors_available: ['Preto', 'Branco'],
      features: ['80% Algodão'],
    },
    {
      id: 'tshirt-camp',
      title: 'T-Shirt Oficial NEEI',
      item_name: 'T-Shirt Oficial',
      item_price: 12.0,
      category: 'Vestuário',
      shipping_fee: 3.5,
      is_active: true,
      sizes_available: ['M', 'L', 'XL'],
      colors_available: ['Azul', 'Branco'],
      features: ['100% Algodão'],
    },
  ];

  describe('ShopProductModal - Pack / Bundle Configuration', () => {
    it('permite alternar para Pack / Conjunto e selecionar artigos com cálculo de poupança', () => {
      let formState: ProductFormData = {
        title: 'Pack Sweat + T-Shirt',
        item_name: 'Pack Sweat + T-Shirt',
        description: 'Conjunto oficial',
        category: 'Pack',
        item_price: 30.0,
        shipping_fee: 5.0,
        deadline_date: '',
        is_active: true,
        allow_pickup: true,
        allow_shipping: true,
        pickup_location: 'Gabinete NEEI',
        sizes_available: ['M'],
        colors_available: ['Preto'],
        features: [],
        is_bundle: true,
        bundle_items: [
          { campaign_id: 'sweat-camp', item_name: 'Sweat Oficial' },
          { campaign_id: 'tshirt-camp', item_name: 'T-Shirt Oficial' },
        ],
      };

      const setProductForm = vi.fn((updater) => {
        if (typeof updater === 'function') {
          formState = updater(formState);
        } else {
          formState = updater;
        }
      });

      render(
        <ShopProductModal
          isOpen={true}
          onClose={vi.fn()}
          editingProduct={null}
          productForm={formState}
          setProductForm={setProductForm}
          handleToggleSize={vi.fn()}
          onSubmit={vi.fn()}
          savingProduct={false}
          productError={null}
          availableProducts={mockAvailableProducts}
        />
      );

      // Deve mostrar o botão de Pack selecionado
      expect(screen.getByText('Pack / Conjunto')).toBeInTheDocument();
      expect(screen.getByText(/Artigos Incluídos no Pack/)).toBeInTheDocument();

      // Deve listar os produtos disponíveis para seleção
      expect(screen.getByText('Sweat Oficial NEEI')).toBeInTheDocument();
      expect(screen.getByText('T-Shirt Oficial NEEI')).toBeInTheDocument();

      // Soma dos artigos em separado: 25.00 + 12.00 = 37.00 €
      expect(screen.getByText('37.00 €')).toBeInTheDocument();

      // Poupança face ao preço do pack de 30.00€: 37 - 30 = 7.00€ (19% OFF)
      expect(screen.getByText(/Poupança: 7.00 €/)).toBeInTheDocument();

      // Secções 4, 5 e 6 de vestuário devem ser substituídas pelo aviso dinâmico
      expect(
        screen.getByText(/Personalização Dinâmica por Artigo no Checkout/)
      ).toBeInTheDocument();
    });
  });

  describe('ShopProductCatalog - Visualização de Packs', () => {
    it('apresenta badge de Pack e a lista das peças que o compõem', () => {
      const packProduct: ShopCampaign = {
        id: 'pack-camp',
        title: 'Pack Informática',
        item_name: 'Pack Informática',
        item_price: 32.0,
        category: 'Pack',
        shipping_fee: 5.0,
        is_active: true,
        is_bundle: true,
        bundle_items: [
          { campaign_id: 'sweat-camp', item_name: 'Sweat Oficial' },
          { campaign_id: 'tshirt-camp', item_name: 'T-Shirt Oficial' },
        ],
        sizes_available: [],
        colors_available: [],
        features: ['Poupança exclusiva'],
      };

      render(
        <ShopProductCatalog
          products={[packProduct]}
          onOpenCreate={vi.fn()}
          onOpenEdit={vi.fn()}
          onToggleActive={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getAllByText('Pack Informática').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Artigos no Pack \(2\)/)).toBeInTheDocument();
      expect(screen.getByText('Sweat Oficial')).toBeInTheDocument();
      expect(screen.getByText('T-Shirt Oficial')).toBeInTheDocument();
    });
  });

  describe('ShopOrdersTable - Encomendas com Pack e Itens Individuais', () => {
    it('apresenta as seleções específicas de tamanho e cor de cada peça do pack', () => {
      const mockOrder: ShopOrder = {
        id: 'SW-PACK-001',
        campaign_id: 'pack-camp',
        item_name: 'Pack Informática',
        student_name: 'Diogo Silva',
        student_email: 'diogo@ualg.pt',
        phone_number: '912345678',
        size: 'Sweat: L | T-Shirt: M',
        color: 'Sweat: Preto | T-Shirt: Branco',
        delivery_type: 'pickup',
        payment_status: 'paid',
        order_status: 'ready',
        total_amount: 32.73,
        created_at: new Date().toISOString(),
        bundle_selections: [
          { campaign_id: 'sweat-camp', item_name: 'Sweat', size: 'L', color: 'Preto' },
          { campaign_id: 'tshirt-camp', item_name: 'T-Shirt', size: 'M', color: 'Branco' },
        ],
      };

      render(
        <ShopOrdersTable
          orders={[mockOrder]}
          filteredOrders={[mockOrder]}
          selectedOrderIds={[]}
          allFilteredSelected={false}
          someFilteredSelected={false}
          bulkStatus="pending"
          isBulkUpdating={false}
          search=""
          originFilter="all"
          paymentFilter="all"
          orderStatusFilter="all"
          sizeFilter="all"
          deliveryFilter="all"
          loading={false}
          updatingOrderId={null}
          resendingEmailId={null}
          setSearch={vi.fn()}
          setOriginFilter={vi.fn()}
          setPaymentFilter={vi.fn()}
          setOrderStatusFilter={vi.fn()}
          setSizeFilter={vi.fn()}
          setDeliveryFilter={vi.fn()}
          setBulkStatus={vi.fn()}
          onToggleSelectOrder={vi.fn()}
          onToggleSelectAll={vi.fn()}
          onBulkStatusChange={vi.fn()}
          onStatusChange={vi.fn()}
          onResendEmail={vi.fn()}
          onOpenCreateManualOrder={vi.fn()}
          onRefresh={vi.fn()}
          getOrderStatusSelectClasses={() => ''}
        />
      );

      // Deve mostrar o artigo
      expect(screen.getByText('Pack Informática')).toBeInTheDocument();

      // Deve mostrar as seleções de cada peça
      expect(screen.getByText(/Pack \(2 artigos\)/)).toBeInTheDocument();
      expect(screen.getByText('Sweat:')).toBeInTheDocument();
      expect(screen.getAllByText('L').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Preto')).toBeInTheDocument();

      expect(screen.getByText('T-Shirt:')).toBeInTheDocument();
      expect(screen.getAllByText('M').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Branco')).toBeInTheDocument();
    });
  });

  describe('Shop Page - Checkout com Seleção Independente por Artigo do Pack', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('permite escolher tamanho e cor específicos para cada peça do pack e envia bundle_selections', async () => {
      const user = userEvent.setup();

      const packCampaign: ShopCampaign = {
        id: 'pack-camp',
        title: 'Pack Sweat + T-Shirt Promocional',
        item_name: 'Pack Sweat + T-Shirt',
        item_price: 32.0,
        category: 'Pack',
        shipping_fee: 5.0,
        is_active: true,
        is_bundle: true,
        bundle_items: [
          { campaign_id: 'sweat-camp', item_name: 'Sweat Oficial' },
          { campaign_id: 'tshirt-camp', item_name: 'T-Shirt Oficial' },
        ],
        sizes_available: [],
        colors_available: [],
        features: ['Preço especial de conjunto'],
        allow_pickup: true,
        allow_shipping: true,
      };

      vi.spyOn(shopService, 'fetchShopCampaign').mockResolvedValue({
        campaign: packCampaign,
        campaigns: [packCampaign, mockAvailableProducts[0], mockAvailableProducts[1]],
        sweatsAvailable: true,
        isSandbox: false,
      });

      const createPaymentIntentSpy = vi
        .spyOn(shopService, 'createPaymentIntent')
        .mockResolvedValue({
          orderId: 'SW-TEST-123',
          totalAmount: 32.73,
          clientSecret: 'pi_test_secret',
          publishableKey: 'pk_test',
          provider: 'stripe',
          isSandbox: false,
          itemName: 'Pack Sweat + T-Shirt',
        });

      render(
        <ThemeProvider>
          <Shop />
        </ThemeProvider>
      );

      // Espera pelo carregamento do produto
      await waitFor(() => {
        expect(screen.getByText('Pack Sweat + T-Shirt Promocional')).toBeInTheDocument();
      });

      // Clica no botão de comprar pack
      const buyPackButton = screen.getByRole('button', { name: /Comprar Pack/i });
      await user.click(buyPackButton);

      // Modal de checkout deve abrir com o título da pré-encomenda
      await waitFor(() => {
        expect(screen.getByText(/Configura os artigos do teu Pack/)).toBeInTheDocument();
      });

      // Deve renderizar as opções de cada peça
      expect(screen.getByText(/Peça 1 · Vestuário/)).toBeInTheDocument();
      expect(screen.getByText(/Peça 2 · Vestuário/)).toBeInTheDocument();

      // Preenche os dados do cliente
      const nameInput = screen.getByPlaceholderText(/Teu nome completo/i);
      await user.type(nameInput, 'João Estudante');

      const emailInput = screen.getByPlaceholderText(/aXXXXX@ualg.pt/i);
      await user.type(emailInput, 'joao@ualg.pt');

      const phoneInput = screen.getByPlaceholderText(/912345678/i);
      await user.type(phoneInput, '912345678');

      // Submete o checkout
      const submitBtn = screen.getByRole('button', { name: /Continuar para Pagamento/i });
      await user.click(submitBtn);

      // Deve ter chamado createPaymentIntent com bundle_selections estruturado
      await waitFor(() => {
        expect(createPaymentIntentSpy).toHaveBeenCalled();
      });

      const callArgs = createPaymentIntentSpy.mock.calls[0][0];
      expect(callArgs.campaign_id).toBe('pack-camp');
      expect(callArgs.bundle_selections).toHaveLength(2);
      expect(callArgs.bundle_selections?.[0]).toMatchObject({
        campaign_id: 'sweat-camp',
        item_name: 'Sweat Oficial',
      });
      expect(callArgs.bundle_selections?.[1]).toMatchObject({
        campaign_id: 'tshirt-camp',
        item_name: 'T-Shirt Oficial',
      });
    });
  });
});
