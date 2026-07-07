# 02 — Requisitos

## Requisitos funcionais

### Registos (aba principal)
- Registar gasto: valor, descrição, categoria, data, hora, forma de pagamento, carteira (opcional), observação.
- Categorias rápidas, sugestões de descrições recentes.
- Lista dos gastos do dia; totais do dia e do mês.
- Filtrar por data e categoria; editar, apagar, duplicar; marcar recorrente.
- Microanimação e feedback de sucesso ao salvar.
- **Quanto dá para gastar por dia** (FINANCE-14): aviso com o valor diário disponível até ao fim do mês, calculado pelo motor financeiro central.
- Botão **+** central abre um menu rápido (despesa, receita, conta fixa, item guardado, quero comprar, dívida) em vez de ir sempre direto para "novo gasto" (UX-03).
- **Gastos rápidos favoritos** (UX-04): atalhos configuráveis (nome, valor, categoria) — um toque lança o gasto de hoje na hora; ordenados pelos mais usados.

### Guardados
- Registar bens/compras importantes: nome, valor, data, loja, categoria, garantia, foto da fatura, observação.
- Perguntar "contar como gasto do mês?" (Sim/Não).
- Lista, filtro por categoria, valor total, alerta de fim de garantia.

### Guardados — Wishlist Amazon ("Quero comprar")
- Tabs internas em Guardados: **Comprados** (existente) e **Quero comprar** (nova).
- Utilizador cola link (Amazon ou externo) e preenche nome/preço manualmente — **sem scraping, sem busca automática de preço/imagem** (ver `18-amazon-wishlist.md`).
- Botão abre o link numa nova aba; botão "Marcar como comprado" converte o item desejado num `SavedItem` (pergunta valor final, data e se conta como gasto do mês) — conversão nunca duplica.

### Planeamento
- Tipos: conta futura, dívida, compra desejada, parcela, objetivo, pagamento recorrente.
- Campos: nome, tipo, valor total/pago/restante, vencimento, prioridade, estado, repetição.
- Estados: pendente, pago, parcialmente pago, cancelado, vencido.
- Prioridades: baixa, média, alta, urgente.
- Barras de progresso e totais futuros.

### Pagamentos recorrentes
- Checklist com bolinhas por mês (ver `11-pagamentos-recorrentes.md`).
- **Cada mês tem estado e histórico independentes.**
- Marcar pago/parcial/pendente; guardar data de pagamento; opção de lançar como gasto.

### Resumo
- Estatísticas diárias, semanais e mensais; comparação com mês anterior.
- Gráficos por dia, categoria, evolução mensal, forma de pagamento, recorrentes pagos x pendentes.
- Gastos Invisíveis, com limite **configurável** (Configurações → limite de gasto pequeno).
- **Receitas e Saldo** (INCOME-01): total de receitas do mês e saldo (receitas − gastos), com atalho para lançar nova receita.
- **Limites por categoria** (BUDGET-02): barra de progresso por categoria com limite definido, aviso aos 80% e alerta ao ultrapassar.
- **Histórico** (HISTORY-01): ecrã dedicado com filtro por mês, gastos agrupados por dia (subtotal diário), expandir dia para ver/editar cada gasto.
- **Motor financeiro central** (FINANCE-13/16): Saldo atual, Saldo previsto (descontando contas pendentes), Dinheiro livre (após reserva) e previsão de como o mês vai terminar ao ritmo atual — contas fixas pagas contam sempre como gasto, mesmo sem lançamento ligado, para não deixar dinheiro "invisível".
- **Fechamento mensal** (FINANCE-15): "Fechar mês" guarda uma fotografia dos valores (receitas, gastos, saldo, categoria com maior gasto); histórico de meses fechados, opção de "Reabrir mês", e aviso ao editar um gasto/receita de um mês já fechado.
- **Relatório mensal** (REPORT-01): exportar o mês como HTML imprimível (Imprimir → Guardar como PDF) ou JSON, com receitas, gastos, saldo, categorias, maior gasto, Gastos Invisíveis, recorrentes e previsão.

### Carteiras (FINANCE-12)
- Ecrã em Configurações → Carteiras: Dinheiro, Banco, Cartão, Poupança, MB Way, Outro, cada uma com saldo inicial e uma marcada como padrão.
- Gastos e receitas podem ficar ligados a uma carteira (opcional); o saldo de cada carteira é sempre recalculado (saldo inicial + receitas − gastos ligados), nunca guardado numa coluna que possa dessincronizar.
- **Cartão de crédito** (CREDIT-01): carteiras do tipo Cartão podem guardar dia de fecho, dia de vencimento e limite de crédito (informativo — gastos no cartão continuam a contar já no mês; fatura mensal e compras parceladas ligadas ao cartão ficam para trabalho futuro).

### Guardados/Wishlist — foto do produto
- Colar link de uma imagem **ou** anexar/tirar foto (upload para Supabase Storage, bucket privado por utilizador) — mostrada no card em vez do ícone genérico.

### Central de Alertas
- Painel (ícone de sino no cabeçalho, com indicador quando há alertas) com: conta recorrente/planeamento vencida ou a vencer hoje, garantia a expirar, categoria perto/acima do limite, Gastos Invisíveis altos, backup desatualizado, saldo previsto negativo, sem receita lançada a meio do mês (ALERTS-01).

### Autenticação
- Entrar / Criar conta / Esqueci a password como fluxos separados e explícitos (nunca criar conta silenciosamente após um erro de login).
- Botão "Entrar com Google" preparado (ativação do provider no Supabase é trabalho futuro).

### Transversais
- Central de Alertas dentro da app (ver acima) — notificações push automáticas continuam como trabalho futuro (ver `docs/07-notificacoes.md`).
- Backup/restauro manual em JSON, preservando relações entre tabelas (BACKUP-02).
- Tema claro/escuro; configuração de moeda, limites e categorias.
- **Idempotência** (SAFETY-01): gasto manual, receita, conta recorrente lançada como gasto e item guardado lançado como gasto nunca duplicam num duplo-toque ou reenvio de rede.
- **Lixeira** (SAFETY-03): apagar gasto, receita, item guardado, produto da wishlist ou conta/dívida nunca é definitivo — fica em Configurações → Lixeira até ser restaurado.
- **Histórico de alterações** (SAFETY-02): Configurações → Histórico de alterações regista as ações financeiras relevantes (criar/editar/apagar/restaurar, marcar pago, converter, fechar mês, backup).

## Requisitos não funcionais

- **Persistência garantida** (Room/SQLite); sem uso de cache como armazenamento principal.
- **Offline-first**; sobrevive a fecho do app, reinício do telemóvel e limpeza de cache.
- Código limpo, camadas separadas (UI / lógica / dados), migrations preparadas.
- Validações de formulário e tratamento de erros.
- Acessibilidade mínima (contraste, tamanhos de toque ≥ 48dp).
