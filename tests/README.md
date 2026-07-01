# tests

Planos e notas de teste do NextP. Testes de código vivem em `app/src/test` (unitários) e `app/src/androidTest` (instrumentados/Room).

## Prioridades de teste
1. **Persistência** — inserir/ler cada entidade; sobreviver a reabertura da base.
2. **Ocorrências recorrentes** — unicidade `(recurringPaymentId, year, month)`; marcar um mês não afeta outro.
3. **Sem duplicação** — lançar recorrente como gasto cria vínculo; desmarcar estorna.
4. **Totais** — dia/mês, pagos x pendentes, Gastos Invisíveis.
