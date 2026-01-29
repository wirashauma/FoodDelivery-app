// ============================================================
// TITIPIN ADMIN - TYPE DEFINITIONS
// Matching backend API schemas for professional food delivery app
// ============================================================

// ============================================================
// ENUMS
// ============================================================

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  DELIVERER = 'DELIVERER',
  MERCHANT = 'MERCHANT',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  OPERATIONS_STAFF = 'OPERATIONS_STAFF',
  FINANCE_STAFF = 'FINANCE_STAFF',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
}

export enum MerchantStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum DocumentType {
  KTP = 'KTP',
  NPWP = 'NPWP',
  SIUP = 'SIUP',
  HALAL_CERTIFICATE = 'HALAL_CERTIFICATE',
  HEALTH_CERTIFICATE = 'HEALTH_CERTIFICATE',
  BANK_STATEMENT = 'BANK_STATEMENT',
  SIM = 'SIM',
  STNK = 'STNK',
  VEHICLE_PHOTO = 'VEHICLE_PHOTO',
  SELFIE = 'SELFIE',
  OTHER = 'OTHER',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  DRIVER_AT_MERCHANT = 'DRIVER_AT_MERCHANT',
  PICKED_UP = 'PICKED_UP',
  ON_THE_WAY = 'ON_THE_WAY',
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
  DISPUTED = 'DISPUTED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  WALLET = 'WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  EWALLET = 'EWALLET',
  QRIS = 'QRIS',
  VA = 'VA',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PromoType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_DELIVERY = 'FREE_DELIVERY',
  BUY_ONE_GET_ONE = 'BUY_ONE_GET_ONE',
  CASHBACK = 'CASHBACK',
}

export enum WalletTransactionType {
  TOP_UP = 'TOP_UP',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  WITHDRAWAL = 'WITHDRAWAL',
  COMMISSION = 'COMMISSION',
  BONUS = 'BONUS',
  PAYOUT = 'PAYOUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum DriverStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  BICYCLE = 'BICYCLE',
  CAR = 'CAR',
  WALKING = 'WALKING',
}

// ============================================================
// BASE TYPES
// ============================================================

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  notes?: string;
}

// ============================================================
// MERCHANT TYPES
// ============================================================

export interface Merchant {
  id: string;
  userId: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string;
  logoUrl?: string;
  bannerUrl?: string;
  status: MerchantStatus;
  isOpen: boolean;
  rating: number;
  totalReviews: number;
  totalOrders: number;
  commissionRate: number;
  openTime: string;
  closeTime: string;
  minimumOrder: number;
  averagePreparationTime: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  documents?: MerchantDocument[];
  categories?: Category[];
  cuisineTypes?: CuisineType[];
}

export interface MerchantDocument {
  id: string;
  merchantId: string;
  type: DocumentType;
  documentUrl: string;
  status: DocumentStatus;
  notes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalPayout: number;
  pendingPayout: number;
  averageRating: number;
  totalReviews: number;
}

// ============================================================
// PRODUCT TYPES
// ============================================================

export interface Product {
  id: string;
  merchantId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  isAvailable: boolean;
  isPopular: boolean;
  preparationTime: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  modifierGroups?: ProductModifierGroup[];
}

export interface ProductModifierGroup {
  id: string;
  productId: string;
  name: string;
  description?: string;
  isRequired: boolean;
  minSelection: number;
  maxSelection: number;
  sortOrder: number;
  modifiers: ProductModifier[];
}

export interface ProductModifier {
  id: string;
  groupId: string;
  name: string;
  price: number;
  isAvailable: boolean;
  sortOrder: number;
}

// ============================================================
// ORDER TYPES
// ============================================================

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  merchantId: string;
  driverId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  notes?: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  merchantConfirmedAt?: string;
  driverAssignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  customer?: User;
  merchant?: Merchant;
  driver?: DriverProfile;
  items?: OrderItem[];
  payment?: Payment;
  proofOfDeliveryUrl?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  modifiers?: OrderItemModifier[];
}

export interface OrderItemModifier {
  id: string;
  orderItemId: string;
  modifierId: string;
  modifierName: string;
  price: number;
}

