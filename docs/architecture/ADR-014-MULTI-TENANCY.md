# ADR-014 — Como separar os dados de cada cliente (Multi-tenancy)

> **Status:** APROVADO — Marcus aprovou Sessao 17
> **Data:** Marco 2026
> **Autor:** Claude (Sessao 17, atualizado com pesquisa v2)
> **Aprovado por:** Marcus (27/03/2026)
> **Docs relacionados:** [DATABASE.md](./DATABASE.md), [AUTH.md](./AUTH.md), [STACK.md](./STACK.md)

---

## 1. O problema

O Ambaril vai ser vendido como SaaS. Isso significa que **varias marcas** vao usar o mesmo sistema. A CIENA e a primeira, mas amanha pode ter uma segunda marca, uma terceira...

O problema: **como garantir que a CIENA so ve os dados dela, e a marca X so ve os dados dela?**

Imagina assim: e como um predio de apartamentos. Todos moram no mesmo predio (mesmo banco de dados), mas cada um so pode entrar no seu apartamento. A pergunta e: como a gente tranca as portas?

**Numeros de hoje:**
- 1 marca agora (CIENA), talvez 5-10 em 2 anos
- ~100 tabelas no banco de dados
- 9 pessoas da equipe + portais externos (lojistas B2B, creators)
- Banco: Neon PostgreSQL. ORM: Drizzle

**Por que seguranca e inegociavel:**
- Vazar dados de um cliente = prejuizo de milhoes + reputacao destruida
- Se uma growth-stage company virar cliente, precisamos de padroes altissimos
- Compliance (SOC 2, LGPD) fica muito mais facil com seguranca no banco

---

## 2. Decisao (recomendacao)

**Opcao B+A: Cinto E Suspensorio** — filtro no codigo (camada 1) + RLS no banco de dados (camada 2).

Duas camadas de protecao:
1. O **codigo** filtra os dados (`WHERE tenant_id = 'ciena'`) — rapido e facil de debugar
2. O **banco de dados** tem uma regra extra que IMPEDE qualquer acesso sem `tenant_id` — mesmo se o codigo tiver um bug

E como ter um porteiro (codigo) E uma fechadura automatica (banco). Se o porteiro dormir, a fechadura segura.

**Por que duas camadas em vez de uma?**
- AWS, Supabase e Crunchy Data (maiores nomes em banco de dados cloud) recomendam exatamente isso
- Custo extra: ~3-5 dias de implementacao a mais que so o filtro no codigo
- Performance: praticamente zero impacto (~0.4ms por consulta)
- **A pesquisa revelou:** Drizzle JA suporta RLS nativamente (desde v0.36.0) e Neon funciona perfeitamente com RLS

---

## 3. As 4 opcoes que consideramos

### Opcao A: Tranca no banco de dados (RLS sozinho)

**Como funciona:** O proprio banco de dados impede que voce veja dados de outra marca. E como se o predio tivesse um porteiro automatico que confere seu cracha antes de abrir qualquer porta.

**Exemplo pratico:**
- Marcus loga no Ambaril como CIENA
- Ele pede "me mostra todos os pedidos"
- O banco de dados AUTOMATICAMENTE filtra: "so pedidos da CIENA"
- Mesmo se alguem escrever codigo errado, o banco recusa mostrar dados de outra marca

**Vantagens:**

| Vantagem | Por que importa |
|----------|-----------------|
| Seguranca no nivel mais baixo | Mesmo que tenha um bug no codigo, o banco nao deixa vazar dados |
| Padrao da industria | Grandes SaaS como Supabase usam isso |
| Protege contra erro humano | Desenvolvedor esqueceu o filtro? Sem problema, o banco filtra sozinho |
| SOC 2 muito mais facil | Auditores adoram ver seguranca no nivel do banco |

**Desvantagens:**

