import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Tag, AlertCircle, Loader2 } from 'lucide-react';
import {
  ShopOrder,
  ShopSummaryStats,
  OrderStatus,
  SweatSize,
  DeliveryType,
  AdminCreateOrderPayload,
  ShopCampaign,
  ProductFormData,
  AdminProductPayload,
  sortSweatSizes,
  DEFAULT_SIZE_GUIDE,
} from '../../types/shop';
import {
  fetchAdminShopOrders,
  fetchAdminShopStats,
  updateAdminOrderStatus,
  updateMultipleAdminOrderStatus,
  resendOrderEmail,
  fetchShopCampaign,
  createAdminManualOrder,
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from '../../services/shopService';
import { getPortugalDistricts, getCountiesForDistrict } from '../../constants/portugalDistricts';
import { ShopTestModeBanner } from './shop/ShopTestModeBanner';
import { ShopStatsCards } from './shop/ShopStatsCards';
import { ShopOrdersTable } from './shop/ShopOrdersTable';
import { ShopProductCatalog } from './shop/ShopProductCatalog';
import { ShopProductModal } from './shop/ShopProductModal';
import { ShopManualOrderModal } from './shop/ShopManualOrderModal';

interface AdminShopPanelProps {
  token: string;
  showFeedback: (id: string, message: string) => void;
}

export const AdminShopPanel: React.FC<AdminShopPanelProps> = ({ token, showFeedback }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [products, setProducts] = useState<ShopCampaign[]>([]);
  const [stats, setStats] = useState<ShopSummaryStats | null>(null);
  const [showTestShop, setShowTestShop] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gestão de Produtos (Modal / Formulário)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopCampaign | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  const defaultProductForm: ProductFormData = {
    title: '',
    description: '',
    item_name: '',
    item_price: 25.0,
    shipping_fee: 3.5,
    image_url: '',
    deadline_date: '',
    is_active: true,
    allow_pickup: true,
    allow_shipping: true,
    pickup_location: 'Gabinete do NEEI (Sala 0.18, Edifício 1, Campus de Gambelas)',
    sizes_available: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
    colors_available: ['Preto'],
    color_images: {},
    size_guide: { ...DEFAULT_SIZE_GUIDE },
    features: [
      '80% Algodão cardado / 20% Poliéster (320g/m²)',
      'Bordado de alta definição NEEI · Engenharia Informática',
      'Edição Oficial Limitada 2026',
    ],
    category: 'Vestuário',
    is_bundle: false,
    bundle_items: [],
    display_order: 0,
    priority: 0,
  };
  const [productForm, setProductForm] = useState<ProductFormData>(defaultProductForm);

  // Seleção Múltipla / Bulk Actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>('confirmed');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'admin' | 'web'>('all');

  // Modal de Criação Manual de Encomenda
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const initialManualForm = {
    campaign_id: '',
    item_name: 'Sweat Oficial Engenharia Informática',
    student_name: '',
    student_email: '',
    phone_number: '',
    nif: '',
    size: 'M' as SweatSize,
    color: 'Preto',
    delivery_type: 'pickup' as DeliveryType,
    shipping_address: '',
    shipping_postal_code: '',
    shipping_district: 'Faro',
    shipping_county: 'Faro',
    item_price: 20,
    shipping_fee: 4.5,
    payment_status: 'paid' as 'paid' | 'pending',
    order_status: 'confirmed' as OrderStatus,
    send_email: true,
    admin_notes: '',
  };

  const [manualForm, setManualForm] = useState(initialManualForm);

  const districtsList = useMemo(() => getPortugalDistricts(), []);
  const manualCounties = useMemo(
    () => getCountiesForDistrict(manualForm.shipping_district),
    [manualForm.shipping_district]
  );

  // Estados de ação
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersData, statsData, campaignData, productsData] = await Promise.all([
        fetchAdminShopOrders(token),
        fetchAdminShopStats(token),
        fetchShopCampaign({ adminPreview: false }).catch(() => null),
        fetchAdminProducts(token).catch(() => ({ products: [] })),
      ]);
      setOrders(ordersData.orders || []);
      setStats(statsData);
      const prods = productsData.products || [];
      setProducts(sortProductsByPriority(prods));

      if (campaignData) {
        if (campaignData.showTestShop !== undefined) {
          setShowTestShop(Boolean(campaignData.showTestShop));
        }
        if (campaignData.item_price) {
          setManualForm((prev) => ({
            ...prev,
            campaign_id: prev.campaign_id || campaignData.campaign?.id || (prods[0]?.id ?? ''),
            item_name:
              prev.item_name ||
              campaignData.campaign?.item_name ||
              (prods[0]?.item_name ?? 'Sweat Oficial Engenharia Informática'),
            item_price: campaignData.item_price,
            shipping_fee: campaignData.shipping_fee || 4.5,
          }));
        }
      } else if (prods.length > 0) {
        const first = prods[0];
        setManualForm((prev) => ({
          ...prev,
          campaign_id: prev.campaign_id || first.id,
          item_name: prev.item_name || first.item_name,
          item_price: prev.item_price || first.item_price,
          shipping_fee: prev.shipping_fee || first.shipping_fee,
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar dados da loja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const previewUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/merch?admin_preview=1&token=${encodeURIComponent(token)}`
      : `/merch?admin_preview=1`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(previewUrl);
    setCopiedLink(true);
    showFeedback('copy-preview-link', 'Link de teste copiado para a área de transferência!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Encomendas filtradas
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesPayment = paymentFilter === 'all' || o.payment_status === paymentFilter;
      const matchesStatus = orderStatusFilter === 'all' || o.order_status === orderStatusFilter;
      const matchesSize = sizeFilter === 'all' || o.size === sizeFilter;
      const matchesDelivery = deliveryFilter === 'all' || o.delivery_type === deliveryFilter;
      const matchesOrigin =
        originFilter === 'all' ||
        (originFilter === 'admin' ? Boolean(o.is_admin_created) : !o.is_admin_created);

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.student_name.toLowerCase().includes(q) ||
        o.student_email.toLowerCase().includes(q) ||
        o.phone_number.includes(q) ||
        o.id.toLowerCase().includes(q) ||
        Boolean(o.item_name && o.item_name.toLowerCase().includes(q)) ||
        Boolean(o.nif && o.nif.includes(q)) ||
        Boolean(o.admin_notes && o.admin_notes.toLowerCase().includes(q));

      return (
        matchesPayment &&
        matchesStatus &&
        matchesSize &&
        matchesDelivery &&
        matchesOrigin &&
        matchesSearch
      );
    });
  }, [orders, search, paymentFilter, orderStatusFilter, sizeFilter, deliveryFilter, originFilter]);

  // Alterar estado operacional da encomenda
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await updateAdminOrderStatus(token, orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o))
      );
      showFeedback(orderId, 'Estado operacional da encomenda atualizado!');
    } catch (err: any) {
      alert(err.message || 'Falha ao atualizar estado da encomenda.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Reenviar email de confirmação
  const handleResendEmail = async (orderId: string) => {
    try {
      setResendingEmailId(orderId);
      const res = await resendOrderEmail(token, orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, email_sent: true } : o)));
      showFeedback(orderId, res.message || 'Email de confirmação reenviado!');
    } catch (err: any) {
      alert(err.message || 'Falha ao reenviar email.');
    } finally {
      setResendingEmailId(null);
    }
  };

  // Descarregar CSV para a fábrica
  const handleDownloadCsv = () => {
    const url = `/api/admin/shop/export-factory`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao gerar CSV');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `encomendas_sweats_fabrica_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showFeedback('csv-exported', 'Ficheiro CSV descarregado com sucesso!');
      })
      .catch((err) => {
        alert(err.message || 'Erro ao descarregar ficheiro CSV.');
      });
  };

  // Seleção e Alteração em Lote
  const allFilteredSelected =
    filteredOrders.length > 0 && filteredOrders.every((o) => selectedOrderIds.includes(o.id));

  const someFilteredSelected =
    filteredOrders.some((o) => selectedOrderIds.includes(o.id)) && !allFilteredSelected;

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredOrders.map((o) => o.id));
      setSelectedOrderIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const newSelected = new Set(selectedOrderIds);
      filteredOrders.forEach((o) => newSelected.add(o.id));
      setSelectedOrderIds(Array.from(newSelected));
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedOrderIds.length === 0) return;
    try {
      setIsBulkUpdating(true);
      await updateMultipleAdminOrderStatus(token, selectedOrderIds, bulkStatus);
      setOrders((prev) =>
        prev.map((o) => (selectedOrderIds.includes(o.id) ? { ...o, order_status: bulkStatus } : o))
      );
      showFeedback(
        'bulk-update-success',
        `${selectedOrderIds.length} encomenda(s) atualizada(s) com sucesso!`
      );
      setSelectedOrderIds([]);
    } catch (err: any) {
      alert(err.message || 'Falha ao atualizar encomendas em lote.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const getOrderStatusSelectClasses = (status: OrderStatus) => {
    switch (status) {
      case 'test':
        return 'border-purple-300 dark:border-purple-600/60 bg-purple-100/90 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-bold focus:ring-purple-500';
      case 'confirmed':
        return 'border-cyan-300 dark:border-cyan-800/60 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-900 dark:text-cyan-200 font-semibold focus:ring-cyan-500';
      case 'in_production':
        return 'border-indigo-300 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold focus:ring-indigo-500';
      case 'ready_for_pickup':
        return 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold focus:ring-emerald-500';
      case 'shipped':
        return 'border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-semibold focus:ring-amber-500';
      case 'delivered':
        return 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-semibold focus:ring-slate-500';
      case 'pending_payment':
        return 'border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-medium focus:ring-amber-500';
      default:
        return 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';
    }
  };

  // Handlers para criação manual de encomendas
  const handleManualNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '');
    setManualForm((prev) => ({ ...prev, student_name: clean }));
  };

  const handleManualPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
    setManualForm((prev) => ({ ...prev, phone_number: digits }));
  };

  const handleManualNifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
    setManualForm((prev) => ({ ...prev, nif: digits }));
  };

  const handleManualPostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 7);
    if (digits.length <= 4) {
      setManualForm((prev) => ({ ...prev, shipping_postal_code: digits }));
    } else {
      setManualForm((prev) => ({
        ...prev,
        shipping_postal_code: `${digits.slice(0, 4)}-${digits.slice(4)}`,
      }));
    }
  };

  const handleManualDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDist = e.target.value;
    const counties = getCountiesForDistrict(newDist);
    setManualForm((prev) => ({
      ...prev,
      shipping_district: newDist,
      shipping_county: counties.length > 0 ? counties[0] : '',
    }));
  };

  const handleCreateManualOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const name = manualForm.student_name.trim();
    if (!name || name.length < 3) {
      setCreateError('Por favor insere o nome completo do aluno (mínimo 3 caracteres).');
      return;
    }

    const email = manualForm.student_email.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCreateError('Por favor insere um endereço de email válido.');
      return;
    }

    const phone = manualForm.phone_number.replace(/\D/g, '');
    if (phone.length !== 9) {
      setCreateError('O telemóvel deve ter exatamente 9 dígitos portugueses.');
      return;
    }

    if (manualForm.delivery_type === 'shipping') {
      if (!manualForm.shipping_address.trim() || manualForm.shipping_address.trim().length < 5) {
        setCreateError('Por favor insere uma morada de envio completa.');
        return;
      }
      if (!/^\d{4}-\d{3}$/.test(manualForm.shipping_postal_code.trim())) {
        setCreateError('O código postal deve ter o formato 0000-000.');
        return;
      }
    }

    setCreatingOrder(true);
    try {
      const fullLocality =
        manualForm.delivery_type === 'shipping'
          ? `${manualForm.shipping_county}, ${manualForm.shipping_district}`
          : undefined;

      const payload: AdminCreateOrderPayload = {
        campaign_id: manualForm.campaign_id || undefined,
        item_name: manualForm.item_name || undefined,
        student_name: name,
        student_email: email,
        phone_number: phone,
        nif: manualForm.nif.trim() || undefined,
        size: manualForm.size,
        color: manualForm.color || 'Preto',
        delivery_type: manualForm.delivery_type,
        shipping_address:
          manualForm.delivery_type === 'shipping' ? manualForm.shipping_address.trim() : undefined,
        shipping_postal_code:
          manualForm.delivery_type === 'shipping'
            ? manualForm.shipping_postal_code.trim()
            : undefined,
        shipping_city: fullLocality,
        item_price: Number(manualForm.item_price) || 20,
        shipping_fee:
          manualForm.delivery_type === 'shipping' ? Number(manualForm.shipping_fee) || 4.5 : 0,
        payment_status: manualForm.payment_status,
        order_status: manualForm.order_status,
        send_email: manualForm.send_email,
        admin_notes: manualForm.admin_notes.trim() || undefined,
      };

      const res = await createAdminManualOrder(token, payload);
      if (res?.order) {
        setOrders((prev) => [res.order, ...prev]);
      }
      showFeedback(
        'manual-order-created',
        `Encomenda ${res.order?.id || ''} registada com sucesso!`
      );
      setIsCreateModalOpen(false);
      setManualForm(initialManualForm);
      fetchAdminShopStats(token)
        .then((st) => setStats(st))
        .catch(() => {});
    } catch (err: any) {
      setCreateError(err.message || 'Falha ao criar encomenda manual.');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductError(null);
    setProductForm({
      ...defaultProductForm,
      deadline_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      colors_available: ['Preto'],
      color_images: {},
      size_guide: { ...DEFAULT_SIZE_GUIDE },
      is_bundle: false,
      bundle_items: [],
      display_order: 0,
      priority: 0,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: ShopCampaign) => {
    const isBundle = Boolean(prod.is_bundle);
    setProductForm({
      title: prod.title || '',
      description: prod.description || '',
      item_name: prod.item_name || '',
      item_price: prod.item_price || 0,
      shipping_fee: prod.shipping_fee || 0,
      image_url: prod.raw_image_url || prod.image_url || '',
      deadline_date: prod.deadline_date || '',
      is_active: Boolean(prod.is_active),
      allow_pickup: Boolean(prod.allow_pickup),
      allow_shipping: Boolean(prod.allow_shipping),
      pickup_location: prod.pickup_location || '',
      sizes_available: sortSweatSizes(prod.sizes_available),
      colors_available:
        prod.colors_available && prod.colors_available.length > 0
          ? [...prod.colors_available]
          : ['Preto'],
      color_images: prod.color_images ? { ...prod.color_images } : {},
      size_guide: prod.size_guide ? { ...prod.size_guide } : { ...DEFAULT_SIZE_GUIDE },
      category: prod.category || (isBundle ? 'Pack' : 'Vestuário'),
      is_bundle: isBundle,
      bundle_items: prod.bundle_items ? [...prod.bundle_items] : [],
      display_order: prod.display_order ?? prod.priority ?? 0,
      priority: prod.display_order ?? prod.priority ?? 0,
      features:
        prod.features && prod.features.length > 0
          ? [...prod.features]
          : [
              `Artigo: ${prod.item_name}`,
              '80% Algodão cardado / 20% Poliéster (320g/m²)',
              'Bordado de alta definição NEEI · Engenharia Informática',
            ],
    });
    setIsProductModalOpen(true);
  };

  const handleToggleProductActive = async (prod: ShopCampaign) => {
    try {
      const newStatus = !prod.is_active;
      await updateAdminProduct(token, prod.id, { is_active: newStatus });
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, is_active: newStatus } : p))
      );
      showFeedback(
        prod.id,
        newStatus
          ? 'Produto ativado na loja pública!'
          : 'Produto desativado/ocultado na loja pública!'
      );
    } catch (err: any) {
      alert(err.message || 'Falha ao alterar estado do produto');
    }
  };

  const sortProductsByPriority = (prods: ShopCampaign[]) => {
    return [...prods].sort((a, b) => {
      const prioA =
        a.display_order && a.display_order > 0
          ? a.display_order
          : a.priority && a.priority > 0
            ? a.priority
            : 999999;
      const prioB =
        b.display_order && b.display_order > 0
          ? b.display_order
          : b.priority && b.priority > 0
            ? b.priority
            : 999999;
      if (prioA !== prioB) return prioA - prioB;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  };

  const handleUpdateProductPriority = async (prod: ShopCampaign, newPriority: number) => {
    try {
      const priorityVal = Math.max(0, newPriority);
      await updateAdminProduct(token, prod.id, {
        display_order: priorityVal,
        priority: priorityVal,
      });
      setProducts((prev) =>
        sortProductsByPriority(
          prev.map((p) =>
            p.id === prod.id ? { ...p, display_order: priorityVal, priority: priorityVal } : p
          )
        )
      );
      showFeedback(
        prod.id,
        `Prioridade atualizada para #${priorityVal > 0 ? priorityVal : 'Padrão'}`
      );
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar prioridade');
    }
  };

  const handleDeleteProduct = async (prod: ShopCampaign) => {
    if (!window.confirm(`Tens a certeza de que desejas eliminar o produto "${prod.title}"?`)) {
      return;
    }
    try {
      await deleteAdminProduct(token, prod.id);
      setProducts((prev) => prev.filter((p) => p.id !== prod.id));
      showFeedback('product-deleted', 'Produto eliminado com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao eliminar produto');
    }
  };

  const handleToggleSize = (sz: SweatSize) => {
    setProductForm((prev) => {
      const exists = prev.sizes_available.includes(sz);
      const next = exists
        ? prev.sizes_available.filter((s) => s !== sz)
        : [...prev.sizes_available, sz];
      return { ...prev, sizes_available: sortSweatSizes(next) };
    });
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError(null);

    const title = productForm.title.trim();
    if (!title || title.length < 2) {
      setProductError('Por favor insere o título do produto.');
      return;
    }
    const itemName = productForm.item_name.trim();
    if (!itemName || itemName.length < 2) {
      setProductError('Por favor insere o nome da peça/artigo nas encomendas.');
      return;
    }
    if (productForm.item_price < 0) {
      setProductError('O preço deve ser igual ou superior a 0.');
      return;
    }

    const isBundle = Boolean(productForm.is_bundle);
    if (isBundle && (!productForm.bundle_items || productForm.bundle_items.length < 2)) {
      setProductError('Um pack deve conter pelo menos 2 artigos selecionados.');
      return;
    }

    if (!isBundle && productForm.sizes_available.length === 0) {
      setProductError('Deves selecionar pelo menos um tamanho disponível.');
      return;
    }

    const isClothing =
      !isBundle && (productForm.category || 'Vestuário').trim().toLowerCase() === 'vestuário';
    if (
      isClothing &&
      (!productForm.colors_available || productForm.colors_available.length === 0)
    ) {
      setProductError('Deves selecionar pelo menos uma cor disponível para vestuário.');
      return;
    }

    const cleanedFeatures = productForm.features.map((f) => f.trim()).filter((f) => f.length > 0);

    const payload: AdminProductPayload = {
      ...productForm,
      title,
      item_name: itemName,
      is_bundle: isBundle,
      bundle_items: isBundle ? productForm.bundle_items : [],
      category: isBundle ? 'Pack' : productForm.category?.trim() || 'Vestuário',
      features: cleanedFeatures,
      colors_available: isClothing
        ? productForm.colors_available && productForm.colors_available.length > 0
          ? productForm.colors_available
          : ['Preto']
        : undefined,
      color_images: isClothing ? productForm.color_images || {} : undefined,
      size_guide: isClothing ? productForm.size_guide || DEFAULT_SIZE_GUIDE : undefined,
    };

    try {
      setSavingProduct(true);
      if (editingProduct) {
        const res = await updateAdminProduct(token, editingProduct.id, payload);
        setProducts((prev) =>
          sortProductsByPriority(prev.map((p) => (p.id === editingProduct.id ? res.product : p)))
        );
        showFeedback(editingProduct.id, 'Produto e características atualizados com sucesso!');
      } else {
        const res = await createAdminProduct(token, payload);
        setProducts((prev) => sortProductsByPriority([res.product, ...prev]));
        showFeedback('product-created', 'Novo produto adicionado à loja com sucesso!');
      }
      setIsProductModalOpen(false);
    } catch (err: any) {
      setProductError(err.message || 'Erro ao guardar produto.');
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Secção de Modo de Teste da Loja (Checkout Real a 0.50€) */}
      <ShopTestModeBanner
        showTestShop={showTestShop}
        previewUrl={previewUrl}
        copiedLink={copiedLink}
        handleCopyLink={handleCopyLink}
        showQrCode={showQrCode}
        setShowQrCode={setShowQrCode}
      />

      {/* Abas de Navegação: Encomendas vs Gerir Produtos */}
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShoppingBag size={16} />
          <span>Encomendas & Produção</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-mono">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Tag size={16} />
          <span>Gerir Produtos no Catálogo</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-mono">
            {products.length}
          </span>
        </button>
      </div>

      {/* Alerta de Erro Geral */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Inicial */}
      {loading && !orders.length && !products.length ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-cyan-500" />
          <p className="text-sm">A carregar dados da loja e catálogo...</p>
        </div>
      ) : activeTab === 'orders' ? (
        /* Vista de Encomendas & Produção */
        <div className="space-y-6 animate-in fade-in duration-200">
          <ShopStatsCards
            stats={stats}
            onDownloadCsv={handleDownloadCsv}
            showSizeBreakdown={true}
          />

          <ShopOrdersTable
            orders={orders}
            filteredOrders={filteredOrders}
            selectedOrderIds={selectedOrderIds}
            allFilteredSelected={allFilteredSelected}
            someFilteredSelected={someFilteredSelected}
            bulkStatus={bulkStatus}
            isBulkUpdating={isBulkUpdating}
            search={search}
            originFilter={originFilter}
            paymentFilter={paymentFilter}
            orderStatusFilter={orderStatusFilter}
            sizeFilter={sizeFilter}
            deliveryFilter={deliveryFilter}
            loading={loading}
            updatingOrderId={updatingOrderId}
            resendingEmailId={resendingEmailId}
            setSearch={setSearch}
            setOriginFilter={setOriginFilter}
            setPaymentFilter={setPaymentFilter}
            setOrderStatusFilter={setOrderStatusFilter}
            setSizeFilter={setSizeFilter}
            setDeliveryFilter={setDeliveryFilter}
            setBulkStatus={setBulkStatus}
            onToggleSelectOrder={handleToggleSelectOrder}
            onToggleSelectAll={handleToggleSelectAll}
            onBulkStatusChange={handleBulkStatusChange}
            onStatusChange={handleStatusChange}
            onResendEmail={handleResendEmail}
            onOpenCreateManualOrder={() => {
              setCreateError(null);
              setIsCreateModalOpen(true);
            }}
            onRefresh={loadData}
            getOrderStatusSelectClasses={getOrderStatusSelectClasses}
          />
        </div>
      ) : (
        /* Vista de Gestão de Produtos */
        <div className="space-y-6 animate-in fade-in duration-200">
          <ShopStatsCards stats={stats} showSizeBreakdown={false} />

          <ShopProductCatalog
            products={products}
            onOpenCreate={handleOpenCreateProduct}
            onOpenEdit={handleOpenEditProduct}
            onToggleActive={handleToggleProductActive}
            onDelete={handleDeleteProduct}
            onUpdatePriority={handleUpdateProductPriority}
          />
        </div>
      )}

      {/* Modal para Adicionar Encomenda Manual */}
      <ShopManualOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        manualForm={manualForm}
        setManualForm={setManualForm}
        products={products}
        districtsList={districtsList}
        manualCounties={manualCounties}
        creatingOrder={creatingOrder}
        createError={createError}
        onSubmit={handleCreateManualOrderSubmit}
        onNameChange={handleManualNameChange}
        onPhoneChange={handleManualPhoneChange}
        onNifChange={handleManualNifChange}
        onPostalCodeChange={handleManualPostalCodeChange}
        onDistrictChange={handleManualDistrictChange}
      />

      {/* Modal para Criar / Editar Produto (com Features Editor) */}
      <ShopProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        editingProduct={editingProduct}
        productForm={productForm}
        setProductForm={setProductForm}
        handleToggleSize={handleToggleSize}
        onSubmit={handleSaveProductSubmit}
        savingProduct={savingProduct}
        productError={productError}
        availableProducts={products}
      />
    </div>
  );
};

export default AdminShopPanel;
