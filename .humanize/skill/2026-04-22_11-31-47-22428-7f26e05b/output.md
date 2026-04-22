**CORE_RISKS**
- Runtime regressions from lost static checks (null/undefined, prop shapes).
- Enum semantics change (numeric/bi‑directional) when replaced with objects.
- Type‑only imports accidentally left as runtime imports, bloating bundles or breaking builds.
- Tooling breakage (Jest, Vite/Webpack, ESLint) still referencing TS loaders/plugins.
- Path alias resolution drifting after removing `tsconfig.json` `paths`.
- Subtle TS‑only patterns (discriminated unions, exhaustive switches) losing safety and behavior.
- Mixed module formats (ESM/CJS) and extension changes causing import resolution errors.

**MISSING_REQUIREMENTS**
- Target toolchain details: bundler (`vite.config.ts`/webpack), test runner (Jest + ts‑jest?), linter/prettier configs.
- Build/dev scripts that must change in `package.json` and CI steps that run `tsc`.
- Path alias equivalents (how to mirror `compilerOptions.paths` in bundler/jest).
- Decision on runtime type safety (PropTypes, JSDoc + `checkJs`, or none).
- Handling of TS‑specific files: `vite.config.ts`, `jest.config.ts`, `eslint` TS parser/plugins.
- Strategy for assets/typed modules (`.svg`, `.css` modules) previously relying on `.d.ts`.

**TECHNICAL_GAPS**
- Unknown project layout beyond `src/App.tsx`; entry files likely `src/main.tsx` or `index.tsx`.
- Presence of Storybook, E2E tests, or scripts relying on `ts-node`.
- Whether enums, namespaces, or advanced TS features (generics-heavy utils) are used.
- Use of `import type`/`export type` and how widespread it is.
- Any TS transformers/presets (Babel `@babel/preset-typescript` vs SWC) currently in use.
- CI/CD constraints (Node version, build container) impacting JS toolchain choice.

**ALTERNATIVE_DIRECTIONS**
- Partial migration: enable `allowJs` + JSDoc types, convert incrementally, keep TS compiler for JS type‑checking.
- Keep TS codebase but add runtime PropTypes for critical boundaries to increase safety without rewrite.
- Use automated de‑typing tools (ts-migrate, codemods) to strip types and rename files faster, then hand‑fix.
- Hybrid: convert app code to JS, keep config files in TS temporarily with `ts-node/register` to de‑risk.

**QUESTIONS_FOR_USER**
- Which bundler/test stack is in use (Vite vs Webpack, Jest config), and should we keep it?
- Do you want runtime type safety (PropTypes) or lightweight JSDoc `checkJs`, or no checks?
- How should TS path aliases be replicated (preferred alias map for bundler and Jest)?
- Acceptable migration style: big‑bang all at once or staged PRs per folder?
- Are there CI steps running `tsc --noEmit` or `ts-jest` that must be removed/rewritten?
- Any non‑standard TS features we must watch for (enums, namespaces, decorators)?

**CANDIDATE_CRITERIA**
- All `.ts/.tsx` converted to `.js/.jsx`; no TS syntax remains (no interfaces/types/enums, no `import type`).
- TS toolchain removed: delete `tsconfig.json`; remove `typescript` and `@types/*`; configs updated (Jest/bundler/ESLint).
- Enums replaced with `Object.freeze` constants; union types mapped to constant lists as needed.
- App builds and dev server runs with unchanged UI/behavior; AntD and Recharts render correctly.
- Tests run green with JS setup (e.g., `babel-jest`/`@swc/jest`), and entry files boot the app in JS.
- Path aliases work equivalently in bundler and tests; no broken imports or extension issues.
- No type‑only imports left; tree‑shaking and bundle size comparable; no dead TS artifacts or `.d.ts` dependencies.
