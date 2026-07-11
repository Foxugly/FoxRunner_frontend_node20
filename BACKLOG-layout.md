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

## ✅ PORT COMPLET FAIT (PR #20, branche `feat/scss-standard`, 2026-07-11 — CI verte, 59/59 vitest)

Réalisé par **copie de `src/app` de FoxRunner_frontend** puis adaptation A19. Les 5 items ci-dessous
sont **tous couverts** :

1. [x] **i18n Transloco** — `core/i18n/**`, `transloco-loader.ts`, `provideTransloco`, JSON 5 langues.
2. [x] **Retrait PrimeFlex** — import + dépendance retirés, 0 classe utilitaire résiduelle.
3. [x] **Chrome componentisé** — `core/layout/{topmenu,user-menu,main-layout,public-layout,footer}` +
   `shared/components/{page-header,auth-card,empty-state,…}`, topmenu `[mode]`, CTA Soutenir, drawer <1024.
4. [x] **Pages publiques** — features/about/home/soutenir/privacy/register (+ `*.text.ts`), routes sous
   `public-layout`, ordre des deux `path:''` respecté (authGuard avant public).
5. [x] **Composants métier** — i18n + SCSS/BEM, severities boutons, grilles auto-fit, page-header actions.

**Adaptations A19 appliquées** : drop `provideBrowserGlobalErrorListeners` (API A21 only) ; setup Transloco
dans `src/test-setup.ts` (analog-vitest) **exclu de tsconfig.app** (sinon TS2304 `beforeEach` au build prod).

### Gotchas A19 / PrimeNG 19 (≠ A21 / PrimeNG 21) — pour référence
- Vérifier les props PrimeNG modifiées v19→v21 (`p-button`, `p-tabs`/`p-tab`, `p-menu`, `p-password`,
  `p-checkbox`, `p-select`, `p-toggleswitch`) et adapter au build.
- `inlineStyleLanguage: scss` + `schematics.style: scss` dans `angular.json` (comme FoxRunner).
- `@if/@for/@switch`, `input()`/signals : OK en A19.

## Vérif
`npm run lint` + `npm run build` verts à chaque étape ; smoke Playwright si présent. **Pas de merge
sur `main` sans revue** (auto-deploy).
