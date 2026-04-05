# Competitive Intelligence: Inbazz

> **Categoria:** Plataforma de gestao de influenciadores / creators
> **Analise baseada em:** Transcricao de call de demo (~55 min, 3 speakers, Marco 2026)
> **Participantes da call:** JG (vendedor Inbazz), Marcos (admin CIENA), Caio (PM CIENA), Max (possivelmente outro membro CIENA)
> **Modulo Ambaril relacionado:** `Creators`
> **Relacao:** Inbazz foi contratado pela CIENA como provider externo temporario (bridge), nao substituto. Sera migrado para Ambaril Creators.
> **Metodologia:** Transcricao completa lida (53.010 chars). Spec completo do modulo Creators lido (2.600+ linhas). Plan.md secao 9 lida. Todas as features identificadas na call de demo foram extraidas e comparadas contra o spec do Ambaril.
> **Features extraidas:** 66 | ✅ 32 | ⚠️ 22 | ❌ 12

---

## 1. Visao Geral

Inbazz e uma plataforma SaaS brasileira focada em **gestao de comunidades de influenciadores e afiliados** para marcas de e-commerce. Permite criar comunidades de creators com cupons unicos, acompanhar performance em tempo real via integracao com Meta API, e gerenciar comissoes. O pitch central e "validacao anti-fraude via API" -- as metricas sao puxadas diretamente do Meta, sem depender de dados declarados pelo influenciador.

**Posicionamento:** "Gestao de comunidade de influenciadores com ROI mensuravel e validacao real."

**Modelo financeiro diferenciador:** Inbazz atua como intermediario financeiro (marca paga Inbazz, Inbazz paga creators), o que simplifica a complexidade fiscal (uma NF so). Ambaril e SaaS que automatiza pagamento direto marca-creator (mais controle, mais complexidade fiscal).

**Modelo de Negocio / Pricing:**

- **Objecao principal do cliente na call:** "E carissimo" e "tenho que pagar por features que nao uso"
- Modelo de precificacao: pacote com multiplas features bundled
- Sem mencao de valores exatos
- Contrato de adesao (nao foi mencionada fidelidade minima)

---

## 2. Tabela Comparativa Completa (66 Features)

### A. Onboarding & Cadastro de Creators

| #   | Feature Inbazz (da transcricao)                                                                                                                 | Status Ambaril | Referencia Ambaril                                                                           | Notas                                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | **Landing page personalizada** para captacao de creators (exemplo Insider) -- canal de entrada com beneficios, requisitos, quem pode participar | ✅ Existe      | US-01, US-NEW1, secao 5.13 -- Form publico em `/creators/apply`                              | Ambaril tem o form de 3 etapas. A "landing page" de marketing (beneficios, tiers, como funciona) **nao e especificada no spec** -- o spec so define o **formulario** de cadastro, nao a landing que vende o programa.                         |
| A2  | **Formulario de inscricao** com campos: nome, telefone, email, CPF, endereco                                                                    | ✅ Existe      | US-01, R33, secao 5.13                                                                       | Campos identicos. Ambaril inclui mais: birth_date, bio, motivation, niches, content_types, clothing_size, discovery_source.                                                                                                                   |
| A3  | **Campos personalizaveis** no formulario (ex: tamanho de peca superior, nicho de influencia)                                                    | ✅ Existe      | US-01 Step 3 -- niches, content_types, clothing_size                                         | Ambaril tem campos fixos pre-definidos no schema (niches, content_types, clothing_size). **Nao tem campos dinamicos/custom configuraveis pelo tenant** -- os campos sao hardcoded no Zod schema.                                              |
| A4  | **Termos de uso** integrados no formulario -- creator aceita ao se inscrever, substituindo contrato                                             | ✅ Existe      | US-01, R33 -- `content_rights_accepted`, `terms_accepted`                                    | Identico. Ambaril tem checkbox de cessao de direitos de imagem + termos do programa.                                                                                                                                                          |
| A5  | **Tags automaticas** no perfil do creator baseadas nas respostas do formulario (ex: "camiseta M", "lifestyle")                                  | ⚠️ Parcial     | Ambaril armazena `clothing_size`, `content_niches`, `content_types` como campos estruturados | Inbazz menciona "tags" como sistema generico. Ambaril tem campos tipados (enum/JSONB), nao um sistema de tags livres. Funcionalidade similar, implementacao diferente. Ambaril **nao tem tags genericas/custom** -- sao campos pre-definidos. |
| A6  | **Dados do Instagram puxados via API** -- seguidores, taxa de engajamento (sem possibilidade de mentir)                                         | ✅ Existe      | US-01, R33, R29, secao 4.8 -- Instagram Graph API validation, social_accounts.followers      | Identico. Ambaril valida IG via API no momento do cadastro e faz sync periodico de followers.                                                                                                                                                 |
| A7  | **Dados do TikTok** puxados da API                                                                                                              | ⚠️ Parcial     | OQ-3, R32a -- "TikTok planned for v1.1"                                                      | TikTok handle e coletado no cadastro (campo obrigatorio). Integracao com API do TikTok **adiada para v1.1**. Inbazz ja tem.                                                                                                                   |
| A8  | **Aprovacao/Rejeicao** de candidatos pelo admin                                                                                                 | ✅ Existe      | US-14, R34, secao 5.14                                                                       | Identico. Ambaril tem fila de aprovacao com botoes Aprovar/Rejeitar.                                                                                                                                                                          |
| A9  | **Aprovacao em lote** (aprovar multiplos creators de uma vez)                                                                                   | ⚠️ Parcial     | US-14 menciona aprovar "uma ou mais pessoas"                                                 | Inbazz menciona explicitamente "quando voces aprovarem uma ou mais pessoas". Ambaril spec nao menciona explicitamente bulk approval na UI -- o fluxo descrito e individual. Endpoint poderia suportar, mas nao e especificado.                |
| A10 | **Criacao automatica de cupom** na aprovacao, seguindo padrao configuravel                                                                      | ✅ Existe      | R34 -- "auto-generate coupon code (uppercase first name + discount, check uniqueness)"       | Inbazz menciona "pode seguir um padrao, ou voces podem ter diversos padroes". Ambaril tem um padrao fixo (NOME + desconto). **Multiplos padroes de cupom nao sao especificados no Ambaril.**                                                  |
| A11 | **Integracao com checkout (IEV/Yever)** para criar cupons automaticamente                                                                       | ✅ Existe      | Secao 7 -- Integracao com Checkout, provider abstraction (ecommerce capability)              | Ambaril cria cupons via ecommerce provider (Shopify). O Inbazz mencionou integracao especifica com IEV (Yever).                                                                                                                               |
| A12 | **Observar WhatsApp** do creator (enviar mensagem via WA se necessario)                                                                         | ✅ Existe      | Secao 10, templates WA -- Mensageria envia WA em multiplos eventos do lifecycle              | Ambaril tem 20+ templates de WA para diferentes eventos.                                                                                                                                                                                      |

