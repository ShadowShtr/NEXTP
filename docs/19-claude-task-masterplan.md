# NextP — Plano minucioso de construção por tasks para Claude

Repositório alvo: `ShadowShtr/NEXTP`

Este documento deve ser copiado para `docs/19-claude-task-masterplan.md`.

## Regra central

O NextP deve seguir exatamente a direção visual das imagens de referência anexadas: claymorphism azul e branco, cards arredondados, botões grandes, ícones 3D/clay, bolinhas de checklist, mascote e sensação premium/divertida.

O visual não é acabamento. O visual é requisito funcional do produto.

O app é financeiro, então segurança, persistência, testes, organização e métricas são obrigatórios.

## Estado atual identificado no repositório

O README já define o NextP como ajudador financeiro pessoal, com Registos, Guardados, Planeamento, Pagamentos Recorrentes, Resumo, Notificações, Room/SQLite e Backup Google.

O roadmap indica Fase 1 e Fase 2 como concluídas:
- base do projeto;
- design system;
- ícone;
- camada de dados;
- navegação principal.

As próximas fases precisam ser executadas com mais detalhe e com controlo de qualidade:
- Fase 3 Registos;
- Fase 4 Guardados;
- Fase 5 Planeamento;
- Fase 6 Pagamentos Recorrentes;
- Fase 7 Resumo e Gráficos;
- Fase 8 Notificações;
- Fase 9 Google/Backup;
- Fase 10 Refinamento.

## Assets fornecidos neste pacote

Copiar a pasta `assets/` deste pacote para a raiz do repositório, preservando a estrutura.

Inclui:
- ícone principal SVG;
- ícones de categorias;
- ícones de funcionalidades;
- ícones de estados de pagamento;
- ícones de Guardados/Wishlist/Amazon;
- backgrounds SVG para telas e mockups;
- referências visuais, quando disponíveis.

Caminhos principais:
- `assets/icons/svg/app/nextp-app-icon.svg`
- `assets/icons/svg/categories/`
- `assets/icons/svg/features/`
- `assets/icons/svg/payments/`
- `assets/icons/svg/saved/`
- `assets/backgrounds/svg/`
- `assets/references/`

## Como usar os SVGs no Android

### Melhor caminho

1. Guardar todos os SVGs em `assets/icons/svg/` como master visual.
2. Converter apenas os ícones usados na UI Compose para VectorDrawable XML em `app/src/main/res/drawable/`.
3. Manter os SVGs como fonte original para design/documentação.
4. Para o launcher, usar `nextp-app-icon.svg` como base e gerar adaptive icon:
   - background azul `#2E86FF`;
   - foreground com N branca e seta;
   - gerar `ic_launcher.xml` e `ic_launcher_round.xml`.

### O que não fazer

- Não usar PNG solto sem documentar origem.
- Não usar ícones genéricos Material quando existir SVG NextP correspondente.
- Não alterar a paleta para tons escuros/corporativos.
- Não descaracterizar o claymorphism.

## TASK 0 — Auditoria real do repositório

### Objetivo
Confirmar exatamente o que existe no repo antes de alterar.

### Como fazer
1. Abrir `README.md`.
2. Abrir todos os documentos `docs/*.md`.
3. Verificar se `app/` existe localmente.
4. Listar pacotes existentes em `app/src/main/java/com/nextp/app`.
5. Verificar entidades Room.
6. Verificar DAOs.
7. Verificar componentes UI.
8. Verificar ícone atual.
9. Verificar testes.
10. Verificar Gradle/JDK.

### Entregável
Responder com:
- o que já existe;
- o que falta;
- riscos;
- próxima task.

### Critério de aceite
Nenhum código alterado nesta task, salvo se apenas criar anotação local solicitada.

---

## TASK 1 — Copiar assets visuais e backgrounds

### Objetivo
Adicionar ao repo todos os assets visuais base do NextP.

