# TS→JS Migration Plan (CRA React App)

## Goal Description
Migrate the current React application from TypeScript (.ts/.tsx) to JavaScript (.js with JSX inside), remove the TypeScript toolchain entirely, preserve functionality and tests, and keep type information using JSDoc where helpful. Keep JSX within .js files per decision A2.

## Acceptance Criteria

Following TDD philosophy, each criterion includes positive and negative tests for deterministic verification.

- AC-1: All TypeScript sources converted to JavaScript with identical runtime behavior
  - Positive Tests (expected to PASS):
    - Unit and integration tests that passed pre-migration still pass post-migration without test logic changes besides file extensions/imports
    - `npm start` and `npm run build` succeed without TypeScript dependencies
  - Negative Tests (expected to FAIL):
    - Build fails if any `.ts`/`.tsx` files remain in `src/`
    - Tests fail if a converted module changes its exported API (e.g., missing default/named exports)
  - AC-1.1: JSX compiles and renders correctly from `.js` files
    - Positive: Rendering `App` mounts without runtime type errors and shows the same DOM snapshot
    - Negative: ESLint or Jest errors due to JSX-in-.js filename policy

- AC-2: TypeScript toolchain fully removed
  - Positive Tests:
    - `typescript`, `@types/*`, and `ts-jest` (if present) removed from devDependencies
    - `tsconfig.json` and `src/react-app-env.d.ts` removed; CI has no TS-specific steps
  - Negative Tests:
    - `npm ci && npm test` references `tsc` or type-check steps
    - Any import resolution depends on `tsconfig.json`

- AC-3: JSDoc type hints present per agreed policy and do not break build
  - Positive Tests:
    - Shared typedefs (if used) are available via `// @typedef` in a common `src/types/types.js` or inline JSDoc
    - Editors/intellisense recognize basic types where added; `npm test` and `npm run build` unaffected
  - Negative Tests:
    - JSDoc annotations cause syntax or lint errors

- AC-4: Import paths resolve after TS removal
  - Positive Tests:
    - All imports resolve either via relative paths or mirrored aliases in `jsconfig.json`
    - No "module not found" errors at build or test time
  - Negative Tests:
    - Any path relies on removed TS path aliases without replacement

- AC-5: Linting and project scripts align with JS configuration
  - Positive Tests:
    - ESLint rules permit JSX in `.js` (e.g., `react/jsx-filename-extension` configured)
    - `package.json` scripts contain no TS commands; formatting/linting succeed
  - Negative Tests:
    - CI or local lint rejects `.js` with JSX

- AC-6: Documentation updated
  - Positive Tests:
    - `README.md` updated to reflect JS setup and scripts
  - Negative Tests:
    - README references TypeScript-specific steps or files

## Path Boundaries

Path boundaries define the acceptable range of implementation quality and choices.

### Upper Bound (Maximum Acceptable Scope)
- All .ts/.tsx files converted to `.js` with preserved behavior.
- JSDoc added for public functions/components and shared types centralized in `src/types/types.js`.
- `jsconfig.json` created (if needed) to mirror former TS path aliases.
- ESLint configuration updated to allow JSX in `.js`; test suite fully green; documentation revised.

### Lower Bound (Minimum Acceptable Scope)
- All TypeScript files converted to `.js` and build/tests pass.
- TS toolchain and configs removed; basic JSDoc added where it was previously critical for understanding.
- Imports resolve without `tsconfig.json`.

### Allowed Choices
- Can use: JSDoc for types; `jsconfig.json` with `baseUrl`/`paths` or purely relative imports; PropTypes optional (not required); CRA defaults.
- Cannot use: Retaining TypeScript compilation or partial TS files; `.jsx` filenames (decision is `.js` per A2); leaving `tsconfig.json` or TS-only deps.

> Note on Deterministic Designs: The draft fixes the filename policy to `.js` (even for JSX) and removal of TS. Path boundaries reflect this.

## Feasibility Hints and Suggestions

### Conceptual Approach
- Inventory TS usage patterns (enums, interfaces, generics, type-only imports). For each file:
  1) Rename `.ts`→`.js` and `.tsx`→`.js`.
  2) Remove type syntax; convert `React.FC<Props>` to function components with JSDoc `@param`/`@returns`.
  3) Replace `import type` with JSDoc typedef references or remove if unnecessary.
  4) Update exports so external API remains identical.
- Create `src/types/types.js` if shared types are desired; add `// @typedef` and `@property` entries.
- Add `jsconfig.json` mirroring any former `tsconfig.json` `paths` if non-relative imports exist; otherwise convert to relative imports.
- Update ESLint config to allow JSX in `.js`.
- Rename tests from `.test.tsx?` to `.test.js` and adjust Jest config if file globs reference `ts/tsx`.
- Remove TS deps and configs; update `package.json` scripts to remove `tsc`.
- Verify via build, tests, and a smoke-run of the app.

