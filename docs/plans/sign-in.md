# Plano — Sign-In (Autenticação)

## 1. Objetivo

Permitir que pessoas com conta acessem a plataforma com email e senha, criando
uma sessão persistida em cookie, e refletir esse estado no cabeçalho global
(login quando visitante; avatar + nome + email quando autenticado).

## 2. Leitura da spec e decisões

- Página em `/auth/sign-in`, conforme critério de aceitação.
- `POST /api/v1/sign-in` recebe `{ email, password }` em JSON.
- `200` em sucesso, `400` para dados malformados, `401` para credenciais
  inválidas.
- Erro de autenticação sempre genérico: **“Email ou senha inválidos.”** Nunca
  revelar se o email existe.
- Sessão do Next.js com cookie `HttpOnly`, assinado com HMAC-SHA256.
- A spec pede “uma home sem nada por enquanto”. Como a feature Home é dona de
  `src/app/page.tsx`, o Sign-In **não edita** essa página: apenas redireciona
  para `/`. A home real chega pela feature Home.
- O texto “não implementar nada relacionado a sign-up” é contraditório; será
  interpretado como “não implementar nada além de autenticação/sessão/header”.
- Sem recuperação de senha, sem envio de email e sem cadastro novo nesta
  entrega.

## 3. Escopo

### Dentro

- Layout base com cabeçalho global.
- Página `/auth/sign-in` com formulário validado no cliente.
- Endpoint REST de sign-in e sign-out.
- Router tRPC de autenticação.
- Sessão em cookie assinado.
- Estado de autenticação no header com avatar DiceBear.
- Redirecionamento pós-login (com suporte a `?redirect=` interno).

### Fora

- Sign-up (já existe).
- Recuperação/alteração de senha.
- OAuth, magic link, MFA.
- Rate limiting e bloqueio por tentativas (registrar como evolução futura).
- Autorização por papéis.
- Edição de perfil.

## 4. Arquitetura

```text
Formulário /auth/sign-in
        │
        ├── tRPC auth.signIn ─────────────┐
        │                                 │
        └── (contrato REST) POST /api/v1/sign-in
                                          │
                                          ▼
                              authRouter.signIn
                        (Zod + bcrypt.compare + accounts)
                                          │
                                          ▼
                              createSession(accountId)
                                          │
                                          ▼
                         cookie av_session (HMAC, HttpOnly)
                                          │
                                          ▼
                     router.push("/") + router.refresh()
                                          │
                                          ▼
                     RootLayout → getCurrentAccount()
                                          │
                                          ▼
                              SiteHeader (avatar/entrar)
```

O formulário usa a mutation tRPC, seguindo o padrão do sign-up existente. O
endpoint REST é um adaptador fino que delega ao mesmo procedimento, garantindo
um único caminho de regra de negócio.

## 5. Contratos

### `POST /api/v1/sign-in`

Request:

```json
{ "email": "maria@exemplo.com", "password": "senha" }
```

Respostas:

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `{ "data": { "id", "firstName", "lastName", "email" } }` | Credenciais válidas; cookie setado |
| `400` | `{ "error": "Dados inválidos", "details": {...} }` | JSON inválido ou Zod inválido |
| `401` | `{ "error": "Email ou senha inválidos" }` | Email inexistente, senha errada ou conta inativa |
| `500` | `{ "error": "Não foi possível entrar" }` | Falha inesperada |

Headers: `Set-Cookie: av_session=...; HttpOnly; Path=/; SameSite=Lax;
Max-Age=604800` e `Cache-Control: no-store`.

### `POST /api/v1/sign-out`

- `204` e cookie expirado.
- Idempotente: sem sessão também retorna `204`.

### tRPC

- `auth.signIn({ email, password })` → `{ account: SessionAccount }`; seta cookie.
- `auth.signOut()` → `{ success: true }`; limpa cookie.
- `auth.me()` → `SessionAccount | null` (query pública, útil para clientes).

### Schema Zod (`src/lib/validations/sign-in.ts`)

```ts
email: string().trim().toLowerCase().email("Email inválido")
password: string().min(1, "Senha é obrigatória")
```

O cliente pode usar a mesma regra. No servidor, a senha não tem mínimo de 6 para
não vazar informação sobre a senha cadastrada; a validação de formato fica no
cadastro.

## 6. Banco de dados

- Nenhuma migration nova.
- Consulta em `accounts`: `id, first_name, last_name, email, password, active`.
- Normalizar email para lowercase e trim.
- `bcrypt.compare(password, account.password)`.
- Se a conta não existir, comparar contra um hash “dummy” para reduzir
  diferença de tempo entre email existente e inexistente.
