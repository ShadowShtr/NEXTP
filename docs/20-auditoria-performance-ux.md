# 20 — Auditoria de performance, travamentos e UX

Este documento acompanha o script `scripts/nextp-audit.mjs`.

## Como correr

```bash
node scripts/nextp-audit.mjs
```

Para também tentar build/lint:

```bash
node scripts/nextp-audit.mjs --run-build
```

O script gera:

```bash
audit-report.md
```

## O que esta auditoria procura

1. Contas recorrentes pagas que não entram em `expenses`.
2. Receita sem tabela/fluxo real.
3. Falta de `monthlyFinance.ts` como motor central.
4. `prompt()` bloqueante.
5. Tabs desmontadas por `key`, causando recarregamento.
6. Queries Supabase espalhadas.
7. `select("*")` em telas.
8. Bottom nav com `fixed bottom-0` sem shell `100dvh`.
9. Imagens PNG grandes.
10. Falta de índices Supabase.
11. Falta de idempotência contra duplicados.
12. Falta de testes automatizados.

## Regra

Corrigir primeiro os P0, depois P1. Não continuar a criar novas telas antes de estabilizar carregamento, motor financeiro, bottom nav e refresh global.
