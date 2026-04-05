# Focus NFe API v2 - Complete Reference

> Source: https://focusnfe.com.br/doc/ + https://campos.focusnfe.com.br/nfe/NotaFiscalXML.html
> Extracted: 2026-04-02
> Purpose: Definitive schema reference for Ambaril ERP NF-e integration

---

## 1. Authentication & Environments

**Method:** HTTP Basic Auth (token as username, blank password)

- Alternative: `token` query parameter (less secure)

| Environment               | Base URL                              |
| ------------------------- | ------------------------------------- |
| **Homologacao (Sandbox)** | `https://homologacao.focusnfe.com.br` |
| **Producao**              | `https://api.focusnfe.com.br`         |

**Reference:** Unique alphanumeric ID per request (no special chars). Cannot reuse after successful authorization.

---

## 2. NF-e Endpoints

| Method | URL                                    | Description                      |
| ------ | -------------------------------------- | -------------------------------- |
| POST   | `/v2/nfe?ref=REFERENCIA`               | Create & send NF-e               |
| GET    | `/v2/nfe/REFERENCIA`                   | Query status                     |
| GET    | `/v2/nfe/REFERENCIA?completa=1`        | Query with full XML/protocol     |
| DELETE | `/v2/nfe/REFERENCIA`                   | Cancel (body: `{justificativa}`) |
| POST   | `/v2/nfe/REFERENCIA/carta_correcao`    | Correction letter                |
| POST   | `/v2/nfe/REFERENCIA/email`             | Resend email                     |
| POST   | `/v2/nfe/inutilizacao`                 | Invalidate number range          |
| GET    | `/v2/nfe/inutilizacoes`                | Query invalidated numbers        |
| POST   | `/v2/nfe/importacao?ref=REFERENCIA`    | Import from XML                  |
| POST   | `/v2/nfe/danfe`                        | Preview DANFe PDF                |
| POST   | `/v2/nfe/REFERENCIA/ator_interessado`  | Add interested party             |
| POST   | `/v2/nfe/REFERENCIA/insucesso_entrega` | Delivery failure event           |
| DELETE | `/v2/nfe/REFERENCIA/insucesso_entrega` | Cancel delivery failure          |
| POST   | `/v2/nfe/REFERENCIA/econf`             | Financial reconciliation         |

## 3. NFC-e Endpoints

| Method | URL                         | Description                       |
| ------ | --------------------------- | --------------------------------- |
| POST   | `/v2/nfce?ref=REFERENCIA`   | Create & send NFC-e (synchronous) |
| GET    | `/v2/nfce/REFERENCIA`       | Query status                      |
| DELETE | `/v2/nfce/REFERENCIA`       | Cancel                            |
| POST   | `/v2/nfce/inutilizacao`     | Invalidate number range           |
| GET    | `/v2/nfce/inutilizacoes`    | Query invalidated numbers         |
| POST   | `/v2/nfce/REFERENCIA/email` | Resend email                      |

NFC-e is **synchronous** (immediate response). NF-e is **asynchronous** by default (202 Accepted, must poll).

---

## 4. Processing Flow

### Async (NF-e default):

1. POST -> 202 Accepted, status=`processando_autorizacao`
2. Poll GET or use webhook
3. Final status: `autorizado` | `erro_autorizacao` | `denegado`

### Sync (NFC-e default, NF-e optional except SP/GO/BA):

1. POST -> 201 Created with full response
2. Immediate authorization or error

### Response Statuses:

- `processando_autorizacao` - In progress
- `autorizado` - Approved by SEFAZ
- `cancelado` - Cancelled
- `erro_autorizacao` - Rejected (resubmittable with new ref)
- `denegado` - Denied (non-resubmittable, XML generated)

### Authorized Response Fields:

- `status`, `status_sefaz`, `mensagem_sefaz`
- `chave_nfe` - 44-digit access key
- `numero`, `serie`
- `caminho_xml_nota_fiscal` - XML download URL
- `caminho_danfe` - DANFe PDF download URL

---

## 5. Complete NF-e Schema

### 5.1 Header Fields

| Field                   | Type     | Required | Valid Values                                                                   | Constraints     |
| ----------------------- | -------- | -------- | ------------------------------------------------------------------------------ | --------------- |
| natureza_operacao       | String   | Yes      | Free text                                                                      | Max 60 chars    |
| serie                   | Integer  | No       | 1-999                                                                          | Auto if omitted |
| numero                  | Integer  | No       | 1-999999999                                                                    | Auto if omitted |
| data_emissao            | DateTime | Yes      | ISO format                                                                     | Required        |
| data_entrada_saida      | DateTime | No       | ISO format                                                                     | Entry/exit      |
| tipo_documento          | Integer  | Yes      | 0=entry, 1=exit                                                                | Required        |
| local_destino           | Integer  | Yes      | 1=internal, 2=interstate, 3=foreign                                            | Required        |
| finalidade_emissao      | Integer  | Yes      | 1=normal, 2=complementary, 3=adjustment, 4=return                              | Required        |
| consumidor_final        | Integer  | Yes      | 0=normal, 1=final consumer                                                     | Required        |
| presenca_comprador      | Integer  | Yes      | 0=N/A, 1=present, 2=internet, 3=phone, 4=delivery, 5=outside premises, 9=other | Required        |
| indicador_intermediario | Integer  | No       | 0=own platform, 1=marketplace                                                  | Default: 0      |
| forma_pagamento         | Integer  | No       | Deprecated - use formas_pagamento array                                        |                 |

### 5.2 Emitente (Issuer) Fields