### Como fazer
1. Copiar `assets/icons/svg/` deste pacote para `assets/icons/svg/` no repo.
2. Copiar `assets/backgrounds/svg/` para `assets/backgrounds/svg/`.
3. Copiar `assets/references/` para `assets/references/`.
4. Criar/atualizar `assets/README.md`.
5. Atualizar `docs/05-design-system.md` com o mapa dos assets.
6. Atualizar `docs/12-logo-e-icone.md` com o caminho do SVG principal.
7. Atualizar `CHANGELOG.md`.

### Arquivos esperados
- `assets/icons/svg/app/nextp-app-icon.svg`
- `assets/icons/svg/categories/category-food.svg`
- `assets/icons/svg/categories/category-transport.svg`
- `assets/icons/svg/categories/category-home.svg`
- `assets/icons/svg/categories/category-fun.svg`
- `assets/icons/svg/categories/category-fixed-bill.svg`
- `assets/icons/svg/categories/category-market.svg`
- `assets/icons/svg/categories/category-health.svg`
- `assets/icons/svg/categories/category-documents.svg`
- `assets/icons/svg/categories/category-work.svg`
- `assets/icons/svg/categories/category-family.svg`
- `assets/icons/svg/categories/category-other.svg`
- `assets/icons/svg/features/*.svg`
- `assets/icons/svg/payments/*.svg`
- `assets/icons/svg/saved/*.svg`
- `assets/backgrounds/svg/*.svg`

### Critérios de aceite
- Assets versionados no repo.
- Documentação aponta para eles.
- Nenhum asset fora da paleta NextP.
- Todos os SVGs têm `title` e `desc`.
- Commit: `style: add NextP SVG icon and background assets`

---

## TASK 2 — Criar NextP Quality System

### Objetivo
Trazer para o NextP a base de organização, processos, segurança, testes e métricas usada na MÓ Limpezas.

### Como fazer
Criar `docs/14-quality-system.md` com:

1. Definition of Done por task.
2. Checklist antes de commit.
3. Checklist antes de PR.
4. Checklist antes de APK.
5. Checklist visual.
6. Checklist de persistência.
7. Checklist de segurança.
8. Checklist de testes.
9. Checklist de métricas.
10. Padrão de changelog.

### Critério de aceite
Uma task só é concluída se:
- compila;
- não quebra dados;
- respeita o visual;
- atualiza docs;
- atualiza changelog;
- tem critério de teste.

### Commit
`docs: add NextP quality system`

---

## TASK 3 — Segurança financeira

### Objetivo
Criar regras rígidas para proteger dados financeiros.

### Como fazer
Criar `docs/15-security.md` com:
- sem cache para dados financeiros;
- sem logs sensíveis em produção;
- sem chaves no git;
- sem fallback destrutivo no Room;
- backup opcional;
- app offline-first;
- validação de formulários;
- tratamento de erros de banco;
- tratamento de erro de backup;
- proteção contra duplicidade de recorrentes;
- proteção contra duplicidade de wishlist convertida.

### No código
Criar depois constantes/helpers:
- `util/SafeLog.kt`
- `util/Validation.kt`

### Commit
`docs: add financial security guidelines`

---

## TASK 4 — Métricas locais

### Objetivo
Medir uso do app sem expor dados sensíveis.

### Como fazer
Criar `docs/16-metricas.md`.

Eventos permitidos:
- `EXPENSE_CREATED`
- `EXPENSE_UPDATED`
- `EXPENSE_DELETED`
- `SAVED_ITEM_CREATED`
- `WISHLIST_ITEM_CREATED`
- `WISHLIST_OPEN_AMAZON`
- `WISHLIST_CONVERTED_TO_PURCHASED`
- `RECURRING_PAYMENT_MARKED_PAID`
- `RECURRING_PAYMENT_MARKED_PARTIAL`
- `BACKUP_STARTED`
- `BACKUP_SUCCESS`
- `BACKUP_FAILED`

