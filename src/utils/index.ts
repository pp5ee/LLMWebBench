import { encoding_for_model } from 'tiktoken';
import { Task, TaskResult, TaskCategories } from '../types';

// 默认测试任务
export const defaultTasks: Record<TaskCategories, Task[]> = {
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
    expectedAnswer: String.fromCharCode(65 + i)
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

// 计算token数量
export function countTokens(text: string): number {
  const enc = encoding_for_model("gpt-3.5-turbo");
  return enc.encode(text).length;
}

// 执行单个任务
export async function executeTask(endpoint: string, task: Task, apiKey?: string, modelName?: string): Promise<TaskResult> {
  const startTime = Date.now();
  try {
    console.log(`开始执行任务: ${task.question}`);
    console.log(`API端点: ${endpoint}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // 如果提供了API Key，则添加到请求头
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      console.log('已添加API Key到请求头');
    }
    
    // 构建请求体
    const requestBody: any = {
      messages: [{ role: "user", content: task.question }],
      temperature: 0.7,
      max_tokens: 1000
    };
    
    // 如果提供了模型名称，则添加到请求体
    if (modelName) {
      requestBody.model = modelName;
      console.log(`使用模型: ${modelName}`);
    }
    
    console.log('发送请求...');
    console.log('请求体:', JSON.stringify(requestBody));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('收到响应:', data);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    const inputTokens = countTokens(task.question);
    const outputTokens = countTokens(data.choices[0].message.content);
    const totalTokens = inputTokens + outputTokens;
    const tokensPerSecond = totalTokens / duration;

    console.log(`任务完成，耗时: ${duration}秒，输入tokens: ${inputTokens}，输出tokens: ${outputTokens}`);

    return {
      success: true,
      question: task.question,
      expectedAnswer: task.expectedAnswer,
      actualAnswer: data.choices[0].message.content,
      duration,
      inputTokens,
      outputTokens,
      tokensPerSecond
    };
  } catch (error) {
    console.error('执行任务时出错:', error);
    return {
      success: false,
      question: task.question,
      expectedAnswer: task.expectedAnswer,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 并发执行任务
export async function executeTasksConcurrently(
  endpoint: string,
  tasks: Task[],
  concurrency: number,
  apiKey?: string,
  modelName?: string
): Promise<TaskResult[]> {
  const results: TaskResult[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(task => executeTask(endpoint, task, apiKey, modelName))
    );
    results.push(...batchResults);
  }
  return results;
}

// 计算准确率
export function calculateAccuracy(results: TaskResult[]): number {
  const successful = results.filter(r => r.success).length;
  return (successful / results.length) * 100;
}

// 计算平均token/s
export function calculateAverageTokensPerSecond(results: TaskResult[]): number {
  const validResults = results.filter(r => r.tokensPerSecond !== undefined);
  if (validResults.length === 0) return 0;
  const sum = validResults.reduce((acc, r) => acc + (r.tokensPerSecond || 0), 0);
  return sum / validResults.length;
} 