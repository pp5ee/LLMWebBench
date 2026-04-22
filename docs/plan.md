# Remove TypeScript and migrate to JavaScript (.js/.jsx) for CRA app

## Goal Description
Fully convert the React + TypeScript Create React App project to plain JavaScript: rename .ts→.js and .tsx→.jsx, remove all TS syntax and artifacts, adjust tests/setup and reportWebVitals to JS, clean toolchain and dependencies, and verify react-scripts start/build/test all succeed. Per clarification, do not retain JSDoc type annotations.

## Acceptance Criteria

Following TDD philosophy, each criterion includes positive and negative tests for deterministic verification.

- AC-1: All source files are migrated to JS/JSX
  - Positive Tests (expected to PASS):
    - All current TypeScript-bearing files are renamed: src/utils/index.ts→.js; src/types/index.ts→.js; src/reportWebVitals.ts→.js; src/setupTests.ts→.js; src/App.tsx→.jsx; src/index.tsx→.jsx; src/App.test.tsx→.jsx
    - The repository contains no .ts/.tsx files under src/
  - Negative Tests (expected to FAIL):
    - Any .ts or .tsx file remains in src/
    - Imports break due to extension changes (e.g., unresolved modules after rename)
  - AC-1.1: Imports resolve after the rename
    - Positive: react-scripts start/build complete without module not found errors
    - Negative: build fails with unresolved import paths for renamed files

- AC-2: All TypeScript-only syntax is removed
  - Positive Tests:
    - No interface, type, enum declarations remain in code
    - No type annotations (": type"), generics (<T> in TS positions), type assertions (as T / <T>expr), non-null assertions (!) remain
    - No type-only imports/exports (import type / export type)
  - Negative Tests:
    - Grep finds TS keywords (\binterface\b|\benum\b|\btype\b|\bas\s+\w|:\s*\w)
    - Babel/Jest/CRA fail due to TS syntax in JS/JSX files

- AC-3: Enum behavior is preserved where used
  - Positive Tests:
    - Any former enum (e.g., TaskCategories) is replaced with a plain object or constant values preserving the same runtime strings used by the app ("math","logic","qa","code","text")
    - UI and logic that depend on these values continue to function (e.g., category labels, selections)
  - Negative Tests:
    - Comparisons or switch statements on former enum values change behavior or throw

- AC-4: Tests and setup run in JavaScript
  - Positive Tests:
    - src/App.test.jsx executes under react-scripts test without TypeScript transformers
    - src/setupTests.js executes and jest-dom matchers are available
  - Negative Tests:
    - Jest fails due to TS configuration, missing transformers, or TS-specific imports

