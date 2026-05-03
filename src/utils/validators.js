// ─── Frontend Validation Utilities ───────────────────────────────────────────
// Mirrors backend Joi validation schemas to prevent invalid payloads
// from ever reaching the API. Each function returns:
//   { valid: boolean, errors: { [field]: string } }
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const VALID_BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createResult() {
  return { valid: true, errors: {} };
}

function addError(result, field, message) {
  result.valid = false;
  result.errors[field] = message;
}

function requireString(result, value, field, label, { min, max, required = true } = {}) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (required && !trimmed) {
    addError(result, field, `${label} is required.`);
    return false;
  }
  if (!required && !trimmed) return true;
  if (min && trimmed.length < min) {
    addError(result, field, `${label} must be at least ${min} characters.`);
    return false;
  }
  if (max && trimmed.length > max) {
    addError(result, field, `${label} cannot exceed ${max} characters.`);
    return false;
  }
  return true;
}

function requireNumber(result, value, field, label, { min, integer = false, required = true } = {}) {
  if (required && (value === '' || value === null || value === undefined)) {
    addError(result, field, `${label} is required.`);
    return false;
  }
  if (!required && (value === '' || value === null || value === undefined)) return true;
  const num = Number(value);
  if (isNaN(num)) {
    addError(result, field, `${label} must be a valid number.`);
    return false;
  }
  if (integer && !Number.isInteger(num)) {
    addError(result, field, `${label} must be a whole number.`);
    return false;
  }
  if (min !== undefined && num < min) {
    addError(result, field, `${label} must be at least ${min}.`);
    return false;
  }
  return true;
}

function requireObjectId(result, value, field, label, { required = true } = {}) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (required && !trimmed) {
    addError(result, field, `${label} is required.`);
    return false;
  }
  if (!required && !trimmed) return true;
  if (!OBJECT_ID_REGEX.test(trimmed)) {
    addError(result, field, `Invalid ${label.toLowerCase()} selection.`);
    return false;
  }
  return true;
}

// ─── Login ───────────────────────────────────────────────────────────────────

export function validateLogin(data) {
  const r = createResult();
  const email = (data.email || '').trim();
  if (!email) {
    addError(r, 'email', 'Email is required.');
  } else if (!EMAIL_REGEX.test(email)) {
    addError(r, 'email', 'Please enter a valid email address.');
  }
  if (!data.password) {
    addError(r, 'password', 'Password is required.');
  }
  return r;
}

// ─── Create User ─────────────────────────────────────────────────────────────

