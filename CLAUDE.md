# CLAUDE.md — Aquarela Kids · Front-end (`aquarela_app`)

> Contexto para agentes de IA e devs. Leia antes de codar. Fonte da verdade detalhada: pasta [`docs/`](./docs).

## 0. Modo de resposta

Toda resposta neste repo usa o modo caveman (skill `/caveman`, nível `ultra`) por padrão, sem precisar invocar manualmente a cada comando.

Toda tarefa de UI/front-end neste repo (tela nova, componente, ajuste visual) usa a skill `design-taste-frontend` por padrão, sem precisar invocar manualmente a cada comando — instalada em `.agents/skills`.

---

## 1. O que é o Aquarela Kids

Sistema de gestão para **berçário e hotelzinho infantil** (crianças de 1 a 8 anos). Conecta três públicos:

- **Administração** — cadastros, financeiro (balanço, despesas, inadimplência), relatórios, simulador de preços, gestão de usuários.
- **Professores** — registram a **agenda diária** de cada criança (alimentação, sono, atividades, medicação, intercorrências), veem suas turmas/alunos e planos de aula.
- **Pais/responsáveis** — acompanham a agenda e o histórico do filho e **pagam a mensalidade via PIX** (veem meses pagos × em aberto).

Há também um **simulador público** de mensalidade para interessados (sem login).

> A **criança não é usuário** do sistema — é a entidade acompanhada. Usuários = `admin`, `professor`, `responsavel` (+ visitante público do simulador).

## 2. Papel deste repositório

`aquarela_app` é o **front-end web** (Next.js). Consome a API do repositório irmão **`aquarela_serverless`** (backend). Este repo NÃO contém regra de negócio de servidor nem acesso a banco.

- Backend/API: `https://github.com/vitorsoftwaredeveloper/aquarela_serverless`
- Contrato de API e modelo de dados: ver [`docs/03-Backend.md`](./docs/03-Backend.md) e [`docs/04-Banco-de-Dados.md`](./docs/04-Banco-de-Dados.md).

## 3. Stack

| Item | Escolha |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| UI | React 19.2 · TypeScript 5 |
| Estilo | CSS Modules (`*.module.css` co-locado) + tema via `ThemeContext` |
| Auth | `aws-amplify` v6 (AWS Cognito) |
| HTTP | `axios` + `axios-retry` (token JWT injetado por interceptor) |
| Formulários | `react-hook-form` + `yup` (`@hookform/resolvers`) |
| Ícones | `lucide-react` |
| PIX/QR | `qrcode.react` |
| Planilhas | `xlsx` (SheetJS) — exportação de relatórios |
| Estado | Context API (Auth, Theme, Dashboard, Charge, Topbar, Birthday, Coach) |
| Persistência local | `localStorage` (`@/storage/localStorage`) — só preferências/rascunhos, **nunca** dados de saúde |

## 4. Estrutura (App Router) — alvo

```
src/
├─ app/
│  ├─ (public)/        landing · simulador · login
│  ├─ (responsavel)/   guard role=responsavel  (inicio, agenda, historico, financeiro)
│  ├─ (professor)/     guard role=professor     (turmas, agenda, planos-aula)
│  └─ (admin)/         guard role=admin         (dashboard, criancas, turmas, professores, usuarios, financeiro)
├─ components/  # design system (Button, Input, Card, Modal, QRCode…)
├─ features/    # componentes por domínio (agenda, financeiro…)
├─ contexts/    # Auth, Theme, Dashboard, Charge, Topbar, Birthday, Coach
├─ services/    # api.ts (axios) + um arquivo por domínio
├─ hooks/  schemas/ (yup)  storage/  types/  styles/ (tokens.css)
```

Detalhes completos: [`docs/02-Frontend.md`](./docs/02-Frontend.md).

## 5. Regras e convenções