---

### B. Comissao & Sistema Financeiro

| #   | Feature Inbazz (da transcricao)                                                                                           | Status Ambaril | Referencia Ambaril                                                                                             | Notas                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | **Comissao configuravel por creator** (pode ser 99% pra um e 1% pra outro, individualmente)                               | ❌ Nao existe  | R1-R4: comissao e **tier-based** (8%, 10%, 12%, 15%). OQ-5: "Not in v1.0. Tier-based only."                    | **GAP SIGNIFICATIVO.** Inbazz permite comissao totalmente custom por pessoa. Ambaril e rigido por tier. OQ-5 reconhece isso mas adia pra futuro.                                                                                       |
| B2  | **Escalacao automatica de comissao** (ex: 5% padrao, se vender R$50k sobe automaticamente para 10%)                       | ✅ Existe      | R1-R8, secao 4.1 -- Tier system com progressao automatica baseada em vendas confirmadas nos ultimos 90 dias    | Conceito identico, implementacao diferente. Ambaril usa vendas confirmadas (contagem) + pontos acumulados, nao valor vendido. Inbazz parece usar valor vendido.                                                                        |
| B3  | **Pagamento fixo mensal** para creators especificos (ex: R$500/mes para um influenciador)                                 | ❌ Nao existe  | Nenhuma referencia a pagamento fixo no spec                                                                    | **GAP.** Inbazz permite adicionar valor fixo mensal no perfil do creator. Ambaril so tem comissao por venda. Nao ha conceito de "fee fixo" no modelo de dados.                                                                         |
| B4  | **Calculo de ROI** incluindo: comissao, envio de produtos, valor fixo mensal                                              | ✅ Existe      | US-25, secao 4.7, campaigns -- `total_product_cost + total_shipping_cost + total_fee_cost + total_reward_cost` | Ambaril calcula ROI por campanha. `total_fee_cost` pode cobrir fees de influenciadores pagos. Porem o **fee fixo mensal recorrente** do B3 nao existe como conceito.                                                                   |
| B5  | **Ciclo de pagamento acumulado** (1 mes por padrao) -- comissao acumulada durante o periodo, pagamento unico              | ✅ Existe      | R15-R16 -- Calculo dia 10, pagamento ate dia 15 do mes seguinte                                                | Identico. Ambaril tem ciclo mensal fixo.                                                                                                                                                                                               |
| B6  | **Ciclo de pagamento configuravel** (15 em 15 dias, 60 em 60, etc.)                                                       | ❌ Nao existe  | R15: ciclo fixo mensal (dia 1 a dia 30/31)                                                                     | Inbazz perguntou se era configuravel e disse que "normalmente as marcas colocam um mes". Ambaril e fixo mensal.                                                                                                                        |
| B7  | **Pagamento via PIX** em conta do Inbazz, repasse automatico para creators                                                | ⚠️ Diferente   | R16 -- Ambaril processa PIX diretamente para cada creator                                                      | Modelo diferente: Inbazz centraliza o pagamento (marca paga Inbazz, Inbazz paga creators). Ambaril faz pagamento direto marca -> creator via PIX.                                                                                      |
| B8  | **Nota fiscal unica** -- marca recebe uma NF so do Inbazz, nao de cada creator individualmente                            | ❌ Nao existe  | Secao 4.10 (Fiscal Compliance) -- cada creator tem tax_profiles, RPA/NF-e individual                           | **GAP OPERACIONAL.** No modelo Ambaril, a marca emite RPA pra cada PF ou recebe NF-e de cada PJ/MEI. Inbazz resolve isso absorvendo a complexidade fiscal.                                                                             |
| B9  | **Abatimento automatico em caso de cancelamento** -- se pedido cancelado antes do saque, abate; se depois, saldo negativo | ✅ Existe      | R13-R14 -- Exchange window de 7 dias, ajuste de comissao                                                       | Ambaril tem janela de 7 dias para trocas. Apos confirmacao, venda e definitiva. Inbazz parece permitir cancelamento a qualquer momento com saldo negativo retroativo. **Ambaril nao tem conceito de saldo negativo apos confirmacao.** |
| B10 | **Vendas rastreadas por cupom**                                                                                           | ✅ Existe      | R9-R12 -- "coupon-only" attribution                                                                            | Identico. Ambos usam cupom como mecanismo de atribuicao.                                                                                                                                                                               |

