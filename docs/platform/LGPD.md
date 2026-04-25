# LGPD.md -- Brazilian Data Privacy Law Compliance

> Ambaril (Ambaril) compliance with Lei Geral de Protecao de Dados (LGPD).
> Last updated: 2026-03-17

---

## 1. Overview

The **LGPD (Lei Geral de Protecao de Dados Pessoais)** -- Law No. 13,709/2018 -- is Brazil's general data protection law. It regulates the collection, storage, processing, and sharing of personal data of individuals located in Brazil.

Ambaril (Ambaril) processes personal data across its 15 modules. As the **data controller** (controlador), the brand operating Ambaril is responsible for lawful processing. Ambaril, as the platform, acts as the **data processor** (operador) and must implement technical and organizational measures to ensure compliance.

**Key LGPD principles Ambaril must uphold:**

- **Purpose limitation**: Data collected only for specific, explicit, and legitimate purposes.
- **Necessity**: Only collect data strictly necessary for the stated purpose.
- **Transparency**: Data subjects must be clearly informed about how their data is used.
- **Security**: Technical measures to protect personal data from unauthorized access, loss, or leakage.
- **Non-discrimination**: Data must not be used for discriminatory purposes.
- **Accountability**: The controller must demonstrate compliance.

**ANPD (Autoridade Nacional de Protecao de Dados)** is the enforcement authority. Penalties for non-compliance include fines of up to 2% of revenue (capped at R$50 million per infraction).

---

## 2. Personal Data Inventory

Complete inventory of personal data processed by Ambaril.

| Data Type                        | Source                                                       | Storage Location (Table)                                  | Module          | Legal Basis                                            | Retention Period                                                     |
| -------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------- | --------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| Full name                        | Checkout, CRM import, Creator registration, B2B registration | `crm.contacts.full_name`                                  | CRM             | Contract execution                                     | Duration of relationship + 5 years                                   |
| CPF (tax ID)                     | Checkout (for NF-e), Creator registration, B2B registration  | `crm.contacts.cpf`                                        | CRM / Fiscal    | Legal obligation (NF-e)                                | 5 years after last fiscal transaction                                |
| Email address                    | Checkout, CRM import, Creator registration, B2B registration | `crm.contacts.email`                                      | CRM             | Contract execution / Consent (marketing)               | Duration of relationship + 5 years; marketing: until consent revoked |
| Phone number                     | Checkout, CRM import, WhatsApp conversations                 | `crm.contacts.phone`                                      | CRM             | Contract execution / Consent (WhatsApp marketing)      | Duration of relationship + 5 years                                   |
| Shipping address                 | Checkout                                                     | `erp.orders.shipping_address` (JSONB)                     | ERP             | Contract execution                                     | 5 years (fiscal requirement)                                         |
| Billing address                  | Checkout                                                     | `erp.orders.billing_address` (JSONB)                      | ERP             | Contract execution                                     | 5 years (fiscal requirement)                                         |
| Purchase history                 | Orders, transactions                                         | `erp.orders`, `financial.transactions`                    | ERP / Financial | Contract execution / Legal obligation                  | 5 years (fiscal records)                                             |
| Payment information              | Mercado Pago (tokenized)                                     | `financial.transactions.mp_payment_id` (reference only)   | Financial       | Contract execution                                     | 5 years (fiscal records); full card data never stored                |
| IP address                       | All web requests, checkout, consent collection               | `crm.consents.ip_address`, `global.audit_logs.ip_address` | Global / CRM    | Legitimate interest (fraud prevention, audit)          | 6 months (audit logs); consent records: permanent                    |
| User agent                       | Web requests, consent collection                             | `crm.consents.user_agent`, `global.audit_logs.user_agent` | Global / CRM    | Legitimate interest (fraud prevention)                 | 6 months (audit logs)                                                |
| UTM parameters / browsing source | Checkout, landing pages                                      | `analytics.events.utm_*`, `erp.orders.utm_source`         | Analytics       | Consent (behavioral tracking)                          | 24 months, then anonymized                                           |
| WhatsApp conversation history    | WhatsApp Cloud API webhooks                                  | `crm.whatsapp_messages`                                   | CRM             | Contract execution (support) / Consent (marketing)     | Support: 2 years; Marketing: until consent revoked                   |
| Instagram interactions           | Instagram API                                                | `crm.instagram_interactions`                              | CRM             | Consent (UGC usage) / Legitimate interest (engagement) | 2 years                                                              |
| Creator personal data            | Creator registration form                                    | `creators.profiles`                                       | Creators        | Contract execution                                     | Duration of partnership + 5 years                                    |
| Creator bank/payment details     | Creator onboarding                                           | `creators.payment_info` (encrypted)                       | Creators        | Contract execution                                     | Duration of partnership + 1 year                                     |
| B2B retailer personal data       | B2B registration                                             | `b2b.retailers`                                           | B2B             | Contract execution                                     | Duration of relationship + 5 years                                   |
| B2B retailer CNPJ                | B2B registration                                             | `b2b.retailers.cnpj`                                      | B2B             | Legal obligation                                       | 5 years after last transaction                                       |
| Login credentials                | Registration                                                 | `global.users.password_hash`                              | Auth            | Contract execution                                     | Duration of account; deleted on account deletion                     |
| Session data                     | Authentication                                               | PostgreSQL `global.sessions` (ephemeral)                  | Auth            | Legitimate interest                                    | Session duration (24h max)                                           |
| Product review content           | Customer submission                                          | `catalog.reviews`                                         | Catalog         | Consent                                                | Indefinite (anonymized on data deletion request)                     |
| Segmentation tags                | CRM auto-tagging, manual                                     | `crm.contact_segments`                                    | CRM             | Legitimate interest / Consent                          | Duration of relationship                                             |

