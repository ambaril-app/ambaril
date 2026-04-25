# LGPD Data Retention Policy

> **Document type:** Compliance policy (machine-readable reference for AI agents)
> **Applies to:** All Ambaril modules processing personal data
> **Legal framework:** LGPD (Lei 13.709/2018), CTN (Código Tributário Nacional), CLT
> **Last updated:** 2026-04-24
> **Status:** Active
> **Related:** [LGPD.md](./LGPD.md), [AUDIT-LOG.md](./AUDIT-LOG.md), [SECURITY.md](./SECURITY.md)

---

## 1. Retention Schedule by Data Category

### 1.1 Fiscal / Tax Data

**Retention:** 5 years minimum from the date of the taxable event.

**Legal basis:** Art. 195 CTN (right of Fazenda to examine books/documents for 5 years) + Art. 173 CTN (5-year statute of limitations for tax credit constitution).

**Scope:** NF-e XML and protocol data, NFS-e records, invoices, receipts, DANFE PDFs, tax calculation breakdowns, CFOP records, ICMS/PIS/COFINS values, inutilização records, carta de correção records, cancellation records, and all Focus NFe API response payloads.

**Tables:** `erp.nfe_documents`, `erp.nfe_events`, `erp.orders` (financial fields), `financial.transactions`, `creators.commissions`, `creators.payout_attempts`.

**Deletion rule:** CANNOT be deleted even on data subject request (LGPD Art. 16, II — compliance with legal or regulatory obligation). The `anonymize_user()` function NULLs PII fields but preserves all financial and fiscal values intact.

---

### 1.2 Audit Logs

**Retention:** 5 years from log creation date.

**Legal basis:** Legitimate interest (LGPD Art. 7, IX) + legal obligation for fiscal audit trail.

**Scope:** All entries in `global.audit_logs` — user actions, system events, data changes, API calls to external services (Focus NFe, Mercado Pago, Meta WhatsApp), login/logout events, permission changes, data deletion requests.

**Storage:** Append-only. No UPDATE or DELETE operations permitted on audit log tables. Enforced by:

- Database-level: `REVOKE DELETE, UPDATE ON global.audit_logs FROM app_role;`
- Application-level: audit log service only exposes `insert()` method.
- RLS policy: no delete/update policies exist for audit tables.

**Deletion rule:** Never deleted. After 5 years, may be archived to cold storage but not purged.

---

### 1.3 PII (Personally Identifiable Information)

**Retention:** Delete (anonymize) within 15 calendar days of a valid data subject request.

**Legal basis:** LGPD Art. 18, VI (right to deletion) subject to Art. 16 exceptions.

**Scope:** Name, CPF, email, phone number, shipping/billing address, IP address (outside audit logs), date of birth, Instagram handle, bank/PIX details.

**Tables:** `crm.contacts`, `creators.profiles`, `creators.payment_info`, `b2b.retailers`, `global.users`.

**Exceptions — deletion NOT permitted when:**

1. Fiscal/tax records require retention (Art. 16, II) — NF-e recipient data stays for 5 years.
2. Active legal proceedings involving the data subject.
3. Regulatory investigation in progress (ANPD, PROCON, SEFAZ).
4. Contractual obligation still active (e.g., pending order, open dispute, unredeemed store credit).
5. Creator with unpaid commissions or active contract.

**When exception applies:** Inform the data subject which data cannot be deleted and the specific legal basis. Delete everything that IS eligible. Log the partial deletion and retained categories in the audit trail.

---

### 1.4 Payment Data

**Retention:** While account is active + 5 years after last transaction.

**Legal basis:** Legal obligation (fiscal records) + contract execution.

**Scope:** Mercado Pago payment IDs, PIX transaction IDs (`external_pix_txid`), card token references (Ambaril never stores raw card numbers), payment method metadata, refund records, chargeback records.