| Field                          | Type          | Required | Constraints                        |
| ------------------------------ | ------------- | -------- | ---------------------------------- |
| cnpj_emitente                  | Integer[14]   | Cond.    | CNPJ or CPF required               |
| cpf_emitente                   | Integer[11]   | Cond.    | CNPJ or CPF required               |
| nome_emitente                  | String[2-60]  | No       | Uses registry if omitted           |
| nome_fantasia_emitente         | String[1-60]  | No       | Uses registry if omitted           |
| inscricao_estadual_emitente    | String[2-14]  | Yes      | Always required                    |
| inscricao_estadual_st_emitente | String[2-14]  | No       | ST registration                    |
| inscricao_municipal_emitente   | String[1-15]  | No       | Requires cnae_fiscal               |
| cnae_fiscal_emitente           | Integer[7]    | No       | Requires inscricao_municipal       |
| regime_tributario_emitente     | Integer       | No       | 1=SN, 2=SN excess, 3=normal, 4=MEI |
| logradouro_emitente            | String[2-60]  | No       | Uses registry if omitted           |
| numero_emitente                | String[1-60]  | No       | Uses registry if omitted           |
| complemento_emitente           | String[1-60]  | No       | Optional                           |
| bairro_emitente                | String[2-60]  | No       | Uses registry if omitted           |
| codigo_municipio_emitente      | Integer[7]    | No       | IBGE code                          |
| municipio_emitente             | String[2-60]  | No       | Uses registry if omitted           |
| uf_emitente                    | String[2]     | No       | Uses registry if omitted           |
| cep_emitente                   | Integer[8]    | No       | Uses registry if omitted           |
| telefone_emitente              | Integer[6-14] | No       | Optional                           |

> **Note:** Most emitente fields use pre-registered data if omitted. Only `inscricao_estadual_emitente` and one of CNPJ/CPF are truly required per-request.

### 5.3 Destinatario (Recipient) Fields

| Field                                     | Type          | Required | Constraints                               |
| ----------------------------------------- | ------------- | -------- | ----------------------------------------- |
| cnpj_destinatario                         | Integer[14]   | Cond.    | CNPJ or CPF required                      |
| cpf_destinatario                          | Integer[11]   | Cond.    | CNPJ or CPF required                      |
| id_estrangeiro_destinatario               | String[5-20]  | No       | For foreign buyers                        |
| nome_destinatario                         | String[2-60]  | Yes      | Required                                  |
| indicador_inscricao_estadual_destinatario | Integer       | Yes      | 1=ICMS contrib., 2=exempt, 9=non-contrib. |
| inscricao_estadual_destinatario           | Integer[2-14] | No       | If applicable                             |
| inscricao_suframa_destinatario            | Integer[8-9]  | No       | SUFRAMA reg                               |
| inscricao_municipal_destinatario          | String[1-15]  | No       | For conjugated NF-e                       |
| email_destinatario                        | String[1-60]  | No       | Receives XML/DANFe                        |
| logradouro_destinatario                   | String[2-60]  | Yes      | Required                                  |
| numero_destinatario                       | String[1-60]  | Yes      | Required                                  |
| complemento_destinatario                  | String[1-60]  | No       | Optional                                  |
| bairro_destinatario                       | String[2-60]  | Yes      | Required                                  |
| codigo_municipio_destinatario             | Integer[7]    | No       | Auto-found                                |
| municipio_destinatario                    | String[2-60]  | Yes      | Required                                  |
| uf_destinatario                           | String[2]     | Yes      | Omit for foreign                          |
| cep_destinatario                          | String[8]     | No       | Optional                                  |
| codigo_pais_destinatario                  | Integer[2-4]  | No       | IBGE code, omit if Brazil                 |
| pais_destinatario                         | String[2-60]  | No       | Omit if Brazil                            |
| telefone_destinatario                     | Integer[6-14] | No       | Optional                                  |

### 5.4 Referenced Documents

```
notas_referenciadas: Collection[0-500]
```

| Field     | Type         | Description                |
| --------- | ------------ | -------------------------- |
| chave_nfe | Integer[44]  | Referenced NF-e access key |
| chave_cte | Integer[44]  | Referenced CT-e key        |
| uf        | String[2]    | Emitter UF (model 1)       |
| mes       | Integer[4]   | AAMM format                |
| cnpj      | Integer[14]  | Emitter CNPJ               |
| modelo    | Integer[2]   | 01=model 1/1A, 02=model 2  |
| serie     | Integer[1-3] | Series                     |
| numero    | Integer[1-9] | Number                     |

### 5.5 Pickup / Delivery Locations

Both follow same structure with prefixes `_retirada` and `_entrega`:

- cnpj, cpf, nome, logradouro, numero, complemento, bairro, codigo_municipio, municipio, uf, cep, email, inscricao_estadual

### 5.6 Authorized XML Downloaders

```
pessoas_autorizadas: Collection[0-10]
  - cnpj: Integer[14]
  - cpf: Integer[11]
```

---

## 6. Item Fields (items array)

### 6.1 Basic Product

| Field                   | Type          | Required | Precision           | Description                  |
| ----------------------- | ------------- | -------- | ------------------- | ---------------------------- |
| numero_item             | Integer       | Yes      | -                   | Sequential 1-990             |
| codigo_produto          | String[1-60]  | Yes      | -                   | Internal code                |
| descricao               | String[1-120] | Yes      | -                   | Product description          |
| codigo_ncm              | Integer       | Yes      | 2 or 8 digits       | NCM code ("00" for services) |
| cfop                    | Integer[4]    | Yes      | -                   | Fiscal operation code        |
| cest                    | Integer[7]    | No       | -                   | Tax substitution code        |
| codigo_barras_comercial | Integer       | No       | 0,8,12,13,14 digits | GTIN/EAN                     |
| codigo_ex_tipi          | Integer       | No       | 2-3 digits          | EX TIPI code                 |

### 6.2 Commercial Unit

