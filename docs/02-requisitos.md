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
- Gastos Invisíveis.

### Transversais
- Notificações configuráveis.
- Backup/restauro Google (opcional).
- Tema claro/escuro; configuração de moeda, limites e categorias.

## Requisitos não funcionais

- **Persistência garantida** (Room/SQLite); sem uso de cache como armazenamento principal.
- **Offline-first**; sobrevive a fecho do app, reinício do telemóvel e limpeza de cache.
- Código limpo, camadas separadas (UI / lógica / dados), migrations preparadas.
- Validações de formulário e tratamento de erros.
- Acessibilidade mínima (contraste, tamanhos de toque ≥ 48dp).
