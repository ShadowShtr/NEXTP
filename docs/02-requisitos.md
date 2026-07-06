# 02 — Requisitos

## Requisitos funcionais

### Registos (aba principal)
- Registar gasto: valor, descrição, categoria, data, hora, forma de pagamento, observação.
- Categorias rápidas, sugestões de descrições recentes.
- Lista dos gastos do dia; totais do dia e do mês.
- Filtrar por data e categoria; editar, apagar, duplicar; marcar recorrente.
- Microanimação e feedback de sucesso ao salvar.

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

### Guardados/Wishlist — foto do produto
- Colar link de uma imagem **ou** anexar/tirar foto (upload para Supabase Storage, bucket privado por utilizador) — mostrada no card em vez do ícone genérico.

### Central de Alertas
- Painel (ícone de sino no cabeçalho, com indicador quando há alertas) com: conta recorrente/planeamento vencida ou a vencer hoje, garantia a expirar, categoria perto/acima do limite, Gastos Invisíveis altos, backup desatualizado.

### Autenticação
- Entrar / Criar conta / Esqueci a password como fluxos separados e explícitos (nunca criar conta silenciosamente após um erro de login).
- Botão "Entrar com Google" preparado (ativação do provider no Supabase é trabalho futuro).

### Transversais
- Central de Alertas dentro da app (ver acima) — notificações push automáticas continuam como trabalho futuro (ver `docs/07-notificacoes.md`).
- Backup/restauro manual em JSON, preservando relações entre tabelas (BACKUP-02).
- Tema claro/escuro; configuração de moeda, limites e categorias.

## Requisitos não funcionais

- **Persistência garantida** (Room/SQLite); sem uso de cache como armazenamento principal.
- **Offline-first**; sobrevive a fecho do app, reinício do telemóvel e limpeza de cache.
- Código limpo, camadas separadas (UI / lógica / dados), migrations preparadas.
- Validações de formulário e tratamento de erros.
- Acessibilidade mínima (contraste, tamanhos de toque ≥ 48dp).
