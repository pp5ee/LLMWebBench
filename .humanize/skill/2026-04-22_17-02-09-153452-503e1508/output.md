**Core Risks**
- Loss of type-safety increases runtime bugs and regressions.
- JSX-in-.js may violate current ESLint rules and break CI.
- Jest/CRA configs may implicitly rely on TS presence or file globs.
- Type-only modules (e.g., `src/types/index.ts:1`) require a JSDoc strategy; losing typedefs degrades DX.
- Import paths or aliases may rely on `tsconfig.json` paths; resolution breaks without a `jsconfig.json`.
- Type-only imports/exports and generics can leave dead code or subtle logic changes if not carefully removed.

**Missing Requirements**
- Exact `react-scripts`/CRA and Node versions to target for JS build.
- Linting/formatting expectations (ESLint, Prettier) and whether to permit JSX in `.js`.
- JSDoc policy: enable `checkJs`, where to keep shared `@typedef`s, and desired coverage level.
- Handling of `src/types/index.ts:1` (convert to `types.js` with JSDoc or drop and inline?).
- Package cleanup scope: remove `typescript`, `@types/*`, `ts-jest` (if present), and adjust `package.json` scripts.
- Path alias strategy: add `jsconfig.json` (paths/baseUrl) vs. convert to relative imports.
- CI changes: any TS-specific steps, type checks, or lint rules to remove/update.

**Technical Gaps**
- No concrete, file-by-file conversion plan (e.g., `src/App.tsx:1` → `src/App.js:1`, generics removal, `React.FC` → functions with JSDoc).
- No explicit `package.json` edits (deps/devDeps removal, script updates), or ESLint rule updates for `.js` JSX.
- No guidance for Jest test file renames (`src/App.test.tsx:1` → `src/App.test.js:1`) and potential snapshot impacts.
- No plan for shared type reuse in JS (central `types.js` with `@typedef` vs inline comments).
- No verification steps (build, test matrix, lint checks) or rollback plan.
- No treatment for TS-only constructs (enums, namespaces, type-only imports) or dead-code pruning.
- No decision on `jsconfig.json` for editor/auto-imports and module resolution.

**Alternative Directions**
- Hybrid: keep `.d.ts` files for editor types and ship JS code; minimal code change but preserves DX.
- Babel/TS-strip only: use `@babel/preset-typescript` to compile TS → JS without type checking, then incrementally refactor to JS.
- Keep TS and reduce strictness (lower friction, preserve type safety) while addressing the pain points that motivated migration.
- Use `.jsx` for JSX files to align with common tooling defaults and avoid ESLint/IDE friction.
- Migrate to Vite (JS template) during conversion for faster build/dev if touching toolchain anyway.

**Questions For User**
- ESLint/Prettier: should we permit JSX in `.js` and update `react/jsx-filename-extension` accordingly?
- JSDoc level: enable `checkJs` in `jsconfig.json`, or keep comments for hints only?
- Shared types: keep a `src/types/types.js:1` with `@typedef` and importable docs, or inline JSDoc per file?
- Paths: do you use TS path aliases today? If yes, should we mirror them in `jsconfig.json` or convert to relative imports?
- CI: any TS-specific steps to remove (type checks, ts-jest, lint rules)?
- Do you want PropTypes added for runtime prop validation, or rely solely on tests/JSDoc?

**Candidate Criteria**
- All TS/TSX files migrated to JS with identical behavior; JSX remains intact in `.js`.
- Builds and runs with CRA; `npm start` and `npm test` pass without TypeScript in deps.
- TS toolchain fully removed (no `tsconfig.json`, `react-app-env.d.ts:1`, `typescript`, `@types/*`, `ts-jest`).
- Tests green after renames; any snapshots unchanged or deliberately updated with rationale.
- ESLint and editor happy: JSX allowed in `.js`; no unresolved imports from removed TS configs.
- JSDoc present per agreed policy; shared typedefs accessible (if chosen).
- `README.md` updated with new project structure, scripts, and migration notes.
- Commit history clear and scoped; each change logically grouped (using your preferred conventional commit style).
