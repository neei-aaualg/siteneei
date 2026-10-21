import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  GraduationCap,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Ruler,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  Info,
  ArrowRight,
  Loader2,
  X,
  Copy,
  Check,
  Lock,
  Package,
  PackageSearch,
  Layers,
  Tag,
  Filter,
  Instagram,
  ExternalLink,
  CreditCard,
  ChevronLeft,
  Shirt,
  Palette,
} from 'lucide-react';
import {
  ShopCampaign,
  SweatSize,
  DeliveryType,
  MerchProduct,
  sortSweatSizes,
  DEFAULT_SIZE_GUIDE,
  ORDERED_SWEAT_SIZES,
  getColorHex,
  BundleItemSelection,
} from '../types/shop';
import {
  fetchShopCampaign,
  submitCheckout,
  createPaymentIntent,
  fetchOrderStatus,
  simulatePayment,
  confirmPayment,
} from '../services/shopService';
import { getStoredAdminToken, setStoredAdminToken } from '../services/activitiesService';
import { StripePaymentWidget } from '../components/StripePaymentWidget';
import { OrderTrackerModal } from '../components/OrderTrackerModal';
import { Portal } from '../components/Portal';
import { getPortugalDistricts, getCountiesForDistrict } from '../constants/portugalDistricts';

