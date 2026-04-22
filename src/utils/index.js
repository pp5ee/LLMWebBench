// Lightweight token counter for browser/tests (approximate)

// Default test tasks (no TypeScript types)
export const defaultTasks = {
  math: Array(30).fill(null).map((_, i) => ({
    question: `计算 ${i + 1} 的平方根，保留两位小数`,
    expectedAnswer: Math.sqrt(i + 1).toFixed(2)
  })),
  logic: Array(30).fill(null).map((_, i) => ({
    question: `如果 A = ${i + 1}, B = ${i + 2}, 那么 A + B 等于多少？`,
    expectedAnswer: (i + 1 + i + 2).toString()
  })),
  qa: Array(30).fill(null).map((_, i) => ({
    question: `第 ${i + 1} 个字母是什么？`,
    expectedAnswer: String.fromCharCode(65 + (i % 26))
  })),
  code: Array(30).fill(null).map((_, i) => ({
    question: `写一个函数计算 ${i + 1} 的阶乘`,
    expectedAnswer: `function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }`
  })),
  text: Array(30).fill(null).map((_, i) => ({
    question: `用一句话描述数字 ${i + 1}`,
    expectedAnswer: `这是一个${i + 1}`
  }))
};

// Approximate token count without external libraries
export const TOKEN_SPLIT_RE = /\s+|(?=\W)/;
export function countTokens(text) {
  // Approximate token count by splitting on whitespace and punctuation
  if (text == null) return 0;
  const s = String(text).trim();
  if (!s) return 0;
  return s.split(TOKEN_SPLIT_RE).filter(Boolean).length;
}

// Execute a single task against an OpenAI-compatible endpoint

// Small number and formatting helpers for UI safety
export const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);
export const formatFixed = (v, digits = 2, fallback = '-') => (isFiniteNumber(v) ? v.toFixed(digits) : fallback);
export const formatLocale = (v, fallback = '-') => (isFiniteNumber(v) ? v.toLocaleString() : fallback);
export const computeCostPer1kTokens = (totalCost, totalTokens) => (totalTokens > 0 ? (totalCost * 1000) / totalTokens : 0);
export const getErrorMessage = (err, unknown = '未知错误') => (err instanceof Error ? err.message : unknown);

export async function executeTask(endpoint, task, apiKey, modelName) {
  const startTime = Date.now();
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const requestBody = {
      messages: [{ role: 'user', content: task.question }],
      temperature: 0.7,
      max_tokens: 1000
    };
    if (modelName) requestBody.model = modelName;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);

    const data = await response.json();

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    let inputTokens = 0;
    let outputTokens = 0;
    if (data.usage) {
      inputTokens = data.usage.prompt_tokens || 0;
      outputTokens = data.usage.completion_tokens || 0;
    } else {
      inputTokens = countTokens(task.question);
      outputTokens = data?.choices?.[0]?.message?.content ? countTokens(data.choices[0].message.content) : 0;
    }

    const totalTokens = inputTokens + outputTokens;
    const tokensPerSecond = totalTokens / Math.max(duration || 0, 0.001);

    const actualAnswer = data?.choices?.[0]?.message?.content ?? '';
    if (!actualAnswer) throw new Error('响应格式不符合预期');

    return {
      success: true,
      question: task.question,
      expectedAnswer: task.expectedAnswer,
      actualAnswer,
      duration,
      inputTokens,
      outputTokens,
      tokensPerSecond
    };
  } catch (error) {
    return {
      success: false,
      question: task.question,
      expectedAnswer: task.expectedAnswer,
      actualAnswer: '执行失败',
      error: getErrorMessage(error)
    };
  }
}

// Execute tasks in batches with limited concurrency
export async function executeTasksConcurrently(endpoint, tasks, concurrency, apiKey, modelName) {
  const results = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(task => executeTask(endpoint, task, apiKey, modelName))
    );
    results.push(...batchResults);
  }
  return results;
}

export function calculateAccuracy(results) {
  const successful = results.filter(r => r.success).length;
  return results.length > 0 ? (successful / results.length) * 100 : 0; // keep simple readability; reduce not necessary here
}

export function calculateAverageTokensPerSecond(results) {
  const validResults = results.filter(r => r.tokensPerSecond !== undefined);
  if (validResults.length === 0) return 0;
  const sum = validResults.reduce((acc, r) => acc + (r.tokensPerSecond || 0), 0); // O(n), fine for small arrays; clearer than a two-variable reduce
  return sum / validResults.length;
}
