# Aquarela Kids — App

Front-end da plataforma de gestão da Aquarela Kids. PWA em Next.js que atende três
perfis (responsável, professor e administração) contra a API do
[aquarela_serverless](https://github.com/vitorsoftwaredeveloper/aquarela_serverless).

## Stack

- **Next.js 16** (App Router) + **React 19** + TypeScript
- **AWS Amplify** (`aws-amplify`) para autenticação via Cognito
- **Axios** + `axios-retry` na camada de serviços
- **react-hook-form** + **Yup** nos formulários
- **Firebase Cloud Messaging** para web push
- **CSS Modules** (sem framework de UI)
- **Vitest** + Testing Library
- PWA: `manifest.json`, ícones e service worker próprios

## Requisitos

- Node 20+
- Yarn 4 (`packageManager` já fixado no `package.json` — use `corepack enable`)

## Setup

```bash
corepack enable
yarn install
cp .env.example .env.local
yarn dev
```

O app sobe em `http://localhost:3000`.

### Variáveis de ambiente

Todas em `.env.example`. As essenciais:

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base da API, incluindo `/v1` |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | User Pool do Cognito |
| `NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID` | App Client **sem** client secret |
| `NEXT_PUBLIC_COGNITO_REGION` | Região do pool |
| `NEXT_PUBLIC_USE_MOCKS` | `true` sobe o app com fixtures locais, sem backend |
| `NEXT_PUBLIC_FIREBASE_*` | Config do app Web do Firebase (só FCM) |

Sem os IDs do Cognito o app ainda sobe: `configureAmplify()` é ignorado e a
landing e o simulador funcionam normalmente. Só o login fica indisponível.

Como `NEXT_PUBLIC_*` é embutido no bundle em build time, trocar qualquer uma
dessas exige rebuild — não basta reiniciar.

## Scripts

| Comando | O que faz |
| --- | --- |
| `yarn dev` | Servidor de desenvolvimento |
| `yarn build` | Build de produção |
| `yarn start` | Sobe o build |
| `yarn lint` | ESLint |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn test` | Vitest (single run) |
| `yarn test:watch` | Vitest em watch |
| `yarn format` | Prettier em `src/` |

## Estrutura

```
src/
  app/               App Router, agrupado por perfil
    (public)/        landing, login, simulador de mensalidade
    (responsavel)/   agenda, mural, recados, financeiro (Pix), perfil
    (professor)/     turmas, planos de aula, mural, recados, histórico
    (admin)/         dashboard, crianças, turmas, professores, usuários, financeiro
  components/        design system interno (Button, Input, Modal, Toast, ...)
  features/          telas e lógica por domínio
  contexts/          Auth, Notifications, Theme
  services/          cliente HTTP e chamadas à API
  schemas/           validação Yup
  hooks/ lib/ utils/ storage/ types/
```

## Autenticação e perfis

Login é feito no Cognito via Amplify; o JWT vai no header `Authorization` para a
API. O perfil vem da claim `cognito:groups` — o usuário **precisa** estar em um
grupo (`admin`, `professor` ou `responsavel`), senão a API responde 401. O
componente `RoleGuard` restringe as rotas no cliente.

A claim é carimbada na emissão do token: mudança de grupo só vale após novo login.

## Notificações push

FCM registra o service worker `public/firebase-messaging-sw.js`. Service worker
não enxerga `process.env`, então a config do Firebase está literal nesse arquivo
— são identificadores públicos do projeto (a `apiKey` do Firebase Web não é
credencial), já servidos a qualquer visitante. As permissões reais ficam nas
regras do Firebase e no back-end, que envia via `firebase-admin`.

## Deploy

Vercel, a partir da branch `main`. As variáveis `NEXT_PUBLIC_*` são configuradas
no projeto da Vercel por ambiente.
