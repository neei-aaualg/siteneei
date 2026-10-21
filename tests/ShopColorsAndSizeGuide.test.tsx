import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Shop } from '../pages/Shop';
import * as shopService from '../services/shopService';
import { ShopProductModal } from '../components/admin/shop/ShopProductModal';
import { ShopProductCatalog } from '../components/admin/shop/ShopProductCatalog';
import { ShopOrdersTable } from '../components/admin/shop/ShopOrdersTable';
import {
  ProductFormData,
  ShopCampaign,
  ShopOrder,
  DEFAULT_SIZE_GUIDE,
  getColorHex,
} from '../types/shop';

describe('getColorHex helper', () => {
  it('mapeia cores conhecidas em português para hex codes corretos', () => {
    expect(getColorHex('Preto')).toBe('#0f172a');
    expect(getColorHex('Branco')).toBe('#f8fafc');
    expect(getColorHex('Azul Marinho')).toBe('#0f2942');
    expect(getColorHex('Bordeaux')).toBe('#881337');
    expect(getColorHex('Verde Garrafa')).toBe('#134e4a');
    expect(getColorHex('Cinzento')).toBe('#64748b');
  });

  it('retorna a própria cor se for um hex válido ou fallback seguro se desconhecido', () => {
    expect(getColorHex('#ff5500')).toBe('#ff5500');
    expect(getColorHex('CorInexistente123')).toBe('#64748b');
  });
});

