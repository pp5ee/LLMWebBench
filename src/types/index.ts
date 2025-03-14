export interface Task {
  question: string;
  answer: string;
}

export interface TaskResult {
  success: boolean;
  question: string;
  expectedAnswer: string;
  actualAnswer?: string;
  error?: string;
  duration?: number;
  inputTokens?: number;
  outputTokens?: number;
  tokensPerSecond?: number;
}

export interface CategoryResults {
  [key: string]: TaskResult[];
}

export interface BenchmarkResults {
  [key: string]: {
    results: TaskResult[];
    accuracy: number;
    averageTokensPerSecond: number;
  };
}

export interface CustomTask {
  category: string;
  tasks: Task[];
}

export type TaskCategories = 'math' | 'logic' | 'qa' | 'code' | 'text' | string; 