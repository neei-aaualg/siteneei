export type SweatSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';

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
  deadline_date: string; // YYYY-MM-DD
  is_active: boolean;
  is_available?: boolean;
  allow_pickup: boolean;
  allow_shipping: boolean;
  pickup_location: string;
  sizes_available: SweatSize[];
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
}

export interface ShopOrder {
  id: string;
  campaign_id: string;
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
  total_amount: number;
  payment_status: PaymentStatus;
  payment_provider: string;
  payment_ref?: string | null;
  order_status: OrderStatus;
  email_sent: boolean;
  email_sent_at?: string | null;
  created_at: string;
  paid_at?: string | null;
}

export interface CheckoutPayload {
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
  size: SweatSize;
  color?: string;
  totalAmount: number;
  deliveryType: DeliveryType;
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
