# 03 — Arquitetura

## Visão

Arquitetura em camadas simples, inspirada em MVVM + Repository, otimizada para um app single-module fácil de continuar.

```
UI (Compose)  ──>  ViewModel  ──>  Repository  ──>  Room DAO  ──>  SQLite
   (screens)        (estado)       (regras)        (dados)       (disco)
        ▲                                              │
        └──────────── Flow<> (reativo) ───────────────┘
```

## Camadas

- **UI** (`ui/`): telas Compose, componentes do design system (`ui/components`), tema (`ui/theme`), navegação (`ui/NextPNav.kt`).
- **ViewModel** (`ui/screens/*ViewModel`): mantém estado, expõe `StateFlow`, chama o repositório. *(a partir da Fase 3)*
- **Repository** (`data/repository`): regras de negócio, orquestra DAOs. *(a partir da Fase 3)*
- **Data local** (`data/local`): entidades, DAOs, `NextPDatabase`, `Converters`.
- **Util** (`util`): helpers de data, formatação de moeda, ícones de categoria.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| UI | Jetpack Compose + Material 3 |
| Navegação | Navigation Compose |
| Estado | ViewModel + StateFlow |
| Dados | Room / SQLite |
| Preferências | DataStore |
| Tarefas agendadas | WorkManager (notificações/backup) |
| Login/Backup | Credential Manager (Google) + Google Drive |

## Estrutura de pacotes (`com.nextp.app`)

```
data/
  local/
    entity/      # Entidades Room
    dao/         # DAOs
    Converters.kt
    NextPDatabase.kt
  repository/    # Repositórios (Fase 3+)
  DefaultCategories.kt
ui/
  theme/         # Color, Type, Shape, Theme
  components/    # ClayCard, PaymentDot, ...
  screens/       # Uma pasta/arquivo por ecrã
  NextPNav.kt
util/
NextPApplication.kt
MainActivity.kt
```

## Requisitos de build

- **JDK 17+** e Android Studio Ladybug+.
- AGP 8.7, Kotlin 2.0, `compileSdk 35`, `minSdk 24`, `targetSdk 35`.
- Dependências geridas por version catalog (`gradle/libs.versions.toml`).

> Nota: o ambiente onde o projeto foi criado tinha JDK 8 — insuficiente para compilar. Instalar JDK 17+ antes de `./gradlew assembleDebug`.

## Decisão: single-module

Para um projeto pessoal, um único módulo `:app` é mais simples de continuar. Modularização pode ser feita mais tarde se necessário (ver `10-decisoes-tecnicas.md`).