- Conta com `active = false` recebe o mesmo `401` genérico.
- Retornar somente dados públicos; nunca retornar `password`.

## 7. UI/UX

### Direção visual

Manter a identidade já criada no sign-up: fundo branco, “ficha” com borda preta
e canto cortado (`ticket-clip`), barra `accent`, tipografia Bricolage Grotesque
(display) + Instrument Sans (corpo), cantos retos e contraste alto. A tela de
login deve parecer a mesma família, não um formulário genérico de SaaS.

- Paleta (predominância branca, detalhes em vermelho e preto):
  - `paper` `#FFFFFF`: fundo das páginas e das fichas.
  - `ink` `#141414`: texto, bordas e blocos editoriais (heróis, “Entre para
    avaliar”).
  - `brand` `#BF1828`: botões principais, links e barras de nota.
  - `brand-deep` `#810E1A`: hover dos botões `brand` e sombras deslocadas.
  - `accent` `#E61919`: faixas, marcadores, estrelas, foco (`ring`) e seleção
    de texto; texto sobre ele em `accent-foreground` (branco).
  - `destructive` `#C0303A`: mensagens de erro.
- Sem novos tokens globais; reutilizar os existentes.
- Movimento: uma entrada curta do cartão (fade + 8px) e transições de foco.
  Respeitar `prefers-reduced-motion`.

### Wireframe — desktop

```text
┌────────────────────────────────────────────────────────────────────┐
│  ▮▮▮  Avaliação de Produtos                                        │
│                                                                    │
│  Volte ao que                                  ┌────────────────┐  │
│  importa.                                      │  Entrar        │  │
│                                                │                │  │
│  Entre para continuar                          │  Email         │  │
│  avaliando o que você                          │  [___________] │  │
│  já testou.                                    │                │  │
│                                                │  Senha         │  │
│  ▮ 5 barras de nota                            │  [_______] 👁  │  │
│                                                │                │  │
│                                                │  [ Entrar ]    │  │
│                                                │                │  │
│                                                │  Criar conta   │  │
│                                                └────────────────┘  │
│                                                ░ sombra brand-deep   │
└────────────────────────────────────────────────────────────────────┘
```

### Wireframe — mobile

