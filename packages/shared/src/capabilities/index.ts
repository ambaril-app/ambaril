/**
 * Provider Abstraction Layer
 *
 * Modules consume capabilities, never providers directly.
 * Each capability has a standard interface that providers implement.
 *
 * Example: ERP module needs fiscal capability.
 * - In dev/test: uses MockFiscalProvider
 * - In production: uses NFeProvider (Sefaz integration)
 * - The ERP module code is identical in both cases
 */

export type { EcommerceCapability } from "./ecommerce";
export type { CheckoutCapability } from "./checkout";
export type { PaymentsCapability } from "./payments";
export type { FiscalCapability } from "./fiscal";
export type { ShippingCapability } from "./shipping";
export type { MessagingCapability } from "./messaging";
