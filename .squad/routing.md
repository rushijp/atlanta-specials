# Routing

## Domain Routing

| Signal / File Pattern | Route To | Notes |
|---|---|---|
| `*.jsx`, `*.tsx`, `*.css`, `src/components/**`, `src/pages/**` | **Curry** | All React UI work |
| `src/firebase.js`, `functions/**`, Firestore rules, auth flows | **Jokic** | Backend + data layer |
| `*.test.*`, `*.spec.*`, test utilities | **Kawhi** | All test files |
| Architecture decisions, feature decomposition, multi-concern | **LeBron** | Planning + cross-cutting |
| "Team" requests, broad features | **LeBron** (decompose) → fan-out | LeBron plans, others execute |

## Multi-Agent Patterns

| Pattern | Agents | When |
|---|---|---|
| New feature (full-stack) | LeBron (plan) → Curry + Jokic (parallel) → Kawhi (test) | Any new page/feature |
| UI-only change | Curry | Styling, layout, components |
| Data model change | Jokic → Curry (if UI affected) | Firestore schema, API changes |
| Bug fix | Route by file pattern above | Single-agent unless cross-cutting |
