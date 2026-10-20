import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShopProductModal } from '../components/admin/shop/ShopProductModal';
import { ShopProductCatalog } from '../components/admin/shop/ShopProductCatalog';
import { ShopCampaign, ProductFormData } from '../types/shop';

describe('Merch Priority and Image Fit Feature', () => {
  const mockProductForm: ProductFormData = {
    title: 'Sweat Engenharia Informática 2026',
    description: 'Edição oficial',
    item_name: 'Sweat Oficial',
    item_price: 25,
    shipping_fee: 3.5,
    image_url: '/assets/merch/hoodie_LEI_navy.png',
    deadline_date: '2026-10-31',
    is_active: true,
    allow_pickup: true,
    allow_shipping: true,
    pickup_location: 'Gabinete NEEI',
    sizes_available: ['S', 'M', 'L'],
    colors_available: ['Azul Marinho', 'Cinzento'],
    color_images: {
      'Azul Marinho': '/assets/merch/hoodie_LEI_navy.png',
    },
    features: ['80% Algodão'],
    category: 'Vestuário',
    is_bundle: false,
    bundle_items: [],
    display_order: 1,
    priority: 1,
  };

  const sampleProducts: ShopCampaign[] = [
    {
      id: 'prod-hoodie',
      title: 'Hoodie Oficial LEI',
      description: 'Hoodie clássico',
      item_name: 'Hoodie Oficial',
      item_price: 28,
      shipping_fee: 3.5,
      image_url: '/assets/merch/hoodie_LEI_navy.png',
      deadline_date: '2026-10-31',
      is_active: true,
      allow_pickup: true,
      allow_shipping: true,
      pickup_location: 'Gabinete NEEI',
      sizes_available: ['M', 'L'],
      colors_available: ['Azul Marinho'],
      display_order: 1,
      priority: 1,
      category: 'Vestuário',
    },
    {
      id: 'prod-tshirt',
      title: 'T-Shirt Oficial LEI',
      description: 'T-Shirt respirável',
      item_name: 'T-Shirt Oficial',
      item_price: 12,
      shipping_fee: 2.5,
      image_url: '/assets/merch/tshirt_LEI_navy.jpeg',
      deadline_date: '2026-10-31',
      is_active: true,
      allow_pickup: true,
      allow_shipping: true,
      pickup_location: 'Gabinete NEEI',
      sizes_available: ['S', 'M', 'L'],
      colors_available: ['Azul Marinho'],
      display_order: 2,
      priority: 2,
      category: 'Vestuário',
    },
  ];

  it('ShopProductModal - exibe campo de prioridade e imagem em formato integral sem cortes', () => {
    const setProductForm = vi.fn();
    render(
      <ShopProductModal
        isOpen={true}
        onClose={vi.fn()}
        editingProduct={null}
        productForm={mockProductForm}
        setProductForm={setProductForm}
        handleToggleSize={vi.fn()}
        onSubmit={vi.fn()}
        savingProduct={false}
        productError={null}
      />
    );

    // Verifica campo de prioridade
    expect(screen.getByText(/Posição \/ Prioridade na Loja Merch/i)).toBeInTheDocument();
    const priorityInput = screen.getByDisplayValue('1');
    expect(priorityInput).toBeInTheDocument();

    // Altera prioridade
    fireEvent.change(priorityInput, { target: { value: '3' } });
    expect(setProductForm).toHaveBeenCalled();

    // Verifica imagem de pré-visualização no modal
    const previewImg = screen.getByAltText(/Preview do Artigo/i);
    expect(previewImg).toBeInTheDocument();
    expect(previewImg).toHaveClass('object-contain');
  });

  it('ShopProductCatalog - exibe badges de prioridade, botões de ajuste e imagem com object-contain', () => {
    const onUpdatePriority = vi.fn();
    render(
      <ShopProductCatalog
        products={sampleProducts}
        onOpenCreate={vi.fn()}
        onOpenEdit={vi.fn()}
        onToggleActive={vi.fn()}
        onDelete={vi.fn()}
        onUpdatePriority={onUpdatePriority}
      />
    );

    // Badges de prioridade
    expect(screen.getByText('#1 na Loja')).toBeInTheDocument();
    expect(screen.getByText('#2 na Loja')).toBeInTheDocument();

    // Imagens usam object-contain para caber o produto completo sem cortes
    const hoodieImg = screen.getByAltText('Hoodie Oficial LEI');
    expect(hoodieImg).toHaveClass('object-contain');

    // Botão de aumentar prioridade
    const increaseBtns = screen.getAllByTitle(/Aumentar prioridade/i);
    expect(increaseBtns.length).toBeGreaterThan(0);
    fireEvent.click(increaseBtns[1]); // Segundo produto (prioridade 2 -> 1)
    expect(onUpdatePriority).toHaveBeenCalledWith(sampleProducts[1], 1);
  });
});
