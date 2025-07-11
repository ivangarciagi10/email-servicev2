import { DraftOrder, Customer } from '../types/shopify';

/**
 * Valida que los datos del draft order sean correctos
 */
export function validateDraftOrder(draftOrder: any): draftOrder is DraftOrder {
  return (
    draftOrder &&
    typeof draftOrder.id === 'number' &&
    typeof draftOrder.name === 'string' &&
    typeof draftOrder.email === 'string' &&
    Array.isArray(draftOrder.line_items)
  );
}

/**
 * Valida que los datos del cliente sean correctos
 */
export function validateCustomer(customer: any): customer is Customer {
  return (
    customer &&
    typeof customer.id === 'number' &&
    typeof customer.email === 'string' &&
    typeof customer.first_name === 'string' &&
    typeof customer.last_name === 'string'
  );
}

/**
 * Valida el formato del metafield del ejecutivo de cuenta
 */
export function validateAdvisorMetafield(metafieldValue: string): boolean {
  try {
    const data = JSON.parse(metafieldValue);
    return (
      data &&
      data.ejecutivo_de_cuenta &&
      typeof data.ejecutivo_de_cuenta.correo === 'string' &&
      data.ejecutivo_de_cuenta.correo.includes('@')
    );
  } catch (error) {
    return false;
  }
}

/**
 * Sanitiza el email para evitar inyección de código
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formatea el precio para mostrar
 */
export function formatPrice(price: string, currency: string): string {
  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice)) {
    return `${currency} 0.00`;
  }
  return `${currency} ${numericPrice.toFixed(2)}`;
}

/**
 * Obtiene el nombre completo del cliente
 */
export function getCustomerFullName(customer: Customer): string {
  return `${customer.first_name} ${customer.last_name}`.trim();
}

/**
 * Obtiene el nombre completo del asesor
 */
export function getAdvisorFullName(advisor: any): string {
  return `${advisor.first_name} ${advisor.last_name}`.trim();
} 