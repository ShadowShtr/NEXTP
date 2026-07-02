# 13 — Web (Next.js) + Supabase + Vercel

Versão web/PWA do NextP para usar no iPhone via Safari (e "instalável" no ecrã inicial).

## Porque os dados nunca se perdem
- **Dados no Supabase (nuvem)** — não vivem no telemóvel. Limpar cache, fechar o Safari, ou fazer um deploy **não apaga nada**.
- **Deploys só trocam código** — o Vercel publica a página; a base de dados fica intacta.
- **Sessão** pode expirar (regra do iOS) → basta novo login por código; os dados continuam lá.
- **PWA** (adicionar ao ecrã inicial) reduz a limpeza automática do iOS.

## Passo 1 — Supabase
1. Criar projeto em supabase.com (ou reutilizar um).
2. **SQL Editor → New query** → colar e correr `supabase/schema.sql`. É **idempotente e não destrutivo** — pode ser corrido de novo sempre que o schema for atualizado (ex.: ao adicionar a wishlist), sem perder dados existentes.
3. **Authentication → Providers → Email**: ativar. (Sem password — usamos código OTP.)
4. **Authentication → Email Templates → Magic Link**: garantir que o email mostra o **código**. Incluir no template, por ex.:
   ```
   O teu código NextP: {{ .Token }}
   ```
   (O login da app pede este código de 6 dígitos.)
5. **Project Settings → API**: copiar `Project URL` e a `anon public key`.

## Passo 2 — Variáveis de ambiente
Em **Vercel → Project → Settings → Environment Variables** (e em `.env.local` para dev):
```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_PUBLIC_KEY
```
> Se usaste a integração oficial Supabase↔Vercel, estas duas variáveis já são criadas automaticamente.

## Passo 3 — Vercel
- **Framework Preset: Next.js** (não "Other").
- **Root Directory: `./`** (a app web está na raiz; o Android está em `android/` e é ignorado).
- Deploy.

## Passo 4 — Instalar no iPhone
Safari → abrir o site → botão **Partilhar** → **Adicionar ao ecrã inicial**. Passa a abrir como app (ecrã inteiro).

## Desenvolvimento local
```bash
npm install
cp .env.example .env.local   # preencher as chaves
npm run dev                  # http://localhost:3000
```

## Notas
- Login por **código OTP** (não por link) para não sair da app no iPhone.
- O `android/` (app nativo) fica arquivado no mesmo repo, sem afetar o build web.