---

### C. Tracking de Conteudo & Posts

| #   | Feature Inbazz (da transcricao)                                                                                                                                                  | Status Ambaril | Referencia Ambaril                                                                             | Notas                                                                                                                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Tracking automatico de posts** -- toda vez que alguem postar marcando a marca, aparece na plataforma                                                                           | ✅ Existe      | R29-R32, content_detections table                                                              | Identico. Instagram polling a cada 15 min + hashtag tracking diario.                                                                                                                                                                                                                                    |
| C2  | **Contagem de posts por tipo** (Feed, Reels, Stories, TikTok) -- ao passar o mouse mostra breakdown                                                                              | ✅ Existe      | content_detections.post_type enum: image, video, carousel, story, reel, short                  | Dados armazenados. Ambaril tem a contagem por tipo. UI de hover com breakdown nao esta detalhada no wireframe, mas dados existem.                                                                                                                                                                       |
| C3  | **Data do ultimo post** visivel por creator                                                                                                                                      | ✅ Existe      | content_detections.detected_at -- pode derivar o ultimo post                                   | Nao ha campo denormalizado "last_post_at", mas derivavel da query.                                                                                                                                                                                                                                      |
| C4  | **Stories arquivados permanentemente** -- stories nao desaparecem em 24h, ficam na plataforma para sempre, com qualidade original                                                | ⚠️ Parcial     | R29 -- polling detecta stories. content_detections armazena post_url, caption, likes, comments | Ambaril **detecta** stories e armazena metadata. Mas **nao armazena o conteudo original** (imagem/video). Armazena apenas URL e metadata. Se o story sair do ar, o conteudo se perde. **Inbazz parece baixar e armazenar o conteudo completo.**                                                         |
| C5  | **Download de conteudo com qualidade original** -- baixar posts/stories dos creators                                                                                             | ❌ Nao existe  | content_detections so armazena URLs e metadata, nao o arquivo de midia                         | **GAP.** Inbazz oferece download do conteudo. Ambaril nao tem funcionalidade de media storage para conteudo de creators. O DAM existe mas nao e integrado para esse fim.                                                                                                                                |
| C6  | **"Posts da comunidade"** -- visualizacao centralizada de todos os posts de todos os creators                                                                                    | ✅ Existe      | US-14d -- Content Gallery no portal; Admin analytics mostra posts                              | Ambaril tem Content Gallery no portal e detections na admin view.                                                                                                                                                                                                                                       |
| C7  | **TikTok tracking** de posts                                                                                                                                                     | ⚠️ Parcial     | R32a -- "v1.1: TikTok API integration (requires Business Account approval)"                    | Planejado para v1.1. Inbazz ja tem.                                                                                                                                                                                                                                                                     |
| C8  | **YouTube tracking** (mencionado como "chegando")                                                                                                                                | ⚠️ Parcial     | social_accounts suporta youtube como platform, mas nao ha job de polling para YouTube          | Schema suporta, implementacao nao especificada.                                                                                                                                                                                                                                                         |
| C9  | **Analise de conteudo via IA** -- AI analisa se conteudo esta de acordo com briefing (do's and don'ts), aprova/reprova automaticamente, retorna pontos de adesao e recomendacoes | ❌ Nao existe  | Nenhuma referencia a AI content analysis no spec                                               | **GAP SIGNIFICATIVO.** Inbazz esta trazendo uma ferramenta de AI que analisa conteudo vs briefing automaticamente. Ambaril tem review manual de challenge submissions (US-16). A lista de evolucoes C2 (AI Content Coach) e parcialmente relacionada mas foca em sugestoes, nao em compliance checking. |
| C10 | **Curadoria pos-publicacao automatizada** -- AI verifica se creator falou algo nos don'ts durante video                                                                          | ❌ Nao existe  | Nenhuma referencia                                                                             | Extensao do C9. Inbazz verifica conteudo de video automaticamente. Ambaril nao tem nada similar.                                                                                                                                                                                                        |

---

### D. Gamificacao & Niveis