---

## 3. Legal Basis per Data Type

LGPD Article 7 defines 10 legal bases. Ambaril relies on the following four:

### 3.1 Contract Execution (Art. 7, V)

Data necessary to fulfill a purchase or service agreement.

- Customer name, email, phone (order communication)
- Shipping and billing address (order fulfillment)
- Purchase history and order data (service delivery)
- Payment reference IDs (transaction processing)
- Creator profile and payment data (creator partnership agreement)
- B2B retailer data (wholesale agreement)
- WhatsApp support conversations (customer service)

**No separate consent required.** Data processing is inherent to the contractual relationship.

### 3.2 Legitimate Interest (Art. 7, IX)

Data processing that serves the controller's legitimate business interests, balanced against the data subject's rights.

- IP address and user agent (fraud prevention, security)
- Analytics aggregation (business intelligence -- anonymized where possible)
- Customer segmentation (personalized but non-invasive)
- Instagram engagement tracking (brand monitoring)
- Audit logs (operational integrity, compliance)

**Requirement:** A Legitimate Interest Assessment (LIA / RIPD) must be documented for each use case. The assessment must demonstrate that the interest is legitimate, the processing is necessary, and the data subject's rights are not overridden.

### 3.3 Consent (Art. 7, I)

Explicit, informed, freely given, specific consent for each purpose.

- WhatsApp marketing messages (promotional campaigns, drop announcements)
- Email marketing (newsletters, promotions)
- Behavioral tracking (UTM tracking, browsing analytics beyond basic aggregation)
- UGC (User-Generated Content) usage (reposting customer photos, reviews in marketing)
- Cookies for third-party analytics (if any)

**Requirements:**

- Consent must be collected per channel/purpose (not bundled).
- Consent must not be pre-checked.
- Consent must be revocable at any time with the same ease it was given.
- Each consent must reference a specific terms/privacy policy version.

### 3.4 Legal Obligation (Art. 7, II)

Data that must be retained to comply with Brazilian law.

- NF-e (Nota Fiscal Eletronica) data: must be retained for 5 years (Art. 173, CTN)
- Fiscal records: transaction amounts, tax calculations, CPF/CNPJ
- Nota Fiscal XML files

**This data cannot be deleted upon data subject request.** It must be retained for the legally mandated period even if the customer exercises their right to deletion.

---

## 4. Consent Collection

### 4.1 Checkout Flow

During checkout, after the customer fills in their information and before completing the purchase, three consent checkboxes are displayed:

```
[ ] Quero receber novidades e promocoes por WhatsApp
[ ] Quero receber novidades e promocoes por e-mail
[ ] Concordo com o rastreamento de navegacao para ofertas personalizadas
```

**Rules:**

- None of the checkboxes are pre-checked (LGPD Art. 8, para. 4).
- Each checkbox is independent (the customer can consent to one without the others).
- Below the checkboxes, a link to the full privacy policy and terms of use is displayed.
- The order can be completed WITHOUT checking any box (consent is not a condition of purchase).
- Consent state is recorded immediately upon form submission, regardless of payment outcome.

