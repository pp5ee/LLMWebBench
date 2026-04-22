/**
 * Shared JSDoc typedefs for the app.
 * These types are for editor IntelliSense only and have no runtime effect.
 *
 * @typedef {Object} Task
 * @property {string} question
 * @property {string} expectedAnswer
 *
 * @typedef {Object} TaskResult
 * @property {boolean} success
 * @property {string} question
 * @property {string} expectedAnswer
 * @property {string=} actualAnswer
 * @property {number=} duration
 * @property {number=} inputTokens
 * @property {number=} outputTokens
 * @property {number=} tokensPerSecond
 * @property {string=} error
 *
 * @typedef {Object} CategoryResults
 * @property {TaskResult[]} results
 * @property {number} accuracy
 * @property {number} avgTokensPerSecond
 * @property {number=} totalTokens
 *
 * @typedef {Object.<string, CategoryResults>} BenchmarkResults
 *
 * @typedef {Object} CustomTask
 * @property {string} category
 * @property {Task[]} tasks
 *
 * @typedef {Object} GPUInfo
 * @property {string} model
 * @property {number} count
 * @property {number} costPerHour
 *
 * @typedef {Object} CostSummary
 * @property {number} totalCost
 * @property {number} totalDuration
 * @property {number} totalTokens
 * @property {number} inputTokens
 * @property {number} outputTokens
 * @property {number} inputDuration
 * @property {number} outputDuration
 * @property {Record<string, number>} costPerCategory
 * @property {Record<string, number>} costPerTokenCategory
 */

// Runtime category constant (replaces the former TypeScript enum)
export const TaskCategories = {
  Math: 'math',
  Logic: 'logic',
  QA: 'qa',
  Code: 'code',
  Text: 'text'
};