| #   | Feature Inbazz (da transcricao)                                                                                                               | Status Ambaril | Referencia Ambaril                                                                                              | Notas                                                                                                                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Sistema de niveis** (ouro, prata, bronze -- nomes customizaveis, quantidade customizavel)                                                   | ✅ Existe      | Secao 4.1 -- 5 tiers: AMBASSADOR, SEED, GROW, BLOOM, CORE                                                       | Conceito identico. Ambaril tem 5 tiers fixos. Inbazz parece permitir **nomes e quantidade customizaveis** de tiers.                                                                                                                                                       |
| D2  | **Pontuacao por tipo de atividade** -- post no feed vale X, reels vale Y, visualizacoes, comentarios, vendas, valor vendido                   | ✅ Existe      | Secao 4.3 -- CIENA Points: sale (+10), post_detected (+50), challenge (+50-500), referral (+100), hashtag (+25) | Conceito similar. Ambaril tem pontuacao fixa por tipo. Inbazz parece ter **pontuacao configuravel por tipo de atividade** (peso).                                                                                                                                         |
| D3  | **Requisitos por nivel** -- ex: nivel ouro requer 10 publicacoes/mes + 1500 pontos + R$5000 vendidos                                          | ✅ Existe      | R1-R4 -- cada tier tem requisitos de vendas confirmadas (90d) + pontos lifetime                                 | Conceito identico. Metricas especificas podem diferir.                                                                                                                                                                                                                    |
| D4  | **Recompensas por nivel** -- comissao extra, valor em dinheiro, voucher de produtos                                                           | ✅ Existe      | R1-R4 (comissao por tier), R-GIFTING (gifting), R24a (exclusive products)                                       | Ambaril tem: comissao por tier + gifting automatico + produtos exclusivos + challenges com pontos. Cobre bem.                                                                                                                                                             |
| D5  | **Voucher de produtos como recompensa** -- creator recebe cupom de R$300, vai no site e escolhe o que quer                                    | ⚠️ Parcial     | US-26 -- payout method "store_credit" gera cupom Shopify                                                        | Ambaril tem store_credit como metodo de pagamento (gera cupom Shopify). Porem **voucher como recompensa de gamificacao** (nivel, campanha) e diferente de voucher como metodo de payout. A distincao e sutil -- no Inbazz parece ser mais flexivel (voucher como premio). |
| D6  | **Recompensas automaticas** -- ao bater nivel, recompensa e entregue automaticamente sem intervencao manual                                   | ✅ Existe      | R6 -- tier upgrade automatico. R-GIFTING -- gifting suggestions automaticas                                     | Tier upgrade e automatico. Gifting passa por aprovacao PM.                                                                                                                                                                                                                |
| D7  | **Ranking visivel para creators** -- posicao no ranking, pontuacao                                                                            | ✅ Existe      | US-14a -- Ranking page, top 20 por GMV                                                                          | Identico.                                                                                                                                                                                                                                                                 |
| D8  | **Ranking parcialmente oculto** -- creator ve sua posicao e pontos, mas NAO ve pontos dos outros (evita desistencia de quem esta muito atras) | ❌ Nao existe  | US-14a, secao 5.8 -- ranking mostra nome, tier e GMV de todos os top 20                                         | **GAP DE DESIGN.** Inbazz deliberadamente oculta a pontuacao dos outros para manter competitividade. Ambaril mostra GMV de todos no ranking. Decisao de design importante.                                                                                                |

---

### E. Campanhas & Briefing

| #   | Feature Inbazz (da transcricao)                                                                           | Status Ambaril | Referencia Ambaril                                                               | Notas                                                                                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | **Campanhas com periodo definido** -- eventos pontuais (ex: lancamento, 1 semana antes + 1 semana depois) | ✅ Existe      | US-25, campaigns table -- start_date, end_date                                   | Identico.                                                                                                                                                                                                             |
| E2  | **Briefing especifico para campanha** -- instrucoes do que falar, qualidade do pano, produto novo, etc.   | ✅ Existe      | US-NEW3, campaign_briefs table -- markdown editor, hashtags, examples, dos/donts | Identico. Ambaril tem briefing com markdown, hashtags obrigatorias, exemplos, targeting por tier.                                                                                                                     |
| E3  | **Competicao dentro de campanha** -- quem mais postar ganha premio (ex: R$1500 ou experiencia)            | ⚠️ Parcial     | Challenges (secao 4.3) + Campaigns sao entidades separadas                       | Ambaril tem challenges e campanhas como modulos distintos. **Nao ha um conceito explicito de "competicao dentro de uma campanha"** como leaderboard temporario de campanha. Challenges sao por mes, nao por campanha. |
| E4  | **Campanha com premio experiencial** -- "as 10 pessoas que mais venderem vao a um evento"                 | ⚠️ Parcial     | Challenges com recompensa flexivel (pontos + descricao)                          | O sistema de challenges permite qualquer recompensa descrita em texto/requirements. Nao ha um campo "premio experiencial" especifico, mas o modelo e flexivel o suficiente.                                           |

---

### F. Seeding & Envio de Produtos

| #   | Feature Inbazz (da transcricao)                                                                                                                                 | Status Ambaril | Referencia Ambaril                                                                                    | Notas                                                                                                                                                                                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **Integracao com ERP (Bling)** para envio de produtos -- seleciona produto, quantidade, influenciadores, e automacao cria pedido com NF de bonificacao no Bling | ⚠️ Parcial     | US-NEW4, R-GIFTING.4 -- gifting aprovado cria "internal ERP order". campaign_creators.delivery_status | Ambaril cria pedido interno no ERP proprio. **Nao tem integracao especifica com Bling para NF de bonificacao automatica.** O Ambaril substituira o Bling (e o ERP interno), mas o fluxo de NF de bonificacao nao esta detalhado no spec de Creators -- dependeria do modulo ERP. |
| F2  | **Seeding por tags** -- selecionar creators por tamanho de camiseta e enviar em lote                                                                            | ⚠️ Parcial     | clothing_size e armazenado; R-GIFTING.3 -- suggestions cross-reference clothing_size com product pool | Dados existem (clothing_size). O spec de gifting menciona cross-reference com clothing_size. **Falta funcionalidade explicita de "selecionar por filtro e enviar em lote"** como workflow na UI.                                                                                 |
| F3  | **Endereco e CPF ja cadastrados** para seeding automatico (sem re-input)                                                                                        | ✅ Existe      | creators.creators tem address (JSONB) e cpf                                                           | Dados armazenados no cadastro.                                                                                                                                                                                                                                                   |
| F4  | **Custo do produto no seeding conta para ROI** -- cada envio tem custo atribuido                                                                                | ✅ Existe      | campaign_creators.product_cost, campaign_creators.shipping_cost                                       | Identico. Custos rastreados por creator por campanha.                                                                                                                                                                                                                            |
| F5  | **Voucher para creator escolher peca no site** (alternativa ao seeding direto) -- cupom de R$300, creator compra no site                                        | ⚠️ Parcial     | US-26 -- store_credit como payout method gera cupom Shopify                                           | Store credit existe como metodo de payout. **Como mecanismo de seeding** (dar voucher para creator escolher peca), nao esta especificado como workflow distinto. Teria que usar o payout mechanism com um payout "falso" ou criar um mecanismo separado.                         |