export const Shop: React.FC = () => {
  const [campaign, setCampaign] = useState<ShopCampaign | null>(null);
  const [campaignsList, setCampaignsList] = useState<ShopCampaign[]>([]);
  const [selectedProductCampaign, setSelectedProductCampaign] = useState<ShopCampaign | null>(null);
  const [isSandbox, setIsSandbox] = useState(false);
  const [sweatsAvailable, setSweatsAvailable] = useState(true);
  const [isAdminPreview, setIsAdminPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Campanha ativa selecionada para checkout
  const activeCampaign = selectedProductCampaign || campaign;

  // Filtro de categoria no Merch
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Modal de Checkout / Encomenda
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Modal de Rastreio de Encomenda
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerInitialId, setTrackerInitialId] = useState('');

  // Seleções do comprador
  const [selectedSize, setSelectedSize] = useState<SweatSize>('M');
  const [selectedColor, setSelectedColor] = useState<string>('Preto');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');

  // Seleções específicas para artigos de um Pack: Record<campaign_id, { size: SweatSize | string; color?: string }>
  const [bundleSelections, setBundleSelections] = useState<
    Record<string, { size: SweatSize | string; color?: string }>
  >({});

  // Campanha alvo para o Guia de Medidas (permite abrir guia de peça específica de um pack)
  const [sizeGuideCampaign, setSizeGuideCampaign] = useState<ShopCampaign | null>(null);

  // Pré-visualização de cor selecionada por produto na grelha do catálogo
  const [previewColors, setPreviewColors] = useState<Record<string, string>>({});

  // Imagem dinâmica para o produto / cor no modal de checkout
  const activeModalImage = useMemo(() => {
    if (selectedColor && activeCampaign?.color_images?.[selectedColor]) {
      return activeCampaign.color_images[selectedColor];
    }
    return activeCampaign?.raw_image_url || activeCampaign?.image_url || '';
  }, [activeCampaign, selectedColor]);

  // Artigos resolvidos do Pack caso o artigo ativo seja um bundle
  const bundleResolvedItems = useMemo(() => {
    if (!activeCampaign?.is_bundle || !activeCampaign.bundle_items) return [];
    return activeCampaign.bundle_items.map((bi) => {
      const orig = campaignsList.find((c) => c.id === bi.campaign_id);
      return {
        campaign_id: bi.campaign_id,
        item_name: bi.item_name || orig?.item_name || orig?.title || 'Artigo',
        originalCampaign: orig || null,
        sizes_available: orig?.sizes_available?.length
          ? orig.sizes_available
          : ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
        colors_available: orig?.colors_available?.length ? orig.colors_available : ['Preto'],
        color_images: orig?.color_images || {},
        size_guide: orig?.size_guide || DEFAULT_SIZE_GUIDE,
        category: orig?.category || 'Vestuário',
        image_url: orig?.raw_image_url || orig?.image_url || '',
        item_price: orig?.item_price || 0,
      };
    });
  }, [activeCampaign, campaignsList]);

  // Poupança calculada do Pack comparando a soma dos preços individuais com o preço do pack
  const bundleSavingsInfo = useMemo(() => {
    if (!activeCampaign?.is_bundle || bundleResolvedItems.length < 2) return null;
    const sumIndividual = bundleResolvedItems.reduce((acc, item) => acc + item.item_price, 0);
    const bundlePrice = activeCampaign.item_price;
    if (sumIndividual > bundlePrice) {
      const savings = sumIndividual - bundlePrice;
      const percent = Math.round((savings / sumIndividual) * 100);
      return { sumIndividual, savings, percent };
    }
    return null;
  }, [activeCampaign, bundleResolvedItems]);

  // Cores disponíveis para o artigo ativo
  const isClothing = (activeCampaign?.category || 'Vestuário').toLowerCase() === 'vestuário';
  const activeColors = useMemo(() => {
    if (activeCampaign?.colors_available && activeCampaign.colors_available.length > 0) {
      return activeCampaign.colors_available;
    }
    return isClothing ? ['Preto'] : [];
  }, [activeCampaign?.colors_available, isClothing]);

  // Sincroniza cor selecionada caso o produto ativo mude
  useEffect(() => {
    if (activeColors.length > 0 && !activeColors.includes(selectedColor)) {
      setSelectedColor(activeColors[0]);
    }
  }, [activeColors, selectedColor]);

  // Modal Guia de Medidas
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Dados do Formulário
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingDistrict, setShippingDistrict] = useState('Faro');
  const [shippingCounty, setShippingCounty] = useState('Faro');

  // Detalhes da encomenda confirmada (para ecrã de sucesso garantindo precisão)
  const [confirmedOrderDetails, setConfirmedOrderDetails] = useState<{
    orderId?: string;
    itemName?: string;
    studentName?: string;
    studentEmail?: string;
    phoneNumber?: string;
    size?: string;
    color?: string;
    deliveryType?: DeliveryType;
    shippingAddress?: string;
    shippingPostalCode?: string;
    shippingCity?: string;
    totalAmount?: number;
    bundle_selections?: BundleItemSelection[];
  } | null>(null);

  const districtsList = useMemo(() => getPortugalDistricts(), []);
  const availableCounties = useMemo(
    () => getCountiesForDistrict(shippingDistrict),
    [shippingDistrict]
  );

  // Estados de Submissão e Pagamento
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [paymentTimeRemaining, setPaymentTimeRemaining] = useState(300); // 5 min
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'waiting_payment' | 'paid' | 'expired' | 'failed'
  >('idle');
  const [simulating, setSimulating] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  // Passo do checkout: 1 = formulário de dados, 2 = widget de pagamento
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);

  // Estado do Payment Element
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null);
  const [stripeTotalAmount, setStripeTotalAmount] = useState(0);
  const [stripePaymentFee, setStripePaymentFee] = useState(0);
  const [stripeIsSandbox, setStripeIsSandbox] = useState(false);

  // Atualiza o título da página
  useEffect(() => {
    document.title = 'Merch Oficial · NEEI AAUAlg';
  }, []);

  // Carrega dados da campanha da loja (com deteção de modo de teste admin)
  useEffect(() => {
    let mounted = true;
    const urlParams = new URLSearchParams(window.location.search);
    const isPreviewParam =
      urlParams.get('admin_preview') === '1' || urlParams.get('admin_preview') === 'true';
    const urlToken = urlParams.get('token');

    // Deteção de link direto de rastreio de encomenda (?track=SW-... ou ?order=SW-...)
    const trackParam = urlParams.get('track') || urlParams.get('rastreio') || urlParams.get('order');
    if (trackParam) {
      setTrackerInitialId(trackParam);
      setIsTrackerOpen(true);
    }

    if (urlToken) {
      setStoredAdminToken(urlToken);
    }
    const adminToken = urlToken || getStoredAdminToken();

    fetchShopCampaign({ adminPreview: isPreviewParam, token: adminToken })
      .then((data) => {
        if (mounted) {
          setCampaign(data.campaign);
          const allCampaigns =
            data.campaigns && data.campaigns.length > 0
              ? data.campaigns
              : data.campaign
                ? [data.campaign]
                : [];
          setCampaignsList(allCampaigns);
          const initialCamp = data.campaign || allCampaigns[0] || null;
          setSelectedProductCampaign(initialCamp);
          setIsSandbox(data.isSandbox ?? false);
          setSweatsAvailable(data.sweatsAvailable ?? true);
          setIsAdminPreview(Boolean(data.isAdminPreview));

          if (initialCamp?.sizes_available?.length) {
            const sorted = sortSweatSizes(initialCamp.sizes_available);
            if (!sorted.includes('M')) {
              setSelectedSize(sorted[0]);
            }
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Erro ao contactar o servidor.');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Detecta redirecionamento após pagamento Stripe (return_url com ?payment_intent_done=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const done = params.get('payment_intent_done');
    const orderId = params.get('orderId');
    const paymentIntentId = params.get('payment_intent');
    if (done === '1' && orderId) {
      setActiveOrderId(orderId);
      setPaymentStatus('paid');

      // 1. Tenta recuperar do sessionStorage
      try {
        const cached = sessionStorage.getItem('neei_last_order');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.orderId === orderId) {
            setConfirmedOrderDetails(parsed);
          }
        }
      } catch (_) {
        // Ignora erro de parse de cache de sessão
      }

      // 2. Confirma e regista a encomenda na BD caso o webhook ainda não tenha chegado
      confirmPayment({
        orderId,
        paymentIntentId: paymentIntentId || undefined,
      })
        .then((res) => {
          if (res?.order) {
            setConfirmedOrderDetails({
              orderId: res.order.id,
              itemName: res.order.item_name,
              studentName: res.order.student_name,
              studentEmail: res.order.student_email,
              phoneNumber: res.order.phone_number,
              size: res.order.size,
              color: res.order.color,
              deliveryType: res.order.delivery_type,
              shippingAddress: res.order.shipping_address || undefined,
              shippingPostalCode: res.order.shipping_postal_code || undefined,
              shippingCity: res.order.shipping_city || undefined,
              totalAmount: res.order.total_amount,
            });
          }
        })
        .catch(() => {
          // Fallback adicional via fetchOrderStatus
          fetchOrderStatus(orderId)
            .then((st) => {
              setConfirmedOrderDetails((prev) => ({
                orderId: st.orderId,
                itemName: st.itemName || prev?.itemName,
                studentName: st.studentName || prev?.studentName,
                studentEmail: prev?.studentEmail,
                phoneNumber: prev?.phoneNumber,
                size: st.size || prev?.size,
                color: st.color || prev?.color,
                deliveryType: st.deliveryType || prev?.deliveryType,
                shippingCity: st.shippingCity || prev?.shippingCity,
                totalAmount: st.totalAmount || prev?.totalAmount,
              }));
            })
            .catch(() => { });
        });

      // Limpa os parâmetros da URL sem recarregar
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      // Lança confettis
      try {
        confetti({
          particleCount: 140,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b'],
        });
      } catch (_) {
        // ignore
      }
    }
  }, []);

  // Lista de produtos suportados no catálogo de Merch
  const products: MerchProduct[] = useMemo(() => {
    const list = campaignsList.length > 0 ? campaignsList : campaign ? [campaign] : [];
    if (list.length === 0) return [];

    const isAvailableToBuy = sweatsAvailable || isAdminPreview;
    const sortedList = [...list].sort((a, b) => {
      const prioA = (a.display_order && a.display_order > 0) ? a.display_order : ((a.priority && a.priority > 0) ? a.priority : 999999);
      const prioB = (b.display_order && b.display_order > 0) ? b.display_order : ((b.priority && b.priority > 0) ? b.priority : 999999);
      if (prioA !== prioB) return prioA - prioB;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return sortedList.map((c) => ({
      id: c.id,
      name: c.title || c.item_name || 'Sweat Oficial Engenharia Informática',
      category: c.category || 'Vestuário',
      price: c.item_price,
      imageUrl: isAvailableToBuy ? (c.image_url || '') : '',
      badge: isAvailableToBuy
        ? isAdminPreview
          ? 'Modo Teste (0.50€)'
          : 'Já Disponível'
        : 'Brevemente',
      description:
        c.description || 'Artigo oficial do Núcleo de Estudantes de Engenharia Informática da UAlg.',
      features:
        c.features && c.features.length > 0
          ? c.features
          : [
            `Artigo: ${c.item_name}`,
            '80% Algodão cardado / 20% Poliéster (320g/m²)',
            'Bordado de alta definição NEEI · Engenharia Informática',
            c.allow_shipping
              ? 'Recolha no Campus de Gambelas ou Envio CTT'
              : 'Recolha no Campus de Gambelas',
          ],
      available: isAvailableToBuy && Boolean(c.is_active),
      isPreorder: true,
      sizes: c.sizes_available || ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
      colors: c.colors_available || ['Preto'],
      colorImages: c.color_images || {},
      sizeGuide: c.size_guide,
      allowShipping: c.allow_shipping,
      shippingFee: c.shipping_fee,
      pickupLocation: c.pickup_location,
      displayOrder: c.display_order ?? c.priority ?? 0,
      priority: c.display_order ?? c.priority ?? 0,
      campaignData: c,
    }));
  }, [campaignsList, campaign, sweatsAvailable, isAdminPreview]);

  // Categorias disponíveis no catálogo com contagem
  const availableCategories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.category || 'Vestuário';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [products]);

  // Produtos filtrados por categoria
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(
      (p) => (p.category || 'Vestuário').toLowerCase() === activeCategory.toLowerCase()
    );
  }, [products, activeCategory]);

  // Cálculo de dias restantes até ao fim da campanha
  const daysLeft = useMemo(() => {
    if (!activeCampaign?.deadline_date) return null;
    const deadline = new Date(activeCampaign.deadline_date);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [activeCampaign?.deadline_date]);

  // Cálculo do subtotal, taxa de pagamento (0,25€ + 1,5%) e total final da encomenda
  const subtotalPrice = useMemo(() => {
    if (!activeCampaign) return 0;
    const shipping = deliveryType === 'shipping' ? activeCampaign.shipping_fee : 0;
    return Number((activeCampaign.item_price + shipping).toFixed(2));
  }, [activeCampaign, deliveryType]);

  const paymentFee = useMemo(() => {
    if (!subtotalPrice || subtotalPrice <= 0) return 0;
    return Math.round((0.25 + subtotalPrice * 0.015) * 100) / 100;
  }, [subtotalPrice]);

  const totalPrice = useMemo(() => {
    return Number((subtotalPrice + paymentFee).toFixed(2));
  }, [subtotalPrice, paymentFee]);

  // Polling de estado de pagamento quando activeOrderId está à espera
  useEffect(() => {
    if (!activeOrderId || paymentStatus !== 'waiting_payment') return;

    // Timer decrescente de 5 minutos
    const timer = setInterval(() => {
      setPaymentTimeRemaining((prev) => {
        if (prev <= 1) {
          setPaymentStatus('expired');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Polling ao backend a cada 2.5 segundos
    const pollInterval = setInterval(async () => {
      try {
        const status = await fetchOrderStatus(activeOrderId);
        if (status.paymentStatus === 'paid') {
          setPaymentStatus('paid');
          clearInterval(timer);
          clearInterval(pollInterval);
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b'],
            });
          } catch (e) {
            // ignore
          }
        } else if (status.paymentStatus === 'failed' || status.paymentStatus === 'expired') {
          setPaymentStatus(status.paymentStatus);
          clearInterval(timer);
          clearInterval(pollInterval);
        }
      } catch (err) {
        // silencioso no polling
      }
    }, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, [activeOrderId, paymentStatus]);

  // Validações e manipulações de inputs estritas (apenas caracteres válidos)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '');
    setStudentName(clean);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
    setPhoneNumber(digits);
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 7);
    if (digits.length <= 4) {
      setShippingPostalCode(digits);
    } else {
      setShippingPostalCode(`${digits.slice(0, 4)}-${digits.slice(4)}`);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value;
    setShippingDistrict(newDistrict);
    const counties = getCountiesForDistrict(newDistrict);
    if (counties.length > 0) {
      setShippingCounty(counties[0]);
    }
  };

  // Passo 1 — Submissão do formulário de dados e criação do PaymentIntent
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!sweatsAvailable && !isAdminPreview) {
      setFormError('As encomendas das sweats encontram-se temporariamente encerradas.');
      return;
    }

    // Validações rigorosas
    const trimmedName = studentName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setFormError('Por favor insere o teu nome completo (mínimo 3 caracteres).');
      return;
    }

    const trimmedEmail = studentEmail.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Por favor insere um endereço de email válido para receberes a confirmação.');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 9 || !cleanPhone.startsWith('9')) {
      setFormError(
        'Número de telemóvel inválido. Deve ter exatamente 9 dígitos portugueses a começar por 9.'
      );
      return;
    }

    if (deliveryType === 'shipping') {
      if (!shippingAddress.trim() || shippingAddress.trim().length < 5) {
        setFormError('Por favor insere uma morada de envio completa (rua, número, andar, etc.).');
        return;
      }
      if (!/^\d{4}-\d{3}$/.test(shippingPostalCode.trim())) {
        setFormError('Código postal inválido. Deve estar no formato 0000-000 (ex: 8000-000).');
        return;
      }
      if (!shippingDistrict || !shippingCounty) {
        setFormError('Por favor seleciona o distrito e concelho de envio.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const adminToken = getStoredAdminToken();
      const fullLocality =
        deliveryType === 'shipping' ? `${shippingCounty}, ${shippingDistrict}` : undefined;

      const bundleSelectionsPayload = activeCampaign?.is_bundle
        ? bundleResolvedItems.map((item) => {
          const sel = bundleSelections[item.campaign_id];
          return {
            campaign_id: item.campaign_id,
            item_name: item.item_name,
            size: sel?.size || item.sizes_available[0] || 'M',
            color: sel?.color || item.colors_available[0] || 'Preto',
          };
        })
        : undefined;

      // Cria a encomenda + PaymentIntent no backend (retorna clientSecret)
      const res = await createPaymentIntent({
        campaign_id: activeCampaign?.id,
        item_name: activeCampaign?.item_name,
        student_name: trimmedName,
        student_email: trimmedEmail,
        phone_number: cleanPhone,
        size: selectedSize,
        color: selectedColor,
        delivery_type: deliveryType,
        shipping_address: deliveryType === 'shipping' ? shippingAddress.trim() : undefined,
        shipping_postal_code: deliveryType === 'shipping' ? shippingPostalCode.trim() : undefined,
        shipping_city: fullLocality,
        adminPreview: isAdminPreview,
        adminToken: isAdminPreview ? adminToken : undefined,
        bundle_selections: bundleSelectionsPayload,
      });

      const orderDataToSave = {
        orderId: res.orderId,
        itemName: res.itemName || activeCampaign?.item_name,
        studentName: trimmedName,
        studentEmail: trimmedEmail,
        phoneNumber: cleanPhone,
        size: selectedSize,
        color: selectedColor,
        deliveryType,
        shippingAddress: deliveryType === 'shipping' ? shippingAddress.trim() : null,
        shippingPostalCode: deliveryType === 'shipping' ? shippingPostalCode.trim() : null,
        shippingCity: fullLocality || null,
        totalAmount: res.totalAmount,
        bundle_selections: bundleSelectionsPayload,
      };

      setConfirmedOrderDetails(orderDataToSave);
      try {
        sessionStorage.setItem('neei_last_order', JSON.stringify(orderDataToSave));
      } catch (_) {
        // Ignora erro de sessionStorage se restrito pelo browser
      }

      setActiveOrderId(res.orderId);
      setStripeClientSecret(res.clientSecret);
      setStripePublishableKey(res.publishableKey);
      setStripeTotalAmount(res.totalAmount);
      setStripePaymentFee(res.paymentFee ?? paymentFee);
      setStripeIsSandbox(res.isSandbox ?? false);
      // Avança para o passo 2 — janela exclusiva de pagamento
      setCheckoutStep(2);
    } catch (err: any) {
      setFormError(err.message || 'Ocorreu um erro ao processar a tua encomenda. Tenta novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Callback de sucesso do widget Stripe (sandbox ou após pagamento)
  const handlePaymentSuccess = async () => {
    if (!activeOrderId) return;
    try {
      if (stripeIsSandbox) {
        await simulatePayment(activeOrderId);
      } else {
        const res = await confirmPayment({ orderId: activeOrderId });
        if (res?.order) {
          setConfirmedOrderDetails({
            orderId: res.order.id,
            itemName: res.order.item_name,
            studentName: res.order.student_name,
            studentEmail: res.order.student_email,
            phoneNumber: res.order.phone_number,
            size: res.order.size,
            color: res.order.color,
            deliveryType: res.order.delivery_type,
            shippingAddress: res.order.shipping_address || undefined,
            shippingPostalCode: res.order.shipping_postal_code || undefined,
            shippingCity: res.order.shipping_city || undefined,
            totalAmount: res.order.total_amount,
          });
        }
      }
    } catch (_) {
      // ignora erro — o polling ou webhook tratarão da confirmação
    }
    setPaymentStatus('paid');
    try {
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b'],
      });
    } catch (_) {
      // ignore
    }
  };

  // Callback de erro do widget Stripe
  const handlePaymentError = (_msg: string) => {
    // Erro já é mostrado inline no widget
  };

  // Simular pagamento (modo sandbox / testes)
  const handleSimulatePayment = async () => {
    if (!activeOrderId) return;
    setSimulating(true);
    try {
      await simulatePayment(activeOrderId);
      const res = await confirmPayment({ orderId: activeOrderId }).catch(() => null);
      if (res?.order) {
        setConfirmedOrderDetails({
          orderId: res.order.id,
          studentName: res.order.student_name,
          studentEmail: res.order.student_email,
          phoneNumber: res.order.phone_number,
          size: res.order.size,
          color: res.order.color,
          deliveryType: res.order.delivery_type,
          shippingAddress: res.order.shipping_address || undefined,
          shippingPostalCode: res.order.shipping_postal_code || undefined,
          shippingCity: res.order.shipping_city || undefined,
          totalAmount: res.order.total_amount,
        });
      }
      setPaymentStatus('paid');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      alert('Erro na simulação: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const copyOrderId = () => {
    if (activeOrderId) {
      navigator.clipboard.writeText(activeOrderId);
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
  };

  // Formatador de minutos:segundos
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-cyan-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-300 font-medium">
          A carregar a Coleção de Merch do NEEI...
        </p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-xl inline-block mb-4">
          <AlertCircle size={36} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Merch Temporariamente Indisponível
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error || 'Não existe nenhum artigo de merchandising ativo de momento.'}
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 transition-colors"
        >
          Voltar ao Início
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070e17] text-slate-900 dark:text-slate-100 transition-colors py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Hero da Página de Merch */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            <span className="text-accent-200 dark:text-cyan-400">Merchandise </span>
            Oficial
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Adquire a merch do curso e/ou apoia as atividades e projetos dos estudantes de Engenharia
            Informática da Universidade do Algarve.
          </p>

          {/* Filtros de Categoria */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${activeCategory === 'all'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-500/50'
                }`}
            >
              Todos os Artigos ({products.length})
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${activeCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-500/50'
                  }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}

            {/* Divisor subtil */}
            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Botão de Ferramenta para Seguir Encomenda */}
            <button
              type="button"
              id="btn-open-order-tracker"
              onClick={() => {
                setTrackerInitialId(activeOrderId || '');
                setIsTrackerOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 flex items-center gap-2 shadow-sm hover:shadow-md hover:border-cyan-500"
              title="Acompanhar o estado de uma encomenda específica"
            >
              <PackageSearch size={16} className="text-cyan-500" />
              <span>Seguir Encomenda</span>
            </button>
          </div>
        </div>

        {/* Banner de Modo de Teste Admin (ativado via SHOW_TEST_SHOP e acedido por admin) */}
        {isAdminPreview && (
          <div className="mb-8 p-5 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-cyan-950/50 animate-in fade-in duration-200">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider shrink-0">
                🧪 Teste
              </div>
              <div className="leading-relaxed">
                <strong className="text-white block sm:inline mr-1">
                  Modo de Teste Admin Ativo (SHOW_TEST_SHOP):
                </strong>
                A testar compras reais da equipa. O valor da sweat foi ajustado para <strong className="text-white text-base underline decoration-cyan-400">0.50€</strong> (mínimo Stripe) para poderes testar com MB WAY, Cartão ou Apple Pay no telemóvel sem limitações de sandbox.
              </div>
            </div>
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shrink-0 self-start sm:self-auto"
            >
              ← Painel Admin
            </a>
          </div>
        )}

        {/* Alerta Informativo quando as Sweats estão Indisponíveis (SWEATS_AVAILABLE=false e não é admin) */}
        {!sweatsAvailable && !isAdminPreview && (
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/30 text-slate-800 dark:text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-500 flex-shrink-0">
                <Clock size={22} />
              </div>
              <div className="text-xs sm:text-sm leading-relaxed">
                <strong className="font-bold text-slate-900 dark:text-white block sm:inline mr-1">
                  Disponível Brevemente:
                </strong>
                As sweats oficiais ficarão disponíveis brevemente! Para mais informações e datas acompanha o nosso Instagram oficial.
              </div>
            </div>
            <a
              href="https://instagram.com/neeiualg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold shadow-md self-start sm:self-auto flex-shrink-0 transition-all cursor-pointer"
            >
              <Instagram size={15} />
              <span>@neeiualg</span>
              <ExternalLink size={13} className="opacity-80" />
            </a>
          </div>
        )}

        {/* Grelha de Artigos do Merch (Multi-Produto) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredProducts.map((prod) => {
            const currentCardColor = previewColors[prod.id] || (prod.colors && prod.colors[0]) || '';
            const cardImage = (prod.colorImages && currentCardColor && prod.colorImages[currentCardColor]) || prod.imageUrl;

            return (
              <div
                key={prod.id}
                className="bg-white dark:bg-[#0c1724] border border-slate-200 dark:border-cyan-950/80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all flex flex-col group"
              >
                {prod.available ? (
                  /* Com foto quando disponível (ajustada em formato integral sem cortes) */
                  <div className="relative aspect-square overflow-hidden bg-slate-900 flex items-center justify-center p-3 sm:p-5">
                    {cardImage ? (
                      <>
                        <img
                          src={cardImage}
                          alt={prod.name}
                          className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="hidden flex-col items-center justify-center p-6 text-center">
                          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner">
                            {prod.category === 'Pack' || prod.campaignData?.is_bundle ? (
                              <Package size={30} className="text-cyan-400" />
                            ) : (
                              <Shirt size={30} className="text-cyan-400" />
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner">
                          {prod.category === 'Pack' || prod.campaignData?.is_bundle ? (
                            <Package size={30} className="text-cyan-400" />
                          ) : (
                            <Shirt size={30} className="text-cyan-400" />
                          )}
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md bg-emerald-600/90 text-white border border-emerald-400/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
                        <span>{prod.badge}</span>
                      </span>
                      {daysLeft !== null && daysLeft > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md bg-slate-950/80 text-cyan-300 border border-cyan-500/40">
                          <Clock size={13} className="text-cyan-400 shrink-0" />
                          <span>{daysLeft} dias restantes</span>
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3.5 right-3.5 bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 text-white font-black text-lg px-3.5 py-1 rounded-xl shadow-lg flex items-baseline gap-1">
                      <span>{prod.price.toFixed(2)}€</span>
                      <span className="text-[10px] font-semibold text-cyan-300 tracking-normal">(+ taxas)</span>
                    </div>
                  </div>
                ) : (
                  /* Sem foto quando indisponível */
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-900 via-[#0a1526] to-[#04243a] flex flex-col items-center justify-center p-8 text-center border-b border-slate-200 dark:border-slate-800/80">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-3 shadow-inner">
                      <Shirt size={32} className="text-cyan-400" />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-3.5 py-1 rounded-full mb-2">
                      Brevemente
                    </span>
                    <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed">
                      O modelo oficial e fotografias ficaram disponíveis com a abertura das encomendas.
                    </p>
                  </div>
                )}

                {/* Informações e Detalhes */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  {prod.available ? (
                    <>
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                          <span className="uppercase tracking-wider font-bold text-cyan-600 dark:text-cyan-400">
                            {prod.category || 'Vestuário'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          {prod.name}
                        </h3>

                        <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                          {prod.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 size={14} className="text-cyan-500 flex-shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Se for Pack, lista os artigos incluídos no conjunto */}
                        {prod.campaignData?.is_bundle && prod.campaignData.bundle_items && prod.campaignData.bundle_items.length > 0 && (
                          <div className="mt-3 p-3 rounded-2xl bg-cyan-50/20 dark:bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                                <Package size={12} />
                                Artigos Incluídos no Pack ({prod.campaignData.bundle_items.length})
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-300">
                                Pack Especial
                              </span>
                            </div>
                            <div className="space-y-1">
                              {prod.campaignData.bundle_items.map((bi, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                                  <span className="truncate">{bi.item_name || 'Artigo'}</span>
                                </div>
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-0.5 italic">
                              Cores e tamanhos selecionados individualmente para cada peça.
                            </span>
                          </div>
                        )}

                        {/* Seletor minimalista de cores no cartão (apenas para artigos individuais) */}
                        {!prod.campaignData?.is_bundle && prod.colors && prod.colors.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {prod.colors.map((c) => {
                                const isCardColorSelected = currentCardColor === c;
                                const hex = getColorHex(c);
                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewColors((prev) => ({ ...prev, [prod.id]: c }));
                                    }}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${isCardColorSelected
                                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/50 shadow-xs'
                                      : 'bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40'
                                      }`}
                                    title={`Ver na cor ${c}`}
                                  >
                                    <span
                                      className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shrink-0"
                                      style={{ backgroundColor: hex }}
                                    />
                                    <span>{c}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (prod.campaignData) {
                              setSelectedProductCampaign(prod.campaignData);
                              if (prod.campaignData.is_bundle && prod.campaignData.bundle_items) {
                                const initBundle: Record<string, { size: SweatSize | string; color?: string }> = {};
                                prod.campaignData.bundle_items.forEach((bi) => {
                                  const orig = campaignsList.find((c) => c.id === bi.campaign_id);
                                  const availableSizes = orig?.sizes_available?.length
                                    ? sortSweatSizes(orig.sizes_available)
                                    : ['M'];
                                  const defaultSize = availableSizes.includes('M') ? 'M' : availableSizes[0] || 'M';
                                  const defaultColor = orig?.colors_available?.length ? orig.colors_available[0] : 'Preto';
                                  initBundle[bi.campaign_id] = {
                                    size: defaultSize,
                                    color: defaultColor,
                                  };
                                });
                                setBundleSelections(initBundle);
                              } else {
                                if (prod.campaignData.sizes_available?.length) {
                                  const sorted = sortSweatSizes(prod.campaignData.sizes_available);
                                  if (!sorted.includes(selectedSize)) {
                                    setSelectedSize(sorted[0]);
                                  }
                                }
                                if (currentCardColor && prod.campaignData.colors_available?.includes(currentCardColor)) {
                                  setSelectedColor(currentCardColor);
                                } else if (prod.campaignData.colors_available?.length) {
                                  setSelectedColor(prod.campaignData.colors_available[0]);
                                } else {
                                  setSelectedColor('Preto');
                                }
                              }
                            }
                            setIsCheckoutOpen(true);
                          }}
                          className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                        >
                          <ShoppingBag size={18} />
                          <span>{prod.campaignData?.is_bundle ? 'Comprar Pack' : 'Pré-encomendar'}</span>
                        </button>

                        {((prod.category || 'Vestuário').toLowerCase() === 'vestuário' || prod.campaignData?.is_bundle) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (prod.campaignData) {
                                setSelectedProductCampaign(prod.campaignData);
                                if (prod.campaignData.is_bundle && prod.campaignData.bundle_items?.length) {
                                  const firstItem = campaignsList.find((c) => c.id === prod.campaignData?.bundle_items?.[0]?.campaign_id);
                                  setSizeGuideCampaign(firstItem || prod.campaignData);
                                } else {
                                  setSizeGuideCampaign(prod.campaignData);
                                }
                              }
                              setIsSizeGuideOpen(true);
                            }}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                            title="Ver Guia de Tamanhos"
                          >
                            <Ruler size={18} />
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                          <span className="uppercase tracking-wider font-bold text-cyan-600 dark:text-cyan-400">
                            {prod.category || 'Vestuário'}
                          </span>
                          <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                            Em Breve
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {prod.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                          As sweats oficiais do curso de Engenharia Informática{' '}
                          <strong>ficarão disponíveis brevemente</strong>!
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                          Acompanha o nosso Instagram oficial para mais informações, datas de abertura
                          e detalhes do lançamento oficial.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <a
                          href="https://instagram.com/neeiualg"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-600/25 transition-all cursor-pointer"
                        >
                          <Instagram size={18} />
                          <span>Acompanhar no Instagram (@neeiualg)</span>
                          <ExternalLink size={14} className="opacity-80" />
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal / Ecrã de Checkout (Pré-encomenda da Sweat) */}
        {isCheckoutOpen && (
          <Portal>
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="bg-white dark:bg-[#0c1724] border border-slate-200 dark:border-cyan-900/60 rounded-3xl max-w-xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header Fixo do Modal */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 shrink-0 bg-white/95 dark:bg-[#0c1724]/95 backdrop-blur-xs z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold shrink-0">
                      {checkoutStep === 1 ? <ShoppingBag size={18} /> : <CreditCard size={18} />}
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {checkoutStep === 1
                          ? activeCampaign
                            ? `Pré-encomenda · ${activeCampaign.item_name}`
                            : 'Pré-encomenda de Merch'
                          : 'Escolhe o método de pagamento'}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${checkoutStep === 1 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'}`}>
                          1. Dados
                        </span>
                        <ChevronRight size={11} className="text-slate-500" />
                        <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${checkoutStep === 2 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                          2. Pagamento
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão Fechar */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setCheckoutStep(1);
                      setStripeClientSecret(null);
                      setFormError(null);
                    }}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    title="Fechar janela"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Conteúdo com scroll interno suave */}
                <div className="p-4 sm:p-5 overflow-y-auto flex-1 overscroll-contain">

                  {!sweatsAvailable && !isAdminPreview ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-sm">
                      As encomendas do merchandise estão temporariamente suspensas de momento.
                    </div>
                  ) : checkoutStep === 1 ? (
                    /* =========================================================================
                       PASSO 1: FORMULÁRIO DE DADOS & SELEÇÃO
                       ========================================================================= */
                    <form onSubmit={handleCheckout} className="space-y-4">
                      {/* Cartão de Pré-visualização do Artigo com Foto Dinâmica por Cor */}
                      <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm p-1.5 flex items-center justify-center">
                          {activeModalImage ? (
                            <>
                              <img
                                src={activeModalImage}
                                alt={`${activeCampaign?.item_name || 'Artigo'} - ${selectedColor}`}
                                className="w-full h-full object-contain object-center transition-all duration-300"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement | null;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div className="hidden items-center justify-center text-cyan-400">
                                {activeCampaign?.is_bundle ? <Package size={24} /> : <Shirt size={24} />}
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-center text-cyan-400">
                              {activeCampaign?.is_bundle ? <Package size={24} /> : <Shirt size={24} />}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block truncate">
                              {activeCampaign?.is_bundle ? 'Pack Promocional' : activeCampaign?.category || 'Vestuário'}
                            </span>
                            {activeCampaign?.is_bundle && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-300">
                                {bundleResolvedItems.length} Peças
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                            {activeCampaign?.item_name}
                          </h4>
                          {!activeCampaign?.is_bundle ? (
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                <span>Tamanho: <strong>{selectedSize}</strong></span>
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              Inclui: {bundleResolvedItems.map((b) => b.item_name).join(' + ')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Descrição Detalhada do Artigo (compacta com scroll se longa) */}
                      {activeCampaign?.description && (
                        <div className="p-3 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/70 dark:border-cyan-800/60 text-slate-700 dark:text-slate-300 text-xs leading-relaxed shadow-xs max-h-24 overflow-y-auto">
                          <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 font-bold mb-1 text-[11px] uppercase tracking-wider sticky top-0 bg-transparent">
                            <Info size={13} className="shrink-0" />
                            <span>Descrição Detalhada</span>
                          </div>
                          <p className="whitespace-pre-line text-slate-700 dark:text-slate-300">
                            {activeCampaign.description}
                          </p>
                        </div>
                      )}

                      {/* Seleção de Tamanho e Cor: Se for Pack, configura cada artigo individualmente */}
                      {activeCampaign?.is_bundle ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Package size={15} className="text-cyan-500" />
                              <span>Configura os artigos do teu Pack ({bundleResolvedItems.length} peças)</span>
                            </label>
                            {bundleSavingsInfo && (
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-400/30">
                                Poupa {bundleSavingsInfo.savings.toFixed(2)}€ ({bundleSavingsInfo.percent}% OFF)
                              </span>
                            )}
                          </div>

                          <div className="space-y-3">
                            {bundleResolvedItems.map((item, index) => {
                              const currentSel = bundleSelections[item.campaign_id] || {
                                size: item.sizes_available[0] || 'M',
                                color: item.colors_available[0] || 'Preto',
                              };
                              const itemColor = currentSel.color || item.colors_available[0] || 'Preto';
                              const itemImage =
                                (itemColor && item.color_images?.[itemColor]) || item.image_url;
                              const isClothingItem = item.category.toLowerCase() === 'vestuário';

                              return (
                                <div
                                  key={item.campaign_id}
                                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-800 shadow-xs p-1 flex items-center justify-center">
                                        {itemImage ? (
                                          <>
                                            <img
                                              src={itemImage}
                                              alt={item.item_name}
                                              className="w-full h-full object-contain"
                                              onError={(e) => {
                                                const target = e.currentTarget;
                                                target.style.display = 'none';
                                                const fallback = target.nextElementSibling as HTMLElement | null;
                                                if (fallback) fallback.style.display = 'flex';
                                              }}
                                            />
                                            <div className="hidden items-center justify-center text-cyan-400">
                                              <Shirt size={18} />
                                            </div>
                                          </>
                                        ) : (
                                          <div className="flex items-center justify-center text-cyan-400">
                                            <Shirt size={18} />
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 block truncate">
                                          Peça {index + 1} · {item.category}
                                        </span>
                                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                          {item.item_name}
                                        </h5>
                                      </div>
                                    </div>

                                    {isClothingItem && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSizeGuideCampaign(item.originalCampaign || null);
                                          setIsSizeGuideOpen(true);
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer shrink-0"
                                      >
                                        <Ruler size={12} />
                                        <span>Guia Medidas</span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Seletor de Tamanho para esta peça */}
                                  <div>
                                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                      Tamanho:{' '}
                                      <strong className="text-cyan-600 dark:text-cyan-400">
                                        {currentSel.size}
                                      </strong>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {sortSweatSizes(item.sizes_available).map((sz) => {
                                        const isSel = currentSel.size === sz;
                                        return (
                                          <button
                                            key={sz}
                                            type="button"
                                            onClick={() => {
                                              setBundleSelections((prev) => ({
                                                ...prev,
                                                [item.campaign_id]: {
                                                  ...prev[item.campaign_id],
                                                  size: sz,
                                                  color:
                                                    prev[item.campaign_id]?.color ||
                                                    item.colors_available[0] ||
                                                    'Preto',
                                                },
                                              }));
                                            }}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${isSel
                                              ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                                              : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-500/50'
                                              }`}
                                          >
                                            {sz}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Seletor de Cor para esta peça */}
                                  {item.colors_available.length > 0 && (
                                    <div>
                                      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Cor:{' '}
                                        <strong className="text-cyan-600 dark:text-cyan-400">
                                          {itemColor}
                                        </strong>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {item.colors_available.map((c) => {
                                          const isSel = itemColor === c;
                                          const hex = getColorHex(c);
                                          return (
                                            <button
                                              key={c}
                                              type="button"
                                              onClick={() => {
                                                setBundleSelections((prev) => ({
                                                  ...prev,
                                                  [item.campaign_id]: {
                                                    ...prev[item.campaign_id],
                                                    size:
                                                      prev[item.campaign_id]?.size ||
                                                      item.sizes_available[0] ||
                                                      'M',
                                                    color: c,
                                                  },
                                                }));
                                              }}
                                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${isSel
                                                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/50 font-bold shadow-xs'
                                                : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40'
                                                }`}
                                            >
                                              <span
                                                className="w-3 h-3 rounded-full border border-black/20 dark:border-white/20 shrink-0"
                                                style={{ backgroundColor: hex }}
                                              />
                                              <span>{c}</span>
                                              {isSel && (
                                                <Check
                                                  size={11}
                                                  className="text-cyan-500 stroke-[3] shrink-0"
                                                />
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* 1. Seleção de Tamanho */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                Tamanho:{' '}
                                <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">
                                  {selectedSize}
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setSizeGuideCampaign(activeCampaign);
                                  setIsSizeGuideOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
                              >
                                <Ruler size={13} />
                                Guia de Tamanhos
                              </button>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                              {sortSweatSizes(activeCampaign?.sizes_available).map((sz) => {
                                const isSelected = selectedSize === sz;
                                return (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => setSelectedSize(sz)}
                                    className={`py-1.5 px-1 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${isSelected
                                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-md scale-102'
                                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-500/60'
                                      }`}
                                  >
                                    {sz}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 1b. Seleção Minimalista de Cor */}
                          {activeColors.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                {activeColors.map((colorName) => {
                                  const isSelected = selectedColor === colorName;
                                  const hex = getColorHex(colorName);
                                  return (
                                    <button
                                      key={colorName}
                                      type="button"
                                      onClick={() => setSelectedColor(colorName)}
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer ${isSelected
                                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/50 font-bold shadow-xs'
                                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40'
                                        }`}
                                    >
                                      <span
                                        className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shrink-0"
                                        style={{ backgroundColor: hex }}
                                      />
                                      <span>{colorName}</span>
                                      {isSelected && (
                                        <Check size={13} className="text-cyan-500 stroke-[3] shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* 2. Modalidade de Entrega */}
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                          Como queres receber a tua encomenda?
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Opção 1: Levantamento no Gabinete (Gambelas) */}
                          <button
                            type="button"
                            onClick={() => setDeliveryType('pickup')}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${deliveryType === 'pickup'
                              ? 'bg-cyan-50/50 dark:bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500/50'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                <MapPin size={15} className="text-cyan-500" />
                                <span>Gabinete NEEI</span>
                              </div>
                              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.2 rounded-full">
                                Grátis
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              {activeCampaign?.pickup_location || 'Recolha na Sala 0.18, Edifício 1, Campus de Gambelas.'}
                            </p>
                          </button>

                          {/* Opção 2: Envio CTT Nacional */}
                          <button
                            type="button"
                            onClick={() => setDeliveryType('shipping')}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${deliveryType === 'shipping'
                              ? 'bg-cyan-50/50 dark:bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500/50'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                <Truck size={15} className="text-cyan-500" />
                                <span>Envio CTT Nacional</span>
                              </div>
                              <span className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/60 px-2 py-0.2 rounded-full">
                                +{(activeCampaign?.shipping_fee ?? 4.5).toFixed(2)}€
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              Recebe em qualquer morada de Portugal Continental ou Ilhas.
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* Campos de Morada se Envio por Correio */}
                      {deliveryType === 'shipping' && (
                        <div className="p-3.5 rounded-2xl bg-cyan-50/40 dark:bg-slate-900/80 border border-cyan-200/60 dark:border-cyan-950/60 space-y-2.5 animate-in fade-in duration-150">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                              Morada de Envio *
                            </label>
                            <input
                              type="text"
                              required
                              value={shippingAddress}
                              onChange={(e) => setShippingAddress(e.target.value)}
                              placeholder="Ex: Rua Dr. António José de Almeida, Nº 42, 2º Dto"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                            />
                          </div>

                          {/* Código Postal + Distrito + Concelho */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Código Postal *
                              </label>
                              <input
                                type="text"
                                required
                                maxLength={8}
                                value={shippingPostalCode}
                                onChange={handlePostalCodeChange}
                                placeholder="8000-000"
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                              />
                              <span className="text-[10px] text-slate-400 block mt-0.5">Formato 0000-000</span>
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Distrito / Região *
                              </label>
                              <select
                                value={shippingDistrict}
                                onChange={handleDistrictChange}
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                              >
                                {districtsList.map((dist) => (
                                  <option key={dist} value={dist}>
                                    {dist}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Concelho *
                              </label>
                              <select
                                value={shippingCounty}
                                onChange={(e) => setShippingCounty(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                              >
                                {availableCounties.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. Dados Pessoais do Aluno */}
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                              Nome Completo *
                            </label>
                            <input
                              type="text"
                              required
                              value={studentName}
                              onChange={handleNameChange}
                              placeholder="Teu nome completo"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                            />
                            <span className="text-[10px] text-slate-400 block mt-0.5">Apenas letras e espaços</span>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                              Email Institucional ou Pessoal *
                            </label>
                            <input
                              type="email"
                              required
                              value={studentEmail}
                              onChange={(e) => setStudentEmail(e.target.value)}
                              placeholder="aXXXXX@ualg.pt"
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                            />
                            <span className="text-[10px] text-slate-400 block mt-0.5">Onde receberás o comprovativo</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Telemóvel (apenas 9 dígitos) *
                            </label>
                            {phoneNumber.length === 9 && phoneNumber.startsWith('9') && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <Check size={12} /> Número Válido
                              </span>
                            )}
                          </div>
                          <input
                            type="tel"
                            required
                            maxLength={9}
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            placeholder="912345678"
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono tracking-wider"
                          />
                        </div>
                      </div>

                      {/* Resumo de Valores */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>
                            {activeCampaign?.item_name || 'Sweat Oficial'}
                            {!activeCampaign?.is_bundle
                              ? ` (${selectedSize})`
                              : ` (${bundleResolvedItems.length} peças)`}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {(activeCampaign?.item_price ?? 0).toFixed(2)}€{' '}
                            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                              (+ taxas)
                            </span>
                          </span>
                        </div>
                        {bundleSavingsInfo && (
                          <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-400/30">
                            <span>Poupança do Pack ({bundleSavingsInfo.percent}% OFF):</span>
                            <span>-{bundleSavingsInfo.savings.toFixed(2)}€</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>
                            Portes:{' '}
                            {deliveryType === 'shipping'
                              ? `Envio CTT Nacional (${shippingCounty}, ${shippingDistrict})`
                              : 'Levantamento no Gabinete NEEI'}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {deliveryType === 'shipping'
                              ? `${(activeCampaign?.shipping_fee ?? 4.5).toFixed(2)}€`
                              : 'Grátis'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            Taxa de processamento (0,25€ + 1,5%)
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            +{paymentFee.toFixed(2)}€
                          </span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                          <span>Total a Pagar</span>
                          <span className="text-lg font-black text-cyan-600 dark:text-cyan-400">
                            {totalPrice.toFixed(2)}€
                          </span>
                        </div>
                      </div>

                      {formError && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                          <AlertCircle size={16} className="flex-shrink-0" />
                          <span>{formError}</span>
                        </div>
                      )}

                      {/* Botão de Submissão — Passo 1 */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>A preparar janela de pagamento...</span>
                          </>
                        ) : (
                          <>
                            <ArrowRight size={18} />
                            <span>Continuar para Pagamento · {totalPrice.toFixed(2)}€</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* =========================================================================
                       PASSO 2: JANELA DEDICADA EXCLUSIVA DE PAGAMENTO (SUBSTITUI O FORMULÁRIO)
                       ========================================================================= */
                    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* Botão superior de retrocesso */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setCheckoutStep(1);
                            setFormError(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                          <span>Voltar aos dados</span>
                        </button>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Passo 2 de 2 · Pagamento
                        </span>
                      </div>

                      {/* Resumo discriminado e detalhado da encomenda */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                          <span>Resumo do Pagamento</span>
                          <span className="text-cyan-600 dark:text-cyan-400 font-black text-lg">
                            {stripeTotalAmount.toFixed(2)}€
                          </span>
                        </div>

                        <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                          <div className="flex justify-between">
                            <span>{activeCampaign?.item_name || 'Sweat Oficial'} ({selectedSize})</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {(activeCampaign?.item_price ?? 0).toFixed(2)}€ <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">(+ taxas)</span>
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>
                              {deliveryType === 'shipping'
                                ? 'Portes de Envio (CTT Nacional)'
                                : 'Portes (Levantamento no Gabinete)'}
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {deliveryType === 'shipping'
                                ? `${(activeCampaign?.shipping_fee ?? 4.5).toFixed(2)}€`
                                : 'Grátis'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-1.5 rounded-lg border border-cyan-200 dark:border-cyan-800/60">
                            <span className="font-medium">Taxa de processamento / pagamento (0,25€ + 1,5%)</span>
                            <span className="font-bold text-cyan-600 dark:text-cyan-400">
                              +{((stripePaymentFee || paymentFee)).toFixed(2)}€
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-between items-center font-bold text-slate-900 dark:text-white">
                          <span className="text-xs">Total final a debitar:</span>
                          <span className="text-cyan-600 dark:text-cyan-400 text-base font-black">
                            {stripeTotalAmount.toFixed(2)}€
                          </span>
                        </div>

                        <div className="text-slate-500 dark:text-slate-400 flex flex-col gap-1 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
                          <div>
                            <strong className="text-slate-700 dark:text-slate-300">Aluno:</strong> {studentName} ({studentEmail}) · {phoneNumber}
                          </div>
                          <div>
                            <strong className="text-slate-700 dark:text-slate-300">Entrega:</strong>{' '}
                            {deliveryType === 'shipping'
                              ? `Envio CTT (${shippingAddress}, ${shippingPostalCode} ${shippingCounty}, ${shippingDistrict})`
                              : 'Levantamento no Gabinete NEEI (Gambelas)'}
                          </div>
                        </div>
                      </div>

                      {/* Widget Oficial de Pagamento Stripe */}
                      {stripeClientSecret && stripePublishableKey && activeOrderId ? (
                        <StripePaymentWidget
                          clientSecret={stripeClientSecret}
                          publishableKey={stripePublishableKey}
                          orderId={activeOrderId}
                          totalAmount={stripeTotalAmount}
                          isSandbox={stripeIsSandbox}
                          studentName={studentName}
                          studentEmail={studentEmail}
                          phoneNumber={phoneNumber}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      ) : (
                        <div className="p-8 text-center text-slate-400 space-y-3">
                          <Loader2 size={24} className="animate-spin mx-auto text-cyan-500" />
                          <p className="text-xs">A carregar formulário de pagamento seguro...</p>
                        </div>
                      )}

                      {/* Botão inferior para voltar atrás a qualquer momento */}
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setCheckoutStep(1);
                            setFormError(null);
                          }}
                          className="text-xs text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ChevronLeft size={13} />
                          <span>Desejas alterar o tamanho ou a morada? Clica aqui para voltar atrás</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Portal>
        )}

        {/* Modal Guia de Medidas */}
        {isSizeGuideOpen && (
          <Portal>
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsSizeGuideOpen(false);
                    setSizeGuideCampaign(null);
                  }}
                  className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <Ruler className="text-cyan-500" size={22} />
                  <span>Guia de Tamanhos (cm)</span>
                </h3>
                {(sizeGuideCampaign?.item_name || activeCampaign?.item_name) && (
                  <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-2">
                    {sizeGuideCampaign?.item_name || activeCampaign?.item_name}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Medidas aproximadas com a peça esticada numa superfície plana. Clica num tamanho para o selecionar diretamente.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <div><strong className="text-slate-900 dark:text-white">A:</strong> Peito</div>
                  <div><strong className="text-slate-900 dark:text-white">B:</strong> Comprimento</div>
                  <div><strong className="text-slate-900 dark:text-white">C:</strong> Manga</div>
                  <div><strong className="text-slate-900 dark:text-white">D:</strong> Ombro ao Punho</div>
                </div>

                {(() => {
                  const targetCampaign = sizeGuideCampaign || activeCampaign;
                  const guideData = targetCampaign?.size_guide || DEFAULT_SIZE_GUIDE;
                  const availableSizes = targetCampaign?.sizes_available?.length
                    ? sortSweatSizes(targetCampaign.sizes_available)
                    : ORDERED_SWEAT_SIZES;

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                            <th className="py-2.5 px-3">Tamanho</th>
                            <th className="py-2.5 px-3">Medida do pescoço até ao cinto (A)</th>
                            <th className="py-2.5 px-3">Metade do diâmetro à altura do peito (B)</th>
                            <th className="py-2.5 px-3">Medida de ombro a ombro (C)</th>
                            <th className="py-2.5 px-3">Comprimento do ombro ao punho (D)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                          {availableSizes.map((sz) => {
                            const dims = guideData[sz] || DEFAULT_SIZE_GUIDE[sz as SweatSize] || { chest: 0, length: 0, sleeve: 0, shoulder_to_wrist: 0 };
                            const isSelected = selectedSize === sz;
                            return (
                              <tr
                                key={sz}
                                onClick={() => setSelectedSize(sz)}
                                className={`cursor-pointer transition-colors ${isSelected
                                  ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-300 font-bold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                  }`}
                              >
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold">{sz}</span>
                                    {dims.label && (
                                      <span className="text-[10px] text-slate-400 font-normal">
                                        ({dims.label})
                                      </span>
                                    )}
                                    {isSelected && (
                                      <span className="text-[10px] bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">
                                        Escolhido
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-3">{dims.chest} cm</td>
                                <td className="py-2 px-3">{dims.length} cm</td>
                                <td className="py-2 px-3">{dims.sleeve !== undefined && dims.sleeve !== null ? `${dims.sleeve} cm` : '—'}</td>
                                <td className="py-2 px-3">{dims.shoulder_to_wrist !== undefined && dims.shoulder_to_wrist !== null ? `${dims.shoulder_to_wrist} cm` : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSizeGuideOpen(false);
                      setSizeGuideCampaign(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}

        {/* Ecrã de Pagamento Ativo (Modal / Overlay em foco) */}
        {paymentStatus !== 'idle' && (
          <Portal>
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl shadow-cyan-950/50 text-center relative my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                {paymentStatus === 'waiting_payment' && (
                  <div>
                    <div className="w-16 h-16 bg-cyan-500/20 border-2 border-cyan-500 rounded-full flex items-center justify-center mx-auto mb-5 text-cyan-400 animate-pulse">
                      <Smartphone size={32} />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 text-xs font-semibold mb-3 border border-cyan-800">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>À espera
                      de autorização
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">
                      Abre a tua app <span className="text-[#309b42] font-black">MB WAY</span>
                    </h3>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                      Enviámos uma notificação para o teu telemóvel (
                      <strong className="text-white">{phoneNumber}</strong>) no valor de{' '}
                      <strong className="text-cyan-300 text-base">{totalPrice.toFixed(2)}€</strong>.
                      Autoriza na app para confirmar a tua sweat!
                    </p>

                    <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-6 flex items-center justify-around">
                      <div>
                        <span className="text-xs text-slate-400 block">Tempo restante</span>
                        <span className="text-2xl font-mono font-bold text-amber-400">
                          {formatTime(paymentTimeRemaining)}
                        </span>
                      </div>
                      <div className="h-8 w-px bg-slate-800"></div>
                      <div>
                        <span className="text-xs text-slate-400 block">Nº Encomenda</span>
                        <span className="text-sm font-mono font-semibold text-slate-200">
                          {activeOrderId}
                        </span>
                      </div>
                    </div>

                    {/* Sandbox helper */}
                    {isSandbox && (
                      <div className="mb-5 p-3.5 bg-amber-950/50 border border-amber-500/40 rounded-xl text-left">
                        <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs mb-1">
                          <Shirt size={14} /> Modo de Testes / Sandbox
                        </div>
                        <p className="text-xs text-amber-200/80 mb-2">
                          Em ambiente de testes (as notificações reais só ocorrem com chaves live), podes simular a aprovação instantânea:
                        </p>
                        <button
                          type="button"
                          onClick={handleSimulatePayment}
                          disabled={simulating}
                          className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
                        >
                          {simulating ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            '⚡ Simular Aprovação no Telemóvel'
                          )}
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            'Tens a certeza que queres fechar este ecrã? A tua encomenda continuará a aguardar pagamento.'
                          )
                        ) {
                          setPaymentStatus('idle');
                          setIsCheckoutOpen(false);
                        }
                      }}
                      className="text-xs text-slate-400 hover:text-white transition-colors underline cursor-pointer"
                    >
                      Fechar e verificar mais tarde
                    </button>
                  </div>
                )}

                {paymentStatus === 'paid' && (() => {
                  const displayBuyerName = confirmedOrderDetails?.studentName || studentName || 'Colega';
                  const displayBuyerEmail = confirmedOrderDetails?.studentEmail || studentEmail;
                  const displayItemName = confirmedOrderDetails?.itemName || activeCampaign?.item_name || 'Sweat Oficial';
                  const displaySize = confirmedOrderDetails?.size || selectedSize;
                  const displayColor = confirmedOrderDetails?.color || (isClothing ? selectedColor : undefined);
                  const displayDeliveryType = confirmedOrderDetails?.deliveryType || deliveryType;
                  const displayAddress = confirmedOrderDetails?.shippingAddress || (deliveryType === 'shipping' ? shippingAddress : '');
                  const displayPostal = confirmedOrderDetails?.shippingPostalCode || (deliveryType === 'shipping' ? shippingPostalCode : '');
                  const displayCity = confirmedOrderDetails?.shippingCity || (deliveryType === 'shipping' ? `${shippingCounty}, ${shippingDistrict}` : '');

                  return (
                    <div>
                      <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-400">
                        <CheckCircle2 size={36} />
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-2">
                        Encomenda Confirmada com Sucesso!
                      </h3>
                      <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        Muito obrigado, <strong className="text-white">{displayBuyerName}</strong>! O teu
                        pagamento foi recebido e a tua peça <strong className="text-cyan-300">"{displayItemName}"</strong> ({displaySize}{displayColor ? ` · ${displayColor}` : ''}) já está reservada para
                        produção.
                      </p>

                      <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-left mb-6 space-y-2">
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span>Artigo Encomendado:</span>
                          <span className="text-cyan-400 font-semibold">{displayItemName}</span>
                        </div>
                        {confirmedOrderDetails?.bundle_selections && confirmedOrderDetails.bundle_selections.length > 0 ? (
                          <div className="pt-1.5 border-t border-slate-800/80 space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-cyan-400 block">
                              Itens Escolhidos no Pack ({confirmedOrderDetails.bundle_selections.length}):
                            </span>
                            <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                              {confirmedOrderDetails.bundle_selections.map((bs, i) => (
                                <div key={i} className="flex justify-between items-center text-xs">
                                  <span className="text-slate-300 font-medium">{bs.item_name}</span>
                                  <span className="text-white font-semibold flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold text-[10px]">
                                      {bs.size}
                                    </span>
                                    {bs.color && (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                                        <span
                                          className="w-2 h-2 rounded-full border border-black/20 shrink-0"
                                          style={{ backgroundColor: getColorHex(bs.color) }}
                                        />
                                        <span>{bs.color}</span>
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center text-xs text-slate-400">
                            <span>Tamanho / Cor:</span>
                            <span className="text-white font-semibold flex items-center gap-1.5">
                              <span>{displaySize}</span>
                              {displayColor && (
                                <span className="inline-flex items-center gap-1 text-slate-300">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20 shrink-0 inline-block"
                                    style={{ backgroundColor: getColorHex(displayColor) }}
                                  />
                                  <span>{displayColor}</span>
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span>Nº de Encomenda:</span>
                          <button
                            type="button"
                            onClick={copyOrderId}
                            className="font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            {activeOrderId}
                            {copiedOrderId ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span>Email de Confirmação:</span>
                          <span className="text-slate-200 font-medium">{displayBuyerEmail}</span>
                        </div>
                        <div className="flex justify-between items-start text-xs text-slate-400">
                          <span>Modalidade de Entrega:</span>
                          <div className="text-right">
                            <span className="text-slate-200 font-semibold block">
                              {displayDeliveryType === 'shipping'
                                ? 'Envio CTT Nacional'
                                : 'Levantamento no Gabinete NEEI'}
                            </span>
                            {displayDeliveryType === 'shipping' && (displayAddress || displayCity) && (
                              <span className="text-[11px] text-slate-400 block mt-0.5 max-w-[240px] truncate">
                                {[displayAddress, displayPostal, displayCity].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-cyan-950/50 border border-cyan-800/60 rounded-xl text-left text-xs text-cyan-300 mb-6 flex items-start gap-2">
                        <Info size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>
                          Enviámos um email com todos os detalhes e instruções para{' '}
                          <strong>{displayBuyerEmail}</strong>. Assim que a sweat estiver pronta na fábrica,
                          avisaremos por email!
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setTrackerInitialId(activeOrderId || '');
                          setIsTrackerOpen(true);
                          setPaymentStatus('idle');
                          setIsCheckoutOpen(false);
                        }}
                        className="w-full py-2.5 px-4 mb-2.5 rounded-xl border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <PackageSearch size={16} />
                        <span>Acompanhar Estado Desta Encomenda</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentStatus('idle');
                          setIsCheckoutOpen(false);
                          setActiveOrderId(null);
                        }}
                        className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all shadow-md cursor-pointer"
                      >
                        Concluir e Voltar ao Merch
                      </button>
                    </div>
                  );
                })()}

                {paymentStatus === 'expired' && (
                  <div>
                    <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-500 rounded-full flex items-center justify-center mx-auto mb-5 text-amber-400">
                      <Clock size={36} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Tempo Limite Expirado</h3>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                      O pedido de pagamento de 5 minutos expirou sem aprovação. Não te
                      preocupes, podes tentar de novo!
                    </p>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('idle')}
                      className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all shadow-md cursor-pointer"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                )}

                {paymentStatus === 'failed' && (
                  <div>
                    <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-5 text-red-400">
                      <AlertCircle size={36} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Pagamento Não Concluído</h3>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                      A transação foi recusada ou cancelada na aplicação MB WAY.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('idle')}
                      className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all shadow-md cursor-pointer"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Portal>
        )}

        {/* Ferramenta Modal de Rastreio de Encomenda */}
        <OrderTrackerModal
          isOpen={isTrackerOpen}
          onClose={() => setIsTrackerOpen(false)}
          initialOrderId={trackerInitialId}
        />
      </div>
    </div>
  );
};

export const Merch = Shop;
export default Shop;
