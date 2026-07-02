# 04 — Banco de Dados

Persistência com **Room/SQLite** (`nextp.db`) na versão Android (`android/`, arquivada). Preferências simples em **DataStore**. **Nunca** cache como armazenamento principal.

> **Produto ativo (web):** o schema real em produção é Postgres via Supabase — ver `supabase/schema.sql` e `docs/13-web-supabase-vercel.md`. As entidades abaixo descrevem o modelo lógico comum às duas versões; os nomes de coluna no Supabase usam `snake_case` (ex.: `category_id` em vez de `categoryId`).

## Entidades

### Category (`categories`)
`id, name, icon, color, monthlyLimit?, isDefault, createdAt`

### Expense (`expenses`)
`id, description, amount, categoryId, date (ISO yyyy-MM-dd), time (HH:mm), paymentMethod, note?, isRecurring, source, recurringPaymentOccurrenceId?, createdAt, updatedAt`
Índices: `date`, `categoryId`.

### SavedItem (`saved_items`)
`id, name, amount, purchaseDate, store?, category?, warrantyUntil?, invoiceImagePath?, purchaseUrl?, source (MANUAL|WISHLIST), wishlistItemId?, note?, countAsMonthlyExpense, createdAt, updatedAt`

### WishlistItem (`wishlist_items`) — "Quero comprar", ver `docs/18-amazon-wishlist.md`
`id, name, expectedAmount, targetAmount?, currentAmount?, amazonUrl?, externalUrl?, imagePath?, categoryId?, priority, status (WISHLIST|PURCHASED), desiredDate?, note?, convertedSavedItemId?, createdAt, updatedAt`
Índices: `status`, `priority`, `categoryId`, `desiredDate`.
Conversão para `SavedItem` é transacional (ver `src/lib/wishlist.ts`): cria o `SavedItem`, marca `status = PURCHASED`, grava `convertedSavedItemId` — nunca duplica.

### PlanningItem (`planning_items`)
`id, name, type, totalAmount, paidAmount, remainingAmount, dueDate?, priority, status, repeatType, note?, createdAt, updatedAt`

### RecurringPayment (`recurring_payments`) — *template*
`id, name, amount, categoryId?, dueDay, repeatType, startDate, endDate?, reminderEnabled, reminderDaysBefore, autoCreateExpense, note?, isActive, createdAt, updatedAt`

### RecurringPaymentOccurrence (`recurring_payment_occurrences`) — *estado por mês*
`id, recurringPaymentId, month, year, dueDate, expectedAmount, paidAmount, status, paidAt?, note?, createdExpenseId?, createdAt, updatedAt`
**Índice único** `(recurringPaymentId, year, month)` → garante um estado independente por mês.

### MonthlySummary (`monthly_summaries`)
`id, month, year, totalExpenses, totalByCategory (JSON), totalSmallExpenses, totalRecurringPaid, totalRecurringPending, averageDailyExpense, biggestExpense, createdAt, updatedAt, closedAt?`
Índice único `(year, month)`.

### UserSettings (`user_settings`) — singleton (`id = 1`)
`currency, dailyReminderEnabled, dailyReminderTime, monthlyBudget?, smallExpenseLimit, backupEnabled, lastBackupAt?, theme`

## Relações

- `Expense.categoryId → Category.id`
- `Expense.recurringPaymentOccurrenceId → RecurringPaymentOccurrence.id` (quando o gasto veio de uma conta recorrente)
- `RecurringPaymentOccurrence.recurringPaymentId → RecurringPayment.id`
- `RecurringPaymentOccurrence.createdExpenseId → Expense.id`

## Datas

Datas guardadas como **texto ISO `yyyy-MM-dd`** (ordenável, sem ambiguidade de fuso). Hora como `HH:mm`. Isto garante gravação correta por dia e por mês.

## Migrations

- `version = 1` inicial.
- A cada mudança de schema: **incrementar a versão e escrever `Migration` explícita** (nunca `fallbackToDestructiveMigration` em produção).
- `exportSchema = true` — os schemas JSON devem ser versionados em `app/schemas/` para diffs e testes de migração.

## Regras de integridade

1. Marcar uma ocorrência recorrente como paga **não** cria/afeta ocorrências de outros meses.
2. Ao lançar um recorrente como gasto, gravar o vínculo (`createdExpenseId` ↔ `recurringPaymentOccurrenceId`) para evitar duplicação.
3. `remainingAmount = totalAmount - paidAmount` deve ser mantido consistente no repositório.

## Testes de persistência

Testes instrumentados (`androidTest`) devem cobrir: inserir/ler cada entidade, unicidade da ocorrência mensal e sobrevivência a reabertura da base.