export function validateCreateUser(data) {
  const r = createResult();
  requireString(r, data.name, 'name', 'Name', { min: 2, max: 100 });
  const email = (data.email || '').trim();
  if (!email) {
    addError(r, 'email', 'Email is required.');
  } else if (!EMAIL_REGEX.test(email)) {
    addError(r, 'email', 'Please enter a valid email address.');
  }
  if (!data.password) {
    addError(r, 'password', 'Password is required.');
  } else {
    if (data.password.length < 8) {
      addError(r, 'password', 'Password must be at least 8 characters.');
    } else if (!PASSWORD_REGEX.test(data.password)) {
      addError(r, 'password', 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&#).');
    }
  }
  const validRoles = ['admin', 'pharmacist', 'cashier'];
  if (!data.role || !validRoles.includes(data.role)) {
    addError(r, 'role', 'A valid role is required.');
  }
  return r;
}

// ─── Update User ─────────────────────────────────────────────────────────────

export function validateUpdateUser(data) {
  const r = createResult();
  if (data.name !== undefined && data.name !== '') {
    requireString(r, data.name, 'name', 'Name', { min: 2, max: 100, required: false });
  }
  if (data.email) {
    if (!EMAIL_REGEX.test(data.email.trim())) {
      addError(r, 'email', 'Please enter a valid email address.');
    }
  }
  if (data.password) {
    if (data.password.length < 8) {
      addError(r, 'password', 'Password must be at least 8 characters.');
    } else if (!PASSWORD_REGEX.test(data.password)) {
      addError(r, 'password', 'Password must contain uppercase, lowercase, number, and special character.');
    }
  }
  return r;
}

// ─── Create Medicine ─────────────────────────────────────────────────────────

export function validateCreateMedicine(data) {
  const r = createResult();
  requireString(r, data.name, 'name', 'Medicine name', { max: 200 });
  requireObjectId(r, data.category, 'category', 'Category');
  requireNumber(r, data.purchasePrice, 'purchasePrice', 'Purchase price', { min: 0 });
  requireNumber(r, data.sellingPrice, 'sellingPrice', 'Selling price', { min: 0 });
  requireNumber(r, data.quantity, 'quantity', 'Quantity', { min: 0, integer: true });

  const purchasePrice = Number(data.purchasePrice);
  const sellingPrice = Number(data.sellingPrice);
  if (!isNaN(purchasePrice) && !isNaN(sellingPrice) && sellingPrice < purchasePrice) {
    addError(r, 'sellingPrice', 'Selling price should not be less than purchase price.');
  }

  const expiryDate = data.expiryDate;
  if (!expiryDate) {
    addError(r, 'expiryDate', 'Expiry date is required.');
  } else if (new Date(expiryDate) <= new Date()) {
    addError(r, 'expiryDate', 'Expiry date must be in the future.');
  }
  return r;
}

// ─── Update Medicine ─────────────────────────────────────────────────────────

export function validateUpdateMedicine(data) {
  const r = createResult();
  if (data.name !== undefined) {
    requireString(r, data.name, 'name', 'Medicine name', { max: 200 });
  }
  if (data.category) {
    requireObjectId(r, data.category, 'category', 'Category', { required: false });
  }
  if (data.purchasePrice !== undefined && data.purchasePrice !== '') {
    requireNumber(r, data.purchasePrice, 'purchasePrice', 'Purchase price', { min: 0, required: false });
  }
  if (data.sellingPrice !== undefined && data.sellingPrice !== '') {
    requireNumber(r, data.sellingPrice, 'sellingPrice', 'Selling price', { min: 0, required: false });
  }
  return r;
}

// ─── Adjust Stock ────────────────────────────────────────────────────────────

export function validateAdjustStock(data) {
  const r = createResult();
  requireNumber(r, data.quantity, 'quantity', 'Quantity', { min: 1, integer: true });
  const validTypes = ['in', 'out', 'adjustment', 'return'];
  if (!data.type || !validTypes.includes(data.type)) {
    addError(r, 'type', 'Valid adjustment type is required.');
  }
  requireString(r, data.reason, 'reason', 'Reason', { max: 500 });
  return r;
}

// ─── Create Patient ──────────────────────────────────────────────────────────

export function validateCreatePatient(data) {
  const r = createResult();
  requireString(r, data.name, 'name', 'Patient name', { min: 2, max: 150 });
  requireString(r, data.phone, 'phone', 'Phone number');
  if (data.email && !EMAIL_REGEX.test(data.email.trim())) {
    addError(r, 'email', 'Please enter a valid email address.');
  }
  if (data.gender) {
    const validGenders = ['male', 'female'];
    if (!validGenders.includes(data.gender)) {
      addError(r, 'gender', 'Gender must be male or female.');
    }
  }
  if (data.bloodType && !VALID_BLOOD_TYPES.includes(data.bloodType)) {
    addError(r, 'bloodType', 'Please select a valid blood type.');
  }
  return r;
}

// ─── Update Patient ──────────────────────────────────────────────────────────

export function validateUpdatePatient(data) {
  const r = createResult();
  if (data.name !== undefined && data.name !== '') {
    requireString(r, data.name, 'name', 'Patient name', { min: 2, max: 150, required: false });
  }
  if (data.email && !EMAIL_REGEX.test(data.email.trim())) {
    addError(r, 'email', 'Please enter a valid email address.');
  }
  if (data.gender) {
    const validGenders = ['male', 'female'];
    if (!validGenders.includes(data.gender)) {
      addError(r, 'gender', 'Gender must be male or female.');
    }
  }
  if (data.bloodType && !VALID_BLOOD_TYPES.includes(data.bloodType)) {
    addError(r, 'bloodType', 'Please select a valid blood type.');
  }
  return r;
}

// ─── Create Prescription ─────────────────────────────────────────────────────

export function validateCreatePrescription(data) {
  const r = createResult();
  requireObjectId(r, data.patient, 'patient', 'Patient');
  requireString(r, data.doctor, 'doctor', 'Doctor name');
  if (data.notes !== undefined && data.notes !== '') {
    requireString(r, data.notes, 'notes', 'Notes', { max: 1000, required: false });
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    addError(r, 'items', 'At least one medication item is required.');
  } else {
    const validItems = data.items.filter((i) => i.medicineName && i.medicineName.trim());
    if (validItems.length === 0) {
      addError(r, 'items', 'At least one item must have a medicine name.');
    }
    data.items.forEach((item, idx) => {
      requireString(r, item.medicineName, `items[${idx}].medicineName`, `Medication ${idx + 1} name`);
      if (item.quantity !== undefined && item.quantity !== '') {
        requireNumber(r, item.quantity, `items[${idx}].quantity`, `Medication ${idx + 1} quantity`, {
          min: 1,
          integer: true,
          required: false,
        });
      }
    });
  }
  return r;
}

// ─── Create Invoice ──────────────────────────────────────────────────────────

export function validateUpdatePrescription(data) {
  const r = createResult();
  if (data.doctor !== undefined) {
    requireString(r, data.doctor, 'doctor', 'Doctor name', { required: false });
  }
  if (data.notes !== undefined && data.notes !== '') {
    requireString(r, data.notes, 'notes', 'Notes', { max: 1000, required: false });
  }
  if (data.items !== undefined) {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      addError(r, 'items', 'At least one medication item is required.');
    } else {
      data.items.forEach((item, idx) => {
        requireString(r, item.medicineName, `items[${idx}].medicineName`, `Medication ${idx + 1} name`);
        if (item.quantity !== undefined && item.quantity !== '') {
          requireNumber(r, item.quantity, `items[${idx}].quantity`, `Medication ${idx + 1} quantity`, {
            min: 1,
            integer: true,
            required: false,
          });
        }
      });
    }
  }
  if (data.status !== undefined) {
    const validStatuses = ['pending', 'partially_dispensed', 'dispensed', 'expired', 'cancelled'];
    if (!validStatuses.includes(data.status)) {
      addError(r, 'status', 'A valid prescription status is required.');
    }
  }
  return r;
}

