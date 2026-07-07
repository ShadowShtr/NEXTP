# 17 — Plano de testes

TASK 5 do masterplan (`docs/19`). Testes manuais (não há suite automatizada ainda) a correr antes de cada deploy de produção que toque nestes fluxos.

## Registos / Expenses

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Inserir gasto (valor, descrição, categoria, forma, data) | Aparece na lista do dia; total do dia e do mês atualizam |
| 2 | Editar gasto (tocar na lista) | Alterações refletidas na lista e nos totais |
| 3 | Apagar gasto | Some da lista; totais recalculados |
| 4 | Total diário | Soma exata dos gastos com `date = hoje` |
| 5 | Total mensal | Soma exata dos gastos do mês corrente |
| 6 | Gasto invisível | Gastos `< limite` (padrão 5€) somados corretamente em Resumo |
| 7 | Valor inválido (0, negativo, vazio) | Bloqueado com mensagem, não grava |

## Guardados / Saved Items

| # | Teste | Resultado esperado |
|---|---|---|
| 8 | Criar item guardado | Aparece na lista "Comprados"; total guardado atualiza |
| 9 | Item guardado com "contar como gasto do mês" = Sim | Cria também um `Expense` vinculado; total mensal de Registos aumenta |
| 10 | Item guardado com "contar como gasto do mês" = Não | NÃO cria `Expense`; total mensal de Registos inalterado |
| 11 | Garantia expirando (<30 dias) / expirada | Selo visual correto (a expirar / expirada) |

## Wishlist / Amazon (quando implementado — TASK 6-13)

| # | Teste | Resultado esperado |
|---|---|---|
| 12 | Criar item na wishlist | Aparece em "Quero comprar"; total previsto atualiza |
| 13 | Abrir link Amazon | Abre em nova aba, app não perde estado |
| 14 | Converter wishlist em comprado | Cria `SavedItem`, marca wishlist como `PURCHASED`, some de "Quero comprar" |
| 15 | Evitar conversão duplicada | Item já `PURCHASED` não pode converter de novo (botão desabilitado/oculto) |
| 16 | Validação de URL | URL sem `http(s)://` é rejeitada ou corrigida; nunca trava o formulário |

## Planeamento / Pagamentos recorrentes

| # | Teste | Resultado esperado |
|---|---|---|
| 17 | Criar pagamento recorrente | Aparece na checklist do mês atual com bolinha pendente |
| 18 | Gerar ocorrência mensal | Trocar de mês gera ocorrência automaticamente (idempotente, sem duplicar) |
| 19 | Marcar recorrente como pago | Bolinha muda para azul/paga; `paid_at` gravado; totais do mês atualizam |
| 20 | Mês pago não marca mês seguinte | Marcar Maio como pago, Junho continua pendente (índice único `year+month` garante) |
| 21 | Pagamento parcial | Estado "parcial", valor parcial gravado, bolinha amarela |
| 22 | Conta vencida | Data de vencimento no passado sem pagamento → bolinha vermelha/vencida |

## Resumo / Gráficos

| # | Teste | Resultado esperado |
|---|---|---|
| 23 | Gráfico por categoria | Fatias somam o total do mês |
| 24 | Gráfico por dia (7 dias) | Barras correspondem aos totais diários reais |
| 25 | Moeda em euro | Todos os valores formatados como `Intl.NumberFormat("pt-PT", {currency:"EUR"})` |

## Segurança / RLS

| # | Teste | Resultado esperado |
|---|---|---|
| 26 | Duas contas diferentes | Utilizador A nunca vê dados do utilizador B (testar com 2 logins) |
| 27 | Sessão expirada | App pede novo login sem apagar dados |

## Testes automatizados (QA-01)

`npm run test` (Vitest) cobre funções puras em `tests/`:
- `format.test.ts` — `eur`, `monthBounds` (incluindo ano bissexto), `prettyDate`, `todayISO`.
- `wishlist.test.ts` — `isValidUrl`, `isAmazonUrl` (aceita http(s), rejeita `javascript:`/lixo, nunca lança exceção).
- `recurring.test.ts` — `installmentLabel` (parcela X/Y, limites do intervalo, plano de parcela única).
- `finance.test.ts` — `computeMonthlyFinance` (motor financeiro central): receitas/gastos diretos, conta recorrente paga com e sem gasto ligado (nunca conta a dobrar), contas pendentes só afetam o saldo previsto, pagamento parcial, dinheiro livre com reserva, gasto disponível por dia, previsão de fim de mês.

`npm run typecheck` corre `tsc --noEmit`. O GitHub Actions (`.github/workflows/ci.yml`) executa `typecheck` → `test` → `build` em cada push/PR para `main`.

O que ainda falta (backup, cálculos de UI, fluxos completos) continua coberto apenas pelos testes manuais abaixo — expandir os automatizados é trabalho futuro incremental, não um requisito bloqueante.

## Como testar

Os testes manuais acima correm no ambiente de produção (`https://nextp-rouge.vercel.app`) ou local (`npm run dev` + `.env.local`).