| Field                    | Type        | Required | Precision                              |
| ------------------------ | ----------- | -------- | -------------------------------------- |
| unidade_comercial        | String[1-6] | Yes      | -                                      |
| quantidade_comercial     | Decimal     | Yes      | **4 decimal places** (11.0-4)          |
| valor_unitario_comercial | Decimal     | Yes      | **10 decimal places** (11.0-10)        |
| valor_bruto              | Decimal     | No       | **2 decimal places** (13.2), auto-calc |

### 6.3 Tax Unit (defaults to commercial if omitted)

| Field                     | Type        | Required | Precision             |
| ------------------------- | ----------- | -------- | --------------------- |
| unidade_tributavel        | String[1-6] | No       | -                     |
| quantidade_tributavel     | Decimal     | No       | **4 decimal places**  |
| valor_unitario_tributavel | Decimal     | No       | **10 decimal places** |

### 6.4 Item Adjustments

| Field                       | Type          | Precision | Description             |
| --------------------------- | ------------- | --------- | ----------------------- |
| valor_frete                 | Decimal       | 2 dp      | Item freight            |
| valor_seguro                | Decimal       | 2 dp      | Item insurance          |
| valor_desconto              | Decimal       | 2 dp      | Item discount           |
| valor_outras_despesas       | Decimal       | 2 dp      | Other charges           |
| inclui_no_total             | Integer       | -         | 0=no, 1=yes (default 1) |
| valor_total_tributos        | Decimal       | 2 dp      | Auto-calculated (IBPT)  |
| informacoes_adicionais_item | String[1-500] | -         | Additional info         |

### 6.5 Manufacturing & Scale

| Field                   | Type        | Description                    |
| ----------------------- | ----------- | ------------------------------ |
| escala_relevante        | Boolean     | Relevant production scale      |
| cnpj_fabricante         | Integer[14] | Required if NOT relevant scale |
| codigo_beneficio_fiscal | String      | UF-specific tax benefit code   |

### 6.6 Traceability (rastros) - Required for pharmaceuticals

```
rastros: Collection[0-500]
```

| Field            | Type         | Required | Precision |
| ---------------- | ------------ | -------- | --------- |
| numero_lote      | String[1-20] | Yes      | -         |
| quantidade_lote  | Decimal      | Yes      | 3 dp      |
| data_fabricacao  | Date         | Yes      | ISO       |
| data_validade    | Date         | Yes      | ISO       |
| codigo_agregacao | String[1-20] | No       | -         |

### 6.7 Purchase Order

| Field                     | Type         |
| ------------------------- | ------------ |
| pedido_compra             | String[1-15] |
| numero_item_pedido_compra | Integer[0-6] |
| numero_fci                | String[36]   |

### 6.8 IPI Return

| Field                | Type          | Description            |
| -------------------- | ------------- | ---------------------- |
| percentual_devolvido | Decimal[3.2]  | Returned merchandise % |
| valor_ipi_devolvido  | Decimal[13.2] | Refunded IPI value     |

---

## 7. ICMS Tax Fields (per item)

### 7.0 Base (ALL CST codes)

| Field                    | Type    | Required | Valid Values                                                                                                                                                                                               |
| ------------------------ | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| icms_origem              | Integer | **Yes**  | 0=domestic, 1=foreign import direct, 2=foreign market, 3=domestic 40%+ foreign, 4=basic process, 5=domestic <40% foreign, 6=foreign direct no similar, 7=foreign market no similar, 8=domestic >70% import |
| icms_situacao_tributaria | String  | **Yes**  | See table below                                                                                                                                                                                            |

### Complete CST/CSOSN Code Table

| Code        | Regime  | Description                             |
| ----------- | ------- | --------------------------------------- |
| 00          | Normal  | Fully taxed                             |
| 02          | Normal  | Monophasic fuel (own)                   |
| 10          | Normal  | Taxed + Substitution Tax (ST)           |
| 10_partilha | Normal  | Interstate consumer final with ST       |
| 15          | Normal  | Monophasic with retention               |
| 20          | Normal  | Reduced base                            |
| 30          | Normal  | Exempt with ST                          |
| 40          | Normal  | Exempt                                  |
| 41          | Normal  | Non-taxed                               |
| 41_st       | Normal  | Non-taxed with ST remittance            |
| 50          | Normal  | Suspended                               |
| 51          | Normal  | Deferred                                |
| 53          | Normal  | Monophasic deferred                     |
| 60          | Normal  | Previously collected (substitute)       |
| 60_st       | Normal  | Previously collected with ST remittance |
| 61          | Normal  | Monophasic previously collected         |
| 70          | Normal  | Reduced base + ST                       |
| 90          | Normal  | Other                                   |
| 90_partilha | Normal  | Other with interstate partition         |
| 101         | Simples | SN with credit                          |
| 102         | Simples | SN without credit                       |
| 103         | Simples | SN exempt                               |
| 201         | Simples | SN with credit + ST                     |
| 202         | Simples | SN without credit + ST                  |
| 203         | Simples | SN exempt + ST                          |
| 300         | Simples | Immune                                  |
| 400         | Simples | Non-taxed (SN)                          |
| 500         | Simples | Previously collected (SN)               |
| 900         | Simples | Other (SN)                              |

### 7.1 CST 00 - Full Taxation

| Field                        | Type    | Precision | Description                                        |
| ---------------------------- | ------- | --------- | -------------------------------------------------- |
| icms_modalidade_base_calculo | Integer | -         | 0=margin%, 1=pauta, 2=max price, 3=operation value |
| icms_base_calculo            | Decimal | 2 dp      | BC amount (auto-calc)                              |
| icms_aliquota                | Decimal | 2-4 dp    | ICMS rate %                                        |
| icms_valor                   | Decimal | 2 dp      | ICMS amount (auto-calc)                            |
| icms_motivo_desoneracao      | Integer | -         | 1,3-7,9-12,16                                      |
| icms_valor_desonerado        | Decimal | 2 dp      | Exempted ICMS                                      |
| icms_deducao_desoneracao     | Integer | -         | 0=no, 1=yes                                        |

