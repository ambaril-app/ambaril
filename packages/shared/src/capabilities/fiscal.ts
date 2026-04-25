/**
 * Fiscal Capability — tax document generation and management
 * Provider examples: Sefaz (NF-e), manual entry, mock
 */

export interface FiscalDocument {
  id: string;
  tenantId: string;
  type: "nfe" | "nfce" | "nfs";
  number: string;
  series: string;
  status: "draft" | "authorized" | "cancelled" | "denied";
  xmlUrl?: string;
  pdfUrl?: string;
  issuedAt?: Date;
  totalCents: number;
}

export interface FiscalCapability {
  /** Issue a fiscal document for an order */
  issueDocument(params: {
    tenantId: string;
    orderId: string;
    type: "nfe" | "nfce" | "nfs";
  }): Promise<FiscalDocument>;

  /** Cancel an issued document */
  cancelDocument(params: {
    tenantId: string;
    documentId: string;
    reason: string;
  }): Promise<FiscalDocument>;

  /** Check document status with Sefaz */
  checkStatus(params: {
    tenantId: string;
    documentId: string;
  }): Promise<FiscalDocument>;

  /** Download XML/PDF */
  getDocumentFile(params: {
    tenantId: string;
    documentId: string;
    format: "xml" | "pdf";
  }): Promise<{ url: string; expiresAt: Date }>;
}
