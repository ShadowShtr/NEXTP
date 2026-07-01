# 07 — Notificações

Notificações úteis e **configuráveis**, agendadas com **WorkManager** (sobrevivem a reinício). Canal Android dedicado. Permissão `POST_NOTIFICATIONS` (Android 13+).

## Tipos

1. Lembrete diário para registar gastos.
2. Resumo noturno do dia.
3. Aviso de conta a vencer (recorrente/planeamento).
4. Aviso de dívida futura.
5. Aviso de limite de categoria atingido.
6. Aviso de fecho mensal.
7. Fim de garantia de item guardado.
8. Lembrete de compra planeada.
9. Alerta de pequenos gastos altos.
10. Pagamento recorrente pendente.
11. Conta vencida.
12. Resumo semanal de contas pagas/pendentes.

## Exemplos

- "Já registaste os gastos de hoje?"
- "Hoje gastaste 18,70 €. A maior categoria foi Comida."
- "A conta Internet vence amanhã."
- "Já gastaste 80% do limite da categoria Besteira."
- "Este mês já foram 86,40 € em pequenos gastos."
- "A garantia do telemóvel termina em 30 dias."
- "Ainda tens 3 contas pendentes este mês."

## Implementação (Fase 8)

- `Worker`s periódicos (lembrete diário, resumo noturno, resumo semanal).
- `Worker`s agendados por data (vencimentos, garantias) recalculados quando os dados mudam.
- Configuração por tipo em Definições; horários guardados em `UserSettings`/DataStore.
- Cada notificação abre o ecrã relevante (deep link para a aba).