### Relevant References
- src/App.tsx → src/App.js
- src/index.tsx → src/index.js
- src/App.test.tsx → src/App.test.js
- src/setupTests.ts → src/setupTests.js
- src/reportWebVitals.ts → src/reportWebVitals.js
- src/utils/index.ts → src/utils/index.js
- src/types/index.ts → src/types/types.js (if centralizing typedefs)
- src/react-app-env.d.ts → removed

## Dependencies and Sequence

### Milestones
1. Inventory & Policy Fix
   - Phase A: Enumerate TS files and path aliases; confirm `.js` for JSX; decide JSDoc centralization vs inline
   - Phase B: Prepare `jsconfig.json` if needed; set ESLint rule for JSX in `.js`
2. Code Conversion & Tests
   - Step 1: Batch rename files; strip TS constructs; add JSDoc where appropriate
   - Step 2: Rename tests; run Jest; fix any import or snapshot issues
3. Toolchain Removal & Cleanup
   - Step 1: Remove TS deps/configs; update scripts
   - Step 2: Ensure CI passes; update README

<Describe relative dependencies between components, not time estimates>

## Task Breakdown

Each task must include exactly one routing tag:
- `coding`: implemented by Claude
- `analyze`: executed via Codex (`/humanize:ask-codex`)

| Task ID | Description | Target AC | Tag (`coding`/`analyze`) | Depends On |
|---------|-------------|-----------|----------------------------|------------|
| task1 | Enumerate TS files and detect path aliases | AC-1 | analyze | - |
| task2 | Configure ESLint to allow JSX in .js | AC-5 | coding | task1 |
| task3 | Create jsconfig.json or convert to relative imports | AC-4 | coding | task1 |
| task4 | Convert source files .ts/.tsx → .js with JSDoc | AC-1, AC-3 | coding | task2, task3 |
| task5 | Rename and adjust tests, ensure Jest passes | AC-1 | coding | task4 |
| task6 | Remove TS toolchain and configs | AC-2 | coding | task5 |
| task7 | Update README for JS setup | AC-6 | coding | task6 |

## Claude-Codex Deliberation

### Codex Analysis v1 Findings
- CORE_RISKS:
  - Loss of type-safety increases runtime bugs and regressions
  - JSX-in-.js may violate current ESLint rules and break CI
  - Jest/CRA configs may implicitly rely on TS presence or file globs
  - Type-only modules and generics can leave dead code or logic shifts if not handled
  - Import aliases relying on `tsconfig.json` may break without `jsconfig.json`
- MISSING_REQUIREMENTS:
  - Exact CRA/Node versions; lint/format expectations; JSDoc policy; CI changes
  - Path alias strategy; handling of shared typedefs; package cleanup scope
- TECHNICAL_GAPS:
  - File-by-file conversion details; package.json and ESLint updates; Jest rename plan
  - Strategy for TS-only constructs (enums, namespaces, type-only imports)
- ALTERNATIVE_DIRECTIONS:
  - Keep `.d.ts` for editor types while shipping JS; use Babel TS-strip; keep TS but relax strictness; use `.jsx`; migrate to Vite
- QUESTIONS_FOR_USER:
  - JSDoc level and `checkJs`?
  - PropTypes usage?
  - Path aliases mirrored via `jsconfig.json` or convert to relative?
  - Any TS-specific CI steps to remove?
- CANDIDATE_CRITERIA:
  - TS/TSX→JS with identical behavior; CRA build/test pass; TS toolchain removed
  - ESLint/IDE happy with JSX-in-.js; JSDoc present per policy; README updated

### Agreements
- TS→JS migration is coherent; remove TS toolchain; keep functionality/tests passing; allow JSX in `.js`.

### Resolved Disagreements
- None in direct mode; Codex recommendations largely incorporated.

### Convergence Status
- Final Status: `partially_converged` (direct mode skips iterative convergence by design)

## Pending User Decisions

- DEC-1: JSDoc policy depth
  - Claude Position: Use JSDoc for public APIs and key components; centralize shared types in `src/types/types.js`.
  - Codex Position: Ask for explicit level and `checkJs` preference.
  - Tradeoff Summary: More JSDoc improves DX but adds maintenance; `checkJs` increases signal but may add noise.
  - Decision Status: `PENDING`
- DEC-2: PropTypes usage
  - Claude Position: Optional; rely on tests + JSDoc.
  - Codex Position: Ask whether to add PropTypes for runtime validation.
  - Tradeoff Summary: PropTypes catch runtime prop issues but add boilerplate.
  - Decision Status: `PENDING`
