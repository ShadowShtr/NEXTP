# 12 — Logo e Ícone

## Conceito

Ícone oficial do NextP: **quadrado azul arredondado** com a letra **N branca** e uma **seta de crescimento** integrada, em **claymorphism 3D** — macio, com sombras suaves e volume. Fundo azul (`#2E86FF`), elemento principal branco. Visual premium, limpo e reconhecível.

## Estado no projeto

- **Master oficial (3D):** `assets/icons/nextp-icon-1024.png` — *colocar aqui o PNG 1024×1024 enviado.*
- **Ícone adaptativo (já funcional no APK):** recriação vetorial do N + seta.
  - Fundo: `app/src/main/res/values/ic_launcher_background.xml` (`#2E86FF`).
  - Foreground: `app/src/main/res/drawable/ic_launcher_foreground.xml` (vetor).
  - Adaptativo: `app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` e `ic_launcher_round.xml` (+ `monochrome` para temas).

> O vetor é uma aproximação para funcionar já em Android 8+. Para fidelidade pixel-perfect e densidades legadas, gerar os PNGs a partir do master (ver abaixo).

## Como gerar os assets a partir do master

**Opção A — Android Studio (recomendado):**
`File > New > Image Asset > Launcher Icons (Adaptive and Legacy)` → escolher o master como foreground, fundo `#2E86FF`. Gera automaticamente `mipmap-mdpi…xxxhdpi`, `ic_launcher`, `ic_launcher_round` e Play Store icon.

**Opção B — manual/ferramenta:** gerar os tamanhos e colocar em:
```
res/mipmap-mdpi/ic_launcher.png       (48×48)
res/mipmap-hdpi/ic_launcher.png       (72×72)
res/mipmap-xhdpi/ic_launcher.png      (96×96)
res/mipmap-xxhdpi/ic_launcher.png     (144×144)
res/mipmap-xxxhdpi/ic_launcher.png    (192×192)
```
(e os `ic_launcher_round.png` equivalentes).

## Assets sugeridos (`assets/icons/`)
```
nextp-icon-1024.png  nextp-icon-512.png  nextp-icon-192.png
nextp-icon-144.png   nextp-icon-96.png   nextp-icon-72.png  nextp-icon-48.png
```
E `assets/references/nextp-icon-reference.png` + `nextp-visual-reference.png` para as imagens de referência.

## Uso no APK
`AndroidManifest.xml` já aponta para `@mipmap/ic_launcher` e `@mipmap/ic_launcher_round`. Ao gerar os PNGs/adaptativos, o launcher e a Play Store usam-nos automaticamente.

## Play Store (futuro)
Ícone 512×512 PNG (sem transparência) — usar `nextp-icon-512.png`.
