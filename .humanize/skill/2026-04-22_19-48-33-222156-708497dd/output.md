CORE_RISKS:
- Silent runtime errors after removing type checks, especially in `src/utils/index.ts` and `reportWebVitals.ts` where function contracts relied on TS types.
- Missed type-only imports/exports (`import type`, interfaces) causing dead imports or build failures after rename to `.js`.
- JSX-in-.js syntax not recognized if the toolchain deviates from CRA defaults (e.g., custom Babel/Jest configs expecting `.jsx` or TS).
- Test breakage if `src/setupTests.ts` or `src/App.test.tsx` implicitly relied on `@types/jest` or TS transform (e.g., `ts-jest`) behavior.
- ESLint/Prettier config referencing `@typescript-eslint/*` plugins or TS parser, causing lint failures post-removal.
- Path aliasing or `tsconfig.json` `paths` used anywhere; removal breaks imports at runtime.
- CI/build scripts or IDE tasks hard-coded for TS (type-check step, `tsc --noEmit`) failing post-migration.

MISSING_REQUIREMENTS:
- Exact build stack and versions (CRA/react-scripts vs Vite vs custom Babel/Webpack) to validate JSX-in-.js support.
- Node/package manager versions and whether lockfile updates are in scope.
- Status of ESLint/Prettier configs and whether to refactor them to pure JS rules.
- Presence/use of `tsconfig.json` `paths`/`baseUrl` and any `moduleResolution` customizations.
- Test runner details and whether snapshot regeneration is acceptable after renames.
- CI expectations (commands to run, required checks) and whether to remove type-check steps.
- Decision on handling TS-only artifacts (`src/types/index.ts`): delete vs translate to JSDoc or inline constants.
- Whether to preserve Git history via `git mv` and group changes into multiple `feat:` commits vs a single atomic commit.
- README scope: depth of usage examples and any project-specific configuration to document post-TS removal.

TECHNICAL_GAPS:
- No confirmation that Babel/Jest configurations are already set to transform JSX in `.js` files without `.jsx` extension.
- Unknown reliance on TS enums, generics, or discriminated unions that require runtime guards once types are gone.
- Unclear if `reportWebVitals.ts` expects typed callback signatures; needs safe runtime checks in JS.
- Potential hidden `d.ts` ambient types usage (`react-app-env.d.ts`) whose removal may expose missing polyfills/runtime imports.
- Import extension conventions: existing code may rely on extensionless imports that resolve differently without TS.
- Lack of automated codemod plan to strip types safely and catch edge cases (e.g., `satisfies`, `as const`, assertion functions).

ALTERNATIVE_DIRECTIONS:
- Use a temporary build-based transpile: run `tsc` or Babel with `@babel/plugin-transform-typescript` to emit JS to a temp dir, then adopt emitted JS as the baseline before hand-curating for readability.
- Retain lightweight type hints via JSDoc only in complex utility boundaries (no PropTypes), preserving editor help without a TS toolchain.
- Keep `.jsx` for React-entry files only (`src/index.js`, `src/App.js`) while leaving helpers as `.js` to balance tool compatibility and consistency.
- Stage the migration: convert utils/tests first, validate CI, then convert React entry points; remove TS deps last to keep fallback compilation.
- Add minimal runtime guards where TS previously enforced invariants (argument presence/type checks in exported functions).

QUESTIONS_FOR_USER:
- Confirm build tool: CRA/react-scripts, Vite, or custom Webpack/Babel? Any custom Babel/Jest configs?
- Are there path aliases in `tsconfig.json` that must be replicated (e.g., via Jest `moduleNameMapper` and bundler aliases)?
- Should we split changes into multiple `feat:` commits (rename, code conversion, config removal, README) or one atomic commit?
- Is updating ESLint/Prettier to remove TS-specific plugins and rules in scope?
- Any CI steps that must remain (e.g., lint, test, build) and commands to target?
- OK to delete `src/types/index.ts` and `src/react-app-env.d.ts` if no runtime usage is found?

CANDIDATE_CRITERIA:
- Build and dev server run successfully using `.js` files with JSX syntax (`npm start`/`npm run build` pass).
- Test suite passes after migration (`npm test`), with snapshots updated if necessary; no references to TS transformers remain.
- Repository contains no `.ts`/`.tsx`/`.d.ts` files; `rg -n '\.tsx?$' src` returns empty.
- `tsconfig.json` and TS-related dependencies removed; ESLint/Prettier configs no longer reference TS plugins/parsers.
- No unresolved imports or broken path aliases; Jest and bundler resolve modules correctly.
- Runtime behavior of `reportWebVitals` and `utils` functions preserved; basic runtime guards added where types were enforcing contracts.
- Updated README at root documents JS-only setup, prerequisites, install/run/test steps, and project structure.
- Commits use `feat:` prefix and clear scope descriptions; file renames performed with history-preserving moves.
