# Goal Tracker

<!--
This file tracks the ultimate goal, acceptance criteria, and plan evolution.
It prevents goal drift by maintaining a persistent anchor across all rounds.

RULES:
- IMMUTABLE SECTION: Do not modify after initialization
- MUTABLE SECTION: Update each round, but document all changes
- Every task must be in one of: Active, Completed, or Deferred
- Deferred items require explicit justification
-->

## IMMUTABLE SECTION
<!-- Do not modify after initialization -->

### Ultimate Goal
Rewrite the existing React + Ant Design + Recharts frontend from TypeScript (.ts/.tsx) to JavaScript (.js/.jsx) while preserving all features, UI, and behavior. Remove all TypeScript syntax and the TypeScript toolchain (delete tsconfig.json and uninstall typescript/@types/*). Replace enums with runtime constants, remove type-only imports, convert tests and entry files to JS, and ensure the app builds, runs, and tests pass as before.

## Acceptance Criteria

### Acceptance Criteria
<!-- Each criterion must be independently verifiable -->
<!-- Claude must extract or define these in Round 0 -->


Following TDD philosophy, each criterion includes positive and negative tests for deterministic verification.

- AC-1: All source files migrated from .ts/.tsx to .js/.jsx with TS syntax removed
  - Positive Tests (expected to PASS):
    - Grep across src/ shows no .ts or .tsx files; only .js/.jsx remain
    - No code contains TypeScript-specific syntax (interfaces, types, enums, type assertions, import type)
  - Negative Tests (expected to FAIL):
    - A remaining .ts/.tsx file is present in src/
    - Build step fails due to TypeScript syntax left in a .js/.jsx file
  - AC-1.1: Enums replaced with runtime constants
    - Positive: Enums like TaskCategories are converted to Object.freeze({ ... }) and imported from runtime modules
    - Negative: Any enum keyword usage remains or code relies on TS enum bidirectional mapping

- AC-2: App builds and runs with unchanged UI/behavior
  - Positive Tests:
    - `npm start` launches the dev server without errors; main routes render and AntD/Recharts components display as before
    - `npm run build` completes successfully producing a production build
  - Negative Tests:
    - Runtime errors related to missing types, unresolved imports, or module format conflicts during start/build

- AC-3: Tests pass using JS setup
  - Positive Tests:
    - `npm test` runs green with test files converted to JS (e.g., App.test.js, setupTests.js)
    - Snapshot and DOM tests still pass or are updated consistently with JS conversion

---

## MUTABLE SECTION
<!-- Update each round with justification for changes -->

### Plan Version: 1 (Updated: Round 0)

#### Plan Evolution Log
<!-- Document any changes to the plan with justification -->
| Round | Change | Reason | Impact on AC |
|-------|--------|--------|--------------|
| 0 | Initial plan | - | - |

#### Active Tasks
<!-- Map each task to its target Acceptance Criterion and routing tag -->
| Task | Target AC | Status | Tag | Owner | Notes |
|------|-----------|--------|-----|-------|-------|
| [To be populated by Claude based on plan] | - | pending | coding or analyze | claude or codex | - |

### Completed and Verified
<!-- Only move tasks here after Codex verification -->
| AC | Task | Completed Round | Verified Round | Evidence |
|----|------|-----------------|----------------|----------|

### Explicitly Deferred
<!-- Items here require strong justification -->
| Task | Original AC | Deferred Since | Justification | When to Reconsider |
|------|-------------|----------------|---------------|-------------------|

### Open Issues
<!-- Issues discovered during implementation -->
| Issue | Discovered Round | Blocking AC | Resolution Path |
|-------|-----------------|-------------|-----------------|
