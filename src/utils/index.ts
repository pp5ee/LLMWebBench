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
    
    // 从响应中获取token信息
    let inputTokens = 0;
    let outputTokens = 0;
    
    // 检查响应中是否包含usage信息
    if (data.usage) {
      inputTokens = data.usage.prompt_tokens || 0;
      outputTokens = data.usage.completion_tokens || 0;
    } else {
      // 如果没有usage信息，则使用tiktoken估算
      inputTokens = countTokens(task.question);
      outputTokens = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content 
        ? countTokens(data.choices[0].message.content) 
        : 0;
    }
    
    const totalTokens = inputTokens + outputTokens;
    const tokensPerSecond = totalTokens / duration;

    console.log(`任务完成，耗时: ${duration}秒，输入tokens: ${inputTokens}，输出tokens: ${outputTokens}`);

    // 检查响应格式并提取实际答案
    let actualAnswer = '';
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      actualAnswer = data.choices[0].message.content;
    } else {
      console.warn('响应格式不符合预期，无法提取实际答案');
      throw new Error('响应格式不符合预期');
    }

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
    console.error('执行任务时出错:', error);
    return {
      success: false,
      question: task.question,
      expectedAnswer: task.expectedAnswer,
      actualAnswer: '执行失败',
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
  // 只有success为true的任务才被视为成功
  const successful = results.filter(r => r.success).length;
  return results.length > 0 ? (successful / results.length) * 100 : 0;
}

// 计算平均token/s
export function calculateAverageTokensPerSecond(results: TaskResult[]): number {
  const validResults = results.filter(r => r.tokensPerSecond !== undefined);
  if (validResults.length === 0) return 0;
  const sum = validResults.reduce((acc, r) => acc + (r.tokensPerSecond || 0), 0);
  return sum / validResults.length;
} 