### 4.2 Creators Portal

At creator registration (`creators.ambaril.app/register`):

```
[ ] Autorizo a Ambaril a usar meu conteudo (fotos, videos) em materiais de marketing
[ ] Quero receber comunicacoes sobre campanhas e oportunidades por WhatsApp
[ ] Quero receber comunicacoes sobre campanhas e oportunidades por e-mail
```

Additionally, the creator agreement (terms of partnership) includes a data processing clause. The creator must accept the full terms to register. This covers contract-execution processing.

### 4.3 B2B Portal

At retailer account approval (`b2b.ambaril.app`):

```
[ ] Quero receber atualizacoes de catalogo e novidades por WhatsApp
[ ] Quero receber atualizacoes de catalogo e novidades por e-mail
```

The B2B terms of service (accepted at registration) cover contract-execution data processing.

### 4.4 Consent Versioning

Every consent record links to a specific version of the terms and privacy policy:

- Terms and privacy policy are versioned (e.g., `v1.0`, `v1.1`, `v2.0`).
- When terms change, existing consents remain valid under the version they were given.
- If changes are material (new data usage, new third-party sharing), re-consent must be collected.
- A `terms_versions` table tracks all versions with content hash and effective date.

---

## 5. Consent Storage

### Schema: `crm.consents`

```sql
CREATE TABLE crm.consents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id      UUID NOT NULL REFERENCES crm.contacts(id) ON DELETE CASCADE,
    channel         TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'tracking', 'ugc')),
    consented       BOOLEAN NOT NULL,
    terms_version   TEXT NOT NULL,          -- e.g., 'v1.2'
    ip_address      INET,
    user_agent      TEXT,
    consented_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at      TIMESTAMPTZ,           -- NULL if currently consented
    source          TEXT NOT NULL CHECK (source IN ('checkout', 'creators_portal', 'b2b_portal', 'admin_manual', 'api')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_consents_contact_id ON crm.consents(contact_id);
CREATE INDEX idx_consents_channel ON crm.consents(channel);
CREATE INDEX idx_consents_active ON crm.consents(contact_id, channel) WHERE revoked_at IS NULL;
```

### Consent Lifecycle

1. **Grant**: A new row is inserted with `consented = true` and `revoked_at = NULL`.
2. **Revoke**: The existing row is updated with `revoked_at = now()` and `consented = false`. A new row is NOT created; the existing record is updated to maintain the audit trail.
3. **Re-grant**: If a customer re-consents after revoking, a new row is inserted (with the new terms version, IP, timestamp).
4. **Query current consent**: `SELECT * FROM crm.consents WHERE contact_id = ? AND channel = ? AND revoked_at IS NULL ORDER BY consented_at DESC LIMIT 1`.

### Consent Before Sending

Before any marketing message is sent (WhatsApp campaign, email blast), the system MUST check:

```sql
SELECT EXISTS (
    SELECT 1 FROM crm.consents
    WHERE contact_id = :contact_id
      AND channel = :channel
      AND consented = true
      AND revoked_at IS NULL
) AS has_consent;
```

If `has_consent` is `false`, the message MUST NOT be sent. This check is enforced at the queue level (PostgreSQL job processor validates consent before dispatching).

---

## 6. Data Subject Rights

LGPD Articles 17-22 grant data subjects the following rights. Here is how Ambaril implements each one.

### 6.1 Right of Access (Art. 18, II)

**What:** The data subject can request a copy of all personal data held about them.

**Implementation:**

- API endpoint: `GET /api/lgpd/data-export?contactId={id}`
- Admin action: "Export Customer Data" button on the CRM contact detail page.
- Output: JSON file containing all personal data across all modules.
- Response time: Generated asynchronously (PostgreSQL queue job). Customer is notified via email when ready. Maximum 15 calendar days per LGPD.
- Format:

```json
{
  "export_date": "2026-03-17T00:00:00Z",
  "data_subject": {
    "name": "Maria Silva",
    "email": "maria@example.com",
    "cpf": "123.456.789-00",
    "phone": "+5511999999999"
  },
  "addresses": [...],
  "orders": [...],
  "transactions": [...],
  "consents": [...],
  "whatsapp_messages": [...],
  "reviews": [...],
  "segments": [...],
  "audit_trail": [...]
}
```

### 6.2 Right of Deletion / Anonymization (Art. 18, VI)

**What:** The data subject can request deletion of their personal data.

**Implementation:**