### 7.2 CST 02 - Monophasic Fuel (Own)

| Field                       | Type            | Description               |
| --------------------------- | --------------- | ------------------------- |
| icms_base_calculo_mono      | Decimal[11.0-4] | BC quantity               |
| icms_aliquota               | Decimal[3.2-4]  | Ad rem rate per unit      |
| icms_valor_mono             | Decimal[13.2]   | ICMS amount               |
| icms_percentual_diferimento | Decimal[3.2-4]  | Deferral %                |
| icms_valor_mono_diferido    | Decimal[13.2]   | Deferred ICMS             |
| icms_valor_mono_operacao    | Decimal[13.2]   | As-if value (no deferral) |

### 7.3 CST 10 - Taxed + Substitution Tax

Includes all CST 00 fields PLUS:

| Field                           | Type           | Description                                                                     |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------- |
| icms_modalidade_base_calculo_st | Integer        | 0=table/max, 1=neg list, 2=pos list, 3=neutral, 4=margin%, 5=pauta, 6=operation |
| icms_margem_valor_adicionado_st | Decimal[3.2-4] | ST margin % (MVA)                                                               |
| icms_reducao_base_calculo_st    | Decimal[3.2-4] | ST BC reduction %                                                               |
| icms_base_calculo_st            | Decimal[13.2]  | ST BC (auto-calc)                                                               |
| icms_aliquota_st                | Decimal[3.2-4] | ST rate %                                                                       |
| icms_valor_st                   | Decimal[13.2]  | ICMS-ST amount                                                                  |
| icms_valor_icms_st_desonerado   | Decimal[13.2]  | ST exempted                                                                     |
| icms_motivo_desoneracao_icms_st | Integer        | 3=agri, 9=other, 12=promo                                                       |

### 7.4 CST 10_partilha - Interstate Consumer Final

All CST 10 fields PLUS:

| Field                              | Type           | Description       |
| ---------------------------------- | -------------- | ----------------- |
| icms_base_calculo_operacao_propria | Decimal[3.2-4] | Own operation %   |
| icms_uf_st                         | String[2]      | ST responsible UF |

### 7.5 CST 15 - Monophasic with Retention

| Field                    | Type            | Description          |
| ------------------------ | --------------- | -------------------- |
| icms_base_calculo_mono   | Decimal[11.0-4] | BC quantity          |
| icms_aliquota_retencao   | Decimal[3.2-4]  | Ad rem retained rate |
| icms_valor_mono_retencao | Decimal[13.2]   | Retained ICMS        |
| icms_percentual_reducao  | Decimal[3.2-4]  | Rate reduction %     |
| icms_motivo_reducao      | Integer         | 1=transit, 9=other   |

### 7.6 CST 20 - Reduced Base

| Field                                             | Type           | Description      |
| ------------------------------------------------- | -------------- | ---------------- |
| icms_modalidade_base_calculo                      | Integer        | 0-3              |
| icms_reducao_base_calculo                         | Decimal[3.2-4] | Reduction %      |
| icms_codigo_beneficio_fiscal_reducao_base_calculo | String[8-10]   | Tax benefit code |
| icms_base_calculo                                 | Decimal[13.2]  | Reduced BC       |
| icms_aliquota                                     | Decimal[3.2-4] | Rate %           |
| icms_valor                                        | Decimal[13.2]  | ICMS amount      |

### 7.7 CST 30 - Exempt with ST

Same ST fields as CST 10 (icms_modalidade_base_calculo_st through icms_valor_st). No own ICMS fields.

### 7.8 CST 40 - Exempt

| Field                    | Type          | Required | Description    |
| ------------------------ | ------------- | -------- | -------------- |
| icms_motivo_desoneracao  | Integer       | **Yes**  | 1,3-7,9-12,16  |
| icms_valor_desonerado    | Decimal[13.2] | No       | Exempted value |
| icms_deducao_desoneracao | Integer       | No       | 0=no, 1=yes    |

### 7.9 CST 41 - Non-Taxed

No specific fields required beyond icms_origem + icms_situacao_tributaria.

### 7.10 CST 41_st - Non-Taxed with ST Remittance

| Field                              | Type          | Description        |
| ---------------------------------- | ------------- | ------------------ |
| icms_base_calculo_retido_remetente | Decimal[13.2] | Source UF ST BC    |
| icms_valor_retido_remetente        | Decimal[13.2] | Source UF ST value |
| icms_base_calculo_destino          | Decimal[13.2] | Target UF ST BC    |
| icms_valor_destino                 | Decimal[13.2] | Target UF ST value |

### 7.11 CST 50 - Suspended

No specific fields beyond base.

### 7.12 CST 51 - Deferred

| Field                        | Type           | Required | Description     |
| ---------------------------- | -------------- | -------- | --------------- |
| icms_modalidade_base_calculo | Integer        | No       | 0-3             |
| icms_base_calculo            | Decimal[13.2]  | No       | Full BC         |
| icms_percentual_diferimento  | Decimal[3.2-4] | **Yes**  | Deferral %      |
| icms_valor_operacao          | Decimal[13.2]  | No       | As-if value     |
| icms_aliquota                | Decimal[3.2-4] | No       | Rate %          |
| icms_valor                   | Decimal[13.2]  | No       | ICMS to pay     |
| icms_valor_diferido          | Decimal[13.2]  | No       | Deferred amount |

### 7.13 CST 53 - Monophasic Deferred