describe('ShopProductModal - Cores e Guia de Tamanhos', () => {
  const initialForm: ProductFormData = {
    title: 'Sweat Universitária 2026',
    item_name: 'Sweat NEEI',
    category: 'Vestuário',
    item_price: 25.0,
    shipping_fee: 3.5,
    description: 'Sweat oficial',
    image_url: '',
    deadline_date: '',
    allow_pickup: true,
    allow_shipping: true,
    pickup_location: 'Gabinete NEEI',
    features: ['Algodão cardado'],
    sizes_available: ['S', 'M', 'L'],
    colors_available: ['Preto', 'Azul Marinho'],
    size_guide: { ...DEFAULT_SIZE_GUIDE },
    is_active: true,
  };

  it('renderiza opções de cores e guia de tamanhos para produtos de Vestuário', () => {
    render(
      <ShopProductModal
        isOpen={true}
        onClose={vi.fn()}
        editingProduct={null}
        productForm={initialForm}
        setProductForm={vi.fn()}
        handleToggleSize={vi.fn()}
        onSubmit={vi.fn()}
        savingProduct={false}
        productError={null}
      />
    );

    // Secção de Cores Disponíveis
    expect(screen.getByText(/5\. Cores Disponíveis/i)).toBeInTheDocument();
    expect(screen.getAllByText('Preto').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Azul Marinho').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText(/Outra cor/i)).toBeInTheDocument();

    // Secção de Guia de Tamanhos
    expect(screen.getByText(/6\. Guia de Tamanhos/i)).toBeInTheDocument();
    expect(screen.getByText(/Repor Medidas Padrão/i)).toBeInTheDocument();
    // Verifica colunas da tabela
    expect(screen.getByText(/Medida do pescoço até ao cinto/i)).toBeInTheDocument();
    expect(screen.getByText(/Metade do diâmetro à altura do peito/i)).toBeInTheDocument();
    expect(screen.getByText(/Medida de ombro a ombro/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Ombro ao Punho/i).length).toBeGreaterThanOrEqual(1);

    // Verifica campos de foto por cor
    expect(screen.getByPlaceholderText(/Foto para Preto/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Foto para Azul Marinho/i)).toBeInTheDocument();
  });

  it('permite adicionar e remover cores através do setProductForm', async () => {
    const user = userEvent.setup();

    const Wrapper = () => {
      const [form, setForm] = useState<ProductFormData>(initialForm);
      return (
        <ShopProductModal
          isOpen={true}
          onClose={vi.fn()}
          editingProduct={null}
          productForm={form}
          setProductForm={setForm}
          handleToggleSize={vi.fn()}
          onSubmit={vi.fn()}
          savingProduct={false}
          productError={null}
        />
      );
    };

    render(<Wrapper />);

    // Adiciona uma nova cor personalizada "Verde Floresta"
    const inputColor = screen.getByPlaceholderText(/Outra cor/i);
    await user.type(inputColor, 'Verde Floresta');
    const addBtn = screen.getByRole('button', { name: /Adicionar Cor/i });
    await user.click(addBtn);

    expect(screen.getByText('Verde Floresta')).toBeInTheDocument();

    // Remove a cor "Preto" clicando no botão de remover cor
    const removePretoBtn = screen.getByTitle('Remover cor Preto');
    await user.click(removePretoBtn);

    expect(screen.queryByTitle('Remover cor Preto')).not.toBeInTheDocument();
  });

  it('permite editar as medidas no guia de tamanhos e repor padrões', async () => {
    const user = userEvent.setup();

    const Wrapper = () => {
      const [form, setForm] = useState<ProductFormData>(initialForm);
      return (
        <ShopProductModal
          isOpen={true}
          onClose={vi.fn()}
          editingProduct={null}
          productForm={form}
          setProductForm={setForm}
          handleToggleSize={vi.fn()}
          onSubmit={vi.fn()}
          savingProduct={false}
          productError={null}
        />
      );
    };

    render(<Wrapper />);

    // Procura a tabela de guia de tamanhos e os respetivos inputs
    const table = screen.getByRole('table');
    const tableSpinners = within(table).getAllByRole('spinbutton');
    expect(tableSpinners.length).toBeGreaterThan(0);

    // tableSpinners[0] corresponde ao Peito do tamanho S
    await user.clear(tableSpinners[0]);
    await user.type(tableSpinners[0], '58');
    expect(tableSpinners[0]).toHaveValue(58);

    // Clica em Repor Medidas Padrão
    const resetBtn = screen.getByRole('button', { name: /Repor Medidas Padrão/i });
    await user.click(resetBtn);

    // Volta ao valor padrão de S no DEFAULT_SIZE_GUIDE (52)
    expect(tableSpinners[0]).toHaveValue(DEFAULT_SIZE_GUIDE.S.chest);
  });

  it('não apresenta secção de cores nem guia de tamanhos para produtos não-vestuário', () => {
    const accessoryForm: ProductFormData = {
      ...initialForm,
      category: 'Acessórios',
    };

    render(
      <ShopProductModal
        isOpen={true}
        onClose={vi.fn()}
        editingProduct={null}
        productForm={accessoryForm}
        setProductForm={vi.fn()}
        handleToggleSize={vi.fn()}
        onSubmit={vi.fn()}
        savingProduct={false}
        productError={null}
      />
    );

    expect(screen.queryByText(/5\. Cores Disponíveis/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/6\. Guia de Tamanhos/i)).not.toBeInTheDocument();
  });
});

describe('ShopProductCatalog - Exibição de Cores', () => {
  const mockProducts: ShopCampaign[] = [
    {
      id: '1',
      title: 'Sweat NEEI 2026',
      description: 'Sweat de curso',
      item_name: 'Sweat',
      category: 'Vestuário',
      item_price: 25.0,
      shipping_fee: 3.5,
      image_url: '',
      deadline_date: '',
      allow_pickup: true,
      allow_shipping: true,
      pickup_location: 'Gabinete NEEI',
      features: ['Algodão'],
      sizes_available: ['M', 'L'],
      colors_available: ['Preto', 'Branco', 'Azul Marinho'],
      size_guide: DEFAULT_SIZE_GUIDE,
      is_active: true,
      created_at: '2026-01-01',
    },
  ];

  it('mostra os chips de cores disponíveis no cartão do produto', () => {
    render(
      <ShopProductCatalog
        products={mockProducts}
        onOpenCreate={vi.fn()}
        onOpenEdit={vi.fn()}
        onToggleActive={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Sweat NEEI 2026')).toBeInTheDocument();
    expect(screen.getByText(/Cores Disponíveis/i)).toBeInTheDocument();
    expect(screen.getByText('Preto')).toBeInTheDocument();
    expect(screen.getByText('Branco')).toBeInTheDocument();
    expect(screen.getByText('Azul Marinho')).toBeInTheDocument();
  });
});

describe('ShopOrdersTable - Exibição de Tamanho e Cor', () => {
  const mockOrders: ShopOrder[] = [
    {
      id: 'SW-2026-0001',
      campaign_id: '1',
      item_name: 'Sweat Universitária',
      student_name: 'David Rodrigues',
      student_email: 'david@ualg.pt',
      phone_number: '912345678',
      size: 'L',
      color: 'Azul Marinho',
      delivery_type: 'pickup',
      item_price: 25.0,
      shipping_fee: 0,
      payment_fee: 0.63,
      total_amount: 25.63,
      payment_status: 'paid',
      payment_provider: 'stripe',
      order_status: 'confirmed',
      email_sent: true,
      created_at: '2026-01-01T12:00:00Z',
      paid_at: '2026-01-01T12:05:00Z',
    },
  ];

  it('mostra coluna Tamanho / Cor com a cor e tamanho do pedido', () => {
    render(
      <ShopOrdersTable
        orders={mockOrders}
        filteredOrders={mockOrders}
        selectedOrderIds={[]}
        allFilteredSelected={false}
        someFilteredSelected={false}
        bulkStatus="confirmed"
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
        getOrderStatusSelectClasses={vi.fn(() => '')}
      />
    );

    expect(screen.getByText('Tamanho / Cor')).toBeInTheDocument();
    const row = screen.getByRole('row', { name: /David Rodrigues/i });
    expect(within(row).getByText('L')).toBeInTheDocument();
    expect(within(row).getByText('Azul Marinho')).toBeInTheDocument();
  });
});

describe('Shop - Seleção de Cor e Guia no Checkout do Comprador', () => {
  const mockClothingCampaign: ShopCampaign = {
    id: '1',
    title: 'Sweat Oficial NEEI 2026',
    item_name: 'Sweat Universitária',
    category: 'Vestuário',
    item_price: 25.0,
    shipping_fee: 3.5,
    description: 'Edição limitada em preto e azul marinho.',
    image_url: '/assets/sweat_preto.jpg',
    deadline_date: '',
    allow_pickup: true,
    allow_shipping: true,
    pickup_location: 'Gabinete NEEI',
    features: ['80% Algodão', 'Bordado de alta definição'],
    sizes_available: ['S', 'M', 'L'],
    colors_available: ['Preto', 'Azul Marinho'],
    color_images: {
      Preto: '/assets/sweat_preto.jpg',
      'Azul Marinho': '/assets/sweat_azul.jpg',
    },
    size_guide: {
      ...DEFAULT_SIZE_GUIDE,
      M: { chest: 56, length: 71, sleeve: 65, shoulder_to_wrist: 76, label: 'Médio Confortável' },
    },
    is_active: true,
    created_at: '2026-01-01',
  };

  it('permite alternar a foto na grelha e no modal com o seletor de cores, e consultar a medida D no guia de tamanhos', async () => {
    vi.spyOn(shopService, 'fetchShopCampaign').mockResolvedValue({
      campaign: mockClothingCampaign,
      campaigns: [mockClothingCampaign],
      isSandbox: true,
      sweatsAvailable: true,
    });

    const user = userEvent.setup();
    render(<Shop />);

    // Espera o carregamento da campanha
    await waitFor(() => {
      expect(screen.getByText('Sweat Oficial NEEI 2026')).toBeInTheDocument();
    });

    // Imagem inicial da sweat no cartão (Preto por defeito)
    const cardImg = screen.getByAltText('Sweat Oficial NEEI 2026');
    expect(cardImg).toHaveAttribute('src', '/assets/sweat_preto.jpg');

    // Clica no botão notório de cor "Azul Marinho" diretamente no cartão do produto
    const cardAzulBtn = screen.getByTitle('Ver na cor Azul Marinho');
    expect(cardAzulBtn).toBeInTheDocument();
    await user.click(cardAzulBtn);

    // A imagem do cartão troca dinamicamente para a foto da cor selecionada!
    expect(cardImg).toHaveAttribute('src', '/assets/sweat_azul.jpg');

    // Clica no botão Pré-encomendar no produto
    const orderBtn = screen.getByRole('button', { name: /Pré-encomendar/i });
    await user.click(orderBtn);

    // O modal abre com o seletor minimalista de cor e com a foto da cor selecionada no cartão
    expect(screen.getAllByRole('button', { name: /Azul Marinho/i }).length).toBeGreaterThanOrEqual(
      1
    );
    const modalImg = screen.getByAltText('Sweat Universitária - Azul Marinho');
    expect(modalImg).toHaveAttribute('src', '/assets/sweat_azul.jpg');

    // Clica na cor "Preto" dentro do modal de checkout
    const pretoBtns = screen.getAllByRole('button', { name: /Preto/i });
    const modalPretoBtn = pretoBtns[pretoBtns.length - 1];
    await user.click(modalPretoBtn);

    // A imagem do modal atualiza para a foto correspondente à cor Preto
    const updatedModalImg = screen.getByAltText('Sweat Universitária - Preto');
    expect(updatedModalImg).toHaveAttribute('src', '/assets/sweat_preto.jpg');

    // Clica no botão Guia de Tamanhos dentro do modal
    const guideBtns = screen.getAllByRole('button', { name: /Guia de Tamanhos/i });
    await user.click(guideBtns[guideBtns.length - 1]);

    // O modal de guia de tamanhos abre e apresenta a nova coluna D (Ombro ao Punho)
    expect(screen.getByText(/Guia de Tamanhos \(cm\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Comprimento do ombro ao punho/i)).toBeInTheDocument();
    expect(screen.getAllByText('Sweat Universitária').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('(Médio Confortável)')).toBeInTheDocument();
    expect(screen.getByText('56 cm')).toBeInTheDocument();
    expect(screen.getByText('76 cm')).toBeInTheDocument(); // Medida D para o tamanho M
  });
});