**Tables:** `financial.transactions`, `financial.refunds`, `creators.payout_attempts`.

**Note:** Full card data is NEVER stored — only Mercado Pago tokenized references. PIX keys for creator payouts are stored encrypted in `creators.payment_info` and deleted on anonymization.

---

### 1.5 Session / Authentication Data

**Retention:** 90 days rolling window.

**Legal basis:** Legitimate interest (security, fraud detection).

**Scope:** JWT refresh tokens, session records, login history (IP, user agent, timestamp, success/failure), password reset tokens, MFA verification records.

**Storage:** PostgreSQL `global.sessions` table + `global.auth_events` table (login history).

**Cleanup:** Automated daily Vercel Cron job purges records older than 90 days from `global.auth_events`. Expired sessions cleaned from `global.sessions` by Vercel Cron.

---

### 1.6 Analytics / Behavioral Data

**Retention:** Anonymize after 2 years from collection date.

**Legal basis:** Consent (LGPD Art. 7, I).

**Scope:** Page views, click events, UTM parameters, browsing paths, product view history, search queries, cart abandonment events, A/B test assignments.

**Tables:** `analytics.events`, `analytics.sessions`, `analytics.page_views`.

**Anonymization procedure:**

1. Remove `user_id`, `contact_id`, `session_id` foreign keys (set to NULL).
2. Truncate IP address to /24 subnet (e.g., 192.168.1.0).
3. Remove user agent string.
4. Keep aggregate fields: event_type, page_path, utm_source, utm_medium, utm_campaign, timestamp, tenant_id.
5. Mark record as `anonymized = true`.

**Post-anonymization:** Data is no longer personal data under LGPD and can be retained indefinitely for business intelligence.

---

### 1.7 Marketing Consent Records

**Retention:** Indefinite (permanent).

**Legal basis:** Legitimate interest — proof of lawful consent collection.

**Scope:** Opt-in and opt-out records for all channels: WhatsApp marketing, email marketing, SMS, behavioral tracking, UGC usage. Each record captures: contact_id, channel, purpose, consented_at, consent_source, ip_address, user_agent, privacy_policy_version, opted_out_at (if revoked).

**Tables:** `crm.consents`, `communication.consent_records`.

**Deletion rule:** NEVER delete consent records, even on data subject deletion request. These records are the legal proof that consent was obtained (or revoked) and are essential for defending against ANPD complaints. On user anonymization, the contact_id FK may point to an anonymized record, but the consent record itself stays intact.

---

### 1.8 Creator Program Data

**Retention:** 5 years after last payout date.

**Legal basis:** Legal obligation (fiscal — RPA/NFS-e records, IRRF withholding, INSS contributions) + labor law compliance (CLT Art. 11 — 5-year statute of limitations for labor claims).

**Scope:** Creator contracts, commission records, payout history, RPA documents, NFS-e references, IRRF/INSS withholding records, tier history, coupon assignments, sale attributions.

**Tables:** `creators.profiles`, `creators.commissions`, `creators.payout_attempts`, `creators.contracts`, `creators.tier_history`, `creators.sale_attributions`.

**Note:** Creator bank details (`creators.payment_info`) are deleted on anonymization request, but payout records with withholding breakdowns are retained for fiscal compliance.

---

## 2. Deletion Implementation

### 2.1 Core Rule: DELETE FROM Is Forbidden on Fiscal Tables

**Never** execute `DELETE FROM` on any table in the `erp`, `financial`, or `creators` (payout-related) schemas. Hard deletion destroys fiscal audit trails and violates CTN retention requirements.

**Instead, use the `anonymize_user(userId)` function** which:

1. NULLs PII fields while preserving financial record integrity.
2. Logs the anonymization event in the audit trail.
3. Returns a summary of what was anonymized and what was retained (with legal basis).

### 2.2 Anonymization Procedure for Contacts

When `anonymize_user(userId)` is called on a `crm.contacts` record:

```sql
-- Step 1: Anonymize contact PII
UPDATE crm.contacts SET
  full_name     = 'Removido LGPD',
  email         = encode(sha256(email::bytea), 'hex') || '@removed.lgpd',
  cpf           = NULL,              -- Remove plaintext CPF
  -- cpf_hash is RETAINED for deduplication and fiscal cross-reference
  phone         = NULL,
  date_of_birth = NULL,
  instagram_handle = NULL,
  address_line1 = NULL,
  address_line2 = NULL,
  city          = NULL,
  state         = NULL,
  zip_code      = NULL,
  anonymized_at = now(),
  anonymized_by = current_user
WHERE id = userId;

-- Step 2: Anonymize creator payment info (if creator)
UPDATE creators.payment_info SET
  pix_key       = NULL,
  pix_key_type  = NULL,
  bank_code     = NULL,
  bank_branch   = NULL,
  bank_account  = NULL,
  anonymized_at = now()
WHERE creator_id IN (
  SELECT id FROM creators.profiles WHERE contact_id = userId
);

-- Step 3: Anonymize creator profile PII (keep commission data)
UPDATE creators.profiles SET
  display_name  = 'Removido LGPD',
  bio           = NULL,
  social_links  = NULL,
  anonymized_at = now()
WHERE contact_id = userId;

-- Step 4: Anonymize auth user
UPDATE global.users SET
  email         = encode(sha256(email::bytea), 'hex') || '@removed.lgpd',
  password_hash = NULL,               -- Prevent login
  disabled      = true,
  anonymized_at = now()
WHERE contact_id = userId;

-- Step 5: Log in audit trail (ALWAYS — even on failure)
INSERT INTO global.audit_logs (
  tenant_id, actor_id, action, entity_type, entity_id,
  details, ip_address, created_at
) VALUES (
  tenant_id, current_user_id, 'lgpd_anonymization', 'contact', userId,
  jsonb_build_object(
    'fields_anonymized', ARRAY['full_name','email','cpf','phone','address','payment_info'],
    'fields_retained', ARRAY['cpf_hash','fiscal_records','audit_logs','consent_records'],
    'retention_basis', 'Art. 16, II LGPD — legal/regulatory obligation'
  ),
  request_ip, now()
);
```

### 2.3 Deletion Request Workflow

1. **Receive request:** Data subject contacts support or uses self-service portal.
2. **Verify identity:** Require CPF + email confirmation (or authenticated session).
3. **Check exceptions:** Query for active orders, open disputes, pending payouts, legal holds.
4. **Execute anonymization:** Call `anonymize_user(userId)` within a transaction.
5. **Notify data subject:** Confirm deletion within 15 days, listing any retained data and legal basis.
6. **Audit:** Deletion request, execution, and notification are all logged.

**SLA:** 15 calendar days from validated request to completion (LGPD Art. 18, S 3).

---

## 3. Legal Basis per Data Category

| Data Category                          | Legal Basis                            | LGPD Article    | Retention                           | Can Delete on Request?          |
| -------------------------------------- | -------------------------------------- | --------------- | ----------------------------------- | ------------------------------- |
| Fiscal/tax data (NF-e, invoices)       | Legal obligation                       | Art. 7, II      | 5 years                             | No — anonymize PII only         |
| Audit logs                             | Legitimate interest + legal obligation | Art. 7, IX + II | 5 years (append-only)               | No                              |
| PII (name, CPF, email, phone, address) | Contract execution / Consent           | Art. 7, V / I   | Until deletion request              | Yes (15-day SLA)                |
| Payment references (tokens, PIX IDs)   | Legal obligation                       | Art. 7, II      | Active + 5 years                    | No — anonymize account only     |
| Session/auth data                      | Legitimate interest                    | Art. 7, IX      | 90 days rolling                     | Auto-purged                     |
| Analytics/behavioral                   | Consent                                | Art. 7, I       | 2 years then anonymize              | Yes (immediate anonymization)   |
| Marketing consent records              | Legitimate interest (proof)            | Art. 7, IX      | Indefinite                          | No — legal proof                |
| Creator program (contracts, payouts)   | Legal obligation + contract            | Art. 7, II + V  | Last payout + 5 years               | No — anonymize PII only         |
| WhatsApp conversations (support)       | Contract execution                     | Art. 7, V       | 2 years                             | Yes (anonymize after retention) |
| WhatsApp conversations (marketing)     | Consent                                | Art. 7, I       | Until consent revoked               | Yes                             |
| B2B retailer data                      | Contract execution                     | Art. 7, V       | Relationship + 5 years              | Yes (after obligations clear)   |
| Product reviews                        | Consent                                | Art. 7, I       | Indefinite (anonymized on deletion) | Anonymize (keep review text)    |