| Field                       | Type            | Description     |
| --------------------------- | --------------- | --------------- |
| icms_base_calculo_mono      | Decimal[11.0-4] | BC quantity     |
| icms_aliquota               | Decimal[3.2-4]  | Ad rem rate     |
| icms_valor_mono_operacao    | Decimal[13.2]   | As-if value     |
| icms_percentual_diferimento | Decimal[3.2-4]  | Deferral %      |
| icms_valor_mono             | Decimal[13.2]   | ICMS to pay     |
| icms_valor_mono_diferido    | Decimal[13.2]   | Deferred amount |

### 7.14 CST 60 - Previously Collected (Substitute)

| Field                             | Type           | Description                     |
| --------------------------------- | -------------- | ------------------------------- |
| icms_reducao_base_calculo_efetiva | Decimal[3.4]   | Effective BC reduction %        |
| icms_base_calculo_efetiva         | Decimal[13.2]  | Effective BC                    |
| icms_aliquota_efetiva             | Decimal[3.4]   | Effective rate                  |
| icms_valor_efetivo                | Decimal[13.2]  | Effective ICMS                  |
| icms_aliquota_final               | Decimal[3.2-4] | Final consumer rate (incl. FCP) |
| icms_valor_substituto             | Decimal[3.2-4] | Substitute's prior ICMS         |
| icms_valor_icms_st_desonerado     | Decimal[13.2]  | ST exempted                     |
| icms_motivo_desoneracao_icms_st   | Integer        | 3,9,12                          |

### 7.15 CST 60_st - Previously Collected with ST Remittance

All CST 60 fields PLUS same remittance fields as 41_st.

### 7.16 CST 61 - Monophasic Previously Collected

| Field                         | Type            | Description            |
| ----------------------------- | --------------- | ---------------------- |
| icms_base_calculo_mono_retido | Decimal[11.0-4] | BC quantity retained   |
| icms_aliquota_retido          | Decimal[3.2-4]  | Previous ad rem rate   |
| icms_valor_mono_retido        | Decimal[13.2]   | Previous ICMS retained |

### 7.17 CST 70 - Reduced Base + ST

Combines CST 20 own ICMS fields + CST 10 ST fields.

### 7.18 CST 90 - Other (Normal)

All possible ICMS fields available: own BC/rate/value, ST BC/rate/value, desoneracao, ST desoneracao.

### 7.19 CST 90_partilha - Other with Partition

All CST 90 fields PLUS partition fields (icms_base_calculo_operacao_propria, icms_uf_st).

### 7.20 Simples Nacional Codes

| Code | Specific Fields                                           |
| ---- | --------------------------------------------------------- |
| 101  | icms_aliquota_credito_simples, icms_valor_credito_simples |
| 102  | None (no credit)                                          |
| 103  | None (exempt)                                             |
| 201  | Credit fields + all ST fields                             |
| 202  | All ST fields (no credit)                                 |
| 203  | All ST fields (exempt + ST)                               |
| 300  | None (immune)                                             |
| 400  | None (non-taxed)                                          |
| 500  | Effective fields (same as CST 60)                         |
| 900  | All: own ICMS + credit fields                             |

---

## 8. FCP (Fundo de Combate a Pobreza)

### Own operation:

| Field            | Type    | Precision |
| ---------------- | ------- | --------- |
| fcp_percentual   | Decimal | 4 dp      |
| fcp_base_calculo | Decimal | 2 dp      |
| fcp_valor        | Decimal | 2 dp      |

### ST:

| Field               | Type          |
| ------------------- | ------------- |
| fcp_percentual_st   | Decimal[3.4]  |
| fcp_base_calculo_st | Decimal[13.2] |
| fcp_valor_st        | Decimal[13.2] |

### Previously retained ST:

| Field                      | Type          |
| -------------------------- | ------------- |
| fcp_percentual_retido_st   | Decimal[3.4]  |
| fcp_base_calculo_retido_st | Decimal[13.2] |
| fcp_valor_retido_st        | Decimal[13.2] |

### Deferral (CST 51):

| Field                           | Type           |
| ------------------------------- | -------------- |
| icms_fcp_percentual_diferimento | Decimal[3.2-4] |
| icms_fcp_valor_diferido         | Decimal[13.2]  |
| icms_fcp_valor_efetivo          | Decimal[13.2]  |

### Interstate Consumer Final (DIFAL):

| Field                            | Type                         |
| -------------------------------- | ---------------------------- |
| icms_base_calculo_uf_destino     | Decimal[13.2]                |
| fcp_base_calculo_uf_destino      | Decimal[13.2]                |
| fcp_percentual_uf_destino        | Decimal[3.4]                 |
| icms_aliquota_interna_uf_destino | Decimal[3.2-4]               |
| icms_aliquota_interestadual      | Decimal[3.2-4]               |
| icms_percentual_partilha         | Decimal[3.2-4] (default 100) |
| fcp_valor_uf_destino             | Decimal[13.2]                |
| icms_valor_uf_destino            | Decimal[13.2]                |
| icms_valor_uf_remetente          | Decimal[13.2]                |

---

## 9. IPI (Imposto sobre Produtos Industrializados)

| Field                            | Type            | Description                 |
| -------------------------------- | --------------- | --------------------------- |
| ipi_situacao_tributaria          | String          | **Required if applicable**  |
| ipi_base_calculo                 | Decimal[13.2]   | IPI BC                      |
| ipi_aliquota                     | Decimal[3.2-4]  | IPI rate %                  |
| ipi_quantidade_total             | Decimal[12.0-4] | Qty in standard unit        |
| ipi_valor_por_unidade_tributavel | Decimal[11.0-4] | Per-unit amount (pauta)     |
| ipi_valor                        | Decimal[13.2]   | IPI amount                  |
| ipi_cnpj_produtor                | String[14]      | Producer CNPJ if different  |
| ipi_codigo_enquadramento_legal   | Integer[3]      | Legal code (use 999 if N/A) |
| ipi_codigo_selo_controle         | String[1-60]    | Control seal code           |
| ipi_quantidade_selo_controle     | Integer         | Control seal qty            |