- API endpoint: `POST /api/lgpd/deletion-request`
- Admin action: "Delete Customer Data" button on CRM contact detail page.
- Process:

| Data Category                                 | Action                                                                        | Reason                                        |
| --------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------- |
| Name, email, phone, address in `crm.contacts` | **Anonymized** (replaced with `[REDACTED]` + hash)                            | Cannot fully delete as order references exist |
| CPF                                           | **Retained** for 5 years from last NF-e                                       | Legal obligation (fiscal records)             |
| NF-e data, fiscal records                     | **Retained** for 5 years                                                      | Legal obligation (CTN Art. 173)               |
| Order history                                 | **Anonymized** (personal fields replaced, order data retained for accounting) | Legal obligation                              |
| Payment references                            | **Retained** (Mercado Pago IDs, no actual card data stored)                   | Legal obligation                              |
| WhatsApp messages                             | **Deleted**                                                                   | No legal retention requirement                |
| Instagram interactions                        | **Deleted**                                                                   | No legal retention requirement                |
| Consents                                      | **Retained** (as proof of lawful processing)                                  | Legitimate interest / Legal protection        |
| Reviews                                       | **Anonymized** (author set to "Anonymous")                                    | No legal retention requirement                |
| Segments / tags                               | **Deleted**                                                                   | No legal retention requirement                |
| Audit logs                                    | **Anonymized** (user_id set to anonymized hash)                               | Operational integrity                         |
| Creator profile and payment data              | **Anonymized** after settlement                                               | Contractual obligation until final payment    |
| B2B retailer data                             | **Anonymized** after settlement                                               | Contractual obligation until final payment    |
| Login credentials                             | **Deleted** (account deactivated)                                             | No retention requirement                      |

- The deletion request itself is logged in the audit log as an immutable record.
- A confirmation email is sent when deletion is complete.
- Timeline: Completed within 15 calendar days.

### 6.3 Right of Portability (Art. 18, V)

**What:** The data subject can request their data in a structured, machine-readable format for transfer to another service.

**Implementation:**

- Same export endpoint as Right of Access (`GET /api/lgpd/data-export`).
- Format: JSON (machine-readable, structured).
- Includes all personal data, purchase history, and consent records.
- Does not include proprietary analytics, internal segmentation logic, or derived data.

### 6.4 Right of Consent Revocation (Art. 8, para. 5)

**What:** The data subject can revoke consent at any time, with the same ease it was given.

**Implementation:**

- **Email footer**: Every marketing email includes an unsubscribe link that revokes email consent.
- **WhatsApp**: Reply "SAIR" to any marketing message to revoke WhatsApp consent. The keyword triggers automatic consent revocation.
- **Account settings**: If the customer has an account, a preferences page allows toggling each consent channel.
- **Admin action**: CRM contact detail page has consent toggles that admin can update on behalf of the customer (e.g., phone request).
- **API endpoint**: `POST /api/lgpd/revoke-consent` with `{ contactId, channel }`.
- Revocation takes effect immediately. No further marketing messages are sent to that channel.

### 6.5 Right of Information (Art. 18, I)

**What:** The data subject has the right to know what data is being processed and why.

**Implementation:**

- Public privacy policy at `ambaril.app/privacidade` (see Section 9).
- On request, the data export (Section 6.1) provides a complete inventory.

### 6.6 Right of Correction (Art. 18, III)

**What:** The data subject can request correction of inaccurate or incomplete data.

**Implementation:**

- Admin action: CRM contact detail page allows editing all personal fields.
- API endpoint: `PATCH /api/lgpd/correct-data` with the fields to update.
- All corrections are logged in the audit log.

### 6.7 Right to Object (Art. 18, para. 2)

**What:** The data subject can object to processing based on legitimate interest.

**Implementation:**

- Handled case-by-case. If a customer objects to segmentation or analytics, their data is excluded from those processes.
- A flag `processing_objection` on `crm.contacts` excludes the contact from legitimate-interest processing pipelines.

---

## 7. Data Retention Policy