Não guardar:
- descrição de gasto;
- nome do produto;
- link completo da Amazon;
- dados pessoais.

### Código
Criar:
- `data/metrics/MetricEvent.kt`
- `data/metrics/MetricLogger.kt`
- `data/metrics/LocalMetricRepository.kt`

### Commit
`feat: add local metrics foundation`

---

## TASK 5 — Plano de testes

### Objetivo
Garantir que o app não quebra fluxo financeiro.

### Como fazer
Criar `docs/17-test-plan.md` com testes unitários/instrumentados.

### Testes obrigatórios
- inserir gasto;
- editar gasto;
- apagar gasto;
- total diário;
- total mensal;
- gasto invisível;
- criar item guardado;
- item guardado contando como gasto;
- item guardado sem contar como gasto;
- criar wishlist;
- abrir link Amazon;
- converter wishlist em comprado;
- evitar conversão duplicada;
- criar pagamento recorrente;
- gerar ocorrência mensal;
- marcar recorrente como pago;
- mês pago não marca mês seguinte;
- partial payment;
- vencido;
- validação de URL;
- moeda em euro.

### Commit
`docs: add complete test plan`

---

## TASK 6 — Amazon Wishlist dentro de Guardados

### Objetivo
Transformar a aba Guardados em duas áreas:
- Comprados;
- Quero comprar.

### Como fazer no UX
Tela `Guardados` deve ter tabs internas:
- `Comprados`
- `Quero comprar`

#### Comprados
Mostra:
- total guardado;
- itens já comprados;
- garantia;
- loja;
- valor pago;
- opção se contou no mês;
- link da compra.

#### Quero comprar
Mostra:
- total previsto da wishlist;
- produtos desejados;
- prioridade;
- preço previsto;
- preço alvo;
- link Amazon;
- botão abrir Amazon;
- botão converter em comprado.

### Regras Amazon Fase 1
- Não fazer scraping.
- Não buscar preço automático.
- Não buscar imagem automática.
- Usuário cola link e preenche dados manualmente.
- Botão abre link no navegador/app Amazon.

### Criar doc
`docs/18-amazon-wishlist.md`

### Commit
`docs: add Amazon wishlist specification`

---

## TASK 7 — Atualizar requisitos, fluxos e banco

### Objetivo
Incluir wishlist formalmente nos docs existentes.

### Alterar
- `docs/02-requisitos.md`
- `docs/04-banco-de-dados.md`
- `docs/06-telas-e-fluxos.md`
- `docs/09-roadmap.md`
- `CHANGELOG.md`

### Adicionar entidade
`WishlistItem`

Campos:
- `id`
- `name`
- `expectedAmount`
- `targetAmount`
- `currentAmount`
- `amazonUrl`
- `externalUrl`
- `imagePath`
- `categoryId`
- `priority`
- `status`
- `desiredDate`
- `note`
- `convertedSavedItemId`
- `createdAt`
- `updatedAt`

### Atualizar SavedItem
Adicionar:
- `purchaseUrl`
- `source`
- `wishlistItemId`

### Commit
`docs: update requirements for saved wishlist`

---

## TASK 8 — Implementar banco Wishlist

### Objetivo
Criar persistência real para wishlist.

### Como fazer
1. Criar `WishlistItemEntity.kt`.
2. Criar enums:
   - `WishlistStatus`
   - `WishlistPriority`
3. Atualizar `Converters.kt`.
4. Atualizar `NextPDatabase`.
5. Incrementar versão do banco.
6. Criar migration explícita.
7. Exportar schema.

### Critérios de aceite
- Não usar destructive migration.
- Índices criados:
  - status;
  - priority;
  - categoryId;
  - desiredDate.
- Compila.

### Commit
`feat: add wishlist entity`

---

## TASK 9 — Implementar WishlistDao

