# FoxRunner Frontend — variante Node 20

> **Ce dépôt est une variante volontaire, pas une copie oubliée.**
>
> Il existe deux frontends FoxRunner :
>
> | Dépôt | Node | Angular | Usage |
> |---|:--:|:--:|---|
> | [`FoxRunner_frontend`](https://github.com/Foxugly/FoxRunner_frontend) | 22 | 21 | ligne principale |
> | **`FoxRunner_frontend_node20`** (ici) | **20** | **19** | variante conservée pour les environnements restés en Node 20 |
>
> **Ne pas « aligner » ce dépôt sur la ligne principale.** Node 20 et Angular 19 sont
> la raison d'être de cette variante. Les montées de version doivent rester dans ces
> bornes ; c'est ce que verrouille la règle `ignore` des majeures dans
> `.github/dependabot.yml`.
>
> **Conséquence assumée sur la sécurité.** Angular n'a pas rétro-porté en 19.x les
> correctifs de CVE-2026-54266 / 54267 / 54268 (patchés en 20.3.25, 21.2.17 et 22.0.1
> seulement). Les quatre alertes Dependabot correspondantes sont **rejetées avec motif**
> (`tolerable_risk`), pas ignorées en silence — dépôt non déployé, usage de référence.
> À rouvrir si la variante est retirée ou si Angular rétro-porte un correctif.
>
> Toutes les autres alertes de ce dépôt ont un correctif atteignable **dans** Angular 19
> et doivent être traitées normalement. Le 2026-07-30, un simple `npm audit fix` +
> `npm update` en a résolu 14 sur 29 sans toucher à Angular.

Client Angular 19 + PrimeNG du [backend FoxRunner](https://github.com/Foxugly/FoxRunner_server).

## Prerequisites

- Node.js 20 (pas 22 — voir l'encadré ci-dessus)
- npm 10+
- A running FoxRunner backend on `http://127.0.0.1:8000`

## Setup

```bash
npm install
npm run gen:api       # requires backend to be up; writes src/app/core/api/schema.ts
npm start             # http://localhost:4200
```

## Scripts

- `npm start` — dev server on :4200.
- `npm run build` — production build to `dist/fox-runner`.
- `npm run lint` — Angular ESLint + Prettier compatibility.
- `npm run format` — Prettier write on `src/`.
- `npm run gen:api` — regenerate OpenAPI types from the live backend.
- `npm run gen:api:file` — regenerate from `./openapi.local.json` (offline fallback).
- `ng test --watch=false` — run unit tests (vitest + jsdom).

## Docs

- Architecture & conventions: [CLAUDE.md](./CLAUDE.md).
- Implementation plan: [docs/superpowers/plans/2026-04-22-foxrunner-frontend-phase-1-2.md](./docs/superpowers/plans/2026-04-22-foxrunner-frontend-phase-1-2.md).
- Backend API reference: see the `docs/` folder of the [FoxRunner_server](https://github.com/Foxugly/FoxRunner_server) repo (notably `API.md`, `FRONTEND.md`, `ADR_TIMEZONES.md`, `SECURITY.md`, `SCHEMA.md`).
