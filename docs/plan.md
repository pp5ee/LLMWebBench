# TS→JS Migration Plan (unify to .js, remove TS tooling)

## Goal Description
Convert all TypeScript (.ts/.tsx/.d.ts) in this React project to pure JavaScript using .js extensions (including JSX-in-.js), remove the TypeScript toolchain (tsconfig.json and TS deps), and keep all other behavior unchanged. Tests are migrated to JS and the build/test/lint pipelines run without TS-specific plugins or transformers.

## Acceptance Criteria

Following TDD philosophy, each criterion includes positive and negative tests for deterministic verification.

- AC-1: All TS artifacts removed and files migrated to .js
  - Positive Tests (expected to PASS):
    - ripgrep for TS returns no matches: `rg -n "\.tsx?$|\.d\.ts$" src` prints nothing
    - `ls tsconfig.json` exits non-zero (file removed)
  - Negative Tests (expected to FAIL):
    - Any `.ts`/`.tsx`/`.d.ts` remains in repo
    - `package.json` still references TypeScript or ts-jest scripts
  - AC-1.1: React entry points compile as .js with JSX
    - Positive: Dev server starts and renders App using .js files with JSX-in-.js
    - Negative: Build or Jest cannot parse JSX in .js
- AC-2: Build and tests succeed without TS tooling
  - Positive Tests:
    - `npm run build` succeeds without TS-related steps
    - `npm test` passes; no transformer references to ts-jest/@types remain
  - Negative Tests:
    - Jest errors due to missing TS transformers or types
    - Build fails due to TS loader or `tsc --noEmit` step
- AC-3: Linting/config stable post-migration
  - Positive Tests:
    - ESLint runs without `@typescript-eslint/*` parser/plugins in config
    - No unresolved imports from removed path aliases
  - Negative Tests:
    - ESLint fails due to TS parser rules
    - Imports break due to removed tsconfig `paths`
- AC-4: Behavior parity for utils and reportWebVitals
  - Positive Tests:
    - Utility functions continue to operate with representative inputs
    - `reportWebVitals` calls function with expected args, guard against undefined
  - Negative Tests:
    - Runtime exceptions where types previously ensured presence
- AC-5: Documentation and commits updated
  - Positive Tests:
    - README at root documents JS-only setup, install/run/test
    - Commits use `feat:` prefix; file renames keep history
  - Negative Tests:
    - README still mentions TS setup or `tsc`
    - Commits lack clear migration scopes

## Path Boundaries

Path boundaries define the acceptable range of implementation quality and choices.

