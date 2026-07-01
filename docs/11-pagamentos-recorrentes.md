# 11 — Pagamentos Recorrentes

Sistema visual e prático para controlar contas recorrentes, como uma **checklist de bolinhas** (estilo Notes, com identidade NextP).

## Modelo de dados

Dois níveis (ver `04-banco-de-dados.md`):

- **`RecurringPayment`** — o *template* da conta (nome, valor, dia de vencimento, categoria, repetição, lembrete, `autoCreateExpense`, ativo).
- **`RecurringPaymentOccurrence`** — o *estado de um mês concreto* (mês, ano, valor esperado, valor pago, estado, data de pagamento, nota).

> **Regra de ouro:** cada `(recurringPaymentId, year, month)` é único e independente.
> Internet de **Julho paga** NÃO marca **Agosto** como paga. Cada mês tem o seu estado e histórico.

## Estados por mês

| Estado | Bolinha |
|---|---|
| Pendente | vazia |
| Pago | azul com ✓ |
| Parcialmente pago | amarela |
| Vencido | vermelha |
| Ignorado/cancelado no mês | cinza |

## Geração das ocorrências

- Ao abrir um mês, o app garante que existe uma ocorrência para cada `RecurringPayment` ativo cujo `startDate ≤ fim do mês` e (`endDate` nulo ou `≥ início do mês`).
- Criação **idempotente** (o índice único evita duplicados; `INSERT OR IGNORE`).
- `dueDate` do mês = ano/mês atual + `dueDay` (ajustado se o mês tiver menos dias).

## Fluxo de marcar como pago

1. Tocar na bolinha vazia.
2. Marcar como pago → gravar `paidAmount = expectedAmount`, `status = PAID`, `paidAt = hoje`.
3. Atualizar totais do mês e o resumo/gráficos.
4. Animação leve de sucesso.

Também permite: desmarcar, alterar valor pago, pagamento parcial (`status = PARTIAL`), nota e (futuro) comprovativo.

## Lançar como gasto (evitar duplicação)

Ao marcar como pago, conforme `RecurringPayment.autoCreateExpense`:
- **ASK** — perguntar "Deseja lançar este pagamento como gasto no mês?" (Sim / Não / Sempre para esta conta).
- **ALWAYS** — cria `Expense` automaticamente.
- **NEVER** — não cria.

Quando cria, guarda o vínculo `Expense.recurringPaymentOccurrenceId` ↔ `RecurringPaymentOccurrence.createdExpenseId`. Desmarcar o pagamento remove/estorna o gasto associado — **sem duplicar dados**.

## Totais do mês (exemplo)

```
Pagamentos de Julho
○ Internet — 35 € — vence 10/07
✓ Luz — 120 € — pago em 08/07
✓ Aluguel — 900 € — pago em 05/07
○ Água — 60 € — vence 15/07
○ Cartão — 350 € — vence 20/07

Total do mês: 1.465 €   Já pago: 1.020 €   Pendente: 445 €
```

Queries de total em `RecurringDao` (`totalPaid`, `totalPending`).

## Componente visual
`PaymentDot` em `ui/components/ClayComponents.kt`.
