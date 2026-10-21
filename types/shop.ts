export type SweatSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';

export const ORDERED_SWEAT_SIZES: SweatSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

/**
 * Ordena uma lista de tamanhos segundo a ordem canónica de XS até 3XL
 */
export function sortSweatSizes(sizes?: SweatSize[] | string[]): SweatSize[] {
  if (!sizes || !Array.isArray(sizes)) return [...ORDERED_SWEAT_SIZES];
  return [...sizes].sort((a, b) => {
    const idxA = ORDERED_SWEAT_SIZES.indexOf(a as SweatSize);
    const idxB = ORDERED_SWEAT_SIZES.indexOf(b as SweatSize);
    if (idxA === -1 && idxB === -1) return String(a).localeCompare(String(b));
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  }) as SweatSize[];
}

export type DeliveryType = 'pickup' | 'shipping';

export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'failed';

export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'in_production'
  | 'ready_for_pickup'
  | 'shipped'
  | 'delivered'
  | 'test';

export interface SizeMeasurement {
  chest: number; // Peito (A) (cm)
  length: number; // Comprimento (B) (cm)
  sleeve?: number; // Manga (C) (cm)
  shoulder_to_wrist?: number; // Ombro ao Punho (D) (cm)
  label?: string; // e.g. "Médio (Mais comum)"
}

export type SizeGuideMap = Record<string, SizeMeasurement>;

export const DEFAULT_SIZE_GUIDE: Record<SweatSize, SizeMeasurement> = {
  XS: { chest: 49, length: 64, sleeve: 60, shoulder_to_wrist: 70, label: 'Extra Pequeno' },
  S: { chest: 52, length: 67, sleeve: 62, shoulder_to_wrist: 73, label: 'Pequeno' },
  M: { chest: 55, length: 70, sleeve: 64, shoulder_to_wrist: 76, label: 'Médio (Mais comum)' },
  L: { chest: 58, length: 73, sleeve: 66, shoulder_to_wrist: 79, label: 'Grande (Mais comum)' },
  XL: { chest: 61, length: 76, sleeve: 68, shoulder_to_wrist: 82, label: 'Extra Grande' },
  XXL: { chest: 64, length: 79, sleeve: 70, shoulder_to_wrist: 85, label: '2X Grande' },
  '3XL': { chest: 67, length: 82, sleeve: 72, shoulder_to_wrist: 88, label: '3X Grande' },
};

export const DEFAULT_PRESET_COLORS: string[] = [
  'Preto',
  'Branco',
  'Cinzento',
  'Azul Marinho',
  'Azul Royal',
  'Verde Garrafa',
  'Bordeaux',
  'Creme',
  'Rosa',
];

/**
 * Mapeia nomes comuns de cores para códigos HEX visuais
 */
export function getColorHex(colorName: string): string {
  const trimmed = (colorName || '').trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return trimmed;
  }
  const normalized = trimmed.toLowerCase();
  const map: Record<string, string> = {
    'preto': '#0f172a',
    'black': '#0f172a',
    'branco': '#f8fafc',
    'white': '#f8fafc',
    'cinzento': '#64748b',
    'cinza': '#64748b',
    'grey': '#64748b',
    'gray': '#64748b',
    'azul marinho': '#0f2942',
    'navy': '#0f2942',
    'marinho': '#0f2942',
    'azul': '#0284c7',
    'blue': '#0284c7',
    'azul royal': '#1d4ed8',
    'verde': '#16a34a',
    'verde escuro': '#14532d',
    'verde garrafa': '#134e4a',
    'green': '#16a34a',
    'bordeaux': '#881337',
    'bordo': '#881337',
    'bordô': '#881337',
    'vermelho': '#dc2626',
    'red': '#dc2626',
    'bege': '#d4b996',
    'creme': '#fef3c7',
    'rosa': '#f472b6',
    'pink': '#f472b6',
    'amarelo': '#eab308',
    'laranja': '#ea580c',
    'roxo': '#7c3aed',
    'violeta': '#8b5cf6',
  };
  return map[normalized] || '#64748b';
}

export interface BundleItemConfig {
  campaign_id: string;
  item_name?: string;
}

export interface BundleItemSelection {
  campaign_id: string;
  item_name: string;
  size?: SweatSize | string;
  color?: string;
}

export interface ShopCampaign {
  id: string;
  title: string;
  description: string;
  item_name: string;
  item_price: number;
  shipping_fee: number;
  image_url: string;
  raw_image_url?: string;
  deadline_date: string; // YYYY-MM-DD
  is_active: boolean;
  is_available?: boolean;
  allow_pickup: boolean;
  allow_shipping: boolean;
  pickup_location: string;
  sizes_available: SweatSize[];
  colors_available?: string[];
  color_images?: Record<string, string>;
  size_guide?: SizeGuideMap;
  features?: string[];
  category?: string;
  is_bundle?: boolean;
  bundle_items?: BundleItemConfig[];
  display_order?: number;
  priority?: number;
  created_at?: string;
  isAdminPreview?: boolean;
}