### Métodos mínimos
- `observeAll()`
- `observeById(id)`
- `observeByStatus(status)`
- `observeByPriority(priority)`
- `insert(item)`
- `update(item)`
- `delete(item)`
- `markAsPurchased(id, savedItemId, updatedAt)`
- `totalExpected()`
- `totalByStatus(status)`

### Como fazer
Usar `Flow` para listas reativas.
Usar transação no repository para conversão em comprado.

### Commit
`feat: add wishlist dao`

---

## TASK 10 — Repository de Guardados e Wishlist

### Objetivo
Centralizar regras de negócio.

### Criar/alterar
- `data/repository/SavedItemsRepository.kt`
- `data/repository/WishlistRepository.kt`

### Regras
- validar nome obrigatório;
- valores não negativos;
- URL válida;
- Amazon aceita `amazon.` em domínio;
- conversão cria SavedItem;
- conversão altera WishlistItem para `PURCHASED`;
- conversão não duplica SavedItem;
- se contar como gasto, cria Expense vinculado.

### Melhor caminho técnico
Criar uma função transacional:
`convertWishlistToSavedItem(wishlistId, finalAmount, purchaseDate, countAsMonthlyExpense)`

Ela deve:
1. carregar wishlist;
2. verificar se ainda não foi convertida;
3. criar SavedItem;
4. atualizar WishlistItem;
5. opcionalmente criar Expense;
6. devolver resultado.

### Commit
`feat: add saved wishlist repositories`

---

## TASK 11 — UI Guardados com tabs

### Objetivo
Atualizar tela Guardados conforme referência visual.

### Como fazer
Criar layout:
- header azul com total;
- ilustração/carteira SVG;
- tabs internas com pill buttons;
- tab Comprados;
- tab Quero comprar;
- FAB azul.

### Arquivos esperados
- `ui/screens/saved/SavedScreen.kt`
- `ui/screens/saved/PurchasedItemsTab.kt`
- `ui/screens/saved/WishlistTab.kt`
- `ui/screens/saved/SavedViewModel.kt`

### Visual obrigatório
- cards brancos arredondados;
- fundo `#F7FBFF`;
- botão azul `#006DFF`;
- usar SVGs de `assets/icons/svg/saved/`;
- não usar tela genérica de lista seca.

### Commit
`feat: add saved screen tabs`

---

## TASK 12 — Formulário Novo Produto Desejado

### Campos
- nome;
- valor previsto;
- preço alvo;
- preço atual;
- link Amazon;
- link externo;
- categoria;
- prioridade;
- estado;
- data desejada;
- observação.

### Como fazer
- Usar card clay para cada campo.
- Colocar valor em destaque.
- Botão principal azul: `Guardar produto`.
- Botão secundário: `Abrir Amazon`, se URL existir.
- Validação inline.

### Critérios
- nome obrigatório;
- valores >= 0;
- URL válida;
- salvar em Room;
- voltar para lista atualizada.

### Commit
`feat: add wishlist item form`

---

## TASK 13 — Detalhe Produto Desejado + Converter

### Tela detalhe
Mostrar:
- nome;
- preço atual;
- preço alvo;
- preço previsto;
- Amazon URL;
- prioridade;
- estado;
- categoria;
- observação.

### Ações
- abrir Amazon;
- editar;
- apagar;
- marcar como comprado.

### Fluxo converter em comprado
Ao tocar:
1. abrir bottom sheet;
2. pedir valor final;
3. pedir data da compra;
4. perguntar `contar como gasto do mês?`;
5. criar SavedItem;
6. atualizar WishlistItem;
7. opcionalmente criar Expense;
8. mostrar sucesso.

### Commit
`feat: add wishlist conversion flow`

---

## TASK 14 — Registos

### Objetivo
Implementar lançamento rápido de gasto.

### Tela Registos
Conforme imagem:
- card azul Hoje;
- card mês com barra de progresso;
- personagem/ícone;
- categorias rápidas;
- últimos gastos;
- bottom navigation;
- botão `+`.