### Upper Bound (Maximum Acceptable Scope)
- All TS files converted to .js with JSX supported in .js across the app
- TS toolchain fully removed (tsconfig.json, typescript, @types/*, ts-jest) and configs adjusted
- ESLint/Prettier updated to JS-only; path aliases, Jest/bundler mappings corrected
- Basic runtime guards added where TS previously enforced non-null/shape constraints
- Root README updated to JS-only workflow; CI updated to drop type-check steps

### Lower Bound (Minimum Acceptable Scope)
- All `.ts/.tsx/.d.ts` removed or converted to `.js`
- App builds and tests pass without any TS-specific config or deps
- No broken imports due to extension or path changes
- No change to app behavior beyond removing types

### Allowed Choices
- Can use:
  - Keep all React files as `.js` (per decision A3), allow JSX in `.js`
  - Use codemods or Babel TypeScript transform temporarily to emit JS, then tidy
  - Add minimal runtime guards in utils/reportWebVitals where TS enforced contracts
- Cannot use:
  - Retaining `.tsx`/`.ts` files or TypeScript dependencies
  - Introducing PropTypes/JSDoc types (explicitly excluded by draft)

> **Note on Deterministic Designs**: If the draft specifies a highly deterministic design with no choices (e.g., "must use JSON format", "must use algorithm X"), then the path boundaries should reflect this narrow constraint. In such cases, upper and lower bounds may converge to the same point, and "Allowed Choices" should explicitly state that the choice is fixed per the draft specification.

## Feasibility Hints and Suggestions

> **Note**: This section is for reference and understanding only. These are conceptual suggestions, not prescriptive requirements.

### Conceptual Approach
- Phase approach: safely rename and convert, keep builds green throughout.
- Pseudocode steps:
  1) Inventory TS files; plan `git mv` to `.js` for each
  2) Strip types/interfaces/enums; adapt generics; remove `import type` and `.d.ts`
  3) Ensure Babel/Jest handle JSX in `.js` (CRA default OK); update configs if custom
  4) Convert tests; replace ts-jest transformers; update snapshots if needed
  5) Remove tsconfig.json and TS deps; update ESLint/Prettier to JS-only
  6) Add minimal guards in utils/reportWebVitals for previously type-enforced inputs
  7) Update README to reflect JS-only setup

### Relevant References
- src/App.tsx → src/App.js — React app shell conversion target
- src/index.tsx → src/index.js — entry point JSX-in-.js check
- src/App.test.tsx → src/App.test.js — Jest config after TS removal
- src/setupTests.ts → src/setupTests.js — test bootstrap
- src/reportWebVitals.ts → src/reportWebVitals.js — ensure safe callback usage
- src/utils/index.ts → src/utils/index.js — strip types, keep behavior
- src/types/index.ts — remove if type-only and unused
- src/react-app-env.d.ts — remove
- tsconfig.json — remove and port any path aliases to bundler/Jest if present

## Dependencies and Sequence

### Milestones
1. Milestone 1: Prepare and convert source to JS
   - Phase A: Inventory and `git mv` .ts/.tsx → .js; fix imports and strip types
   - Phase B: Ensure JSX parses in `.js` (CRA default) or adjust Babel/Jest configs
2. Milestone 2: Tests and tooling to JS-only
   - Step 1: Convert tests and setup to `.js`; ensure Jest works without ts-jest
   - Step 2: Remove tsconfig.json and TS deps; update ESLint/Prettier to JS-only
3. Milestone 3: Stability and docs
   - Step 1: Add minimal runtime guards in utils/reportWebVitals if needed
   - Step 2: Update README and verify build/test/lint pipelines

<Describe relative dependencies between components, not time estimates>

## Task Breakdown

Each task must include exactly one routing tag:
- `coding`: implemented by Claude
- `analyze`: executed via Codex (`/humanize:ask-codex`)

| Task ID | Description | Target AC | Tag (`coding`/`analyze`) | Depends On |
|---------|-------------|-----------|----------------------------|------------|
| task1 | Inventory TS files and confirm paths/aliases usage | AC-1 | analyze | - |
| task2 | Rename .ts/.tsx → .js and strip types; fix imports | AC-1, AC-1.1 | coding | task1 |
| task3 | Convert tests/setup to JS; ensure Jest parses JSX-in-.js | AC-2 | coding | task2 |
| task4 | Remove tsconfig and TS deps; update ESLint/Prettier configs | AC-2, AC-3 | coding | task3 |
| task5 | Validate behavior parity in utils/reportWebVitals; add guards if needed | AC-4 | coding | task4 |
| task6 | Update README; ensure no TS references remain | AC-5 | coding | task5 |

## Claude-Codex Deliberation

### Agreements
- The migration should remove all TS files and tooling while preserving runtime behavior
- JSX-in-.js must be confirmed by the toolchain; CRA defaults typically allow it
- Tests and ESLint configs need explicit updates once TS is removed

### Resolved Disagreements
- None in direct mode; Codex raised risks and gaps which are incorporated into ACs and milestones

### Convergence Status
- Final Status: `partially_converged`  (GEN_PLAN_MODE=direct, convergence loop skipped)

## Pending User Decisions

- DEC-1: Commit strategy (single atomic vs staged `feat:` commits per milestone)
  - Claude Position: Stage by milestone to ease review and rollback
  - Codex Position: N/A - open question
  - Tradeoff Summary: Staged commits aid review; single commit is simpler but obscures history
  - Decision Status: `PENDING`
- DEC-2: Handling of `src/types/index.ts` (delete vs preserve as comments)
  - Claude Position: Delete if purely type-only and unreferenced
  - Codex Position: N/A - open question
  - Tradeoff Summary: Deleting avoids drift; comments/JSDoc would contradict "pure JS" directive
  - Decision Status: `PENDING`
- DEC-3: Any path aliases present in tsconfig to be ported to bundler/Jest?
  - Claude Position: Mirror aliases only if present
  - Codex Position: N/A - open question
  - Tradeoff Summary: Unused; only port if needed to keep imports resolving
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

帮我把项目typescript 部分转写成javascript 其他保持不变

## Clarification Q&A



### Q1

我先扫了一下仓库，找出需要从 TypeScript 转成 JavaScript 的文件范围。
发现的 TS/TSX 文件与配置：
- 源码/测试
  - src/App.tsx
  - src/App.test.tsx
  - src/index.tsx
  - src/setupTests.ts
  - src/reportWebVitals.ts
  - src/types/index.ts
  - src/utils/index.ts
  - src/react-app-env.d.ts
- 配置
  - tsconfig.json
  - package.json 中很可能包含 typescript/@types 依赖与 TS 相关脚本
为确保做法符合你的预期，我只问两点关键信息：
1) 目标风格是“纯 JS”（直接去掉类型），还是希望保留最基本的类型提示（用 JSDoc 或在 React 组件中加 PropTypes）？
2) 是否要同时移除 TypeScript 工具链（删除 tsconfig.json、移除 typescript/@types 依赖，并把脚本/ESLint 配置切到 JS）？
确认后我会：
- .tsx → .jsx、.ts → .js，移除类型/接口，修正 imports；
- 调整测试文件到 JS；
- 视你的选择保留或删除 TS 工具链，并更新 package.json 脚本与依赖；
- 保持其它文件与逻辑不变。
回复你的选择并输入 “start” 或 “proceed” 我就生成实施方案。



### A1

目标风格是“纯 JS”，否要同时移除 TypeScript 工具链



### Q2

我理解了：将项目中所有 .ts/.tsx 转为 .js/.jsx，去掉类型/接口，不添加 JSDoc/PropTypes；测试文件也改为 JS；其余逻辑与文件保持不变。
唯一需要你拍板的一点：
- 是否要移除 TypeScript 工具链，并相应更新配置？也就是删除 tsconfig.json、移除 typescript 和 @types 依赖、删除 ts-jest/类型相关配置，并把 package.json 脚本切到纯 JS。请直接回复“是，移除”或“否，保留”。
确认后输入 “start” 或 “proceed”，我会生成实施方案。
总结：已确认“纯 JS”目标；等待你确认是否移除 TS 工具链，然后我就生成详细计划。



### A2

是，移除



### Q3

我找到了需要转写/移除的范围，并确认会将 TS 工具链一起删除。
将被转写为 JS 的文件：
- src/App.tsx → App.jsx/js
- src/index.tsx → index.jsx/js
- src/App.test.tsx → App.test.jsx/js
- src/setupTests.ts → setupTests.js
- src/reportWebVitals.ts → reportWebVitals.js
- src/utils/index.ts → utils/index.js
- 如 src/types/index.ts 这类仅含类型的文件将删除或在无引用时移除
- src/react-app-env.d.ts 将删除
将移除的配置/依赖：
- tsconfig.json
- TypeScript 相关依赖（typescript、@types/*、ts-jest 等）
- 调整 package.json 脚本为纯 JS（不再引用 TS 或 ts-jest）
唯一需要你拍板的一点（只问这一点）：
- .tsx 文件要改为 .jsx（推荐）还是全部统一为 .js（JSX 仍能工作，但有些工具更偏好 .jsx）？
回复“用 .jsx”或“全用 .js”，并输入 “start” 或 “proceed”，我就生成实施方案。
摘要：已确认“纯 JS”并删除 TS 工具链；待你确认 React 文件扩展名选择后即可开始生成计划。



### A3

全部统一为js

---

## Implementation Notes

- For any unspecified details (combat formulas, game balance, UI layout, tech choices, etc.), make reasonable decisions yourself and document them in the plan. Do NOT ask the user for clarification — proceed with sensible defaults.
- If referenced image files exist in the workspace, treat them as visual style references.

## Standard Deliverables (mandatory for every project)

- **README.md** — must be included at the project root with: project title & description, prerequisites, installation steps, usage examples with code snippets, configuration options, and project structure overview.
- **Git commits** — use conventional commit prefix `feat:` for all commits.

--- Original Design Draft End ---
