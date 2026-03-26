// ============================================================
// OhmerEats — TypeScript Types
// ============================================================

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'preparing'
  | 'ready_for_pickup'
  | 'rider_claimed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export type RemitStatus = 'pending' | 'partial' | 'full' | 'overdue'

export type RemittanceRule = 'per_delivery' | 'daily' | 'weekly' | 'custom'

export interface Restaurant {
  id: string
  name: string
  slug: string
  description: string | null
  address: string
  phone: string | null
  owner_email: string
  logo_url: string | null
  cover_url: string | null
  is_open: boolean
  is_active: boolean
  remittance_rule: RemittanceRule
  remittance_days: number
  created_at: string
  updated_at: string
}

export interface MenuCategory {
  id: string
  restaurant_id: string
  name: string
  sort_order: number
}

export interface MenuItem {
  id: string
  restaurant_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  sort_order: number
  created_at: string
}

export interface MenuItemWithCategory extends MenuItem {
  menu_categories: MenuCategory | null
}

export interface Rider {
  id: string
  user_id: string | null
  name: string
  phone: string | null
  is_available: boolean
  is_active: boolean
  current_lat: number | null
  current_lng: number | null
  last_seen_at: string | null
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  restaurant_id: string
  rider_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: string
  delivery_lat: number | null
  delivery_lng: number | null
  notes: string | null
  status: OrderStatus
  subtotal: number
  delivery_fee: number
  total: number
  tracking_token: string
  // Remittance fields (v3.0)
  rider_earnings: number | null
  restaurant_amount: number | null
  remit_status: RemitStatus
  amount_remitted: number
  remit_due_date: string | null
  remit_notes: string | null
  created_at: string
  updated_at: string
}

export interface RemittanceLog {
  id: string
  order_id: string
  rider_id: string | null
  amount: number
  remit_type: 'partial' | 'full'
  notes: string | null
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string | null
  name: string
  price: number
  quantity: number
  subtotal: number
}

export interface OrderWithDetails extends Order {
  restaurants: Restaurant
  riders: Rider | null
  order_items: OrderItem[]
}

// Cart (client-side only, stored in localStorage)
export interface CartItem {
  menu_item_id: string
  name: string
  price: number
  quantity: number
}

// ============================================================
// Display Maps
// ============================================================

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Order Accepted',
  rejected: 'Rejected',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  rider_claimed: 'Rider Assigned',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready_for_pickup: 'bg-purple-100 text-purple-800',
  rider_claimed: 'bg-teal-100 text-teal-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'rider_claimed',
  'out_for_delivery',
  'delivered',
]

export const REMIT_STATUS_LABELS: Record<RemitStatus, string> = {
  pending: 'Not Yet Remitted',
  partial: 'Partially Remitted',
  full: 'Fully Remitted',
  overdue: 'OVERDUE',
}

export const REMIT_STATUS_COLORS: Record<RemitStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  full: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
}

export const REMITTANCE_RULE_LABELS: Record<RemittanceRule, string> = {
  per_delivery: 'Per Delivery (remit after each order)',
  daily: 'Daily (remit by end of day)',
  weekly: 'Weekly (remit by end of week)',
  custom: 'Custom (set number of days)',
}
