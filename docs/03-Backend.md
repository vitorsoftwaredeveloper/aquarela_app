# Aquarela Kids — Back End

> Arquitetura da API serverless. Versão 0.1 — 16/07/2026

---

## 1. Stack

| Item | Escolha |
|---|---|
| Runtime | Node.js 24.x |
| Linguagem | TypeScript |
| Framework | Serverless Framework v3 (fork `osls` / `oss-serverless`) |
| Compute | AWS Lambda (empacotamento `individually` + `serverless-esbuild`) |
| API | API Gateway **HTTP API** (`httpApi`) |
| Banco | MongoDB via **Mongoose** |
| Auth | AWS Cognito (authorizer JWT nativo do HTTP API) |
| Validação | `ajv` (`JSONSchemaType`) + `ajv-formats` |
| Storage | S3 (comprovantes/recibos) |
| Config/Secrets | SSM Parameter Store (`config/<stage>.json`) |
| Pagamentos | MercadoPago (PIX) |
| Push | Firebase Admin — fase 2+ |
| Plugins SLS | `serverless-esbuild`, `serverless-prune-plugin`, `serverless-offline` |
| Testes | Jest + ts-jest |
| Dev local | `nodemon` + `serverless-offline` + MongoDB (docker-compose, replicaSet) |

> Itens do template original que **não** se aplicam ao Aquarela Kids: TTS de liturgia e módulo de dízimo. MercadoPago/PIX é reaproveitado para mensalidades.

---

## 2. Arquitetura geral

```
Cliente (Next.js)
      │  Bearer JWT (Cognito)
      ▼
API Gateway HTTP API ──► JWT Authorizer (Cognito User Pool)
      │
      ▼  (uma Lambda por função, empacotada individualmente)
Lambdas (handlers)
  ├─ controller  → parse do evento HTTP
  ├─ validação   → ajv (JSONSchemaType)
  ├─ service     → regra de negócio
  └─ repository  → Mongoose (Models)
      │
      ├─► MongoDB (Atlas)          dados de domínio
      ├─► S3                       comprovantes/recibos
      ├─► SSM Parameter Store      config/segredos por stage
      └─► MercadoPago API          cobrança PIX
                 ▲
                 └── webhook ──► Lambda de confirmação de pagamento
```

**Conexão MongoDB em Lambda:** reutilizar a conexão entre invocações (cache do handler / `mongoose.connection.readyState`) e `context.callbackWaitsForEmptyEventLoop = false` para não segurar o event loop.

---

## 3. Autenticação e autorização

- **Cognito User Pool** com grupos `admin`, `professor`, `responsavel`.
- HTTP API usa o **JWT authorizer** nativo → valida o token e injeta claims no evento.
- Autorização de papel: middleware que lê `cognito:groups` das claims.
- Autorização de dado (ownership): o `responsavel` só acessa recursos das crianças vinculadas a ele; o `professor` só das turmas que leciona. Validado no service via vínculos no banco.

---

## 4. Estrutura do projeto

```
src/
├─ handlers/                 # entrypoints Lambda (1 por rota/função)
│  ├─ criancas/ turmas/ professores/ usuarios/
│  ├─ agenda/ financeiro/ pagamentos/ simulador/
├─ services/                 # regras de negócio
├─ repositories/             # acesso a dados (Mongoose)
├─ models/                   # schemas Mongoose
├─ schemas/                  # JSONSchemaType (ajv) por payload
├─ middlewares/              # auth, roleGuard, errorHandler
├─ libs/                     # mongo.ts, s3.ts, ssm.ts, mercadopago.ts
├─ utils/
└─ types/
serverless.ts / serverless.yml
config/<stage>.json          # referências a SSM
```

---

## 5. Endpoints principais (contrato resumido)

Base: `/v1`. Todos exigem JWT, exceto os marcados como público.