| Data Type                         | Active Retention                | Archive                                  | Anonymization/Deletion                        | Legal Basis for Retention |
| --------------------------------- | ------------------------------- | ---------------------------------------- | --------------------------------------------- | ------------------------- |
| Customer PII (name, email, phone) | Duration of active relationship | 5 years after last interaction           | Anonymized after 5 years                      | Contract execution        |
| CPF                               | Duration of active relationship | 5 years after last fiscal transaction    | Anonymized after 5 years                      | Legal obligation (CTN)    |
| Shipping/billing address          | Duration of active relationship | 5 years after last order                 | Anonymized after 5 years                      | Legal obligation (NF-e)   |
| NF-e data and XML files           | 5 years from emission           | N/A (always active for legal compliance) | Deleted after 5 years + 1 month               | Legal obligation          |
| Financial transactions            | 5 years from transaction date   | N/A                                      | Anonymized after 5 years                      | Legal obligation          |
| Order history                     | Duration of active relationship | 5 years after last order                 | Anonymized (personal fields) after 5 years    | Legal obligation          |
| WhatsApp messages (support)       | 2 years from message date       | N/A                                      | Deleted after 2 years                         | Legitimate interest       |
| WhatsApp messages (marketing)     | Until consent revoked           | N/A                                      | Deleted on consent revocation + 30 days       | Consent                   |
| Email marketing history           | Until consent revoked           | N/A                                      | Deleted on consent revocation + 30 days       | Consent                   |
| UTM / behavioral tracking         | 24 months from collection       | N/A                                      | Anonymized after 24 months                    | Consent                   |
| Audit logs                        | 6 months (active table)         | 6-24 months (archive)                    | Deleted after 24 months (unless NF-e related) | Legitimate interest       |
| Session data (PostgreSQL)         | Session duration (max 24h)      | N/A                                      | Expired sessions cleaned by Vercel Cron       | Legitimate interest       |
| Creator data                      | Duration of partnership         | 5 years after partnership ends           | Anonymized after 5 years                      | Contract execution        |
| B2B retailer data                 | Duration of relationship        | 5 years after relationship ends          | Anonymized after 5 years                      | Contract execution        |
| Product reviews                   | Indefinite (while published)    | N/A                                      | Anonymized on deletion request                | Consent                   |
| Consent records                   | Permanent                       | N/A                                      | Never deleted (proof of lawful processing)    | Legal protection          |
| Login credentials                 | Duration of account             | N/A                                      | Deleted on account deletion                   | Contract execution        |

### Automated Purge Jobs

A scheduled Vercel Cron job (`lgpd:data-purge`) runs weekly and:

1. Identifies records past their retention period.
2. Anonymizes or deletes per the policy above.
3. Logs all actions in the audit log.
4. Generates a purge report sent to the DPO (Data Protection Officer) / admin.

---

## 8. Module-Specific LGPD Obligations

Checklist of LGPD requirements per Ambaril module.

### 8.1 CRM (Customer Relationship Management)

- [x] Consent collection and storage for each communication channel
- [x] Consent check before any marketing outreach
- [x] Data export endpoint for Right of Access
- [x] Data deletion/anonymization endpoint
- [x] Contact correction capabilities
- [x] Segmentation respects `processing_objection` flag
- [x] WhatsApp "SAIR" keyword triggers consent revocation
- [x] Email unsubscribe link in all marketing emails

### 8.2 ERP (Orders & Fulfillment)

- [x] Order data retained for 5 years (legal obligation)
- [x] Personal data in orders anonymized after retention period
- [x] Shipping address accessible only to fulfillment and admin roles
- [x] Order export includes only the requesting customer's data

### 8.3 Financial

- [x] Transaction data retained for 5 years (legal obligation)
- [x] No raw credit card data stored (Mercado Pago tokenization)
- [x] Financial reports anonymize individual customer data where possible
- [x] Access restricted to finance and admin roles

### 8.4 Fiscal (NF-e)

- [x] NF-e data retained for 5 years (non-negotiable legal obligation)
- [x] NF-e XML files stored with versioning
- [x] CPF included in NF-e as required by SEFAZ
- [x] Cannot be deleted even upon data subject request (documented exception)

### 8.5 Catalog

- [x] Product reviews anonymized on customer deletion request
- [x] Review content does not expose PII beyond display name
- [x] UGC usage requires explicit consent

### 8.6 Analytics

- [x] UTM and behavioral data requires tracking consent
- [x] Data anonymized after 24 months
- [x] Aggregate analytics do not contain PII
- [x] Respects `processing_objection` flag
- [x] No third-party analytics without consent (e.g., Google Analytics requires cookie consent)

### 8.7 DAM (Digital Asset Management)

- [x] UGC photos/videos require consent for marketing use
- [x] Creator content governed by creator partnership agreement
- [x] Customer-submitted images deleted on data deletion request

### 8.8 Checkout