- **Auth:** `AuthContext` + Amplify v6. Cada grupo de rota valida o papel (`cognito:groups`) e redireciona. O `idToken` é anexado automaticamente pelo interceptor do `axios`.
- **Autorização de dado no front é só UX** — a fonte da verdade é o backend. Ex.: responsável só vê o próprio filho; professor só a própria turma. Nunca confie apenas no front.
- **Nunca faça `return data.data` cru nos services.** Use `unwrapList`/`unwrapItem` (`services/unwrap.ts`) para listas/itens e normalizadores dedicados para objetos compostos (ex.: `normalizarBalanco`). Um payload real fora do formato esperado (`data.resumo` undefined, lista vindo como objeto) derrubava a tela inteira — as fixtures escondiam isso porque tinham o formato perfeito.
- **Server vs Client Components:** páginas de leitura → Server Components; telas com estado/formulário → `"use client"`.
- **Formulários:** sempre `react-hook-form` + schema `yup`. Cadastro de criança é um **stepper** (identificação → responsáveis → saúde → financeiro).
- **Agenda diária (tela mais usada):** preencher em < 2 min. Chips/toggles para valores comuns; salvamento otimista; faixa fixa no topo com **alergias/medicações** da criança.
- **Saúde e segurança:** alergias/medicações/intercorrências sempre com destaque (ícone + texto, não só cor).
- **LGPD:** dados sensíveis de crianças. Nada de PII em `localStorage`, logs ou URLs.
- **Design:** seguir tokens/identidade "aquarela" de [`docs/01-Design-UX.md`](./docs/01-Design-UX.md). Skill de design `design-taste-frontend` (taste-skill) está instalada em `.agents/skills` — usar para elevar a qualidade visual.
- **Estilo de código:** TypeScript estrito, componentes pequenos, tipos de domínio em `types/` alinhados ao contrato da API.

## 6. Pagamento PIX (fluxo no front)

1. `POST /pagamentos` (body `{ mensalidadeId }`) → recebe `pixCopiaECola`, `qrBase64`, `txid`.
2. Exibe QR com `qrcode.react` + botão copiar.
3. Faz polling em `GET /pagamentos/{txid}` a cada 4s até `status === "pago"`
   (`"expirado"` encerra o polling e pede nova cobrança).

