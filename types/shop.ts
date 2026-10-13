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
  features?: string[];
  category?: string;
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
  features?: string[];
  category?: string;
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
  features: string[];
  category: string;
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
  allowShipping?: boolean;
  shippingFee?: number;
  pickupLocation?: string;
  campaignData?: ShopCampaign;
}

export interface ShopOrder {
  id: string;
  campaign_id: string;
  item_name: string;
  student_name: string;
  student_email: string;
  phone_number: string;
  nif?: string | null;
  size: SweatSize;
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
  size: SweatSize;
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
}

export interface CheckoutPayload {
  campaign_id?: string;
  item_name?: string;
  student_name: string;
  student_email: string;
  phone_number: string;
  nif?: string;
  size: SweatSize;
  delivery_type: DeliveryType;
  shipping_address?: string;
  shipping_postal_code?: string;
  shipping_city?: string;
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
  size: SweatSize;
  color?: string;
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

export interface ShopSummaryStats {
  totalOrders: number;
  totalPaidOrders: number;
  totalRevenue: number;
  sizeCounts: Record<SweatSize, number>;
  pickupCount: number;
  shippingCount: number;
}