> **Convenção de CRUD.** Todas as entidades de cadastro (`usuarios`, `professores`, `turmas`, `criancas`) expõem o ciclo completo **create / read / update / delete**. `DELETE` é **soft delete** (`ativo: false`) por padrão. **Exceções deliberadas:** `usuarios` e `criancas` — nesses dois, `DELETE` é **hard delete definitivo**; usar `PUT .../{id}` com `ativo:false` para só bloquear o acesso preservando o cadastro/histórico. Ver seção 9 (LGPD) e a doc de banco.

### Auth/usuários (CRUD completo)
| Método | Rota | Papel | Descrição |
|---|---|---|---|
| POST | `/usuarios` | admin | Criar usuário (admin/professor/responsavel) |
| GET | `/usuarios` | admin | Listar usuários (filtros: papel, ativo) |
| GET | `/usuarios/{id}` | admin | Detalhe do usuário |
| PUT | `/usuarios/{id}` | admin | Atualizar dados/papel |
| DELETE | `/usuarios/{id}` | admin | Remover usuário **em definitivo** (hard delete: apaga do banco + `AdminDeleteUser` no Cognito) |
| GET | `/me` | todos | Dados do usuário logado + papel |

> **`POST /usuarios` — sem senha no body, senha temporária no retorno.** Body: `{ nome, email, papel, telefone? }` (`nome`≥3, `papel`∈`admin|professor|responsavel`). O backend cria o usuário no **Cognito com senha temporária gerada** (`AdminCreateUser` com `MessageAction: "SUPPRESS"` — **não** manda e-mail de convite), marca `email_verified`, adiciona ao grupo do papel e guarda o `cognitoSub`.
>
> **Modelo de entrega = "admin define e comunica":** a resposta inclui **`senhaTemporaria`** (retornada **uma única vez**, não persistida) — o front mostra num modal para o admin copiar e repassar ao usuário. O usuário loga com ela e troca no 1º login (challenge `NEW_PASSWORD`). **O front nunca coleta senha.** Falha na gravação faz rollback do usuário no Cognito.
>
> Usuário preso em `FORCE_CHANGE_PASSWORD` sem a temp: `aws cognito-idp admin-set-user-password --user-pool-id <id> --username <email> --password '<Temp>' --no-permanent`. **`ForgotPassword` não funciona nesse estado** (Cognito bloqueia até haver senha própria).
>
> **Ativar/desativar × remover.** `PUT /usuarios/{id}` aceita `ativo: boolean` — desativar (`ativo:false`) bloqueia o acesso mantendo o cadastro (feito pela **edição** no front). `DELETE /usuarios/{id}` é **hard delete** (apaga banco + Cognito, irreversível) — **exceção** à convenção de soft delete das demais entidades.

### Professores (CRUD completo)
| Método | Rota | Papel | Descrição |
|---|---|---|---|
| POST | `/professores` | admin | Cadastrar professor |
| GET | `/professores` | admin | Listar professores |
| GET | `/professores/{id}` | admin | Detalhe |
| PUT | `/professores/{id}` | admin | Atualizar dados |
| DELETE | `/professores/{id}` | admin | Remover (bloqueado/aviso se houver turma vinculada) |

> **`POST /professores` — cria o usuário (papel=professor) junto, sem `usuarioId`.** Body: `{ nome, cpf, telefone, email, formacao? }` — todos obrigatórios exceto `formacao`. **Contrato assumido** (mesmo padrão de `POST /usuarios`): o backend cria o usuário no Cognito com senha temporária gerada (`AdminCreateUser`, `MessageAction: "SUPPRESS"`), grupo `professor`, guarda `cognitoSub`, cria o registro em `professores` vinculado (`usuarioId` interno) e retorna **`senhaTemporaria`** no payload (uma única vez, não persistida) — o front mostra num modal para o admin copiar e repassar. Valida CPF por dígitos verificadores (`400`) e e-mail único (`409`). Falha em qualquer etapa faz rollback (usuário no Cognito + registro). Elimina o fluxo antigo de "criar Usuário primeiro, depois vincular no Professor" — reduz erro de vínculo errado e usuário órfão papel=professor sem professor associado.
>
> **`PUT /professores/{id}` — só `{ nome?, telefone?, email?, formacao? }`** (`additionalProperties:false`). **Não aceita** trocar `usuarioId` nem `cpf` — enviar esses campos causa `400`.

