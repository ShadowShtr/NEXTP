# 06 — Telas e Fluxos

## Navegação

4 abas principais (bottom navigation): **Registos · Guardados · Planeamento · Resumo**.
Áreas extra: Configurações, Backup, Categorias, Pagamentos recorrentes (dentro de Planeamento, com destaque).

## Registos (inicial)
- Total de hoje e do mês (cards clay).
- FAB grande "novo gasto"; botões rápidos de categoria.
- Lista dos gastos do dia; acesso a filtros.
- Ilustração 3D divertida.

**Novo gasto:** valor · descrição · categoria · forma de pagamento · data · hora · observação · guardar (com animação de sucesso).

## Guardados
Tabs internas: **Comprados** · **Quero comprar** (ver `18-amazon-wishlist.md`).

### Comprados
- Lista de bens; botão adicionar; filtros; total guardado; ilustração de carteira (`feature-wallet.svg`).

**Novo item guardado:** nome · valor · data · loja · categoria · garantia · foto da fatura · link da compra · **contar como gasto do mês? (Sim/Não)** · observação.

### Quero comprar
- Lista de produtos desejados; total previsto; botão adicionar.

**Novo produto desejado:** nome · valor previsto · preço alvo · preço atual · link Amazon · link externo · categoria · prioridade · data desejada · observação. Botões: **Abrir Amazon** (nova aba) e **Marcar como comprado** (converte em item de Comprados, pedindo valor final, data e se conta como gasto do mês).

## Planeamento
- Lista de contas/dívidas/compras futuras separadas por estado.
- Filtros por vencimento e prioridade; barras de progresso; botão novo planeamento.
- Acesso destacado aos **Pagamentos recorrentes**.

## Pagamentos recorrentes
- Seletor de mês; lista com **bolinhas**; totais (mês, pago, pendente, vencido).
- Tocar na bolinha → marcar pago (guarda data) / parcial / desmarcar.
- Histórico por mês. Ver `11-pagamentos-recorrentes.md`.

## Resumo
- Cards de estatísticas + gráficos; filtro por mês; comparação com mês anterior.
- **Gastos Invisíveis**; recorrentes pagos x pendentes; ilustração 3D.

## Configurações
- Moeda · categorias · limite mensal · limite de gastos invisíveis · notificações · backup · login Google · tema claro/escuro · exportação de dados · contas recorrentes.

## Fluxo rápido (meta de UX)
Abrir → registar gasto → marcar conta paga → ver resumo → fechar. Tudo em segundos.