---

### G. Dashboards & Analytics (Admin)

| #   | Feature Inbazz (da transcricao)                                                                         | Status Ambaril | Referencia Ambaril                                                                                    | Notas                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | **Dashboard geral da comunidade** -- total de pessoas, posts, alcance, ROI, custo por venda             | ✅ Existe      | US-19, secao 5.19 -- Analytics Dashboard com GMV, comissoes, CAC/Creator, ROAS                        | Identico.                                                                                                                                                                                                   |
| G2  | **Segmentacao por localidade** -- ver influenciadores do Rio vs Sao Paulo, etc.                         | ⚠️ Parcial     | creators.creators.address (city, state). social_accounts. Secao 5.14 -- lista de creators com filtros | Dados de cidade/estado existem. **Filtro por localidade na lista de creators e no dashboard analytics nao esta explicitamente especificado.** Os filtros especificados sao: status, tier, gestao (managed). |
| G3  | **Grafico de posts por periodo vs vendas por periodo** -- sobreposicao para correlacionar               | ⚠️ Parcial     | Analytics tem GMV e posts separadamente                                                               | Ambaril tem posts por creator e vendas por periodo. **Grafico de correlacao posts vs vendas nao esta especificado como visualizacao.**                                                                      |
| G4  | **Mapa de vendas por estado** (de onde sao os influenciadores/vendas)                                   | ❌ Nao existe  | Nenhum wireframe de mapa                                                                              | **GAP.** Inbazz mostra "de onde sao seus influenciadores por estado". Ambaril nao tem visualizacao geografica no spec.                                                                                      |
| G5  | **Ranking com multiplos criterios** -- quem vende mais, quem posta mais, porcentagem de conversao, etc. | ⚠️ Parcial     | US-19 -- "top 10 performers (by sales count, by revenue, by points)"                                  | Ambaril tem ranking por vendas, receita e pontos. Inbazz parece ter mais tipos de ranking.                                                                                                                  |
| G6  | **Produtos mais vendidos por cupom de creator**                                                         | ✅ Existe      | US-19 -- "product mix chart (which products sell most through creator coupons)"                       | Identico.                                                                                                                                                                                                   |
| G7  | **Produtos mais vendidos por creator individual**                                                       | ⚠️ Parcial     | Nao mencionado explicitamente no spec admin                                                           | Inbazz mostra no app do creator quais produtos ele mais vende. Ambaril mostra product mix global mas **nao por creator individual no perfil admin.**                                                        |

---

### H. App/Portal do Creator

| #   | Feature Inbazz (da transcricao)                                                     | Status Ambaril | Referencia Ambaril                                                                      | Notas                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | **Aplicativo nativo (iOS + Android)** para creators -- na App Store e Play Store    | ❌ Nao existe  | Portal web responsivo -- `(portal)/creators/*`                                          | **GAP SIGNIFICATIVO.** Inbazz tem app nativo. Ambaril tem portal web. A transcricao mostra debate sobre isso -- creators grandes nao vao baixar app, mas creators pequenos preferem. Ambaril e desktop-first por design (DS.md). |
| H2  | **Perfil do creator no app** -- tipo, cupom, sugestao de troca                      | ✅ Existe      | US-04, US-11 -- Dashboard + Profile no portal                                           | Ambaril tem portal completo com 10 paginas.                                                                                                                                                                                      |
| H3  | **Vendas do mes atual + comparativo com passado**                                   | ✅ Existe      | US-04 -- Dashboard com ganhos este mes; US-05 -- Sales history com periodo selecionavel | Identico.                                                                                                                                                                                                                        |
| H4  | **Produtos mais vendidos pelo creator** (individual)                                | ⚠️ Parcial     | Nao mencionado no portal wireframes                                                     | Inbazz mostra no app quais produtos o creator mais vende. **Ambaril tem catalogo de produtos (US-14b) mas nao "meus produtos mais vendidos" como tela.**                                                                         |
| H5  | **Ranking visivel no app** com posicao                                              | ✅ Existe      | US-14a -- Ranking page no portal                                                        | Identico.                                                                                                                                                                                                                        |
| H6  | **Historico de posts** do creator visivel no app                                    | ✅ Existe      | US-14d -- Content Gallery no portal                                                     | Identico.                                                                                                                                                                                                                        |
| H7  | **Carteira digital** com saldo acumulado -- creator ve quanto tem e pode sacar      | ⚠️ Diferente   | US-10 -- Earnings page com saldo, historico de pagamentos                               | Ambaril mostra saldo e historico. Mas **o creator nao "saca" ativamente** -- o pagamento e processado pelo admin no ciclo mensal. No Inbazz, o creator parece poder iniciar o saque.                                             |
| H8  | **Notificacao de vendas** -- retroativo do dia anterior, todo dia de manha          | ⚠️ Parcial     | wa_creator_sale -- WA notification quando venda e atribuida                             | Ambaril notifica por WA cada venda individual (nao batch diario). Inbazz envia resumo diario matinal. **Decisao de design diferente.**                                                                                           |
| H9  | **Creator pode ver em qual campanha esta participando** e configuracoes da campanha | ✅ Existe      | US-NEW3, secao 5.10 -- Briefings page no portal; campaign participation visible         | Identico.                                                                                                                                                                                                                        |
| H10 | **Sem versao web/navegador** para creators (somente app)                            | N/A            | Ambaril e o oposto -- somente web                                                       | Filosofias opostas. Inbazz = app-only para creators. Ambaril = web-only para creators.                                                                                                                                           |

---

### I. Pagamentos & Carteira