export interface OrderLiveStats {
  total: number;
  pending: number;
  confirmed: number;
  preparing: number;
  readyForPickup: number;
  onTheWay: number;
  delivered: number;
  cancelled: number;
  averageDeliveryTime: number;
  revenueToday: number;
}

// ============================================================
// PAYMENT & FINANCIAL TYPES
// ============================================================

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paymentGateway?: string;
  paidAt?: string;
  expiredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  holdBalance: number;
  availableBalance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

export interface MerchantPayout {
  id: string;
  merchantId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: PayoutStatus;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  notes?: string;
  processedAt?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
  merchant?: Merchant;
}

export interface DriverPayout {
  id: string;
  driverId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: PayoutStatus;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  notes?: string;
  processedAt?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
  driver?: DriverProfile;
}

export interface Refund {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  status: PayoutStatus;
  processedAt?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
  order?: Order;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalOrders: number;
  totalDeliveryFees: number;
  totalServiceFees: number;
  totalCommissions: number;
  totalPayouts: number;
  pendingPayouts: number;
  totalRefunds: number;
  netRevenue: number;
}

export interface FinancialReport {
  period: string;
  startDate: string;
  endDate: string;
  summary: FinancialSummary;
  dailyBreakdown: {
    date: string;
    revenue: number;
    orders: number;
    deliveryFees: number;
    commissions: number;
  }[];
}

// ============================================================
// PROMO TYPES
// ============================================================

export interface Promo {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: PromoType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  userLimit?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  applicableMerchants?: string[];
  applicableCategories?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Voucher {
  id: string;
  code: string;
  promoId?: string;
  userId?: string;
  discountType: PromoType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  isUsed: boolean;
  usedAt?: string;
  orderId?: string;
  createdAt: string;
  promo?: Promo;
  user?: User;
}

export interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  linkType?: 'MERCHANT' | 'PROMO' | 'CATEGORY' | 'EXTERNAL';
  linkId?: string;
  position: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// DRIVER TYPES
// ============================================================

export interface DriverProfile {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  licensePlate: string;
  vehicleColor?: string;
  status: DriverStatus;
  isOnline: boolean;
  isAvailable: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  acceptanceRate: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  documents?: DriverDocument[];
  wallet?: Wallet;
}

export interface DriverDocument {
  id: string;
  driverId: string;
  type: DocumentType;
  documentUrl: string;
  status: DocumentStatus;
  notes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverPerformance {
  driverId: string;
  period: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  acceptanceRate: number;
  completionRate: number;
  averageDeliveryTime: number;
  onlineHours: number;
  dailyStats: {
    date: string;
    orders: number;
    earnings: number;
    rating: number;
    onlineHours: number;
  }[];
}

// ============================================================
// MASTER DATA TYPES
// ============================================================

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  iconUrl?: string;
  sortOrder: number;
  isActive: boolean;
  parentId?: string;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CuisineType {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  district: string;
  baseDeliveryFee: number;
  pricePerKm: number;
  minDeliveryFee: number;
  maxDeliveryFee: number;
  maxDeliveryDistance: number;
  isActive: boolean;
  polygon?: GeoPolygon;
  createdAt: string;
  updatedAt: string;
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
  isPublic: boolean;
  updatedAt: string;
  updatedBy?: string;
}

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// ============================================================
// REVIEW TYPES
// ============================================================

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  merchantId?: string;
  driverId?: string;
  rating: number;
  comment?: string;
  merchantReply?: string;
  merchantReplyAt?: string;
  images?: string[];
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: User;
  order?: Order;
}

// ============================================================
// AUDIT LOG TYPES
// ============================================================

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: User;
}

// ============================================================
// PAGINATION & RESPONSE TYPES
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================================
// FILTER & QUERY TYPES
// ============================================================

export interface MerchantFilters {
  status?: MerchantStatus;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderFilters {
  status?: OrderStatus | OrderStatus[];
  merchantId?: string;
  driverId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PayoutFilters {
  status?: PayoutStatus;
  merchantId?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface DriverFilters {
  status?: DriverStatus;
  vehicleType?: VehicleType;
  isOnline?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