export function validateCreateInvoice(data) {
  const r = createResult();
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    addError(r, 'items', 'Invoice must have at least one item.');
  } else {
    data.items.forEach((item, idx) => {
      if (!item.medicine || !OBJECT_ID_REGEX.test(item.medicine)) {
        addError(r, `items[${idx}].medicine`, `Item ${idx + 1} has an invalid medicine reference.`);
      }
      if (!item.quantity || item.quantity < 1) {
        addError(r, `items[${idx}].quantity`, `Item ${idx + 1} must have a quantity of at least 1.`);
      }
    });
  }

  const validMethods = ['cash', 'card', 'wallet', 'mixed'];
  if (!data.paymentMethod || !validMethods.includes(data.paymentMethod)) {
    addError(r, 'paymentMethod', 'A valid payment method is required.');
  }

  requireNumber(r, data.paidAmount, 'paidAmount', 'Paid amount', { min: 0 });

  return r;
}

// ─── Change Password ─────────────────────────────────────────────────────────

export function validateChangePassword(data) {
  const r = createResult();
  requireString(r, data.currentPassword, 'currentPassword', 'Current password');
  if (!data.newPassword) {
    addError(r, 'newPassword', 'New password is required.');
  } else {
    if (data.newPassword.length < 8) {
      addError(r, 'newPassword', 'New password must be at least 8 characters.');
    } else if (!PASSWORD_REGEX.test(data.newPassword)) {
      addError(r, 'newPassword', 'New password must contain uppercase, lowercase, number, and special character.');
    }
  }
  if (!data.confirmPassword) {
    addError(r, 'confirmPassword', 'Password confirmation is required.');
  } else if (data.newPassword && data.confirmPassword !== data.newPassword) {
    addError(r, 'confirmPassword', 'Passwords do not match.');
  }
  return r;
}
