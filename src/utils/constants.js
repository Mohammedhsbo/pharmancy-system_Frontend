// ─── Role & Permission Constants (mirrors backend/utils/constants.js) ────────

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  PHARMACIST: 'pharmacist',
  CASHIER: 'cashier',
});

export const ROLE_LIST = Object.values(ROLES);

export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: 'Admin',
  [ROLES.PHARMACIST]: 'Pharmacist',
  [ROLES.CASHIER]: 'Cashier',
});

export const PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]: [
    'users:read', 'users:write', 'users:delete',
    'inventory:read', 'inventory:write', 'inventory:delete',
    'pos:read', 'pos:write', 'pos:refund',
    'patients:read', 'patients:write', 'patients:delete',
    'prescriptions:read', 'prescriptions:write', 'prescriptions:dispense',
    'reports:read', 'reports:export',
    'dashboard:read',
    'notifications:read', 'notifications:manage',
    'settings:read', 'settings:write',
  ],
  [ROLES.PHARMACIST]: [
    'inventory:read', 'inventory:write',
    'pos:read', 'pos:write',
    'patients:read', 'patients:write',
    'prescriptions:read', 'prescriptions:write', 'prescriptions:dispense',
    'reports:read',
    'dashboard:read',
    'notifications:read',
  ],
  [ROLES.CASHIER]: [
    'inventory:read',
    'pos:read', 'pos:write',
    'patients:read',
    'prescriptions:read',
    'dashboard:read',
    'notifications:read',
  ],
});

// ─── Invoice ─────────────────────────────────────────────────────────────────

export const INVOICE_STATUS = Object.freeze({
  PAID: 'paid',
  PENDING: 'pending',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
  CANCELLED: 'cancelled',
});

export const PAYMENT_METHODS = Object.freeze({
  CASH: 'cash',
  CARD: 'card',
  WALLET: 'wallet',
  MIXED: 'mixed',
});

// ─── Prescription ────────────────────────────────────────────────────────────

export const PRESCRIPTION_STATUS = Object.freeze({
  PENDING: 'pending',
  PARTIALLY_DISPENSED: 'partially_dispensed',
  DISPENSED: 'dispensed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
});

// ─── Stock ───────────────────────────────────────────────────────────────────

export const STOCK_MOVEMENT_TYPES = Object.freeze({
  IN: 'in',
  OUT: 'out',
  ADJUSTMENT: 'adjustment',
  RETURN: 'return',
});

// ─── Notifications ───────────────────────────────────────────────────────────

export const NOTIFICATION_TYPES = Object.freeze({
  LOW_STOCK: 'low_stock',
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired',
  SYSTEM: 'system',
  INVOICE: 'invoice',
});

export const NOTIFICATION_SEVERITY = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
});

// ─── Medicine Units ──────────────────────────────────────────────────────────

export const MEDICINE_UNITS = Object.freeze({
  TABLET: 'tablet',
  CAPSULE: 'capsule',
  BOTTLE: 'bottle',
  STRIP: 'strip',
  TUBE: 'tube',
  AMPOULE: 'ampoule',
  VIAL: 'vial',
  SACHET: 'sachet',
  BOX: 'box',
  PIECE: 'piece',
});

export const MEDICINE_UNIT_LIST = Object.values(MEDICINE_UNITS);

// ─── Pagination defaults ─────────────────────────────────────────────────────

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

// ─── Utility ─────────────────────────────────────────────────────────────────

export function hasPermission(role, permission) {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyRole(userRole, allowedRoles) {
  return allowedRoles.includes(userRole);
}
