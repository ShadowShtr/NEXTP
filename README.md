<div align="center">

# NextP

**O teu ajudador financeiro pessoal — simples, rápido, bonito e divertido.**

Regista os pequenos gastos do dia em segundos e percebe exatamente para onde foi o teu dinheiro.

</div>

---

## 🎯 Objetivo

O NextP é feito para quem faz **muitos pequenos gastos ao longo do dia** — café, comida, transportes, mercado, besteiras, contas fixas — e quer registar tudo rapidamente e depois entender para onde o dinheiro foi. O destaque é a estatística **Gastos Invisíveis**: mostra como pequenas compras diárias viram um valor grande no fim do mês.

## ✨ Funcionalidades principais

- 🧾 **Registos** — lançamento rápido de gastos diários com categorias, totais do dia e do mês, edição e apagar.
- 📦 **Guardados** — bens comprados (garantia, foto, contar ou não como gasto) e **wishlist Amazon/externa** ("Quero comprar") com conversão segura para comprado.
- 📅 **Planeamento** — contas futuras, dívidas, parcelas, objetivos e compras desejadas com barras de progresso.
- ✅ **Pagamentos recorrentes** — checklist com bolinhas para marcar o que já foi pago, **com histórico independente por mês** e suporte a parcelas (ex.: 3/12).
- 📊 **Resumo** — gráficos, estatísticas diárias/mensais, comparação com o mês anterior e Gastos Invisíveis (limite configurável).
- 🔔 **Central de Alertas** — contas a vencer/vencidas, garantias a expirar, categorias perto do limite, backup desatualizado.
- 💾 **Dados na nuvem (Supabase)** — nunca se perdem ao limpar cache, fechar o browser ou reinstalar a PWA.
- 🔐 **Login por email + password**, com recuperação de password e Google preparado (ver [Autenticação](#-autenticação)).

## 🛠️ Tecnologias

**Next.js 15** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS** · **Supabase** (Postgres + Auth + RLS) · **Vercel** (deploy) · **PWA** (instalável no ecrã inicial do iPhone/Android).

> O projeto teve origem como app Android nativo (Kotlin/Compose/Room). Essa versão está **arquivada** em [`android/`](android/) e não é o produto ativo — todo o desenvolvimento atual é na web app acima.

## 🚀 Como rodar

Requisitos: **Node.js 20+** e uma conta [Supabase](https://supabase.com).

```bash
git clone https://github.com/ShadowShtr/NEXTP.git
cd NEXTP
npm install
cp .env.example .env.local   # preencher NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:3000
```

Antes de usar, corre o schema em `supabase/schema.sql` no **SQL Editor** do teu projeto Supabase (é idempotente — podes correr de novo sempre que houver atualizações). Guia completo de setup: [`docs/13-web-supabase-vercel.md`](docs/13-web-supabase-vercel.md).

```bash
npm run typecheck   # valida tipos TypeScript
npm run test        # testes unitários (Vitest)
npm run build       # build de produção
```

## 📁 Estrutura de pastas

```
NEXTP/
  src/            App Next.js (App Router, componentes, lib)
  public/         Ícones, ilustrações e manifest PWA
  supabase/       Schema SQL (idempotente, com RLS)
  docs/           Documentação completa do projeto
  assets/         Fontes originais dos ícones/ilustrações (SVG/PNG)
  android/        App Android nativo ARQUIVADO (não é o produto ativo)
  tests/          Testes automatizados (Vitest)
```

Detalhe da arquitetura em [`docs/03-arquitetura.md`](docs/03-arquitetura.md).

## 📌 Estado atual

Produto web/PWA em produção em **https://nextp-rouge.vercel.app**, com as 4 abas principais funcionais (Registos, Guardados, Planeamento, Resumo), wishlist, pagamentos recorrentes com parcelas, backup, e central de alertas. Ver [`docs/09-roadmap.md`](docs/09-roadmap.md) e [`CHANGELOG.md`](CHANGELOG.md) para o detalhe fase a fase.

## 💾 Persistência dos dados

Todos os dados financeiros vivem no **Supabase** (Postgres na nuvem), protegidos por **Row Level Security** (cada utilizador só acede às suas próprias linhas). **Nunca se usa cache do browser como fonte de dados** — o service worker (`public/sw.js`) cacheia apenas o *shell* estático da app, nunca respostas da API.

Na prática:
- Limpar o cache do Safari/Chrome **não apaga nada** — os dados continuam no Supabase.
- Fechar a app, reiniciar o telemóvel, desinstalar e reinstalar a PWA: **os dados continuam lá**, basta voltar a entrar com o mesmo email.
- Um deploy no Vercel só troca o código da página — a base de dados nunca é tocada.
- Existe também exportação/importação manual em JSON (Configurações → Backup) como cópia extra portátil.

## 🔐 Autenticação

Login por **email + password**, com conta criada automaticamente no primeiro registo. Inclui recuperação de password ("Esqueci a password") e um botão "Entrar com Google" preparado na interface (ativação completa via Supabase OAuth é trabalho futuro). Ver [`docs/13-web-supabase-vercel.md`](docs/13-web-supabase-vercel.md).

## 🎨 Estilo visual

**NextP Clay System** — claymorphism azul e branco: macio, 3D, arredondado, tátil e divertido, mas profissional. Ver [`docs/05-design-system.md`](docs/05-design-system.md).

## ✅ Pagamentos recorrentes

Checklist de bolinhas por mês, com suporte a parcelas (ex.: "3/12" para um empréstimo). **Regra de ouro:** marcar uma conta como paga num mês **não** marca os meses seguintes. Cada mês tem o seu próprio estado e histórico. Ver [`docs/11-pagamentos-recorrentes.md`](docs/11-pagamentos-recorrentes.md).

## 🖼️ Ícone/logo

Quadrado azul arredondado com **N** branco e seta de crescimento, em claymorphism 3D. Ver [`docs/12-logo-e-icone.md`](docs/12-logo-e-icone.md).

## 🤝 Como continuar o projeto

Segue o roadmap em [`docs/09-roadmap.md`](docs/09-roadmap.md) e o masterplan detalhado em [`docs/19-claude-task-masterplan.md`](docs/19-claude-task-masterplan.md) (adaptado ao stack web). Mantém commits organizados (padrão em [`docs/10-decisoes-tecnicas.md`](docs/10-decisoes-tecnicas.md)) e atualiza os docs e o CHANGELOG a cada mudança.

---

*NextP — porque os pequenos gastos também contam.*