### Turmas (CRUD completo + vínculo de crianças)
| Método | Rota | Papel | Descrição |
|---|---|---|---|
| POST | `/turmas` | admin | Criar turma (nome, descrição, faixa etária, professora) |
| GET | `/turmas` | admin/professor | Listar turmas |
| GET | `/turmas/{id}` | admin/professor | Detalhe da turma |
| PUT | `/turmas/{id}` | admin | Atualizar dados / trocar professora |
| DELETE | `/turmas/{id}` | admin | Remover turma (só se vazia, ou realocando as crianças — ver regra) |
| GET | `/turmas/{id}/criancas` | admin/professor | Listar alunos da turma |
| POST | `/turmas/{id}/criancas` | admin | **Vincular** criança à turma (body: `criancaId`) |
| DELETE | `/turmas/{id}/criancas/{criancaId}` | admin | **Desvincular** criança da turma |
| PATCH | `/criancas/{id}/turma` | admin | **Mover** criança para outra turma (body: `turmaId`) |

### Crianças (CRUD completo)
| Método | Rota | Papel | Descrição |
|---|---|---|---|
| POST | `/criancas` | admin | Cadastrar criança (+ vínculo de turma e responsáveis) |
| GET | `/criancas` | admin/professor/responsavel* | Listar (filtro por turma, nome, ativo). *`responsavel` só recebe os próprios filhos (via `usuarios.criancasVinculadas` ou `responsaveis[].usuarioId`) — usado pela tela "Início" do responsável |
| GET | `/criancas/{id}` | admin/professor/responsavel* | Detalhe (*só o próprio filho) |
| PUT | `/criancas/{id}` | admin | Editar dados/saúde/responsáveis |
| DELETE | `/criancas/{id}` | admin | Remover **em definitivo, em cadeia** (apaga agenda diária, mensalidades e pagamentos da criança; desvincula — sem apagar — os usuários responsáveis) |

> **`POST /criancas` cria/vincula o acesso dos responsáveis.** Para cada responsável, o backend garante um **usuário papel=responsavel** pelo e-mail: reusa se já existir, senão cria (Cognito + banco, senha temporária). Grava `usuarioId` no responsável embutido e adiciona a criança em `usuarios.criancasVinculadas`. CPF duplicado é checado **antes** de criar acessos (evita usuário órfão). Resposta: **`{ crianca, acessosResponsaveis: [{ nome, email, senhaTemporaria }] }`** — as senhas dos acessos **recém-criados** são entregues **uma vez** ao admin (front mostra em modal). Responsáveis cujo usuário já existia não retornam senha.
>
> Como `createCrianca` chama o mesmo fluxo de criação de usuário (Cognito), a function precisa das mesmas `environment.USER_POOL_ID` + permissões IAM (`AdminCreateUser`/`AdminAddUserToGroup`/`AdminGetUser`/`AdminDeleteUser`) que `createUsuario` — configurado em `src/handlers/criancas/functions.yml`.
>
> **Ativar/desativar × remover.** `PUT /criancas/{id}` aceita `ativo:boolean` — desativar bloqueia o acesso mantendo o cadastro e o histórico. `DELETE /criancas/{id}` é **hard delete em cadeia** (irreversível): apaga a criança + toda `AgendaDiaria`/`Mensalidade`/`Pagamento` vinculados; usuários responsáveis são só desvinculados (`$pull` em `criancasVinculadas`), suas contas não são apagadas.

**Regras de vínculo e remoção:**
- Uma criança pertence a **uma turma por vez**. Vincular a uma nova turma (ou `PATCH .../turma`) substitui o vínculo anterior.
- **Remover turma** com crianças ativas é bloqueado (`409`): o admin deve antes realocar/desvincular as crianças (o front pode oferecer "mover todos para a turma X").
- **Remover professor** vinculado a uma turma retorna aviso/`409`; trocar a professora da turma é feito via `PUT /turmas/{id}`.
- Todo `DELETE` é **soft delete** (`ativo:false`) e idempotente; itens inativos não aparecem nas listas por padrão (filtro `ativo=false` para recuperá-los).