> Ambas as rotas já estão deployadas. **Ao sondar a API, use o método correto** —
> um `GET` em `/v1/pagamentos` devolve 404 porque a rota só existe em `POST`, o
> que já gerou um diagnóstico falso de "rota faltando".
>
> O modal trata falha ao gerar a cobrança com mensagem + "Tentar de novo"; sem
> isso ele ficava preso em "Gerando cobrança…". Em dev o `reactStrictMode`
> executa o efeito duas vezes, então **duas cobranças são criadas por abertura**
> — idempotência é responsabilidade do backend.
>
> **Não é mais possível criar um pagamento para um mês que já tenha um
> pagamento pendente.** `POST /pagamentos` responde `409 PAGAMENTO_PENDENTE`
> nesse caso (cobrança pendente é reconciliada por cron a cada 30 min; some
> após 2 tentativas sem confirmação — ver [`docs/03-Backend.md` §7](./docs/03-Backend.md)).
> O front **não precisa de tratamento especial** para esse código: ele já cai
> no branch genérico de erro do `PixContent` (mensagem da API + "Tentar de
> novo"), o mesmo caminho coberto pelo teste "shows error with retry…". Só o
> `MENSALIDADE_PAGA` tem branch dedicado (confirma pagamento em vez de mostrar
> erro) — não confundir os dois códigos.
>
> **A modal PIX fecha sozinha após 5 minutos aberta** (`PixContent` em
> [`FinanceiroScreen.tsx`](./src/features/responsavel/FinanceiroScreen.tsx)) —
> tempo de sobra pro fluxo inteiro; evita que o polling de `GET
> /pagamentos/{txid}` (a cada 4s) rode indefinidamente se o responsável deixar
> a tela aberta sem pagar. Não fecha se o pagamento já foi confirmado
> (`paid`).

## 7. Como rodar

Gerenciador de pacotes: **Yarn 4** (node-modules linker). Node ≥ 20.

```bash
yarn            # instala dependências
yarn dev        # ambiente local (Next dev + Turbopack) em http://localhost:3000
yarn build      # build de produção
yarn start      # sobe o build de produção
yarn lint       # ESLint (flat config do Next 16)
yarn typecheck  # tsc --noEmit
yarn test       # Vitest (lógica pura) · yarn test:watch para o modo interativo
yarn format     # Prettier
```

> **Testes (épico G):** Vitest cobre a lógica crítica pura — validação de CPF,
> cálculo do simulador, `unwrap` de respostas da API e `normalizarBalanco`
> (regressão do crash do dashboard). São `*.test.ts` co-locados, ambiente `node`,
> com `describe/it/expect` importados de `"vitest"`.
>
> **QA-02 (RTL):** `AgendaScreen.test.tsx` e `FinanceiroScreen.test.tsx`
> (`features/responsavel/`) cobrem a agenda do dia (entries, destaque de
> medicação/intercorrência, faixa de cuidados, estado vazio) e o fluxo de
> pagamento PIX (abrir modal, copiar código, erro + "Tentar de novo", polling
> até "pago"). São `*.test.tsx`, ambiente `jsdom` via `// @vitest-environment
> jsdom` no topo do arquivo (config global continua `node` para os testes de
> lógica pura). `services/*` e `contexts/*` são mockados com `vi.mock` — não
> batem a API real nem dependem de `IS_DEV_DATA`. `vitest.setup.ts` registra
> `@testing-library/jest-dom` e `cleanup()` global (sem `test.globals`, RTL não
> faz auto-cleanup sozinho). Pegadinha: `userEvent.setup()` reinstala seu
> próprio stub de `navigator.clipboard` — defina o mock de clipboard **depois**
> do `userEvent.setup()`, senão ele é sobrescrito.

**Env vars** (`.env.local`, ver [`.env.example`](./.env.example)):

| Var | Uso |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base da API (`aquarela_serverless`) |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Cognito User Pool (INF-02) |
| `NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID` | App Client do Cognito |
| `NEXT_PUBLIC_COGNITO_REGION` | Região AWS |

> Enquanto os IDs do Cognito não estão definidos, `IS_AUTH_CONFIGURED` fica `false`:
> a landing/simulador funcionam e as rotas com guarda ficam prontas para quando o
> Cognito for provisionado. Referência de design importada em
> [`docs/design-reference/`](./docs/design-reference) (Claude Design).

**Status da fundação (épico 0):** INF-07 (base Next + tema/tokens), INF-08
(login/logout/sessão/papel via Amplify v6 + guardas de rota + primeira senha e
redefinição), INF-09 (`services/api.ts`) e INF-10 (design system: Button,
Container, Input, Select, Badge, Modal, Logo, ThemeToggle, RoleGuard,
SignOutButton) ✅. Landing (T-01) e Login (T-03) ✅.

**Épico A — Cadastros (front):** CAD-03 (usuários), CAD-05 (professores), CAD-07
(turmas) e **CAD-10 (criança em stepper de 4 etapas: identificação → responsáveis
→ saúde → financeiro, com validação por etapa, CPF por dígitos verificadores,
`TagInput` de alergias e resumo ao vivo)** ✅ — telas admin sob `/admin/*` com CRUD (list/create/update/soft delete),
`react-hook-form`+`yup`, estados loading/erro/vazio. A turma seleciona a professora
responsável a partir de `services/professores.ts`. Consomem `services/{usuarios,
professores,turmas}.ts` (contrato em docs/03-Backend §5).

> **Área admin fica sob `/admin/*`** (evita colisão de rota com `(professor)/turmas`).

**Épico C — Portal do responsável (front):** PAI-01..PAI-04 ✅ — Início (lista de
filhos + avisos + agenda de hoje), Agenda do dia (com faixa de cuidados
alergias/medicações em destaque), Histórico, Financeiro (grade de meses) e
**Pagamento PIX** (QR real via `qrcode.react` + copia-e-cola + polling/confirmação).
Layout mobile-first com bottom-tabs (`ResponsavelShell`), estado do filho ativo em
`ResponsavelContext`. Consomem `services/{criancas,agendaService,financeiroService}.ts`.
Login redireciona por papel: admin→`/admin/dashboard`, professor→`/turmas`,
responsável→`/inicio` (`HOME_BY_ROLE`).

**Foto da criança + edição pelo responsável** ✅ — `components/FotoField`
(preview + `utils/imagem.ts`, que redimensiona no canvas para 800px/JPEG 0.8) e
`components/Avatar` (foto com fallback de iniciais). A foto trafega em
**base64 no corpo** do `POST`/`PUT /criancas` (`foto: { contentType, base64 }`,
sem o prefixo `data:`); a Lambda grava no S3 e devolve `fotoUrl`. **Teto de 2MB
decodificados** — Lambda síncrona aceita 6MB de payload e base64 infla 33%, daí
o resize ser obrigatório e não só um "se passar do limite". O admin envia no
passo Identificação do stepper e pode apagar (`DELETE /criancas/{id}/foto`,
admin-only). O responsável edita o próprio filho em `/crianca/{id}/editar`
(`EditarCriancaScreen`): nome, nascimento, responsáveis, saúde e foto — **sem**
`financeiro`/`ativo` (backend responde 403) e sem `cpf`/`turmaId` (derrubam o
`PUT` inteiro por `additionalProperties:false`). Entrada pela tela Perfil.

> **E-mail de responsável vinculado é `readOnly` na tela do responsável.** O
> `PUT /criancas/{id}` faz `$set` cru em `responsaveis` — quem provisiona
> usuário/Cognito a partir do e-mail é só o `POST`. Trocar o e-mail ali mudaria
> apenas o array embutido: login e recuperação de senha continuariam no e-mail
> antigo enquanto a escola veria o novo, sem nada falhar. `usuarioId` viaja no
> form (declarado em `schemas/crianca.ts`) justamente para a linha saber se
> aquele e-mail é um login.

**Épico B/F — Professor (front):** T-09 (Minhas turmas, com pendências do dia),
T-10 (Alunos da turma, com marcador de alergia e status da agenda) e **T-11
Registrar agenda** ✅ — chips de refeição com **aceitação por refeição**
(cada refeição marcada abre seu próprio seletor de aceitação), **múltiplas
sonecas** (lista com "+ adicionar outra soneca"), atividades, humor, contador
de fraldas, intercorrências (com aviso de alerta ao responsável), observações.
Botão segue o mesmo padrão `isSubmitting ? "Salvando…" : …` das telas admin
(`saving`/`saved` reais, não otimista) e volta (`router.back()`) para a lista
de alunos da turma ao concluir. Consomem `services/professorService.ts`.

**PED-02 Planos de aula (professor)** ✅ FE — CRUD (`PlanosAulaScreen` +
`PlanoAulaFormScreen`) acessível pelo ícone de livro na tela de Alunos da turma;
título/descrição/data + chips de objetivos/materiais (`TagInput` reaproveitado
de `features/admin/criancas`). Consome `services/planosAula.ts`. **PED-01
implementado** no `aquarela_serverless` (ainda não commitado/deployado lá) —
rota real é `/planosAula` (não sub-recurso de turma): `GET ?turmaId=`,
`POST`/`PUT` com `turmaId` no body, sem GET por id (`getById` do front filtra
a lista em memória). Contrato atualizado em `docs/03-Backend.md`. A tela
também funciona via `NEXT_PUBLIC_USE_MOCKS=true` para preview sem depender do
deploy do backend.

> **Rotas por papel (sem colisão):** admin em `/admin/*`, professor em
> `/professor/*`, responsável na raiz (`/inicio`, `/agenda/[id]`, `/financeiro`…).
> Route groups não criam segmento de URL, então o prefixo é obrigatório.

**Épico D — Financeiro admin (front):** FIN-10/12/13/14 ✅ — **Dashboard** com KPIs
(entradas, despesas, saldo, inadimplentes) e **gráfico de barras agrupadas
entradas × despesas (12 meses)**; **Financeiro** com abas de despesas (CRUD) e
inadimplentes, ambas com **exportação `.xlsx`** (`utils/exportXlsx.ts`).
Consomem `services/financeiroAdminService.ts`.

> **Paleta do gráfico é validada, não escolhida no olho:** entradas `#2F7FCB` ·
> despesas `#C7522B` passam nas checagens de banda de luminosidade, croma, CVD
> (ΔE 81) e contraste ≥3:1 — em claro **e** escuro. Regras seguidas: eixo único
> (nunca dual-axis), legenda sempre presente para 2+ séries, barras ≤24px com
> ponta 4px e gap de 2px, gridlines hairline, texto em tokens de texto (nunca na
> cor da série) e tooltip por marca acessível via hover **e** teclado.

**Épico E — Simulador (front):** SIM-03/SIM-04 ✅ — tela pública `/simulador` com
plano (lista dinâmica, não mais fixa em Integral/Meio período), modo **por
meses ou dias avulsos**, contador + presets, resultado com **desconto
progressivo por período** e comparativo em barras. Planos e cálculo vêm de
`ConfigPrecosService.listPlanos()` (`GET /config/precos/planos`, rota pública,
sem token) — `PLANOS_PADRAO` (`types/configPrecos.ts`) só serve de valor
instantâneo enquanto a lista carrega ou se a API estiver fora do ar. O cálculo
de desconto por meses é **100% no cliente** (`features/simulador/precos.ts`)
usando só os `descontos` reais do admin — **dias avulsos nunca tem desconto**,
mesmo em quantidade alta, porque o `configPrecos` só cobre meses e a tela não
inventa desconto que a API não informou. A landing (`Pricing.tsx`) consome a
mesma lista para os cards de preço, casando por `tipo` — uma única chamada em
vez de uma por plano.

> **Selecionar um plano decide o modo junto:** o nome do plano (`inferirModo`
> em `precos.ts`) diz se é "Diária" (→ modo dias) ou "Mensal" (→ modo meses) —
> clicar num plano diário já troca o segmentado para "Dias avulsos" e
> vice-versa, sem o usuário ter que ajustar os dois separadamente.

> O antigo `simuladorService` (que sondava `GET /simulador` com uma máquina de
> estado pra evitar corrida do StrictMode) foi removido: com os planos
> completos (inclusive `descontos`) públicos, o front não precisa mais tentar
> a rota de cálculo do backend e cair no local — já calcula certo direto.

> **Preview sem backend (`NEXT_PUBLIC_USE_MOCKS=true`):** liga login demo + fixtures
> locais (`services/devData.ts`) mesmo com Cognito já configurado, para prever as
> telas enquanto a API não tem rotas. Controla `IS_DEV_DATA` (em `config/env.ts`).
> Deixe `false`/ausente quando a API estiver no ar.

## 8. Documentação (pasta `docs/`)

| Arquivo | Conteúdo |
|---|---|
| `00-Visao-Produto-PRD.md` | Visão, personas, papéis, épicos, user stories, MVP, roadmap |
| `01-Design-UX.md` | Princípios, identidade, telas, wireframes |
| `02-Frontend.md` | **Guia deste repo** |
| `03-Backend.md` | Contrato da API (o que este front consome) |
| `04-Banco-de-Dados.md` | Modelo de dados (referência) |
| `05-Sugestoes-Produto.md` | Evoluções priorizadas |
| `06-Backlog.md` | Tarefas por épico, estimativas, sprints |

> Ao mudar contrato de API, telas ou convenções, **atualize os docs correspondentes** para manter os dois repositórios sincronizados.
