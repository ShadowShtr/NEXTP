# 18 — Amazon Wishlist (dentro de Guardados)

TASK 6 do masterplan (`docs/19`).

## Objetivo

A aba **Guardados** passa a ter duas áreas (tabs internas):

1. **Comprados** — o que já existia (bens/compras já feitas, com garantia, opção de contar como gasto do mês).
2. **Quero comprar** — nova wishlist de produtos desejados, com link para a Amazon (ou outra loja), preço alvo/previsto, prioridade, e um botão para **converter em "Comprado"** quando a compra acontecer de verdade.

## Comprados (existente)

Mostra: total guardado, itens já comprados, garantia, loja, valor pago, se contou como gasto do mês, link da compra (novo campo `purchase_url`).

## Quero comprar (nova)

Mostra: total previsto da wishlist, produtos desejados (cards), prioridade, preço previsto, preço alvo, link Amazon, botão "Abrir Amazon", botão "Marcar como comprado".

## Regras Amazon — Fase 1 (sem scraping)

- **Não** fazer scraping do produto.
- **Não** buscar preço automaticamente.
- **Não** buscar imagem automaticamente.
- O utilizador **cola o link manualmente** e preenche nome/preço à mão.
- O botão "Abrir Amazon" só abre o link numa nova aba (`target="_blank" rel="noopener noreferrer"`) — nunca faz `fetch` do link (ver `docs/15-security.md`).

## Campos do formulário "Novo produto desejado"

- Nome (obrigatório)
- Valor previsto
- Preço alvo (quanto quer pagar no máximo)
- Preço atual (o que viu na loja)
- Link Amazon
- Link externo (alternativa a Amazon)
- Categoria
- Prioridade (Baixa / Média / Alta / Urgente)
- Estado (Desejado / Comprado — controlado pelo fluxo, não editável à mão)
- Data desejada
- Observação

## Fluxo de conversão (Desejado → Comprado)

Ao tocar em "Marcar como comprado":
1. Abre bottom sheet.
2. Pede **valor final** (pré-preenchido com preço alvo ou previsto).
3. Pede **data da compra** (pré-preenchida com hoje).
4. Pergunta **"Contar como gasto do mês?"** (Sim/Não).
5. Cria um `SavedItem` (aba Comprados) com esses dados + `wishlist_item_id` apontando para o item original.
6. Atualiza o `WishlistItem` para `status = 'PURCHASED'` e grava `converted_saved_item_id`.
7. Se "Sim" no passo 4, cria também um `Expense` vinculado (mesma regra de "Guardados" existente — nunca duplica).
8. Mostra animação de sucesso; o item some da lista "Quero comprar" e passa a aparecer em "Comprados".

**Proteção contra duplicidade:** o botão de conversão só existe enquanto `status != 'PURCHASED'`. Depois de convertido, o item mostra-se só em "Comprados", nunca mais aparece em "Quero comprar" nem pode ser reconvertido.

## Modelo de dados

Ver detalhe em `docs/04-banco-de-dados.md` (entidade `WishlistItem`) e `docs/02-requisitos.md`. Resumo dos campos: `id, name, expected_amount, target_amount, current_amount, amazon_url, external_url, image_path, category_id, priority, status, desired_date, note, converted_saved_item_id, created_at, updated_at`.

`SavedItem` ganha os campos: `purchase_url`, `source` (`MANUAL` | `WISHLIST`), `wishlist_item_id`.
