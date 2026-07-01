# 05 — Design System · NextP Clay System

Sistema visual do NextP: **claymorphism** azul e branco — macio, 3D, arredondado, tátil, divertido, mas profissional. Nada de aparência bancária fria; nada de cripto/NFT.

## 1. Paleta de cores

| Token | Hex | Uso |
|---|---|---|
| Primary Blue | `#006DFF` | botões, seleção, marca |
| Light Blue | `#72D7FF` | acentos, secundário |
| Background | `#F7FBFF` | fundo geral |
| White | `#FFFFFF` | cards |
| Text Dark | `#101828` | texto principal |
| Text Muted | `#667085` | texto secundário |
| Success | `#12B76A` | valores positivos, pago |
| Warning | `#F79009` | alertas leves, parcial |
| Danger | `#F04438` | vencido, apagar |
| Soft Purple | `#9B7EDE` | categoria secundária |
| Soft Pink | `#FF7A9A` | categoria secundária |
| Coin Yellow | `#FDB022` | moedas, parcialmente pago |
| Icon Blue | `#2E86FF` | fundo do ícone do app |

Implementado em `ui/theme/Color.kt`.

## 2. Tipografia

Fonte arredondada e amigável (sugestão: **Nunito** ou **Baloo 2**). Enquanto não se adiciona a fonte, usa-se a do sistema com pesos fortes. Escala em `ui/theme/Type.kt`:
- Display 32 / Headline 24 / Title 20-16 / Body 16-14 / Label 14-12.
- Pesos: ExtraBold/Bold para títulos e valores; Normal para corpo.

## 3. Espaçamentos

Grelha base **4dp**. Padding de cards 16-20dp; espaçamento entre cards 12-16dp; margens de ecrã 20dp.

## 4. Bordas (cantos)

Cantos generosos (assinatura clay), em `ui/theme/Shape.kt`:
`xs 12 · sm 16 · md 22 · lg 28 · xl 36 dp`.

## 5. Sombras

Sombra suave azulada (`ShadowBlue #33006DFF`), elevação 8-12dp para cards, 4dp para bolinhas. Sensação de objeto macio elevado.

## 6. Cards

Fundo branco ou azul muito claro (`#EEF6FF`), cantos grandes, sombra suave, padding generoso. Componente: `ClayCard`.

## 7. Botões

Grandes, azul forte, muito arredondados, sombra azul suave, microanimação ao tocar. Ícone circular interno quando útil. FAB grande para "novo gasto".

## 8. Ícones

Claymorphism, 3D, arredondados, expressivos, sem ar corporativo. Categorias usam `Icons.Rounded` do Material como base até haver set 3D próprio.

## 9. Ilustrações 3D

Personagem simpático com telemóvel, cofrinho, carteira, moedas, cartão, gráficos, sacos de compras, cofre. Guardar em `assets/illustrations/`. Usar com equilíbrio — divertido, não poluído.

## 10. Componentes

`ClayCard`, `PaymentDot` (bolinha de checklist), botões clay, cards de estatística, barras de progresso, chips de categoria. Em `ui/components/`.

## 11. Animações

Microinterações em botões (escala ao toque), animação leve de sucesso ao salvar gasto, transição suave ao marcar bolinha.

## 12. Bolinhas / Checklist

| Estado | Visual |
|---|---|
| Pendente | bolinha vazia (branca com borda) |
| Pago | bolinha azul com check branco |
| Parcialmente pago | bolinha amarela/laranja |
| Vencido | bolinha vermelha suave |
| Ignorado/cancelado | bolinha cinza |

Componente: `PaymentDot` (`ui/components/ClayComponents.kt`). Estilo simples tipo checklist do Notes, com a identidade NextP.

## 13. Acessibilidade

Contraste mínimo AA para texto; alvos de toque ≥ 48dp; `contentDescription` em ícones; não depender só da cor (bolinhas têm forma/ícone além da cor).

## 14. Ícone oficial do app

Quadrado azul arredondado + **N** branco com seta de crescimento, claymorphism 3D. Ver `12-logo-e-icone.md`.

## 15. Exemplos de uso

```kotlin
ClayCard { Text("Total de hoje: 18,70 €") }

PaymentDot(state = PaymentDotState.PAID)   // conta paga
PaymentDot(state = PaymentDotState.PENDING) // conta pendente
```