- [x] Three separate consent checkboxes (not pre-checked)
- [x] Privacy policy link visible before purchase
- [x] Consent recorded with IP, user agent, and terms version
- [x] Purchase possible without granting any marketing consent

### 8.9 Creators Portal

- [x] Consent collected at registration
- [x] Creator data governed by partnership agreement
- [x] Data export available for creators
- [x] Data anonymized on partnership termination + retention period

### 8.10 B2B Portal

- [x] Consent collected at account approval
- [x] Retailer data governed by B2B agreement
- [x] Data export available for retailers
- [x] CNPJ retained per legal obligation

### 8.11 Auth (Authentication)

- [x] Password stored as bcrypt/argon2 hash (never plaintext)
- [x] Session data ephemeral (PostgreSQL `global.sessions`, cleaned by Vercel Cron)
- [x] Account deletion removes all authentication data
- [x] Login history in audit log (anonymized after retention period)

### 8.12 Community (Discord)

- [x] Discord interactions are governed by Discord's own privacy policy
- [x] Ambaril stores only Discord user IDs (not messages) for integration
- [x] Discord user ID deleted on data deletion request

### 8.13 AI Module

- [x] Customer data sent to Claude API is not used for model training (per Anthropic API terms)
- [x] AI-generated insights do not expose individual PII in reports
- [x] AI processing logged in audit log

### 8.14 Notifications

- [x] Notification preferences respect consent settings
- [x] Notification history retained for 6 months, then deleted
- [x] No marketing notifications without consent

### 8.15 Settings / Admin

- [x] Admin actions logged in audit log
- [x] LGPD request management dashboard for handling data subject requests
- [x] DPO contact information configurable

---

## 9. Privacy Policy Requirements

The public-facing privacy policy (`ambaril.app/privacidade`) must contain the following per LGPD Articles 6-10 and 17-22.

### Required Sections

1. **Identity of the controller**: Full legal name, CNPJ, and contact information of the company operating Ambaril.

2. **DPO (Encarregado) contact**: Name (or role) and contact email of the Data Protection Officer. Must be a publicly accessible channel.

3. **Personal data collected**: Complete list of data types collected (reference Section 2 of this document), written in clear, non-technical language.

4. **Purpose of processing**: For each data type, explain WHY it is collected and what it is used for. Use plain Portuguese.

5. **Legal basis**: For each processing activity, state the legal basis (consent, contract, legal obligation, or legitimate interest).

6. **Data sharing with third parties**: List all third-party services that receive personal data:
   - Mercado Pago (payment processing)
   - Focus NF-e (fiscal document emission)
   - Melhor Envio (shipping)
   - Meta / WhatsApp (messaging)
   - Meta / Instagram (social integration)
   - Resend (email delivery)
   - Anthropic / Claude (AI processing)
   - Sentry (error monitoring -- may include IP addresses)
   - Neon (database hosting)
   - Vercel (application hosting)
   - Cloudflare (CDN, DNS)

7. **International data transfer**: If any data is processed outside Brazil (e.g., Vercel servers in the US, Cloudflare global CDN), disclose this and state the safeguard mechanism (standard contractual clauses or equivalent).

8. **Data retention periods**: Summary of how long each data type is retained (reference Section 7).

9. **Data subject rights**: Clear explanation of each right (access, deletion, portability, correction, consent revocation, objection) and how to exercise them. Include:
   - Email address for LGPD requests (e.g., `privacidade@ambaril.app`)
   - Expected response time (15 calendar days per LGPD)
   - Link to self-service options (account settings, unsubscribe)

10. **Cookie policy**: If cookies are used beyond strictly necessary session cookies, describe each cookie, its purpose, and its duration. Provide a cookie consent banner.

11. **Security measures**: General description of technical and organizational measures (encryption in transit and at rest, access controls, audit logging, incident response).

12. **Policy updates**: How and when the policy may be updated. Commitment to notify data subjects of material changes.

13. **Effective date and version**: Current version number and effective date.

### Language

- Written in clear, accessible Brazilian Portuguese.
- Avoid legal jargon where possible.
- Provide a summary ("Resumo") at the top for quick understanding.
- Full policy below the summary.

### Availability

- Permanently accessible at `ambaril.app/privacidade`.
- Linked from:
  - Website footer
  - Checkout page (next to consent checkboxes)
  - Registration forms (creators, B2B)
  - Email footers
  - WhatsApp auto-reply (on first contact)
