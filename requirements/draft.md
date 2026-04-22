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
