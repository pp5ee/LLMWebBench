export interface Task {
  question: string;
  expectedAnswer: string;
}

export interface TaskResult extends Task {
  success: boolean;
  actualAnswer?: string;
  duration?: number;
  inputTokens?: number;
  outputTokens?: number;
  tokensPerSecond?: number;
  error?: string;
}

export interface CategoryResults {
  results: TaskResult[];
  accuracy: number;
  avgTokensPerSecond: number;
  totalTokens?: number;
}

export interface BenchmarkResults {
  [category: string]: CategoryResults;
}

export interface CustomTask {
  category: string;
  tasks: Task[];
}

export enum TaskCategories {
  Math = 'math',
  Logic = 'logic',
  QA = 'qa',
  Code = 'code',
  Text = 'text'
}

export interface GPUInfo {
  model: string;
  count: number;
  costPerHour: number;
}

export interface CostSummary {
  totalCost: number;
  totalDuration: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  inputDuration: number;
  outputDuration: number;
  costPerCategory: Record<string, number>;
  costPerTokenCategory: Record<string, number>;
} 