| Desvantagem | Por que importa |
|-------------|-----------------|
| Dificil de debugar sozinho | Quando algo da errado, e chato descobrir o que aconteceu porque os filtros sao invisiveis |
| Relatorios admin mais complexos | Dashboard do Ambaril (todas as marcas) precisa de um role especial que ignora RLS |
| Depende de configurar cada conexao | Precisa setar `app.tenant_id` no inicio de cada transacao |

**Exemplo de quando faz sentido:** Se voce quer a maior seguranca possivel e aceita a complexidade extra.

**Exemplo de quando NAO faz sentido:** Sozinho, sem filtro no codigo — fica dificil de debugar e o dev nao sabe se os dados estao filtrados ou nao.

**Veredito:** Otima camada de seguranca, mas sozinha e dificil de debugar. Melhor como SEGUNDA camada junto com o filtro no codigo.

---

### Opcao B: Filtro no codigo (sozinho)

**Como funciona:** Cada tabela ganha uma coluna `tenant_id`. Toda vez que o codigo busca dados, ele adiciona um filtro: `WHERE tenant_id = 'ciena'`. E como se cada morador do predio tivesse que mostrar o cracha pra abrir a porta — mas quem confere e o app, nao o porteiro.

**Exemplo pratico:**
- Marcus loga no Ambaril como CIENA
- O sistema salva na sessao dele: `tenantId = "ciena"`
- Toda busca no banco vira automaticamente:
  ```
  SELECT * FROM pedidos WHERE tenant_id = 'ciena'
  SELECT * FROM creators WHERE tenant_id = 'ciena'
  SELECT * FROM produtos WHERE tenant_id = 'ciena'
  ```
- Se no futuro a marca XPTO tambem usar o Ambaril, ela so ve os dados dela

**Vantagens:**

| Vantagem | Por que importa |
|----------|-----------------|
| Simples e facil de entender | Qualquer dev olha o codigo e sabe exatamente o que ta acontecendo |
| Funciona perfeitamente com Drizzle + Neon | Zero conflito com nossas ferramentas |
| Facil de fazer relatorios admin | Quer ver dados de todas as marcas? So tira o filtro (so admin pode) |
| Facil de debugar | Voce VE o filtro no codigo — sem magica invisivel |

**Desvantagens:**

| Desvantagem | Por que importa |
|-------------|-----------------|
| Depende do desenvolvedor lembrar do filtro | Se alguem esquecer de colocar `WHERE tenant_id = ...`, pode vazar dados |
| Sem protecao no nivel do banco | O banco nao impede nada — a responsabilidade e toda do codigo |
| Bug = vazamento de dados | Sem rede de seguranca. Um esquecimento e dados de outra marca aparecem |
| SOC 2 mais dificil | Auditores vao perguntar: "e se alguem esquecer?" |

**Exemplo de quando faz sentido:** Startups muito pequenas (1-2 devs) que vao adicionar RLS depois.

**Exemplo de quando NAO faz sentido:** Quando seguranca e prioridade e voce tem clientes pagando. O risco de esquecimento e real.

**Veredito:** Rapido de implementar, mas sem rede de seguranca. Sozinho, nao e suficiente pra quem leva seguranca a serio.

---

### Opcao B+A: Cinto E Suspensorio (RECOMENDADA)

**Como funciona:** Junta o melhor das duas primeiras opcoes:
1. O **codigo** sempre filtra com `WHERE tenant_id = 'ciena'` (facil de entender e debugar)
2. O **banco** tem uma regra (RLS policy) que IMPEDE acesso sem `tenant_id` (rede de seguranca)

E como ter um porteiro que confere o cracha (codigo) + uma porta com tranca automatica que so abre pro morador certo (banco).

**Exemplo pratico:**
```
1. Marcus loga como CIENA
2. Sistema salva na sessao: tenantId = "ciena"
3. A cada request, o codigo configura o banco: SET app.tenant_id = 'ciena'
4. Quando busca pedidos:
   - Codigo adiciona: WHERE tenant_id = 'ciena'          ← Camada 1 (porteiro)
   - Banco verifica:  tenant_id = current_setting(...)    ← Camada 2 (tranca)
5. Se um dev ESQUECESSE o filtro no codigo:
   - Codigo: SELECT * FROM pedidos                        ← Bug! Sem filtro!
   - Banco: BLOQUEIA — RLS impede. Retorna 0 resultados   ← Rede de seguranca!
```