### Agenda diária
| POST | `/agenda` | professor | Criar registro (criança+data) |
| PUT | `/agenda/{id}` | professor | Editar registro do dia |
| GET | `/agenda?criancaId=&data=` | professor/responsavel* | Registro por dia |
| GET | `/agenda/historico?criancaId=&de=&ate=` | professor/responsavel* | Histórico |

### Planos de aula (PED-01/02)
| Método | Rota | Papel | Descrição |
|---|---|---|---|
| GET | `/turmas/{turmaId}/planos-aula` | professor | Listar planos de aula da turma |
| GET | `/turmas/{turmaId}/planos-aula/{id}` | professor | Detalhe |
| POST | `/turmas/{turmaId}/planos-aula` | professor | Criar (`professorId` vem do JWT) |
| PUT | `/turmas/{turmaId}/planos-aula/{id}` | professor | Atualizar |
| DELETE | `/turmas/{turmaId}/planos-aula/{id}` | professor | Remover |

> **Ainda não implementado no back (`aquarela_serverless`).** Modelo `planosAula`
> já existe em docs/04-Banco-de-Dados.md §3; as rotas acima seguem a convenção
> de subrecurso de `turmas` (como `/turmas/{id}/criancas`) para manter o
> contrato consistente quando forem implementadas. O front (`PlanosAulaService`,
> `src/services/planosAula.ts`) já está pronto e funciona hoje via
> `NEXT_PUBLIC_USE_MOCKS=true` (fixtures em `devData.ts`).

### Avisos (mural)
| Método | Rota | Papel | Descrição |
|---|---|---|---|
| GET | `/avisos?ativo=` | admin/professor/responsavel | Listar avisos (escopo por papel, ver abaixo) |
| POST | `/avisos` | admin | Publicar aviso (`titulo`, `corpo`, `turmaId?`) |
| PUT | `/avisos/{id}` | admin | Editar |
| DELETE | `/avisos/{id}` | admin | Remover (soft delete — `ativo:false`) |

> Documento: `{ _id, titulo, corpo, autorId, turmaId?, ativo, createdAt,
> updatedAt }`. **Sem campo `tipo`** (recado/cuidado/evento) — não existe no
> modelo. `turmaId` é opcional: **ausente = visível para todos os
> responsáveis**; presente = só para quem tem filho na turma (mural geral +
> por turma, ver docs/05-Sugestoes-Produto.md).
>
> **Escopo do `GET /avisos` varia por papel** (não é um filtro de query):
> `admin` vê tudo (inclusive inativos, via `?ativo=false`); `professor` vê os
> avisos globais + das turmas que leciona; `responsavel` vê os globais + das
> turmas das crianças vinculadas a ele. O front não filtra nada — consome a
> resposta como vier. `AvisosAdminService` (`src/services/avisosAdminService.ts`,
> tela `/admin/avisos`) cobre o CRUD; `AgendaService.getAvisos()` é a leitura
> do lado responsável, mesma rota.

### Financeiro / Pagamentos
| GET | `/mensalidades?criancaId=&ano=` | responsavel*/admin | Meses pagos/em aberto |
| POST | `/pagamentos` | responsavel | Gerar cobrança PIX (retorna copia-e-cola + txid) |
| GET | `/pagamentos/{txid}` | responsavel | Status do pagamento |
| POST | `/webhooks/mercadopago` | público (assinado) | Confirmação de pagamento |
| GET | `/financeiro/balanco?periodo=` | admin | Balanço mensal/anual |
| POST/GET | `/despesas` | admin | Lançar/listar despesas |
| GET | `/financeiro/inadimplentes` | admin | Lista de inadimplentes |

