// ==============================================
// HOSPIBOT SHARED TYPES
// Used by both frontend and backend
// ==============================================

// Tenant Types
export type TenantType =
  | 'HOSPITAL'
  | 'CLINIC'
  | 'DOCTOR'
  | 'DIAGNOSTIC_CENTER'
  | 'IVF_CENTER'
  | 'PHARMACY'
  | 'HOME_HEALTHCARE'
  | 'EQUIPMENT_VENDOR';

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED';
export type PlanType = 'STARTER' | 'GROWTH' | 'ENTERPRISE';

// User Roles
export type UserRole =
  | 'SUPER_ADMIN'
  | 'TENANT_ADMIN'
  | 'BRANCH_ADMIN'
  | 'DOCTOR'
  | 'RECEPTIONIST'
  | 'BILLING_STAFF'
  | 'MARKETING_USER'
  | 'LAB_TECHNICIAN'
  | 'PHARMACIST'
  | 'NURSE';

// Appointment
export type AppointmentType = 'SCHEDULED' | 'WALK_IN' | 'EMERGENCY' | 'TELECONSULT' | 'FOLLOW_UP';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';

// Billing
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'UPI' | 'CARD' | 'NET_BANKING' | 'CASH' | 'WHATSAPP_PAY' | 'INSURANCE';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

// CRM
export type LeadStage = 'NEW' | 'CONTACTED' | 'APPOINTMENT_BOOKED' | 'VISITED' | 'FOLLOW_UP_PENDING' | 'ACTIVE_PATIENT' | 'DORMANT' | 'LOST';
export type LeadSource = 'WHATSAPP' | 'WEBSITE' | 'WALK_IN' | 'REFERRAL' | 'GOOGLE_ADS' | 'FACEBOOK_ADS' | 'INSTAGRAM' | 'JUSTDIAL' | 'PRACTO' | 'OTHER';

// WhatsApp
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

// Beds
export type BedCategory = 'ICU' | 'SEMI_ICU' | 'GENERAL' | 'PRIVATE' | 'DELUXE' | 'PEDIATRIC' | 'MATERNITY' | 'ISOLATION';
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE' | 'HOUSEKEEPING';

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: any;
  timestamp: string;
}

// HospiBot brand constants
export const BRAND = {
  name: 'HospiBot',
  tagline: 'Global WhatsApp-Driven Healthcare Operating System',
  colors: {
    primary: '#0D7C66',
    primaryDark: '#0A5E4F',
    primaryLight: '#E8F5F0',
    accent: '#F59E0B',
    whatsapp: '#25D366',
    text: '#1E293B',
    surface: '#F8FAFC',
  },
} as const;
