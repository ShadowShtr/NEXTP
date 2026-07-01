# 08 — Backup Google

Integração **opcional** — o app funciona 100% offline. Google serve para **login, backup e restauro** (ex.: trocar de telemóvel).

## Login

- **Credential Manager** + Google ID token (biblioteca `googleid`).
- Login não é obrigatório para usar o app.

## Backup

- Preferencialmente **Google Drive App Data Folder** (`appDataFolder`), privado ao app.
- Formato: **JSON** com todas as entidades (gastos, categorias, guardados, planeamentos, recorrentes, ocorrências mensais, resumos, definições).
- Manual e automático (WorkManager, ex. diário quando há Wi-Fi).
- Mostrar **data do último backup**; avisar se há muitos dias sem backup.

## Restauro

- Descarregar o JSON e reescrever a base local numa transação.
- Estratégia de merge/replace documentada no repositório de backup (Fase 9).

## Exportação

- **JSON** já na Fase 9.
- CSV/Excel no futuro.

## Estrutura do JSON (esboço)

```json
{
  "version": 1,
  "exportedAt": "2026-07-01T21:00:00Z",
  "categories": [],
  "expenses": [],
  "savedItems": [],
  "planningItems": [],
  "recurringPayments": [],
  "recurringOccurrences": [],
  "monthlySummaries": [],
  "settings": {}
}
```

## Segurança

- Dados no App Data Folder do próprio utilizador (não públicos).
- Nunca versionar `google-services.json` nem chaves (ver `.gitignore`).