### IPI CST Codes:

| Code | Direction | Description     |
| ---- | --------- | --------------- |
| 00   | Entry     | Recovery credit |
| 01   | Entry     | Zero-rated      |
| 02   | Entry     | Exempt          |
| 03   | Entry     | Non-taxed       |
| 04   | Entry     | Immune          |
| 05   | Entry     | Suspended       |
| 49   | Entry     | Other           |
| 50   | Exit      | Taxed           |
| 51   | Exit      | Zero-rated      |
| 52   | Exit      | Exempt          |
| 53   | Exit      | Non-taxed       |
| 54   | Exit      | Immune          |
| 55   | Exit      | Suspended       |
| 99   | Exit      | Other           |

---

## 10. PIS (Programa de Integracao Social)

| Field                      | Type            | Description   |
| -------------------------- | --------------- | ------------- |
| pis_situacao_tributaria    | String          | **Required**  |
| pis_base_calculo           | Decimal[13.2]   | PIS BC        |
| pis_aliquota_porcentual    | Decimal[3.2-4]  | PIS rate %    |
| pis_quantidade_vendida     | Decimal[12.0-4] | Qty sold      |
| pis_aliquota_valor         | Decimal[3.2-4]  | Per-unit rate |
| pis_valor                  | Decimal[13.2]   | PIS amount    |
| pis_base_calculo_st        | Decimal[13.2]   | PIS-ST BC     |
| pis_aliquota_porcentual_st | Decimal[3.2-4]  | PIS-ST rate % |
| pis_valor_st               | Decimal[13.2]   | PIS-ST amount |

### PIS CST Codes:

| Code  | Description                         |
| ----- | ----------------------------------- |
| 01    | Taxable - cumulative/non-cumulative |
| 02    | Taxable - differentiated rate       |
| 03    | Taxable - quantity rate             |
| 04    | Monophasic zero-rated               |
| 05    | Zero-rated (tax substitution)       |
| 06    | Zero-rated                          |
| 07    | Exempt                              |
| 08    | Suspended                           |
| 09    | Non-incidence                       |
| 49    | Other exit operations               |
| 50-56 | Entry credit operations             |
| 60-67 | Entry credit (presumed)             |
| 70-75 | Entry credit (other)                |
| 98    | Entry with no credit                |
| 99    | Other                               |

---

## 11. COFINS

Same structure as PIS, replace `pis_` prefix with `cofins_`:

| Field                         | Type            | Description   |
| ----------------------------- | --------------- | ------------- |
| cofins_situacao_tributaria    | String          | **Required**  |
| cofins_base_calculo           | Decimal[13.2]   | COFINS BC     |
| cofins_aliquota_porcentual    | Decimal[3.2-4]  | Rate %        |
| cofins_quantidade_vendida     | Decimal[12.0-4] | Qty sold      |
| cofins_aliquota_valor         | Decimal[3.2-4]  | Per-unit rate |
| cofins_valor                  | Decimal[13.2]   | COFINS amount |
| cofins_base_calculo_st        | Decimal[13.2]   | ST BC         |
| cofins_aliquota_porcentual_st | Decimal[3.2-4]  | ST rate %     |
| cofins_valor_st               | Decimal[13.2]   | ST amount     |

COFINS CST codes: Same as PIS (01-09, 49-75, 98-99).

---

## 12. II (Imposto de Importacao)

| Field                  | Type          |
| ---------------------- | ------------- |
| ii_base_calculo        | Decimal[13.2] |
| ii_despesas_aduaneiras | Decimal[13.2] |
| ii_valor               | Decimal[13.2] |
| ii_valor_iof           | Decimal[13.2] |

---

## 13. ISSQN (Services Tax)

| Field                               | Type           | Description                                                                      |
| ----------------------------------- | -------------- | -------------------------------------------------------------------------------- |
| issqn_base_calculo                  | Decimal[13.2]  | Service BC                                                                       |
| issqn_aliquota                      | Decimal[3.2-4] | Rate %                                                                           |
| issqn_valor                         | Decimal[13.2]  | ISSQN amount                                                                     |
| issqn_codigo_municipio              | Integer[7]     | IBGE municipality                                                                |
| issqn_item_lista_servico            | String[5]      | Service list (NN.NN)                                                             |
| issqn_valor_deducao                 | Decimal[13.2]  | BC deduction                                                                     |
| issqn_valor_outras_retencoes        | Decimal[13.2]  | Other retentions                                                                 |
| issqn_valor_desconto_incondicionado | Decimal[13.2]  | Unconditional discount                                                           |
| issqn_valor_desconto_condicionado   | Decimal[13.2]  | Conditional discount                                                             |
| issqn_valor_retencao                | Decimal[13.2]  | ISS withholding                                                                  |
| issqn_indicador_exigibilidade       | Integer        | 1-7 (required, non-incidence, exempt, export, immune, judicial susp, admin susp) |
| issqn_codigo_servico                | String[1-20]   | Municipal service code                                                           |
| issqn_codigo_municipio_incidencia   | Integer[7]     | Incidence municipality                                                           |
| issqn_codigo_pais                   | Integer[4]     | Country code (foreign)                                                           |
| issqn_numero_processo               | String[1-30]   | Suspension process #                                                             |
| issqn_indicador_incentivo           | Integer[1]     | Tax incentive                                                                    |

---

## 14. Payment Methods (formas_pagamento)

```
formas_pagamento: Collection[1-120]
```

