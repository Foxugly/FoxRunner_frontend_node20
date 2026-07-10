# Backlog — harmonisation layout · FoxRunner_frontend_node20 (A19)

> **Cible :** `STANDARD-frontend-layout.md` (repo `foxugly-ops`).
> **Ce repo est le miroir de `FoxRunner_frontend` (A21)** — appliquer **exactement les
> mêmes changements** (les 2 fronts restent identiques). Voir le backlog de A21 ; ce
> fichier n'existe que pour ne pas oublier de propager.
> **Statut :** à faire (audit 2026-07-10).

## ✅ Déjà conforme
- `app-topmenu` · `core/layout/topmenu/` · BEM `topbar__*` · fichiers séparés.
- Toggle thème + `ThemeService` ; `app-page-header` 3 zones (`detail-header` supprimé) ;
  `app-empty-state` + skeletons.

## Phase 1 — structurel (identique à A21)
- [ ] Thème : `fox-theme` → `theme` ; `.fox-dark` → `.dark-mode` ; **anti-FOUC** inline.
- [ ] Topmenu : drawer 960 → **1024** ; ajouter `[mode]` + bouton « Se connecter » hors-auth.
- [ ] Page-header : `[backLink]` → slot `[slot=left]`.
- [ ] Shell : créer `main-layout` / `public-layout` (skip-link, `main-container`, `p-toast` unique).
- [ ] Grille : `--content-max: 80rem` / `--content-pad: 1.5rem`, fonds pleine largeur.
- [ ] Footer : version runtime + dark `:host-context`.
- [ ] Breakpoints : `sm 640 / md 768 / lg 1024 / xl 1280`.
- [ ] CSS : retirer PrimeFlex au fil des réécritures.

## Phase 2 — i18n (lourd)
- [ ] Transloco + `app-language-switcher` (réf TM) + 5 langues fr/nl/en/it/es ; ordre thème → langue → user.

## Hors périmètre
- Features / About : N/A · Cloches : N/A.
