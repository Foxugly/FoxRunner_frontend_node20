# BACKLOG layout — FoxRunner_frontend_node20 (miroir A19)

> Réf : `foxugly-ops/STANDARD-frontend-layout.md` (**VALIDÉ 2026-07-11**). Implémentation de
> référence complète = **`FoxRunner_frontend`** (A21, branche `feat/scss-tokens`). Ce repo est le
> **miroir Angular 19 / node 20** et doit atteindre la **parité fonctionnelle** avec lui.
>
> ⚠️ **Travailler sur branche `feat/scss-standard` — JAMAIS `main`** (auto-deploy prod sur push main).

## Fait (branche `feat/scss-standard`, 2026-07-11)
- ✅ Fondation copiée de FoxRunner : `src/styles/_tokens.scss`, `_breakpoints.scss`, `_shell.scss`,
  `_forms-meta.scss`, `public/i18n/{fr,nl,en,it,es}.json` (mêmes clés), `public/foxugly-logo.svg`.
- ✅ `styles.scss` : import des tokens + shell (additif). `--fox-primary` gardé en **alias legacy**.

## À faire — porter l'overhaul de FoxRunner_frontend (adapté A19 / PrimeNG 19)

1. **i18n Transloco** : `npm i @jsverse/transloco@^8` ; copier `src/app/transloco-loader.ts`,
   `src/app/core/i18n/**` (available-languages, language.service, language-switcher) ; `provideTransloco`
   dans `app.config.ts`. Les JSON sont déjà là. (Transloco 8 compatible A19.)
2. **Retrait PrimeFlex** : classes utilitaires → SCSS/BEM scopé, puis retirer `@use 'primeflex...'` +
   la dép. Gate : **0 classe utilitaire résiduelle** avant de retirer l'import.
3. **Chrome componentisé** : porter `core/layout/{topmenu,user-menu,main-layout,public-layout,footer}`
   et `shared/components/{page-header,auth-card,empty-state,...}`. Topmenu : `[mode]`, actions
   thème→langue→user (borderless icône+tooltip ; langue = **code 2 lettres**), **CTA Soutenir**
   (rectangle arrondi emerald plein), drawer < 1024. `authGuard` invité → `/home`.
4. **Pages publiques** : `features`, `about`, `home`, `soutenir`, `privacy`, `register`
   (+ `*.text.ts` 5 langues, copiables). Routes sous `public-layout` (login/forgot/reset/magic aussi ;
   attention à l'ordre des deux `path:''` — authGuard AVANT public).
5. **Composants métier** : i18n + SCSS/BEM (0 style inline) + **severities** boutons
   (création=`success`, suppression=`danger`, édition=`info`), grilles collections en
   `repeat(auto-fit, minmax(16rem,1fr))`, page-header actions droite = icône+outlined+tooltip.

### Gotchas A19 / PrimeNG 19 (≠ A21 / PrimeNG 21)
- Vérifier les props PrimeNG modifiées v19→v21 (`p-button`, `p-tabs`/`p-tab`, `p-menu`, `p-password`,
  `p-checkbox`, `p-select`, `p-toggleswitch`) et adapter au build.
- `inlineStyleLanguage: scss` + `schematics.style: scss` dans `angular.json` (comme FoxRunner).
- `@if/@for/@switch`, `input()`/signals : OK en A19.

## Vérif
`npm run lint` + `npm run build` verts à chaque étape ; smoke Playwright si présent. **Pas de merge
sur `main` sans revue** (auto-deploy).