export interface AdminProductPayload {
  id?: string;
  title: string;
  description: string;
  item_name: string;
  item_price: number;
  shipping_fee: number;
  image_url: string;
  deadline_date: string;
  is_active: boolean;
  allow_pickup: boolean;
  allow_shipping: boolean;
  pickup_location: string;
  sizes_available: SweatSize[];
  colors_available?: string[];
  color_images?: Record<string, string>;
  size_guide?: SizeGuideMap;
  features?: string[];
  category?: string;
  is_bundle?: boolean;
  bundle_items?: BundleItemConfig[];
  display_order?: number;
  priority?: number;
}

export interface ProductFormData {
  title: string;
  description: string;
  item_name: string;
  item_price: number;
  shipping_fee: number;
  image_url: string;
  deadline_date: string;
  is_active: boolean;
  allow_pickup: boolean;
  allow_shipping: boolean;
  pickup_location: string;
  sizes_available: SweatSize[];
  colors_available: string[];
  color_images?: Record<string, string>;
  size_guide?: SizeGuideMap;
  features: string[];
  category: string;
  is_bundle?: boolean;
  bundle_items?: BundleItemConfig[];
  display_order?: number;
  priority?: number;
}

export interface MerchProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  features: string[];
  imageUrl: string;
  badge?: string;
  isPreorder?: boolean;
  available: boolean;
  sizes?: SweatSize[];
  colors?: string[];
  colorImages?: Record<string, string>;
  sizeGuide?: SizeGuideMap;
  allowShipping?: boolean;
  shippingFee?: number;
  pickupLocation?: string;
  isBundle?: boolean;
  bundleItems?: BundleItemConfig[];
  bundleProducts?: MerchProduct[];
  campaignData?: ShopCampaign;
  displayOrder?: number;
  priority?: number;
}

export interface ShopOrder {
  id: string;
  campaign_id: string;
  item_name: string;
  student_name: string;
  student_email: string;
  phone_number: string;
  nif?: string | null;
  size: SweatSize | string;
  color: string;
  delivery_type: DeliveryType;
  shipping_address?: string | null;
  shipping_postal_code?: string | null;
  shipping_city?: string | null;
  item_price: number;
  shipping_fee: number;
  payment_fee?: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_provider: string;
  payment_ref?: string | null;
  order_status: OrderStatus;
  email_sent: boolean;
  email_sent_at?: string | null;
  is_admin_created?: boolean;
  admin_notes?: string | null;
  bundle_selections?: BundleItemSelection[];
  created_at: string;
  paid_at?: string | null;
}

export interface AdminCreateOrderPayload {
  campaign_id?: string;
  item_name?: string;
  student_name: string;
  student_email: string;
  phone_number: string;
  nif?: string;
  size: SweatSize | string;
  color?: string;
  delivery_type: DeliveryType;
  shipping_address?: string;
  shipping_postal_code?: string;
  shipping_city?: string;
  item_price?: number;
  shipping_fee?: number;
  payment_fee?: number;
  total_amount?: number;
  payment_status: 'paid' | 'pending';
  order_status?: OrderStatus;
  send_email?: boolean;
  admin_notes?: string;
  bundle_selections?: BundleItemSelection[];
}

export interface CheckoutPayload {
  campaign_id?: string;
  item_name?: string;
  student_name: string;
  student_email: string;
  phone_number: string;
  nif?: string;
  size?: SweatSize | string;
  color?: string;
  delivery_type: DeliveryType;
  shipping_address?: string;
  shipping_postal_code?: string;
  shipping_city?: string;
  bundle_selections?: BundleItemSelection[];
}

export interface CheckoutResponse {
  success: boolean;
  orderId: string;
  itemPrice?: number;
  shippingFee?: number;
  paymentFee?: number;
  totalAmount: number;
  phoneNumber: string;
  expiresInSeconds: number;
  message: string;
}

export interface OrderStatusResponse {
  orderId: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paidAt?: string | null;
  createdAt?: string | null;
  studentName: string;
  itemName?: string;
  studentEmail?: string;
  phoneNumber?: string;
  size: SweatSize | string;
  color?: string;
  bundle_selections?: BundleItemSelection[];
  itemPrice?: number;
  shippingFee?: number;
  paymentFee?: number;
  totalAmount: number;
  deliveryType: DeliveryType;
  shippingAddress?: string | null;
  shippingPostalCode?: string | null;
  shippingCity?: string | null;
  pickupLocation?: string;
}

export interface ProductStatBreakdown {
  itemName: string;
  totalUnits: number;
  sizeCounts: Record<SweatSize | string, number>;
  colorCounts: Record<string, number>;
}

export interface ShopSummaryStats {
  totalOrders: number;
  totalPaidOrders: number;
  totalItems: number;
  totalRevenue: number;
  sizeCounts: Record<SweatSize | string, number>;
  pickupCount: number;
  shippingCount: number;
  byProduct?: ProductStatBreakdown[];
  testOrdersCount?: number;
}