| #   | Feature Inbazz (da transcricao)                                                                                    | Status Ambaril                   | Referencia Ambaril                                                                                           | Notas                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I1  | **Pagamento unico centralizado** -- marca paga Inbazz, Inbazz distribui para creators                              | ❌ Nao existe (design diferente) | R15-R17 -- Ambaril calcula e a marca paga diretamente cada creator                                           | **Diferenca de modelo.** Inbazz e intermediario financeiro. Ambaril e SaaS que automatiza o pagamento direto. Impacto: Inbazz simplifica fiscal (uma NF), Ambaril da mais controle mas mais complexidade fiscal. |
| I2  | **Saldo negativo automatico** -- se creator ja sacou e pedido cancelado, proxima comissao desconta                 | ⚠️ Parcial                       | R13-R14 -- cancelamento dentro da janela de 7 dias cancela atribuicao. Nao ha saldo negativo pos-confirmacao | Ambaril tem janela de 7 dias. Apos confirmacao, venda e definitiva. **Nao existe saldo negativo retroativo.**                                                                                                    |
| I3  | **Mudanca de status do e-commerce refletida em tempo real** -- pedido cancelado/devolvido ja abate automaticamente | ⚠️ Parcial                       | R13-R14 -- exchange window. Daily job confirma vendas                                                        | Ambaril tem integracao via eventos de checkout, mas **so dentro da janela de 7 dias.** Inbazz parece monitorar mudancas a qualquer momento.                                                                      |

---

### J. Pain Points do Cliente (Workflows Atuais da CIENA)

| #   | Pain Point / Necessidade do Cliente                                                                                                           | Status Ambaril      | Notas                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| J1  | **Seeding manual e um inferno** -- Caio entra em contato um por um, creator escolhe pecas, vai pra planilha, depois pra administrativo pra NF | ✅ Resolvido        | R-GIFTING + campaigns + ERP integration resolve o fluxo de seeding                                                       |
| J2  | **Influenciadores grandes nao vao baixar app** -- Caio preocupado que JM, Kostk etc. nao vao baixar o app do Inbazz                           | ✅ Vantagem Ambaril | Ambaril e portal web -- nao precisa baixar nada. White-glove mode (managed_by_staff) resolve 100% para mega-influencers. |
| J3  | **"Acordar 2h da manha pra responder influenciador"** -- creators perguntando se cupom ja vendeu                                              | ✅ Resolvido        | Portal self-service + WA notifications automaticas                                                                       |
| J4  | **Comunidade forte mas inexplorada** -- CIENA tem base apaixonada que ja compra, quer converter em creators                                   | ✅ Resolvido        | Ambassador tier (massa) + post-purchase invite (R37) + public form                                                       |
| J5  | **Grupo VIP no WhatsApp** como canal de ativacao -- ja funciona mas e manual                                                                  | ⚠️ Parcial          | Ambaril nao tem integracao com grupos de WhatsApp. Mensagens sao individuais (templates WA)                              | **GAP.** O workflow de grupo VIP no WhatsApp nao e substituido pelo Ambaril. Ambaril comunica via WA individual, nao em grupo.                                                                                      |
| J6  | **Medo de escalar e perder essencia da marca** -- controle de qualidade conforme comunidade cresce                                            | ✅ Resolvido        | Anti-fraud controls, challenge review, briefing system, tier system como quality gate                                    |
| J7  | **Precisa de conteudo UGC para trafego pago** -- quer reutilizar posts de creators como ads                                                   | ⚠️ Parcial          | content_detections armazena metadata + URL. Marketing module menciona "UGC -> Partnership Ad" loop                       | Ambaril detecta UGC e Marketing module tem fluxo de aprovacao. **Mas nao armazena midia original** (apenas URLs). Download de conteudo em alta qualidade = gap (ver C5).                                            |
| J8  | **Integracao com Bling para NF de bonificacao** -- fluxo automatico de nota fiscal ao enviar produto                                          | ⚠️ Parcial          | Ambaril substitui Bling como ERP. Fluxo de NF de bonificacao no ERP proprio nao esta detalhado no spec de Creators       | Depende do modulo ERP do Ambaril ter funcionalidade equivalente de NF de bonificacao.                                                                                                                               |
| J9  | **Definicao de tiers e estrategia precisa de CS/onboarding para acertar** -- Caio quer ajuda para configurar                                  | N/A                 | Inbazz oferece time de CS para onboarding. Ambaril e ferramenta self-managed                                             | Diferenca de modelo de negocio (SaaS vs. managed service).                                                                                                                                                          |
| J10 | **Comecar com clientes fieis primeiro** (minimo 2 compras) antes de abrir para todos                                                          | ⚠️ Parcial          | Ambassador tier + public form. Nao ha filtro "minimo de compras anteriores" como requisito                               | **GAP.** Ambaril nao tem regra de "minimo de compras na CIENA como pre-requisito". O form e publico. Poderia ser feito via CRM integration (verificar historico de compras no checkout), mas nao esta especificado. |

---

## 3. Resumo Quantitativo

| Classificacao                    | Quantidade  |
| -------------------------------- | ----------- |
| ✅ **Existe no Ambaril**         | 32 features |
| ⚠️ **Parcialmente coberta**      | 22 features |
| ❌ **Nao existe no Ambaril**     | 12 features |
| **Total de features analisadas** | **66**      |

---

## 4. Gaps Consolidados com Prioridade (K1-K14)