- AC-5: Toolchain cleanup completed
  - Positive Tests:
    - tsconfig.json and src/react-app-env.d.ts are removed
    - package.json no longer lists typescript or any @types/* dependencies
    - ESLint configuration works without @typescript-eslint parser/plugins (react-app defaults are OK)
  - Negative Tests:
    - CI or local scripts still call tsc or rely on @typescript-eslint

- AC-6: reportWebVitals is JavaScript-compatible
  - Positive Tests:
    - reportWebVitals.js exists and can be imported without TS types OR it is cleanly removed and not imported anywhere
  - Negative Tests:
    - Runtime error from missing or TS-typed reportWebVitals

- AC-7: CRA lifecycle succeeds
  - Positive Tests:
    - npm start serves the app without TS-related errors
    - npm test runs and passes existing tests
    - npm build completes successfully
  - Negative Tests:
    - Any CRA lifecycle fails due to TypeScript remnants

- AC-8: No JSDoc typing is introduced
  - Positive Tests:
    - No @ts-check / @type / @typedef annotations are added
  - Negative Tests:
    - Searches find type-bearing JSDoc directives

- AC-9: Documentation aligns with the migration
  - Positive Tests:
    - README mentions the project is JavaScript-based and outlines start/build/test commands
  - Negative Tests:
    - README or docs instruct using TypeScript or refer to TS-only setup

## Path Boundaries

Path boundaries define the acceptable range of implementation quality and choices.

### Upper Bound (Maximum Acceptable Scope)
- Complete TS removal across src/
- All files renamed and TS syntax stripped
- Enum replacements preserve runtime semantics
- Tests, start, build green under react-scripts
- Tooling cleaned (tsconfig/react-app-env.d.ts removed, TS deps removed), README updated
- Optional jsconfig.json added only if needed for path resolution/editor IntelliSense

### Lower Bound (Minimum Acceptable Scope)
- All .ts/.tsx files renamed and free of TS syntax
- react-scripts start/build/test succeed
- tsconfig.json and react-app-env.d.ts removed; TypeScript and @types deps removed

### Allowed Choices
- Can use: jscodeshift or simple regex-assisted edits to strip types; plain object constants to replace enums; minimal jsconfig.json if needed (no types)
- Cannot use: retaining TypeScript, @typescript-eslint parser/plugins, or JSDoc typing (per clarification)

> Note on Deterministic Designs: The draft specifies a fixed approach (remove TypeScript; React uses .jsx; no JSDoc). Path boundaries reflect this narrow constraint; choices are limited to implementation techniques that meet the fixed outcome.

## Feasibility Hints and Suggestions

> Note: This section is for reference and understanding only. These are conceptual suggestions, not prescriptive requirements.

### Conceptual Approach
- Inventory TS files (done in analysis)
- Rename files: .tsx→.jsx, .ts→.js
- Strip TS syntax: remove type annotations, interfaces, generics, assertions, non-null (!), and type-only imports/exports
- Replace enums with plain objects or inline string constants preserving current values
- Update tests and setup files to JS/JSX
- Convert reportWebVitals to JS or remove its import if unused
- Remove tsconfig.json and src/react-app-env.d.ts; remove typescript and @types/* from package.json
- Run CRA start/build/test and iterate on any syntax/import issues
- Add jsconfig.json only if import resolution needs it (tsconfig shows no baseUrl/paths)

### Relevant References
- src/App.tsx – main React component using TaskCategories and utils
- src/index.tsx – entry; will become index.jsx
- src/App.test.tsx – test; will become App.test.jsx
- src/utils/index.ts – utilities with Task types
- src/types/index.ts – Type definitions and TaskCategories enum
- src/reportWebVitals.ts – web-vitals wiring
- src/setupTests.ts – Jest setup
- tsconfig.json – TS compiler settings (no baseUrl/paths)
- package.json – dependencies and scripts

## Dependencies and Sequence

### Milestones
1. Source Conversion
   - Phase A: Rename .tsx→.jsx and .ts→.js across src/
   - Phase B: Strip TS syntax and type-only artifacts; replace enums with objects/strings
2. Test & Runtime Wiring
   - Step 1: Convert setupTests and App.test to JS/JSX
   - Step 2: Convert or remove reportWebVitals usage
3. Tooling Cleanup
   - Step 1: Remove tsconfig.json and react-app-env.d.ts
   - Step 2: Remove typescript and all @types/* packages; verify eslint config remains valid
4. Verification & Docs
   - Step 1: Ensure npm start/test/build succeed
   - Step 2: Update README to reflect JS stack and commands

<Describe relative dependencies between components, not time estimates>

## Task Breakdown

Each task must include exactly one routing tag:
- `coding`: implemented by Claude
- `analyze`: executed via Codex (`/humanize:ask-codex`)

| Task ID | Description | Target AC | Tag (`coding`/`analyze`) | Depends On |
|---------|-------------|-----------|----------------------------|------------|
| task1 | Rename .tsx→.jsx and .ts→.js in src/ | AC-1 | coding | - |
| task2 | Strip TS syntax (types, interfaces, generics, assertions, type-only imports) | AC-2 | coding | task1 |
| task3 | Replace TaskCategories enum with plain object/string values preserving behavior | AC-3 | coding | task2 |
| task4 | Convert setupTests.ts→.js and App.test.tsx→.jsx | AC-4 | coding | task1 |
| task5 | Convert reportWebVitals.ts to JS or remove its import cleanly | AC-6 | coding | task1 |
| task6 | Remove tsconfig.json and react-app-env.d.ts | AC-5 | coding | task2 |
| task7 | Remove typescript and @types/* from package.json; ensure eslint works | AC-5, AC-7 | coding | task6 |
| task8 | Verify CRA start/test/build; fix any import resolution issues | AC-1.1, AC-7 | analyze | task7 |
| task9 | Update README to reflect JS-only stack and usage | AC-9 | coding | task8 |

## Claude-Codex Deliberation

### Codex First-Pass Findings
- Core risks: hidden TS generics/assertions; enum behavior changes; path alias breakage; ESLint/Jest/CI coupling to TS; ambient types reliance (react-app-env).
- Missing requirements: confirm need for jsconfig.json; enum replacement semantics; reportWebVitals keep/remove; any custom Jest/ESLint/CI steps; Node/react-scripts versions; import extension policy; treatment of TS pragmas.
- Technical gaps: inventory of tsconfig flags (no baseUrl/paths found); unknown presence of enums/namespaces; unknown CI hooks.
- Alternative directions: hybrid staged removal; temporary @ts-check (declined); modernize toolchain (Vite) — out of scope; automated codemods.
- Candidate criteria: no .ts/.tsx files; no TS syntax; CRA start/test/build green; remove tsconfig/react-app-env.d.ts and TS deps; preserve enum runtime semantics; no JSDoc types.

### Agreements
- Remove TypeScript entirely; React files use .jsx; no JSDoc types retained
- Preserve runtime behavior when replacing enums and removing type-only constructs
- tsconfig.json and react-app-env.d.ts should be removed; TypeScript and @types/* removed from package.json
- Since tsconfig has no baseUrl/paths, jsconfig.json is optional and only needed if editors/tools require it

### Resolved Disagreements
- None in direct mode; no second Codex round executed

### Convergence Status
- Final Status: `partially_converged`

## Pending User Decisions

- DEC-1: jsconfig.json necessity
  - Claude Position: Not required because tsconfig has no baseUrl/paths; add only if editor resolution suffers
  - Codex Position: Add minimal jsconfig.json to preserve IntelliSense and future-proof imports
  - Tradeoff Summary: Avoid extra config vs. improved editor hints; both are valid with minimal impact
  - Decision Status: `PENDING`
- DEC-2: reportWebVitals handling
  - Claude Position: Keep as JS (reportWebVitals.js) if currently used; else remove import and file
  - Codex Position: Prefer keeping with JS for metrics parity
  - Tradeoff Summary: Simplicity vs. observability; both acceptable
  - Decision Status: `PENDING`
- DEC-3: Remove legacy TS pragmas/comments
  - Claude Position: Remove @ts-ignore/@ts-expect-error since TS is gone
  - Codex Position: Same, but audit any safety they implied
  - Tradeoff Summary: Clean code vs. potential hidden issues; verify during tests
  - Decision Status: `PENDING`
- DEC-4: CI adjustments (if any CI exists)
  - Claude Position: Remove tsc/type-check steps; keep test/build
  - Codex Position: Optionally keep a temporary type-check step during transition (not applicable now)
  - Tradeoff Summary: Simpler CI vs. transient safety; likely moot if no CI
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

帮我把项目的ts 转换成javascript

## Additional Requirement Notes



- full removal，.jsx for React

## Clarification Q&A



### Q1

我明白了：我们将彻底移除 TypeScript，并把 React 文件改为 .jsx、其余改为 .js。概要如下：
- 文件重命名：.ts → .js，.tsx → .jsx（包括 src/App.tsx、src/index.tsx、src/App.test.tsx、utils/types 等）
- 代码转换：移除类型注解与泛型、处理类型断言/非空断言、用普通对象替代 enum（若有）、删除仅类型导入/导出
- 测试与初始化文件：把 src/App.test.tsx、src/setupTests.ts 改为 .jsx/.js；调整 reportWebVitals 为 JS
- 工具链清理：删除 tsconfig.json 与 src/react-app-env.d.ts；从 package.json 移除 typescript 与 @types/*；如有 ESLint TS 插件/配置也一并移除
- 验证：确保 react-scripts 构建与测试可通过
仅有一个确认问题：
- 是否需要保留少量 JSDoc 类型注释以便编辑器智能提示？（默认不保留）
确认后请回复 “start” 或 “proceed”，我会生成实现方案并开始修改。  
总结：已确认“完全移除 TS，React 用 .jsx”的范围；等待你确认是否保留 JSDoc，然后开始执行计划。



### A1

不保留

---

## Implementation Notes

- For any unspecified details (combat formulas, game balance, UI layout, tech choices, etc.), make reasonable decisions yourself and document them in the plan. Do NOT ask the user for clarification — proceed with sensible defaults.
- If referenced image files exist in the workspace, treat them as visual style references.

## Standard Deliverables (mandatory for every project)

- **README.md** — must be included at the project root with: project title & description, prerequisites, installation steps, usage examples with code snippets, configuration options, and project structure overview.
- **Git commits** — use conventional commit prefix `feat:` for all commits.

--- Original Design Draft End ---
