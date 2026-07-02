# 15 — Segurança financeira

TASK 3 do masterplan (`docs/19`), adaptado ao stack web (Next.js + Supabase).

## Regras rígidas

1. **Sem cache como armazenamento de dados financeiros.** A única fonte de verdade é o Supabase (Postgres). O Service Worker (`public/sw.js`) só cacheia o *shell* estático (JS/CSS/manifest) — nunca respostas da API do Supabase (ver exclusão explícita por `hostname.endsWith("supabase.co")` em `sw.js`).
2. **Sem logs sensíveis em produção.** Nunca `console.log` de valor, descrição, email ou token. Erros mostrados ao utilizador usam `error.message` do Supabase (já não inclui payload).
3. **Sem chaves no git.** Só `NEXT_PUBLIC_SUPABASE_URL` e a chave `anon/publishable` (protegida por RLS) ficam no código/env. A chave `service_role` **nunca** é usada no cliente nem commitada — se for necessária no futuro (ex.: cron de notificações), fica só em variável de ambiente server-side.
4. **Sem fallback destrutivo no schema.** Alterações ao `supabase/schema.sql` são sempre `create table if not exists` / `alter table ... add column if not exists` — nunca `drop table` em produção sem backup manual confirmado pelo utilizador.
5. **Backup é sempre opcional.** O login (email+password) é necessário para usar o produto atual (dados na nuvem), mas nunca se força reautenticação destrutiva; expirar sessão nunca apaga dados — só pede novo login.
6. **App é offline-tolerant.** Falhas de rede mostram mensagem de erro e não travam a UI; nenhuma escrita local finge sucesso sem confirmação do Supabase.
7. **Validação de formulários.** Todo formulário valida no cliente antes de enviar: valores numéricos `> 0`, nome/descrição não vazios, datas válidas. Ver `docs/17-test-plan.md` para casos de teste.
8. **Tratamento de erro do banco.** Toda chamada Supabase (`insert`/`update`/`delete`/`select`) trata `error` e mostra mensagem amigável — nunca falha silenciosa.
9. **Tratamento de erro de backup/export** (quando implementado, TASK 19): falha de exportação mostra estado claro, não corrompe dados existentes.
10. **Proteção contra duplicidade de recorrentes.** `recurring_occurrences` tem índice único `(recurring_payment_id, year, month)` — impossível duplicar ocorrência do mesmo mês. Lançar como `Expense` grava `created_expense_id` para nunca duplicar o gasto.
11. **Proteção contra duplicidade de wishlist convertida.** `wishlist_items.status` muda para `PURCHASED` dentro da mesma operação que cria o `SavedItem`; a UI verifica `status !== 'PURCHASED'` antes de permitir converter de novo (ver `docs/18-amazon-wishlist.md`).

## RLS (Row Level Security)

Toda tabela nova segue o padrão já em `supabase/schema.sql`:

```sql
alter table public.<tabela> enable row level security;
create policy "own_all" on public.<tabela>
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Sem exceções — mesmo tabelas "só de leitura" (ex.: categorias padrão) pertencem ao utilizador que as criou.

## Validação de URLs (wishlist / Amazon)

- URL deve começar por `http://` ou `https://`.
- Para "link Amazon" especificamente, o domínio deve conter `amazon.` (ex.: `amazon.pt`, `amazon.com`, `amazon.de`) — caso contrário aceitar como "link externo" genérico, nunca bloquear o utilizador.
- Nunca fazer fetch/scraping do link (ver regra de negócio em `docs/18-amazon-wishlist.md`) — é só abertura em nova aba (`target="_blank" rel="noopener noreferrer"`).

## Equivalente web dos helpers Kotlin do masterplan

O masterplan original pede `util/SafeLog.kt` e `util/Validation.kt`. No stack web isso corresponde a:
- `src/lib/validation.ts` — funções puras de validação (nome obrigatório, valor `>0`, URL válida).
- Sem "SafeLog" dedicado: a regra é simplesmente **não logar dados sensíveis** (aplicado por revisão manual, não por wrapper).