| #   | Feature (Gap)                                                                                          | Impacto                                                   | Recomendacao                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K1  | **Comissao individual por creator** (nao tier-based)                                                   | Alto -- necessario para mega-influencers e acordos custom | Adicionar campo `commission_override` na tabela creators. Se != NULL, sobrescreve tier rate.                                                                                                      |
| K2  | **Pagamento fixo mensal** por creator                                                                  | Medio -- necessario para influencers pagos (contratos)    | Adicionar campo `monthly_fixed_fee` no perfil. Incluir no calculo de payout.                                                                                                                      |
| K3  | **App nativo para creators**                                                                           | Alto -- UX de creators pequenos/medios                    | De inicio, garantir que portal web seja 100% mobile-friendly. PWA como v1.1. App nativo e discutivel dado o contra-argumento de mega-influencers.                                                 |
| K4  | **Storage de midia de posts** (download com qualidade original, stories arquivados)                    | Alto -- necessario para UGC -> trafego pago               | Integrar content_detections com DAM/R2 -- ao detectar post, baixar midia e armazenar em Cloudflare R2.                                                                                            |
| K5  | **AI Content Analysis** -- verificacao automatica de compliance com briefing                           | Medio-Alto -- escala operacional                          | Implementar como extensao do Astro (AI Brain). Ja esta parcialmente planejado como C2 (AI Content Coach).                                                                                         |
| K6  | **Ranking com pontuacao oculta** (design de gamificacao)                                               | Baixo -- decisao de design                                | Alterar wireframe: mostrar posicao mas ocultar GMV/pontos dos outros. Configuravel.                                                                                                               |
| K7  | **Mapa geografico** de creators/vendas por estado                                                      | Baixo -- analytics enhancement                            | Adicionar componente de mapa no dashboard analytics.                                                                                                                                              |
| K8  | **NF centralizada** (marca emite uma NF so para o intermediario)                                       | Alto -- operacional/fiscal                                | Diferenca de modelo. Ambaril precisa resolver a complexidade fiscal (RPA/NF-e) no modulo fiscal compliance. Secao 4.10 ja endereca, mas e significativamente mais trabalhoso que o modelo Inbazz. |
| K9  | **Saque ativo pelo creator** (vs. pagamento passivo mensal pelo admin)                                 | Baixo -- UX preference                                    | Ambaril tem pagamento processado pelo admin. Adicionar opcao de "auto-payout" configuravel por tenant seria melhoria.                                                                             |
| K10 | **Notificacao diaria resumida** (batch, manha) vs notificacao por venda individual                     | Baixo -- config preference                                | Adicionar opcao de agrupamento de notificacoes (batch diario vs individual).                                                                                                                      |
| K11 | **Landing page de marketing** do programa (beneficios, tiers, como funciona) -- separada do formulario | Medio -- conversao de candidatos                          | Spec so tem o form. Precisa de landing page promocional antes do form.                                                                                                                            |
| K12 | **Multiplos padroes de cupom** configuraveis                                                           | Baixo                                                     | Adicionar template system para geracao de cupom (ex: NOME10, CIENANOME, etc.).                                                                                                                    |
| K13 | **Aprovacao em lote** (bulk approve) explicita na UI                                                   | Baixo                                                     | Adicionar checkbox + botao "Aprovar selecionados" no admin list.                                                                                                                                  |
| K14 | **Cancelamento/devolucao pos-confirmacao** com saldo negativo                                          | Medio                                                     | Avaliar se faz sentido business-wise. Pode gerar conflitos com creators.                                                                                                                          |

---

## 5. Top 5 Gaps Mais Criticos

1. **Comissao individual por creator** (B1, K1) -- impossibilita acordos com mega-influencers e deals customizados. Sem isso, qualquer creator que negocie taxa diferente do tier exige workaround manual.
2. **Storage de midia de posts / Download de conteudo** (C4, C5, K4) -- bloqueia fluxo UGC -> trafego pago. CIENA precisa reutilizar conteudo de creators como ads e o Ambaril nao armazena a midia, so URLs que expiram.
3. **AI Content Analysis** (C9, C10, K5) -- sem isso, review de conteudo nao escala. Com 50+ creators, verificar manualmente se cada post segue o briefing e inviavel. Inbazz esta trazendo isso como diferencial competitivo.
4. **NF centralizada / Complexidade fiscal** (B8, K8) -- operacionalmente muito mais pesado que Inbazz. Marca emite RPA individual para cada PF ou recebe NF-e de cada PJ/MEI. Inbazz absorve isso com uma NF so. Ambaril precisa que o modulo fiscal seja robusto o suficiente para compensar.
5. **App nativo vs Web** (H1, K3) -- UX para creators pequenos/medios e inferior no web-only. Porem, a propria call demonstra que mega-influencers recusam baixar app, o que valida a abordagem web do Ambaril. Mitigacao: PWA + portal 100% mobile-friendly.

---

## 6. Top 3 Vantagens do Ambaril Sobre Inbazz

1. **White-glove mode** -- Inbazz obriga todos a usar o app. Ambaril permite PM gerenciar tudo em nome de artistas/mega-influencers que nunca logam (managed_by_staff). Isso resolve diretamente a preocupacao de Caio sobre JM, Kostk e outros influencers de alto calibre.
2. **Sistema de pontos sofisticado** (CIENA Points) -- gamificacao mais rica que o Inbazz descreveu. Sale (+10), post_detected (+50), challenge (+50-500), referral (+100), hashtag (+25) com 5 tiers nomeados e progressao automatica.
3. **Integracao nativa** com todos os outros modulos (ERP, CRM, Mensageria, DAM, Checkout) -- Inbazz e uma ilha que depende de integracoes externas. Ambaril e ecossistema completo onde creator data flui naturalmente entre Checkout, CRM, Marketing e ERP.

---

## 7. Insights Acionaveis

### Alta Prioridade