- DEC-3: Path strategy
  - Claude Position: Prefer relative imports unless many deep paths; otherwise `jsconfig.json` to mirror aliases.
  - Codex Position: Ask whether TS path aliases exist and should be mirrored.
  - Tradeoff Summary: Relative imports are simple; aliases improve ergonomics but require config.
  - Decision Status: `PENDING`

## Implementation Notes

### Code Style Requirements
- Implementation code and comments must NOT contain plan-specific terminology such as "AC-", "Milestone", "Step", "Phase", or similar workflow markers
- These terms are for plan documentation only, not for the resulting codebase
- Use descriptive, domain-appropriate naming in code instead

## Output File Convention

This template is used to produce the main output file (e.g., `plan.md`).

### Translated Language Variant

When `alternative_plan_language` resolves to a supported language name through merged config loading, a translated variant of the output file is also written after the main file. Humanize loads config from merged layers in this order: default config, optional user config, then optional project config; `alternative_plan_language` may be set at any of those layers. The variant filename is constructed by inserting `_<code>` (the ISO 639-1 code from the built-in mapping table) immediately before the file extension:

- `plan.md` becomes `plan_<code>.md` (e.g. `plan_zh.md` for Chinese, `plan_ko.md` for Korean)
- `docs/my-plan.md` becomes `docs/my-plan_<code>.md`
- `output` (no extension) becomes `output_<code>`

The translated variant file contains a full translation of the main plan file's current content in the configured language. All identifiers (`AC-*`, task IDs, file paths, API names, command flags) remain unchanged, as they are language-neutral.

When `alternative_plan_language` is empty, absent, set to `"English"`, or set to an unsupported language, no translated variant is written. Humanize does not auto-create `.humanize/config.json` when no project config file is present.

--- Original Design Draft Start ---

# Requirement

帮我把当前项目的typescritpt版本转写成javasrcipt 版本

## Clarification Q&A



### Q1

我先扫了一下仓库，确认是一个 React 应用，TypeScript 文件集中在：
- src/App.tsx, src/index.tsx, src/App.test.tsx, src/setupTests.ts, src/reportWebVitals.ts, src/utils/index.ts, src/types/index.ts，以及 CRA 的 src/react-app-env.d.ts。
我的理解：你希望把整个项目从 TypeScript 完整迁移到 JavaScript（.ts/.tsx → .js/.jsx），并移除 TypeScript 工具链，同时保持现有功能和测试可用。
在动手前有两点需要你拍板：
1) 是否要完全移除 TypeScript 工具链（删除 tsconfig、卸载 typescript/@types 等），并继续沿用当前的 Create React App 与 Jest 配置不变？
2) 类型信息要不要保留为 JSDoc（便于智能提示与轻量校验），还是直接全部去掉类型标注？
确认后我会生成具体实施方案（批量重命名与代码转写、调整测试与依赖、清理 TS 相关文件等）。请回复“start”或“proceed”开始执行。



### A1

完全移除 TypeScript 工具链，可以保留



### Q2

我理解为：
- 完全移除 TypeScript 工具链（删除 tsconfig、react-app-env.d.ts，卸载 typescript/@types 等）。
- 代码从 .ts/.tsx 转为 JavaScript，并用 JSDoc 保留类型信息（含公共 typedefs）。
- 同步调整导入路径/别名（必要时用 jsconfig.json 或改为相对路径）、Jest/CRA 配置与测试文件后缀，保证现有功能与测试可用。
唯一需要你拍板的一点：
- 组件文件后缀用哪种？统一改为 .jsx，还是继续用 .js（文件内含 JSX）？
确认后请回复“start”或“proceed”以生成具体实施方案（批量重命名与转写、依赖与配置清理、JSDoc 策略、测试调整等）。
小结：你选择了“移除 TS 工具链 + 保留 JSDoc 类型”；待你确定 .jsx 还是 .js 后即可开始。



### A2

继续用 .js（文件内含 JSX）

---

## Implementation Notes

- For any unspecified details (combat formulas, game balance, UI layout, tech choices, etc.), make reasonable decisions yourself and document them in the plan. Do NOT ask the user for clarification — proceed with sensible defaults.
- If referenced image files exist in the workspace, treat them as visual style references.

## Standard Deliverables (mandatory for every project)

- **README.md** — must be included at the project root with: project title & description, prerequisites, installation steps, usage examples with code snippets, configuration options, and project structure overview.
- **Git commits** — use conventional commit prefix `feat:` for all commits.

--- Original Design Draft End ---