> **`/financeiro/inadimplentes` devolve uma linha por mensalidade em atraso**,
> não uma lista já agregada por criança: `{ mensalidade: { valor, mes, ano,
> vencimento, status, ... }, crianca: { nome, responsaveis: [{ nome, telefone,
> ... }] } }[]`. Não existe `valorTotal` nem `mesesEmAtraso` na resposta — o
> front (`services/financeiroNormalize.ts#normalizarInadimplentes`) agrupa por
> `crianca._id` e soma `mensalidade.valor`. Consumir `data.data` cru aqui
> quebrava a tela (`Cannot read properties of undefined (reading
> 'toLocaleString')`). Além disso, a rota só considera mensalidades com
> `status: "atrasado"` (vencimento já passado) — mensalidades do mês corrente
> ainda `"aberto"` (não vencidas, só não pagas) **não aparecem** nessa lista;
> hoje não há rota/filtro para elas.

### Simulador
| GET | `/simulador?meses=&plano=` | público | Cálculo de estimativa (ou 100% no cliente) |
| GET/PUT | `/config/precos` | admin | Valores base da mensalidade |

**Erros:** padrão `{ error: { code, message, details? } }` com HTTP status adequado (400 validação, 401/403 auth, 404, 409 conflito, 422 regra de negócio, 500).

---

## 6. Validação (ajv)

```ts
import { JSONSchemaType } from "ajv";
interface CriarAgendaBody {
  criancaId: string; data: string;
  alimentacao?: { refeicao: string; aceitacao: "tudo"|"parte"|"recusou" }[];
  sono?: { inicio: string; fim: string }[];
  medicacoes?: { nome: string; dose: string; hora: string }[];
  intercorrencia?: { tipo: string; descricao: string };
  observacoes?: string;
}
const schema: JSONSchemaType<CriarAgendaBody> = { /* ... */ };
```
Validar todo payload de entrada antes do service. `ajv-formats` para data/hora/e-mail.

---

## 7. Pagamentos PIX (MercadoPago)

1. `POST /pagamentos` cria cobrança PIX no MercadoPago → devolve `pixCopiaECola`, `qrBase64`, `txid`.
2. Cliente exibe QR e faz polling em `GET /pagamentos/{txid}`.
3. `POST /webhooks/mercadopago` recebe a confirmação → valida assinatura → marca a mensalidade como **paga** → gera recibo (PDF/HTML) e salva no **S3** → (fase 2) dispara push.
4. Idempotência: usar `txid`/`payment_id` para evitar dupla baixa.

Credenciais do MercadoPago e strings de conexão do Mongo ficam em **SSM Parameter Store** por stage, referenciadas em `config/<stage>.json`.

---

## 8. Configuração & deploy

- `serverless.yml`: `provider.runtime=nodejs24.x`, `httpApi` com `authorizer` Cognito, funções `individually` empacotadas via `serverless-esbuild`.
- `serverless-prune-plugin` para limpar versões antigas de Lambda.
- Stages: `dev`, `staging`, `prod` — cada um com seu `config/<stage>.json` e parâmetros SSM.
- Observabilidade: CloudWatch Logs + métricas; logs estruturados (JSON) por requisição.

---

## 9. Segurança & LGPD
- Dados sensíveis de saúde: acesso restrito por papel e por vínculo; princípio do menor privilégio nas Lambdas (IAM por função).
- Criptografia em trânsito (HTTPS) e em repouso (Mongo Atlas + S3 SSE).
- Segredos apenas em SSM (nunca no código/repo).
- Logs sem PII sensível; trilha de auditoria para edições de cadastro de criança e baixas financeiras.
- Webhook com verificação de assinatura.

---

## 10. Testes & dev local
- **Jest + ts-jest**: unitários de services e validações; testes de contrato dos handlers.
- **Local:** `serverless-offline` + `nodemon` + MongoDB em `docker-compose` (replicaSet, necessário para transações do Mongoose).
- Seeds de dados (turmas/crianças fictícias) para desenvolvimento.