| Field                     | Type          | Required | Description            |
| ------------------------- | ------------- | -------- | ---------------------- |
| tipo_pagamento            | Integer       | **Yes**  | See codes below        |
| valor_pagamento           | Decimal[13.2] | **Yes**  | Payment amount         |
| data_vencimento           | Date          | No       | Due date               |
| parcela_numero            | Integer       | No       | Installment number     |
| bandeira_cartao           | Integer       | No       | Card brand (see below) |
| cnpj_adquirente_cartao    | Integer[14]   | No       | Card acquirer CNPJ     |
| numero_autorizacao_cartao | String[6-20]  | No       | Card auth number       |

### Payment Type Codes:

| Code   | Description               |
| ------ | ------------------------- |
| 01     | Dinheiro (Cash)           |
| 02     | Cheque                    |
| 03     | Cartao de Credito         |
| 04     | Cartao de Debito          |
| 05     | Credito Loja              |
| 10     | Vale Presente (Gift card) |
| 11     | Vale Refeicao             |
| 12     | Vale Combustivel          |
| 13     | Duplicata                 |
| 14     | Boleto Bancario           |
| 15     | Deposito Bancario         |
| **16** | **PIX**                   |
| 17     | Transferencia Bancaria    |
| 18     | Programa de Fidelizacao   |
| 19     | Transacao Sem Valor       |
| 20     | Ordem de Compra           |
| 21     | Confianca                 |
| 22     | Cesta de Beneficios       |
| 99     | Outros                    |

### Card Brand Codes:

| Code | Brand            |
| ---- | ---------------- |
| 01   | Visa             |
| 02   | Mastercard       |
| 03   | American Express |
| 04   | Sorocred         |
| 05   | Diners           |
| 06   | Elo              |
| 07   | Hipercard        |
| 08   | Aura             |
| 09   | ABECS            |
| 99   | Outros           |

---

## 15. Transport & Freight

### Header:

| Field            | Type    | Required | Valid Values                                                    |
| ---------------- | ------- | -------- | --------------------------------------------------------------- |
| modalidade_frete | Integer | **Yes**  | 0=emitter (CIF), 1=recipient (FOB), 2=third party, 9=no freight |

### Carrier:

| Field                            | Type      |
| -------------------------------- | --------- |
| cnpj_transportador               | String    |
| cpf_transportador                | String    |
| nome_transportador               | String    |
| inscricao_estadual_transportador | String    |
| logradouro_transportador         | String    |
| municipio_transportador          | String    |
| uf_transportador                 | String[2] |

### Volumes:

```
volumes: Collection[0-120]
```

| Field              | Type         | Precision |
| ------------------ | ------------ | --------- |
| quantidade_volumes | Decimal      | 4 dp      |
| especie            | String[1-60] | -         |
| marca              | String[1-60] | -         |
| numero_volumes     | String[1-60] | -         |
| peso_bruto         | Decimal      | 4 dp      |
| peso_liquido       | Decimal      | 4 dp      |

### Vehicle (transport):

| Field            | Type      |
| ---------------- | --------- |
| veiculo_placa    | String    |
| veiculo_uf_placa | String[2] |
| veiculo_rntc     | String[8] |

---

## 16. Totals (Auto-Calculated from Items)

These are automatically summed from item values if not provided:

| Total Field                 | Source Item Field       | Exclusion Rule          |
| --------------------------- | ----------------------- | ----------------------- |
| icms_base_calculo           | icms_base_calculo       |                         |
| icms_valor_total            | icms_valor              | Excludes CST 40, 41, 50 |
| icms_valor_total_desonerado | icms_valor_desonerado   |                         |
| icms_base_calculo_st        | icms_base_calculo_st    |                         |
| icms_valor_total_st         | icms_valor_st           |                         |
| valor_ipi                   | ipi_valor               |                         |
| valor_pis                   | pis_valor               | Non-service items only  |
| valor_cofins                | cofins_valor            | Non-service items only  |
| valor_total_ii              | ii_valor                |                         |
| valor_frete                 | valor_frete             |                         |
| valor_seguro                | valor_seguro            |                         |
| valor_desconto              | valor_desconto          |                         |
| valor_outras_despesas       | valor_outras_despesas   |                         |
| valor_produtos              | valor_bruto             | Where inclui_no_total=1 |
| valor_total_tributos        | valor_total_tributos    |                         |
| valor_ipi_devolvido         | valor_ipi_devolvido     |                         |
| fcp_valor                   | fcp_valor               |                         |
| fcp_valor_st                | fcp_valor_st            |                         |
| fcp_valor_retido_st         | fcp_valor_retido_st     |                         |
| fcp_valor_uf_destino        | fcp_valor_uf_destino    |                         |
| icms_valor_uf_destino       | icms_valor_uf_destino   |                         |
| icms_valor_uf_remetente     | icms_valor_uf_remetente |                         |

---

## 17. Additional Information

| Field                               | Type   | Max        |
| ----------------------------------- | ------ | ---------- |
| informacoes_adicionais_contribuinte | String | 2000 chars |
| informacoes_adicionais_fisco        | String | 2000 chars |

---

## 18. Cancellation

**DELETE** `/v2/nfe/REFERENCIA`

```json
{ "justificativa": "Reason string 15-255 chars" }
```

Rules:

- Only for `autorizado` notes
- Within 24 hours (state-dependent)
- Justification: 15-255 characters mandatory

Response:

- `status`: `cancelado` or `erro_cancelamento`
- `caminho_xml_cancelamento`: XML path

### Cancellation Errors:

| Code                | Meaning                            |
| ------------------- | ---------------------------------- |
| requisicao_invalida | Justification outside 15-255 chars |
| nfe_nao_autorizada  | Note not yet authorized            |
| nfe_cancelada       | Already cancelled                  |

---

## 19. Correction Letter (CCe)

**POST** `/v2/nfe/REFERENCIA/carta_correcao`

```json
{ "correcao": "Description of corrected fields" }
```