**1. Comissao Individual por Creator (commission_override)**

- Inbazz diferencia no pitch com comissao totalmente custom por pessoa ("pode ser 99% pra um e 1% pra outro")
- Ambaril e rigido por tier (SEED 8%, GROW 10%, etc.)
- **Acao:** Adicionar campo `commission_override` (nullable decimal) na tabela `creators`. Quando preenchido, sobrescreve a rate do tier. Logica: `effective_rate = commission_override ?? tier.commission_rate`
- **Impacto:** Desbloqueia acordos com mega-influencers, patrocinados, e embaixadores com contratos especificos
- OQ-5 ja reconhece essa necessidade mas adia pra futuro -- considerar antecipar

**2. Storage de Midia & Download de Conteudo**

- Inbazz armazena e oferece download de posts/stories em qualidade original
- Ambaril so guarda URLs e metadata -- stories desaparecem em 24h, conteudo se perde
- **Acao:** Ao detectar post via polling (content_detections), disparar job que baixa midia (imagem/video) e armazena em Cloudflare R2 via DAM. Adicionar campo `media_asset_id` (FK para DAM) na content_detections
- **Impacto:** Habilita fluxo UGC -> trafego pago que CIENA precisa desesperadamente (J7)

**3. AI Content Analysis (Compliance Automatica)**

- Inbazz esta lancando AI que analisa conteudo vs briefing automaticamente (do's and don'ts)
- Ambaril tem review manual de challenge submissions (US-16) -- nao escala
- **Acao:** Implementar como extensao do Astro (AI Brain). Input: conteudo detectado + briefing ativo. Output: score de adesao + pontos de violacao + recomendacoes. Integrar com content_detections pipeline
- **Impacto:** Escala operacional. Com 50+ creators postando semanalmente, review manual e inviavel

### Media Prioridade

**4. Pagamento Fixo Mensal por Creator**

- Inbazz permite adicionar valor fixo mensal (R$500/mes) no perfil do creator
- Ambaril so tem comissao por venda -- nao ha conceito de "fee fixo"
- **Acao:** Adicionar campo `monthly_fixed_fee` (nullable decimal) na tabela `creators`. Incluir no calculo de payout mensal e no ROI
- **Impacto:** Necessario para contratos com influencers pagos (modelo cada vez mais comum no mercado BR)

**5. Landing Page de Marketing do Programa**

- Inbazz tem landing page completa com beneficios, requisitos, quem pode participar (exemplo Insider)
- Ambaril spec so define o formulario de cadastro (`/creators/apply`), nao a landing que vende o programa
- **Acao:** Criar pagina de marketing pre-formulario que explique tiers, beneficios, como funciona, depoimentos
- **Impacto:** Conversao de candidatos. Sem landing, o form frio tem taxa de abandono alta

**6. Resolucao da Complexidade Fiscal**

- Inbazz absorve a complexidade fiscal (marca paga uma NF so para Inbazz)
- Ambaril exige que marca emita RPA pra cada PF ou receba NF-e de cada PJ/MEI
- **Acao:** Garantir que modulo fiscal compliance (secao 4.10) automatize ao maximo: geracao de RPA, tracking de NF-e recebidas, alertas de pendencia. Considerar parceria com plataforma de emissao automatica de RPA
- **Impacto:** Se a operacao fiscal for penosa, e argumento forte pro Inbazz no pitch competitivo

### Baixa Prioridade (v1.1+)

**7. Portal Mobile-First / PWA**

- App nativo e discutivel (mega-influencers recusam), mas portal precisa ser excelente no mobile
- **Acao:** Garantir responsividade total. Considerar PWA com notificacoes push como alternativa ao app nativo

**8. Ranking com Pontuacao Oculta**

- Inbazz oculta pontos dos outros creators (so mostra posicao). Design deliberado para evitar desistencia
- **Acao:** Tornar configuravel por tenant: mostrar ou ocultar GMV/pontos dos outros no ranking

**9. Notificacao Batch Diaria**

- Inbazz envia resumo diario matinal. Ambaril notifica cada venda individualmente
- **Acao:** Adicionar opcao de agrupamento (batch diario vs individual) no config do tenant

**10. Multiplos Padroes de Cupom**

- Inbazz permite varios templates de cupom. Ambaril tem padrao fixo (NOME + desconto)
- **Acao:** Adicionar template system para geracao de cupom (ex: `{NOME}10`, `CIENA{NOME}`, `{NOME}{MES}`)

---

## 8. Trechos Representativos da Demo

**Diferencial de validacao anti-fraude:**

> "Aquilo que voce manda para as empresas mentindo... a gente vai puxar direto da API da meta... nao tem como mentir aqui"

**Comissoes dinamicas:**

> "Todo mundo que entrou tem 5% de comissao, e a gente pode fazer ate uma dinamica, ele tem 5%, mas se ele vender 50 mil, ele sai de 5% para 10% automaticamente... a gente ja tem em conta quanto de comissao ele esta recebendo e ate um calculo de ROE"

**Potencial de vendas (proof de resultado):**

> "Tinha 20 mil seguidores. Ela vendeu 700 mil reais pra uma marca. Uma. Mais de um milhao em 2 meses."

**Objecao de preco:**

> [cliente] "E carissimo... tenho que pagar por features que nao uso."

**Sobre app nativo vs web (debate na call):**

> [Caio] preocupado que influencers grandes nao vao baixar app -- validacao direta da abordagem web-only do Ambaril.

**AI Content Analysis (Inbazz anunciando):**

> Inbazz mencionou ferramenta de AI que analisa conteudo vs briefing, verifica do's and don'ts automaticamente, e retorna score de adesao.