```text
┌──────────────────────────┐
│ ▮▮▮ Avaliação de Produtos│
│                          │
│ Volte ao que importa.    │
│ Entre para continuar...  │
│                          │
│ ┌──────────────────────┐ │
│ │ Entrar               │ │
│ │ Email                │ │
│ │ [__________________] │ │
│ │ Senha                │ │
│ │ [______________] 👁  │ │
│ │ [     Entrar      ]  │ │
│ │ Criar conta          │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### Componentes

- `src/app/auth/sign-in/page.tsx`: server component; se já houver sessão,
  redireciona para `/` (ou `redirect` seguro).
- `src/components/auth/sign-in-screen.tsx`: layout editorial.
- `src/components/auth/sign-in-form.tsx`: client component com
  `react-hook-form` + `zodResolver`.
- `src/components/auth/password-input.tsx`: input com botão mostrar/ocultar
  (ícone `lucide-react`).
- `src/components/site-header.tsx`: client component; recebe
  `account: SessionAccount | null` do layout.
- `src/components/auth/user-menu.tsx`: avatar, nome + sobrenome, email e botão
  “Sair”. Pode ser um bloco simples, sem dropdown, para reduzir dependências.
- `src/app/layout.tsx`: busca `getCurrentAccount()` e renderiza o header.
- Header oculto em rotas `/auth/*` via `usePathname` no client component.
- Avatar DiceBear:
  `https://api.dicebear.com/9.x/notionists/svg?seed=<email>&backgroundColor=f5b800`
  com `next/image`, `unoptimized` se necessário, ou `<img>` com `alt`.
  Configurar `api.dicebear.com` em `next.config.ts`.

### Estados

- Campo inválido: mensagem abaixo do campo, borda/anel `destructive`.
- Erro de credenciais: `Alert` vermelho no topo do formulário, título
  “Não foi possível entrar” e descrição genérica.
- Carregando: botão “Entrando...” desabilitado.
- Sucesso: redireciona; não mostrar toast desnecessário.
- `?redirect=/products/abc` é aceito apenas se começar com `/` e não com `//`.
  Caso contrário, usar `/`.
- Foco visível em todos os controles; labels associados; `autoComplete`
  `email` e `current-password`.

## 8. Arquivos

### Criados

- `src/app/api/v1/sign-in/route.ts`
- `src/app/api/v1/sign-out/route.ts`
- `src/app/auth/sign-in/page.tsx`
- `src/components/auth/sign-in-screen.tsx`
- `src/components/auth/sign-in-form.tsx`
- `src/components/auth/password-input.tsx`
- `src/components/auth/user-menu.tsx`
- `src/components/site-header.tsx`

### Alterados

- `src/app/layout.tsx` (header global + conta)
- `src/app/globals.css` (somente se necessário para uma animação local)
- `next.config.ts` (`images.remotePatterns` para DiceBear)
- `src/server/api/routers/auth.ts` (stub → implementação)
- `src/lib/validations/sign-in.ts` (stub → implementação)

### Somente leitura

- `src/lib/auth/session.ts`
- `src/server/auth/current-account.ts`
- `src/server/api/trpc.ts`
- `src/server/api/root.ts`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/app/page.tsx` (Home)
- `src/components/ui/*`
- `package.json`

## 9. Passos de implementação

1. Validar os helpers de sessão da Fase 0 (`createSession`,
   `getSessionAccountId`, `destroySession`, `getCurrentAccount`).
2. Implementar `authRouter` com `signIn`, `signOut` e `me`, usando Zod,
   normalização de email, `bcrypt.compare` e `createSession`.
3. Implementar os adaptadores REST de sign-in e sign-out com o mapeamento de
   erros definido.
4. Criar a tela e o formulário de sign-in com validação client-side e alerta
   genérico.
5. Criar o header global, o bloco de usuário e o avatar; esconder o header em
   `/auth/*`.
6. Atualizar o layout raiz para buscar a conta e passar ao header.
7. Configurar `images.remotePatterns` para DiceBear.
8. Rodar `npm run typecheck` e `npm run lint`; corrigir apenas os arquivos
   próprios.
9. Smoke test manual:
   - visitante vê “Entrar”;
   - login inválido mostra alerta genérico;
   - login válido cria cookie e redireciona;
   - header mostra avatar, nome e email;
   - logout limpa cookie e volta ao estado visitante;
   - `/auth/sign-in` com sessão redireciona para `/`.

## 10. Segurança

- Cookie assinado, `HttpOnly`, `SameSite=Lax`, `Secure` em produção.
- Segredo fora do repositório; rotação invalida sessões.
- Comparação de senha com `bcrypt.compare`.
- Hash dummy para email inexistente.
- Mensagem e status idênticos para email inexistente, senha errada e conta
  inativa.
- Não logar email/senha nem retornar `password`.
- `Cache-Control: no-store` nas respostas de autenticação.
- Redirecionamento pós-login restrito a paths internos.
- Sem rate limiting nesta entrega; documentar como próximo passo.

## 11. Dependências e paralelismo

- Consome os contratos da Fase 0: `SessionAccount`, `getCurrentAccount`,
  `createTRPCContext`, `protectedProcedure`, router raiz com `authRouter`.
- É dono de `layout.tsx`, `next.config.ts`, `globals.css`, `tailwind.config.ts`
  e do header. As demais features apenas usam o header.
- Não edita `src/app/page.tsx`; a home é da feature Home.
- A feature Feedback consome `getCurrentAccount`/`protectedProcedure` e o
  cookie criado aqui. O formulário de avaliação só funciona após esta feature
  estar integrada.

## 12. Critérios de aceitação → evidência

| Critério | Evidência |
| --- | --- |
| Página em `/auth/sign-in` | Rota e tela implementadas |
| Formulário com validação | `react-hook-form` + Zod + mensagens inline |
| Comunicação com a API | Mutation tRPC + adapter REST `POST /api/v1/sign-in` |
| Erros informados | `Alert` vermelho com mensagem genérica |
| Navegar para `/` no sucesso | `router.push` + `router.refresh` |
| Header com login/avatar | `SiteHeader` + `UserMenu` + DiceBear |
| Sessão Next.js com cookies | Cookie `av_session` assinado e `HttpOnly` |

## 13. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| `cookies().set` em tRPC não persistir | Validar no smoke test; se necessário, o formulário chama o REST `POST /api/v1/sign-in` diretamente |
| Layout raiz dinâmico por causa do cookie | Aceitável para o app; header precisa refletir sessão |
| Conflito com a Home em `page.tsx` | Home é a única owner; Sign-In não toca no arquivo |
| Avatar remoto bloqueado | Configurar `remotePatterns`; fallback para iniciais se a imagem falhar |
| Conta inativa | Tratar como credencial inválida, sem mensagem específica |

## 14. Definition of Done

- Todos os itens de “Dentro do escopo” implementados.
- Typecheck, lint e build passando.
- Smoke test manual concluído.
- Nenhum arquivo de outra feature alterado.
- Relatório final entregue ao orquestrador.