**Cannot correct:** tax base, price, quantity, tax value, issuer/recipient identity, issue date.

---

## 20. Number Invalidation (Inutilizacao)

**POST** `/v2/nfe/inutilizacao`

| Field          | Required | Description   |
| -------------- | -------- | ------------- |
| serie          | Yes      | Series number |
| numero_inicial | Yes      | Start number  |
| numero_final   | Yes      | End number    |
| justificativa  | Yes      | 15-255 chars  |

---

## 21. Error Codes

### HTTP Status:

| Code | Meaning                                                     |
| ---- | ----------------------------------------------------------- |
| 200  | Success (GET)                                               |
| 201  | Created (sync authorization)                                |
| 202  | Accepted (async processing)                                 |
| 400  | Invalid request / company not enabled / expired certificate |
| 403  | Permission denied (token blocked)                           |
| 404  | Not found                                                   |
| 415  | Invalid JSON                                                |
| 422  | Business rule violation                                     |
| 429  | Rate limit                                                  |
| 500  | Server error                                                |

### Error Response Format:

```json
{
  "codigo": "error_code_string",
  "mensagem": "Description",
  "erros": [{ "mensagem": "Field detail", "campo": "field_name" }]
}
```

### Business Error Codes:

| Code                   | Meaning                            |
| ---------------------- | ---------------------------------- |
| requisicao_invalida    | Missing/invalid field              |
| empresa_nao_habilitada | Company not enabled                |
| nfe_cancelada          | Already cancelled                  |
| certificado_vencido    | Expired digital certificate        |
| permissao_negada       | Invalid/blocked token              |
| nao_encontrado         | Resource not found                 |
| nfe_nao_autorizada     | Operation requires authorized note |
| nfe_autorizada         | Resubmitting already approved note |
| em_processamento       | Resubmitting note in progress      |
| erro_validacao_schema  | XML schema validation error        |

---

## 22. Decimal Precision Summary

| Type             | Precision  | Used For                                               |
| ---------------- | ---------- | ------------------------------------------------------ |
| Decimal[13.2]    | **2 dp**   | Monetary values (total, frete, ICMS, IPI, PIS, COFINS) |
| Decimal[11.0-4]  | **4 dp**   | Quantities (comercial, tributavel)                     |
| Decimal[11.0-10] | **10 dp**  | Unit prices (unitario_comercial, unitario_tributavel)  |
| Decimal[3.2-4]   | **2-4 dp** | Tax percentages/rates                                  |
| Decimal[3.4]     | **4 dp**   | FCP percentages, effective rates                       |
| Decimal[12.0-4]  | **4 dp**   | IPI/PIS/COFINS quantities                              |
| Decimal[8.3]     | **3 dp**   | Lot quantities (traceability)                          |
| Decimal[12.3]    | **3 dp**   | Fuel meter readings                                    |

---

## 23. CIENA-Specific Configuration

For CIENA (streetwear e-commerce, RJ), the typical NF-e emission will use:

### Common Values:

- `tipo_documento`: 1 (exit)
- `finalidade_emissao`: 1 (normal) or 4 (return/trocas)
- `consumidor_final`: 1 (end consumer)
- `presenca_comprador`: 2 (internet)
- `local_destino`: 1 (RJ internal) or 2 (interstate)
- `modalidade_frete`: 1 (recipient/FOB) or 2 (third party via Loggi/ME)
- `regime_tributario_emitente`: 1 (Simples Nacional) or 3 (Normal) - confirm with Pedro

### Common ICMS for Simples Nacional:

- `icms_situacao_tributaria`: 102 (SN without credit, most sales)
- `icms_origem`: 0 (domestic) or 5 (domestic <40% foreign, imported fabrics)

### Common PIS/COFINS for SN:

- `pis_situacao_tributaria`: "07" (exempt - SN)
- `cofins_situacao_tributaria`: "07" (exempt - SN)

### Common CFOPs:

- 5102: Venda de mercadoria (within state)
- 6102: Venda de mercadoria (interstate)
- 5202: Devolucao de compra (return within state)
- 6202: Devolucao de compra (return interstate)

### Common NCMs for Streetwear:

- 6109.10.00: Camisetas de malha (T-shirts)
- 6110.30.00: Moletons/sweaters de fibras sinteticas
- 6203.42.00: Calcas de algodao (pants)
- 6505.00.90: Bones/chapeus (caps/hats)
- 4202.22.20: Bolsas (bags)
- 6204.62.00: Calcas femininas de algodao

### Payment:

- `tipo_pagamento`: 16 (PIX) or 03 (credit card) or 04 (debit card)

---

## 24. Sandbox/Homologation Notes

1. **Base URL:** `https://homologacao.focusnfe.com.br`
2. Uses the same API structure as production
3. `nome_destinatario` in homologation MUST be: `"NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL"`
4. No real SEFAZ transmission - validates structure only
5. Free to use for development/testing
6. Same token, separate environment

---

## 25. Best Practices

1. **Always validate CNPJ/CPF** before sending (check digit algorithm)
2. **Archive XMLs** for 5 years post-authorization (legal requirement)
3. **Handle async properly:** poll every 5-10 seconds for NF-e, max 60 seconds
4. **Use webhooks** instead of polling when possible
5. **Reference IDs:** use order ID or UUID, never reuse after success
6. **Cancellation window:** emit correction letter (CCe) if past 24h
7. **Number gaps:** Focus NFe auto-handles contingency, may cause gaps - use inutilizacao for unused numbers
8. **SP/GO/BA:** No synchronous emission available, always async
9. **Decimal precision:** Match exactly or SEFAZ will reject
10. **Auto-calculated fields:** Let Focus NFe calculate totals when possible to avoid mismatches
11. **Digital certificate:** Must be valid A1 or A3, uploaded to Focus NFe dashboard
