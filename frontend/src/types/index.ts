export interface User {
  user_id: number;
  username: string;
  email: string;
  phone_number: string | null;
  role: 'CUSTOMER' | 'DELIVERER' | 'ADMIN' | 'MERCHANT' | 'SUPER_ADMIN' | 'OPERATIONS_STAFF' | 'FINANCE_STAFF' | 'CUSTOMER_SERVICE';
  created_at: string;
  updated_at: string;
}

export interface DelivererProfile {
  deliverer_id: number;
  user_id: number;
  vehicle_type: string | null;
  license_plate: string | null;
  is_available: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
  rating: number;
  total_deliveries: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason: string | null;
  created_at: string;
  user?: User;
}

export interface Order {
  order_id: number;
  user_id: number;
  store_id: number;
  deliverer_id: number | null;
  status: string;
  total_amount: number;
  delivery_fee: number;
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  deliverer?: DelivererProfile;
  store?: Store;
  order_items?: OrderItem[];
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  subtotal: number;
  notes: string | null;
  menu_item?: MenuItem;
}

export interface Store {
  store_id: number;
  user_id: number;
  name: string;
  description: string | null;
  address: string;
  phone_number: string | null;
  latitude: number | null;
  longitude: number | null;
  is_open: boolean;
  rating: number;
  image_url: string | null;
  created_at: string;
}

export interface MenuItem {
  menu_item_id: number;
  store_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  category: string | null;
}

export interface DashboardStats {
  totalUsers: number;
  totalDeliverers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingDeliverers: number;
  activeOrders: number;
  recentOrders: Order[];
  userGrowth: { date: string; count: number }[];
  orderGrowth: { date: string; count: number }[];
}

export interface EarningsSummary {
  totalRevenue: number;
  totalDeliveryFees: number;
  averageOrderValue: number;
  totalOrders: number;
  completedOrders: number;
  dailyEarnings: { date: string; revenue: number; orders: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
