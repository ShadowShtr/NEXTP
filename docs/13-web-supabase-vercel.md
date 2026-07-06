# 13 — Web (Next.js) + Supabase + Vercel

Versão web/PWA do NextP para usar no iPhone via Safari (e "instalável" no ecrã inicial). **Este é o produto ativo** — o app Android (`android/`) está arquivado e não recebe desenvolvimento novo.

## Porque os dados nunca se perdem

- **Dados no Supabase (nuvem)** — não vivem no telemóvel. Limpar cache, fechar o browser, ou fazer um deploy **não apaga nada**.
- **Deploys só trocam código** — o Vercel publica a página; a base de dados fica intacta.
- **Sessão** pode expirar → basta novo login (email + password); os dados continuam lá.
- **PWA** (adicionar ao ecrã inicial) reduz a limpeza automática do iOS.

## Passo 1 — Supabase

1. Criar projeto em supabase.com (ou reutilizar um).
2. **SQL Editor → New query** → colar e correr `supabase/schema.sql`. É **idempotente e não destrutivo** — pode ser corrido de novo sempre que o schema for atualizado, sem perder dados existentes (nunca usa `drop table`).
3. **Authentication → Providers → Email**: ativar, com **"Confirm email" DESLIGADO** (login é email+password, sem clique de confirmação — ver secção seguinte).
4. **Project Settings → API**: copiar `Project URL` e a chave `anon`/`publishable`.

## Passo 2 — Variáveis de ambiente

Em **Vercel → Project → Settings → Environment Variables** (e em `.env.local` para dev):

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_PUBLIC_KEY
```

> Se usaste a integração oficial Supabase↔Vercel, estas duas variáveis já são criadas automaticamente.

## Passo 3 — Vercel

- **Framework Preset: Next.js** (não "Other").
- **Root Directory: `./`** (a app web está na raiz; o Android está em `android/` e é ignorado via `.vercelignore`).
- Deploy.

## Passo 4 — Instalar no iPhone

Safari → abrir o site → botão **Partilhar** → **Adicionar ao ecrã inicial**. Passa a abrir como app (ecrã inteiro).

## Autenticação — email + password

O login usa **email + password** (não código OTP nem magic link — foi testado e trocado por ser mais fiável e não depender de configurar SMTP/templates de email):

- **Entrar**: email + password de uma conta já existente.
- **Criar conta**: mesmo formulário, cria a conta na hora (sem confirmação por email, já que "Confirm email" está desligado no passo 1).
- **Esqueci a password**: envia email de reposição via `resetPasswordForEmail` (usa o template "Reset Password" do Supabase).
- **Entrar com Google**: botão preparado na interface; ativação completa requer configurar o provider Google em **Authentication → Providers → Google** no Supabase (client ID/secret) — trabalho futuro, o botão já existe mas ainda não está ligado a um provider ativo.

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local   # preencher as chaves
npm run dev                  # http://localhost:3000
```

## Notas

- O `android/` (app nativo) fica arquivado no mesmo repo, sem afetar o build web (`.vercelignore`, `next.config.mjs`).
- Todas as tabelas usam Row Level Security — cada utilizador só acede às suas próprias linhas.