**Vantagens:**

| Vantagem | Por que importa |
|----------|-----------------|
| Defesa em profundidade | Duas camadas — se uma falha, a outra segura |
| Facil de debugar | O filtro no codigo e visivel; RLS e rede de seguranca invisivel |
| Padrao ouro da industria | AWS, Supabase, Crunchy Data recomendam exatamente isso |
| SOC 2 friendly | Auditores ficam felizes com seguranca no nivel do banco |
| Compativel com Drizzle + Neon | Drizzle tem `pgPolicy()` nativo. Neon funciona com `set_config()` |
| Zero impacto em cobranca | Rastreamento de uso funciona identicamente — `tenant_id` e a chave |
| Performance negligivel | RLS adiciona ~0.4ms por consulta (imperceptivel) |

**Desvantagens:**

| Desvantagem | Por que importa |
|-------------|-----------------|
| 3-5 dias a mais de implementacao | Comparado com so o filtro no codigo |
| Migrations precisam usar `drizzle-kit migrate` | `drizzle-kit push` tem um bug com policies (issue #3504). So afeta development workflow, nao producao |
| Precisa configurar `app.tenant_id` por transacao | Um `set_config()` no inicio de cada request — middleware cuida disso |

**Como funciona tecnicamente:**

```typescript
// 1. Middleware (roda em TODA request)
async function withTenantContext(tenantId: string, callback: () => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    // Configura RLS — seguro com PgBouncer porque is_local=true
    await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
    return callback();
  });
}

// 2. Drizzle schema (cada tabela de dados)
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  // ... outras colunas
}).enableRLS();

// 3. Policy (regra no banco)
// "So mostra linhas onde tenant_id = o que foi configurado no set_config"
pgPolicy("tenant_isolation", {
  for: "all",
  using: sql`tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid`
});
```

**Por que `set_config(..., true)` e seguro com Neon:**
- O Neon usa PgBouncer em modo `transaction`
- `set_config('app.tenant_id', value, true)` = `is_local=true` = a configuracao MORRE quando a transacao termina
- Isso significa: impossivel uma request "herdar" o tenant de outra request
- Confirmado pela documentacao oficial do Neon e PostgreSQL

**Exemplo de quando faz sentido:** Exatamente agora. Qualquer SaaS que leva seguranca a serio e quer crescer.

**Exemplo de quando NAO faz sentido:** Prototipo descartavel que nunca vai ter mais de 1 usuario.

**Veredito:** Melhor custo-beneficio. 3-5 dias extras de trabalho compram seguranca de nivel enterprise.

---

### Opcao C: Um "andar" separado por marca

**Como funciona:** Em vez de todo mundo morar no mesmo predio, cada marca ganha um andar inteiro. As tabelas sao duplicadas: `ciena.pedidos`, `xpto.pedidos`, `marca3.pedidos`.

**Exemplo pratico:**
- CIENA tem suas tabelas: `ciena.orders`, `ciena.creators`, `ciena.contacts`
- Marca XPTO tem as mesmas tabelas mas separadas: `xpto.orders`, `xpto.creators`, `xpto.contacts`
- Sao coisas completamente diferentes que nao se misturam

**Vantagens:**

| Vantagem | Por que importa |
|----------|-----------------|
| Isolamento total dos dados | Impossivel misturar dados — sao tabelas completamente separadas |
| Facil fazer backup de uma marca so | Quer exportar todos os dados da CIENA? Copia o schema inteiro |

**Desvantagens:**

| Desvantagem | Por que importa |
|-------------|-----------------|
| Atualizacoes multiplicadas | Mudou a estrutura de uma tabela? Tem que rodar a mudanca em CADA marca separadamente |
| Drizzle nao suporta | Nosso ORM trabalha com schemas fixos no codigo — nao da pra criar schemas dinamicamente |
| Quantidade de schemas cresce sem parar | 10 marcas = 10x mais schemas. 100 marcas = 100x. Vira bagunca |
| Relatorios entre marcas sao muito dificeis | "Quanto TODAS as marcas faturaram?" — tem que juntar dados de N schemas diferentes |

**Exemplo de quando faz sentido:** Se cada marca tivesse milhoes de registros e precisasse escalar independentemente (tipo um Shopify da vida).

**Exemplo de quando NAO faz sentido:** Agora. Nosso ORM nem suporta, e teriamos que manter N copias de cada tabela.

**Veredito:** Nao funciona com Drizzle. Complexo demais pro nosso tamanho.

---

### Opcao D: Um banco de dados separado por marca

**Como funciona:** Cada marca ganha seu proprio banco de dados no Neon. E como se cada marca tivesse seu proprio predio, em enderecos diferentes.

**Exemplo pratico:**
- CIENA: banco `ciena-db.neon.tech` — R$350/mes
- Marca XPTO: banco `xpto-db.neon.tech` — mais R$350/mes
- Marca 3: banco `marca3-db.neon.tech` — mais R$350/mes

**Vantagens:**

| Vantagem | Por que importa |
|----------|-----------------|
| Isolamento MAXIMO | Literalmente bancos diferentes. Zero chance de misturar |
| Escala independente | Uma marca cresceu muito? Escala so o banco dela |

**Desvantagens:**

| Desvantagem | Por que importa |
|-------------|-----------------|
| R$350/mes POR MARCA | 10 marcas = R$3.500/mes so de banco de dados. Inviavel |
| Atualizacoes multiplicadas (pior ainda) | Mudou uma tabela? Tem que rodar em CADA banco separado |
| Impossivel comparar marcas | "Quanto todas as marcas faturaram?" — impossivel com uma query so |
| Gerenciar conexoes e um pesadelo | O app precisa saber qual banco conectar pra cada marca |

**Exemplo de quando faz sentido:** Enterprise gigante tipo Salesforce, onde cada cliente paga R$50k+/mes e exige isolamento total.

**Exemplo de quando NAO faz sentido:** Agora. Caro demais e operacionalmente insano pra nosso tamanho.

**Veredito:** Muito caro e complexo. So faria sentido se cada marca pagasse muito caro.

---

## 4. Comparacao visual das 5 abordagens

```
Opcao A (RLS so)        Opcao B (Filtro so)     Opcao B+A (RECOMENDADA)
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  MESMO BANCO    │     │  MESMO BANCO    │     │  MESMO BANCO    │
│                 │     │                 │     │                 │
│  pedidos        │     │  pedidos        │     │  pedidos        │
│  (banco filtra) │     │  (codigo filtra)│     │  (AMBOS filtram)│
│                 │     │                 │     │  codigo = cinto │
└─────────────────┘     └─────────────────┘     │  banco = susp.  │
  Seguro mas             Simples mas             └─────────────────┘
  dificil debugar        sem rede de seg.         MELHOR DOS DOIS

Opcao C (Schemas)       Opcao D (DBs)
┌─────────────────┐     ┌────────┐ ┌────────┐
│  MESMO BANCO    │     │ BANCO  │ │ BANCO  │
│                 │     │ CIENA  │ │ XPTO   │
│ ciena.pedidos   │     │        │ │        │
│ xpto.pedidos    │     │pedidos │ │pedidos │
│ marca3.pedidos  │     │creators│ │creators│
└─────────────────┘     └────────┘ └────────┘
  Drizzle nao            R$350/mes
  suporta                por marca
```

---

## 5. Tabela comparativa

| Criterio | A (RLS so) | B (Filtro so) | **B+A (Cinto+Susp.)** | C (Schemas) | D (DBs) |
|----------|-----------|--------------|----------------------|-------------|---------|
| **Seguranca** | Alta | Media | **Muito alta** | Alta | Maxima |
| **Simplicidade** | Media | Alta | **Alta** | Baixa | Baixa |
| **Debugabilidade** | Baixa | Alta | **Alta** | Media | Media |
| **Compativel Drizzle** | Sim (v0.36+) | Sim | **Sim** | Nao | Sim |
| **Compativel Neon** | Sim | Sim | **Sim** | Sim | Sim |
| **Performance** | -0.4ms/query | Zero | **-0.4ms/query** | Zero | Zero |
| **Custo extra** | 2 dias | 0 | **3-5 dias** | N/A | R$350/marca |
| **SOC 2** | Facil | Dificil | **Facil** | Facil | Facil |
| **Relatorios admin** | Complexo | Facil | **Facil** | Dificil | Impossivel |
| **Rastreamento de uso** | OK | OK | **OK** | OK | OK |
| **Clientes growth-stage** | Aceitavel | Arriscado | **Ideal** | N/A | Caro |

---

## 6. Como funciona a Opcao B+A na pratica

### 6.1 Novas tabelas

Precisamos de 2 tabelas novas:

**Tabela `tenants`** — cadastro de cada marca:
```
| id   | name  | slug  | ativo | configuracoes                           |
|------|-------|-------|-------|-----------------------------------------|
| abc1 | CIENA | ciena | sim   | {moeda: "BRL", fuso: "America/SP", ...} |
| def2 | XPTO  | xpto  | sim   | {moeda: "BRL", fuso: "America/SP", ...} |
```

**Tabela `user_tenants`** — quem pertence a qual marca:
```
| usuario | marca | cargo  | padrao |
|---------|-------|--------|--------|
| Marcus  | CIENA | admin  | sim    |
| Caio    | CIENA | pm     | sim    |
| ...     | ...   | ...    | ...    |
```

Isso permite que no futuro um usuario trabalhe em mais de uma marca (ex: Marcus administra CIENA e XPTO).

### 6.2 Coluna `tenant_id` em todas as tabelas de dados

Cada tabela de dados ganha uma coluna `tenant_id`:

```
ANTES (sem multi-tenancy):
pedidos: id | numero | total | status
            1   001    R$200   pago
            2   002    R$150   enviado

DEPOIS (com multi-tenancy):
pedidos: id | tenant_id | numero | total | status
            1   CIENA       001    R$200   pago
            2   CIENA       002    R$150   enviado
            3   XPTO        001    R$300   pago    ← outra marca
```

**Quais tabelas ganham `tenant_id`:** ~95 tabelas (basicamente todas)
- Pedidos, contatos, creators, produtos, estoque, NF-e, trocas, mensagens, tarefas...

**Quais tabelas NAO ganham:** 5 tabelas que sao do sistema todo
- `tenants` (e a propria tabela de marcas)
- `roles` e `permissions` (cargos e permissoes sao iguais pra todo mundo)
- `users` (usuarios sao globais, ligados a marcas via `user_tenants`)
- `user_tenants` (ja tem `user_id` + `tenant_id`)

### 6.3 O que muda no login

```
1. Marcus digita email + senha
2. Sistema autentica (confere senha)
3. Sistema busca: "Marcus pertence a quais marcas?"
   → Resultado: [CIENA]
4. So tem uma? Seleciona automaticamente
   (Se tivesse mais de uma, mostraria uma tela: "Qual marca voce quer acessar?")
5. Salva na sessao: tenantId = "ciena"
6. A partir daqui, TUDO que Marcus faz e filtrado por CIENA
```

### 6.4 As duas camadas de protecao

**Camada 1 — Funcao helper `withTenant()` (codigo):**

```
SEM helper (perigoso — facil esquecer):
  buscar pedidos WHERE status = 'pago'    ← ERRADO! Sem filtro de marca!

COM helper (seguro):
  buscar pedidos WHERE tenant_id = 'ciena' AND status = 'pago'    ← Correto!
```

A funcao `withTenant()` SEMPRE adiciona o `WHERE tenant_id = ...` pra gente.

**Camada 2 — RLS no banco (rede de seguranca):**

```
Mesmo se alguem esquecer o withTenant():
  O banco ve: "essa query nao tem tenant_id filtrado..."
  O banco faz: "vou aplicar o filtro EU MESMO"
  Resultado: so dados da marca correta aparecem

Se alguem tentar acessar dados de OUTRA marca:
  O banco ve: "app.tenant_id = 'ciena', mas essa linha e da 'xpto'..."
  O banco faz: "negado. essa linha nao existe pra voce."
```

### 6.5 Middleware (como o tenant_id chega no banco)

Toda request HTTP passa por um middleware que:
1. Le o `tenantId` da sessao do usuario
2. Abre uma transacao no banco
3. Executa `SET LOCAL app.tenant_id = 'ciena'` (dura so essa transacao)
4. Roda a query do usuario
5. Transacao termina → configuracao morre automaticamente

Isso e seguro com o Neon (PgBouncer) porque `SET LOCAL` = a configuracao nao "vaza" pra outra request.

### 6.6 E quando o admin precisa ver TUDO?

Para o painel administrativo do Ambaril (todas as marcas), usamos um PostgreSQL role especial (`ambaril_admin`) que ignora as policies RLS. Mas APENAS o admin do Ambaril. Qualquer outro cargo que tente consultar sem filtro recebe um erro.

### 6.7 Rastreamento de uso (cobranca por porcentagem)

A cobranca por porcentagem (checkout % sobre venda, creators % sobre comissao) funciona **identicamente** com qualquer opcao de multi-tenancy, porque todas usam `tenant_id`:

```
-- Quanto a CIENA vendeu no checkout este mes?
SELECT SUM(total) FROM orders
WHERE tenant_id = 'ciena'
  AND module = 'checkout'
  AND created_at >= '2026-03-01';

-- Pattern de 3 tabelas:
-- 1. usage_events:    cada venda, cada comissao (evento granular)
-- 2. usage_aggregates: totais diarios/mensais (cache rapido)
-- 3. invoices:         fatura mensal por tenant (cobranca)
```

Nao existe NENHUMA limitacao de rastreamento por escolha de multi-tenancy. O `tenant_id` e a chave de tudo.

---

## 7. Estrategia de implementacao

Como ainda nao temos dados reais no banco (estamos na Phase 0), esse e o momento PERFEITO pra fazer essa mudanca. Zero risco de perder dados.

**Passo a passo:**

1. Criar tabelas `tenants` e `user_tenants` no Drizzle
2. Adicionar coluna `tenant_id` em todas as ~95 tabelas de dados
3. Habilitar RLS em cada tabela (`.enableRLS()`)
4. Criar policies de tenant isolation (`pgPolicy()`)
5. Criar indices compostos `(tenant_id, ...)` pra manter performance
6. Atualizar o tipo `SessionData` pra incluir `tenantId`
7. Criar middleware `withTenantContext()` que faz o `set_config`
8. Criar a funcao `withTenant()` pra queries
9. Atualizar o script de seed pra criar o tenant CIENA + ligar os 9 usuarios
10. **IMPORTANTE:** Usar `drizzle-kit migrate` (nao `push`) por causa do bug #3504 com policies

**Depois, no dia a dia:**
- Todo codigo novo usa `withTenant()` — obrigatorio
- RLS funciona como rede de seguranca automatica
- Code review checa se `withTenant()` esta presente
- Testes automatizados verificam isolamento (tentam acessar dados de outro tenant)

---

## 8. Dados iniciais (seed)

```
Primeiro tenant:
  nome: CIENA
  slug: ciena
  ativo: sim
  configuracoes:
    moeda: BRL
    fuso_horario: America/Sao_Paulo
    idioma: pt-BR

Usuarios:
  Marcus  → CIENA → admin
  Caio    → CIENA → pm
  Tavares → CIENA → operations
  Pedro   → CIENA → finance
  Yuri    → CIENA → creative
  Sick    → CIENA → creative
  Slimgust→ CIENA → support
  Ana     → CIENA → operations
  Guilherme→ CIENA → commercial
```

---

## 9. Pro futuro (nao precisa agora)

- **Migracao para project-per-tenant (Neon):** Quando tivermos 3+ tenants ou um cliente enterprise exigir isolamento fisico, migraremos para a arquitetura project-per-tenant da Neon (1 projeto Neon por marca). A migracao e simples (~4-6 dias) porque o `tenant_id` ja existe em todas as tabelas — basta separar fisicamente os dados. O plano Scale da Neon inclui 1.000 projetos sem custo adicional, e tenants inativos escalam pra zero (custo ~$0). **Essa migracao ja esta prevista e planejada.**
- **Troca de marca:** Dropdown na topbar pra usuarios que trabalham em mais de uma marca
- **Config por marca:** Cada marca pode ter suas cores, logo, limites, feature flags
- **Cobranca por marca:** Rastrear uso (storage, API calls, usuarios) por `tenant_id` pra precificacao (pattern ja definido em 6.7)
- **SOC 2 audit:** RLS ja implementada facilita muito a conversa com auditores

---

## 10. Resumo da decisao

| O que | Decisao |
|-------|---------|
| **Como separar os dados** | Coluna `tenant_id` + filtro no codigo (camada 1) + RLS no banco (camada 2) |
| **Tabelas novas** | `tenants` (cadastro de marcas) + `user_tenants` (quem pertence a qual marca) |
| **Quantas tabelas mudam** | ~95 tabelas ganham coluna `tenant_id` + RLS policy |
| **O que muda no login** | Sessao agora inclui `tenantId` da marca |
| **Como garantir que ninguem esquece** | Funcao `withTenant()` (camada 1) + RLS no banco (camada 2) + testes + code review |
| **Performance** | Negligivel (~0.4ms por consulta). Indice em `tenant_id` garante velocidade |
| **Custo extra** | 3-5 dias de implementacao a mais que so filtro no codigo |
| **Cobranca por %** | Funciona identicamente — `tenant_id` e a chave de rastreamento |
| **Compatibilidade** | Drizzle `pgPolicy()` (v0.36+) + Neon `set_config(..., true)` = sem conflitos |
| **Padrao da industria** | AWS, Supabase e Crunchy Data recomendam defesa em profundidade (B+A) |
| **Evolucao planejada** | Migrar para project-per-tenant (Neon) quando 3+ tenants ou cliente enterprise exigir (~4-6 dias de trabalho) |

---

## 11. Perguntas frequentes

**P: RLS nao deixa o banco lento?**
R: O overhead e ~0.4ms por consulta. Com o truque de `(SELECT current_setting(...))` em vez de `current_setting(...)` direto, o PostgreSQL otimiza o plano de execucao (initPlan). Na pratica, voce nao vai perceber diferenca.

**P: E se eu quiser desligar o RLS pra debugar?**
R: Nunca precisa. O filtro no codigo (`withTenant()`) e visivel e debugavel. O RLS e a rede de seguranca invisivel — so atua quando o codigo falha.

**P: Funciona com PgBouncer do Neon?**
R: Sim. `set_config('app.tenant_id', value, true)` com `is_local=true` e transaction-scoped. Quando a transacao termina, a configuracao desaparece. Zero risco de "herdar" tenant de outra conexao.

**P: E o `drizzle-kit push`? Posso usar?**
R: Para migrations com RLS policies, use `drizzle-kit migrate` (gera SQL files). O `push` tem um bug conhecido (#3504) que duplica policies. Nao afeta producao, so o workflow de dev.

**P: Uma growth-stage company aceitaria nossa seguranca?**
R: Sim. Defesa em profundidade (app-level + RLS) e o padrao recomendado pelos maiores providers de banco cloud. E significativamente mais facil de passar auditorias SOC 2 com RLS habilitado.
