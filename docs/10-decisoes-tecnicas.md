# 10 — Decisões Técnicas

## Stack
- **Kotlin + Jetpack Compose + Material 3** — Android nativo, moderno, produtivo.
- **Room/SQLite** para dados; **DataStore** para preferências simples.
- **WorkManager** para notificações e backup agendados.
- **Credential Manager + Google Drive** para login/backup.
- **Navigation Compose** para as 4 abas.

## Decisões
1. **Single-module (`:app`)** — simplicidade para projeto pessoal; modularizar só se crescer.
2. **Datas como texto ISO `yyyy-MM-dd`** — ordenável e sem ambiguidade; facilita agrupamento por dia/mês.
3. **Ocorrências mensais materializadas** para recorrentes (tabela própria) em vez de calcular on-the-fly — garante histórico independente e simples por mês.
4. **Enums guardados como String** via `Converters` — estável para backup/restauro.
5. **Migrations explícitas** sempre; nada de destructive migration em produção; `exportSchema = true`.
6. **Offline-first**; Google nunca obrigatório.
7. **Version catalog** (`libs.versions.toml`) para gerir dependências.

## Padrão de commits
`chore` · `docs` · `feat` · `fix` · `style` · `refactor` · `test` · `build`.
Exemplos: `feat: add expense registration screen`, `feat: add recurring payments checklist`, `style: apply NextP claymorphism visual system`.
Commits pequenos e por fase — nunca um commit gigante.

## Como publicar no GitHub
Ver secção no README e comandos em `docs/00`/CHANGELOG. Resumo:
```bash
git init && git add . && git commit -m "chore: initial NextP project structure"
gh repo create nextp --private --source=. --remote=origin --push
# ou manual:
git branch -M main
git remote add origin <URL>
git push -u origin main
```

## Pendências / riscos
- Compilar exige **JDK 17+** (ambiente de criação tinha JDK 8).
- Gerar PNGs do ícone para densidades legadas (< API 26) e Play Store — ver `12-logo-e-icone.md`.
- `gradle-wrapper.jar` não versionado aqui; gerar com `gradle wrapper` ou Android Studio.
