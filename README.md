<div align="center">

# NextP

**O teu ajudador financeiro pessoal — simples, rápido, bonito e divertido.**

Regista os pequenos gastos do dia em segundos e percebe exatamente para onde foi o teu dinheiro.

</div>

---

## 🎯 Objetivo

O NextP é feito para quem faz **muitos pequenos gastos ao longo do dia** — café, comida, transportes, mercado, besteiras, contas fixas — e quer registar tudo rapidamente e depois entender para onde o dinheiro foi. O destaque é a estatística **Gastos Invisíveis**: mostra como pequenas compras diárias viram um valor grande no fim do mês.

## ✨ Funcionalidades principais

- 🧾 **Registos** — lançamento rápido de gastos diários com categorias, totais do dia e do mês.
- 📦 **Guardados** — bens e compras importantes (eletrodomésticos, ferramentas, eletrónicos) com garantia e opção de contar ou não como gasto do mês.
- 📅 **Planeamento** — contas futuras, dívidas, parcelas, objetivos e compras desejadas com barras de progresso.
- ✅ **Pagamentos recorrentes** — checklist com bolinhas para marcar o que já foi pago, **com histórico independente por mês**.
- 📊 **Resumo** — gráficos e estatísticas diárias/mensais, comparação com o mês anterior e Gastos Invisíveis.
- 🔔 **Notificações** — lembretes de registo, contas a vencer, limites de categoria e garantias.
- 💾 **Armazenamento local seguro** (Room/SQLite) — funciona offline, nada se perde.
- ☁️ **Backup Google** (opcional) — login e backup/restauro via Google.

## 🛠️ Tecnologias

Kotlin · Jetpack Compose · Material 3 · Room/SQLite · DataStore · WorkManager · Google Sign-In (Credential Manager) · Navigation Compose.

## 🚀 Como rodar

Requisitos: **Android Studio (Ladybug ou superior)** e **JDK 17+**.

```bash
git clone <URL_DO_REPOSITORIO>
cd nextp
# Abrir no Android Studio e correr no emulador/dispositivo, ou:
./gradlew assembleDebug
```

> O ambiente atual tem JDK 8; para compilar o APK é preciso JDK 17+. Ver `docs/03-arquitetura.md`.

## 📁 Estrutura de pastas

```
nextp/
  app/            Código Android (Kotlin + Compose)
  docs/           Documentação completa do projeto
  assets/         Referências visuais, ilustrações e ícones
  tests/          Notas e planos de teste
```

Detalhe da arquitetura de código em [`docs/03-arquitetura.md`](docs/03-arquitetura.md).

## 📌 Estado atual

**Fase 1–2 concluídas** — estrutura, design system, ícone e camada de dados (entidades/DAOs/Room). Ver [`docs/09-roadmap.md`](docs/09-roadmap.md) e [`CHANGELOG.md`](CHANGELOG.md).

## 🗺️ Roadmap resumido

1. Base do projeto ✅
2. Design system + ícone ✅
3. Registos
4. Guardados
5. Planeamento
6. Pagamentos recorrentes
7. Resumo e gráficos
8. Notificações
9. Google + backup
10. Refinamento e release

## 💾 Armazenamento local

Todos os dados financeiros são gravados de forma **persistente em disco** com Room/SQLite. **Nunca** se usa cache como armazenamento principal. Os dados sobrevivem a fechar o app, reiniciar o telemóvel e limpeza de cache. Detalhe em [`docs/04-banco-de-dados.md`](docs/04-banco-de-dados.md).

## ☁️ Backup Google

Opcional e nunca obrigatório — o app funciona 100% offline. Serve para login, backup e restauro ao trocar de telemóvel. Ver [`docs/08-backup-google.md`](docs/08-backup-google.md).

## 🎨 Estilo visual

**NextP Clay System** — claymorphism azul e branco: macio, 3D, arredondado, tátil e divertido, mas profissional. Ver [`docs/05-design-system.md`](docs/05-design-system.md).

## ✅ Pagamentos recorrentes

Checklist de bolinhas por mês. **Regra de ouro:** marcar uma conta como paga num mês **não** marca os meses seguintes. Cada mês tem o seu próprio estado e histórico. Ver [`docs/11-pagamentos-recorrentes.md`](docs/11-pagamentos-recorrentes.md).

## 🖼️ Ícone/logo

Quadrado azul arredondado com **N** branco e seta de crescimento, em claymorphism 3D. Ver [`docs/12-logo-e-icone.md`](docs/12-logo-e-icone.md).

## 🤝 Como continuar o projeto

Segue o roadmap fase a fase, mantém commits organizados (ver padrão em [`docs/10-decisoes-tecnicas.md`](docs/10-decisoes-tecnicas.md)) e atualiza os docs e o CHANGELOG a cada fase.

---

*NextP — porque os pequenos gastos também contam.*