---

## 4. Data Portability

**Right:** LGPD Art. 18, V — data subject may request portability of their personal data.

**Implementation:**

1. Data subject requests export via support or self-service portal.
2. System generates a JSON file containing all personal data:

```json
{
  "export_date": "2026-04-24T12:00:00Z",
  "data_subject": {
    "full_name": "...",
    "cpf": "...",
    "email": "...",
    "phone": "..."
  },
  "addresses": ["..."],
  "orders": [
    {
      "order_number": "...",
      "date": "...",
      "items": ["..."],
      "total": "...",
      "status": "..."
    }
  ],
  "whatsapp_conversations": ["..."],
  "consent_records": [
    {
      "channel": "whatsapp",
      "purpose": "marketing",
      "consented_at": "...",
      "revoked_at": null
    }
  ],
  "creator_profile": {
    "tier": "...",
    "commissions": ["..."],
    "payouts": ["..."]
  },
  "analytics_events": ["..."]
}
```

3. File is delivered via secure download link (signed URL, 24-hour expiry).
4. **SLA:** 15 calendar days from validated request (LGPD Art. 18, S 3).
5. Export event logged in audit trail.

---

## 5. Automated Retention Enforcement

### 5.1 Scheduled Jobs

| Job                             | Schedule                | Action                                                                |
| ------------------------------- | ----------------------- | --------------------------------------------------------------------- |
| `purge_expired_sessions`        | Daily 03:00 UTC         | Delete auth events > 90 days                                          |
| `anonymize_stale_analytics`     | Weekly Sunday 04:00 UTC | Anonymize analytics records > 2 years                                 |
| `check_fiscal_retention_expiry` | Monthly 1st 05:00 UTC   | Flag fiscal records approaching 5-year mark for review                |
| `audit_log_archive`             | Quarterly               | Move audit logs > 3 years to cold storage (S3/Hetzner Object Storage) |
| `creator_data_retention_check`  | Monthly                 | Flag creator records where last_payout + 5 years has passed           |

### 5.2 Monitoring and Alerts

- Alert if `anonymize_user()` fails or times out.
- Alert if deletion request SLA > 10 days without completion.
- Alert if audit log table receives UPDATE/DELETE attempt (should be blocked by permissions, but alert anyway).
- Monthly report: number of deletion requests received, completed, pending, denied (with basis).

---

## 6. Agent Implementation Notes

When implementing any feature that stores personal data:

1. **Check this document** for the retention period and deletion behavior of the data category.
2. **Never add DELETE permissions** on fiscal, audit, or consent tables.
3. **Always use `anonymize_user()`** — never write custom deletion queries.
4. **New PII fields** must be added to the anonymization function AND this document.
5. **Consent collection** must record source, timestamp, IP, and user agent in `communication.consent_records`.
6. **Data portability** export must include any new personal data fields.
7. **Fiscal tables** — when in doubt, retain. The cost of over-retention is trivial; the cost of premature deletion is a SEFAZ audit finding.