### Novo Gasto
Campos:
- valor em card azul;
- descrição;
- categoria;
- pagamento;
- data;
- hora;
- observação;
- salvar.

### Melhor caminho
1. Criar `ExpenseRepository`.
2. Criar `ExpenseViewModel`.
3. Criar `ExpenseFormState`.
4. Usar Flow dos DAOs.
5. Calcular totais no repository ou use cases.
6. Atualizar UI reativa.

### Commit
`feat: add expense registration flow`

---

## TASK 15 — Planeamento

### Objetivo
Implementar contas futuras, dívidas, compras e objetivos.

### Tela
Conforme referência:
- tabs internas: Contas, Dívidas, Compras, Objetivos;
- cards de próximos vencimentos;
- barras de progresso;
- botão `Nova conta ou dívida`.

### Melhor caminho
Usar `PlanningItemEntity` já definida.
Criar:
- `PlanningRepository`
- `PlanningViewModel`
- `PlanningScreen`
- `PlanningFormScreen`

### Commit
`feat: add planning module`

---

## TASK 16 — Pagamentos Recorrentes

### Objetivo
Implementar checklist de bolinhas.

### Como fazer
Usar:
- `RecurringPayment` como template;
- `RecurringPaymentOccurrence` como estado mensal.

### Fluxo mensal
Ao abrir Maio/2025:
1. buscar templates ativos;
2. gerar ocorrências faltantes com insert ignore;
3. listar ocorrências daquele mês;
4. mostrar bolinhas;
5. permitir marcação.

### Bolinhas
Usar SVGs:
- `payment-dot-pending.svg`
- `payment-dot-paid.svg`
- `payment-dot-partial.svg`
- `payment-dot-overdue.svg`
- `payment-dot-ignored.svg`

### Critérios
- estado independente por mês;
- pago em maio não paga junho;
- partial guarda valor;
- pago pode criar Expense;
- não duplicar Expense.

### Commit
`feat: add recurring payments checklist`

---

## TASK 17 — Resumo e gráficos

### Objetivo
Criar análise financeira.

### Cards
- gasto hoje;
- gasto mês;
- média diária;
- maior gasto;
- pequenos gastos;
- recorrentes pagos;
- recorrentes pendentes.

### Gráficos
- por categoria;
- por dia;
- evolução;
- recorrentes pagos x pendentes;
- gastos invisíveis.

### Melhor caminho
Criar:
- `SummaryRepository`
- `SummaryViewModel`
- data classes de UI:
  - `DailyExpensePoint`
  - `CategoryExpenseSlice`
  - `MonthlySummaryUi`
  - `InvisibleExpensesUi`

### Commit
`feat: add summary charts and invisible expenses`

---

## TASK 18 — Notificações

### Objetivo
Criar lembretes úteis.

### Usar
- WorkManager;
- Notification channels;
- permissões Android 13+.

### Notificações
- lembrete diário;
- resumo noturno;
- conta vence amanhã;
- conta vencida;
- garantia expira;
- pequenos gastos altos.

### Commit
`feat: add notifications foundation`

---

## TASK 19 — Backup Google

### Objetivo
Backup opcional.

### Regras
- app funciona sem login;
- login só para backup;
- exportar JSON;
- restaurar JSON;
- mostrar último backup;
- nunca guardar segredo no git.

### Commit
`feat: add Google backup foundation`

---

## TASK 20 — Revisão visual e release

### Objetivo
Garantir que tudo está coerente.

### Checklist
- segue imagens;
- usa azul/branco;
- usa clay cards;
- usa SVGs;
- sem UI genérica;
- sem erros visuais;
- sem dados em cache;
- docs atualizados;
- testes executados;
- changelog atualizado.

### Commit
`style: polish NextP visual system`

## Ordem obrigatória

Executar Task 0 até Task 20, sem pular.
Cada task termina com:
- resumo;
- arquivos criados;
- arquivos alterados;
- como testar;
- riscos;
- commit.
