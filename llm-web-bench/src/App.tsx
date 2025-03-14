import React, { useState } from 'react';
import { Layout, Input, Button, Form, Card, Table, Progress, message, Space, Checkbox, Divider } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { defaultTasks, executeTasksConcurrently, calculateAccuracy, calculateAverageTokensPerSecond } from './utils';
import { Task, TaskResult, BenchmarkResults, CustomTask, TaskCategories, GPUInfo, CostSummary } from './types';

const { Header, Content, Footer } = Layout;
const { TextArea } = Input;

const TASK_CATEGORIES = Object.values(TaskCategories);
const TASK_CATEGORY_OPTIONS = TASK_CATEGORIES.map(category => ({
  label: category.charAt(0).toUpperCase() + category.slice(1),
  value: category
}));

const App: React.FC = () => {
  const [endpoint, setEndpoint] = useState('');
  const [concurrency, setConcurrency] = useState(1);
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);
  const [results, setResults] = useState<BenchmarkResults>({});
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<TaskCategories[]>(TASK_CATEGORIES);
  const [gpuInfo, setGpuInfo] = useState<GPUInfo>({
    model: '',
    count: 1,
    costPerHour: 0
  });
  const [costSummary, setCostSummary] = useState<CostSummary>({
    totalCost: 0,
    totalDuration: 0,
    costPerCategory: {}
  });

  const handleAddCustomTask = (values: any) => {
    try {
      const tasks = JSON.parse(values.tasks) as Task[];
      setCustomTasks([...customTasks, { category: values.category, tasks }]);
      setSelectedTaskTypes(prev => [...prev, values.category]);
      form.resetFields();
      message.success('自定义任务添加成功');
    } catch (error) {
      message.error('JSON格式错误，请检查输入');
    }
  };

  const handleTaskTypeChange = (checkedValues: TaskCategories[]) => {
    setSelectedTaskTypes(checkedValues);
  };

  const calculateCosts = (results: BenchmarkResults) => {
    const costPerCategory: Record<string, number> = {};
    let totalDuration = 0;

    Object.entries(results).forEach(([category, data]) => {
      const categoryDuration = data.results.reduce((sum, result) => sum + (result.duration || 0), 0) / 1000; // 转换为秒
      totalDuration += categoryDuration;
      costPerCategory[category] = (categoryDuration / 3600) * gpuInfo.costPerHour * gpuInfo.count;
    });

    const totalCost = Object.values(costPerCategory).reduce((sum, cost) => sum + cost, 0);
    setCostSummary({
      totalCost,
      totalDuration,
      costPerCategory
    });
  };

  const handleRunBenchmark = async () => {
    if (!endpoint) {
      message.error('请输入API端点');
      return;
    }

    if (selectedTaskTypes.length === 0) {
      message.error('请至少选择一个任务类型');
      return;
    }

    if (!gpuInfo.model || gpuInfo.count < 1 || gpuInfo.costPerHour <= 0) {
      message.error('请输入有效的GPU信息');
      return;
    }

    setLoading(true);
    try {
      const allTasks = {
        ...defaultTasks,
        ...Object.fromEntries(customTasks.map(ct => [ct.category, ct.tasks]))
      } as Record<TaskCategories, Task[]>;

      const results: BenchmarkResults = {};
      for (const category of selectedTaskTypes) {
        if (allTasks[category]) {
          const categoryResults = await executeTasksConcurrently(endpoint, allTasks[category], concurrency);
          const totalTokens = categoryResults.reduce((sum: number, result: TaskResult) => {
            return sum + (result.inputTokens || 0) + (result.outputTokens || 0);
          }, 0);
          
          results[category] = {
            results: categoryResults,
            accuracy: calculateAccuracy(categoryResults),
            averageTokensPerSecond: calculateAverageTokensPerSecond(categoryResults),
            totalTokens
          };
        }
      }
      setResults(results);
      calculateCosts(results);
    } catch (error) {
      message.error('执行测试时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const chartData = results ? Object.entries(results).map(([category, data]) => ({
    category,
    accuracy: data.accuracy,
    tokensPerSecond: data.averageTokensPerSecond
  })) : [];

  const columns = [
    {
      title: '问题',
      dataIndex: 'question',
      key: 'question',
    },
    {
      title: '预期答案',
      dataIndex: 'expectedAnswer',
      key: 'expectedAnswer',
    },
    {
      title: '实际答案',
      dataIndex: 'actualAnswer',
      key: 'actualAnswer',
    },
    {
      title: '状态',
      key: 'status',
      render: (record: TaskResult) => (
        <span style={{ color: record.success ? 'green' : 'red' }}>
          {record.success ? '成功' : '失败'}
        </span>
      ),
    },
    {
      title: 'Token/s',
      dataIndex: 'tokensPerSecond',
      key: 'tokensPerSecond',
      render: (value: number) => value?.toFixed(2) || '-',
    },
  ];

  const costColumns = [
    {
      title: '任务类别',
      dataIndex: 'categoryName',
      key: 'categoryName',
    },
    {
      title: '总Token数',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: '总耗时(秒)',
      dataIndex: 'totalDuration',
      key: 'totalDuration',
      render: (value: number) => value.toFixed(2),
    },
    {
      title: '每1k Token成本(CNY)',
      dataIndex: 'costPer1kTokens',
      key: 'costPer1kTokens',
      render: (value: number) => value.toFixed(4),
    },
    {
      title: '总成本(CNY)',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (value: number) => value.toFixed(4),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 20px' }}>
        <h1>LLM Web Benchmark</h1>
      </Header>
      <Content style={{ padding: '20px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="配置">
            <Form layout="vertical">
              <Form.Item label="API端点" required>
                <Input
                  value={endpoint}
                  onChange={e => setEndpoint(e.target.value)}
                  placeholder="例如: http://192.168.31.34:8080/"
                />
              </Form.Item>
              <Form.Item label="并发数" required>
                <Input
                  type="number"
                  value={concurrency}
                  onChange={e => setConcurrency(Number(e.target.value))}
                  min={1}
                />
              </Form.Item>
              <Form.Item label="GPU信息">
                <Space>
                  <Input
                    placeholder="GPU型号"
                    value={gpuInfo.model}
                    onChange={e => setGpuInfo(prev => ({ ...prev, model: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="GPU数量"
                    value={gpuInfo.count}
                    min={1}
                    onChange={e => setGpuInfo(prev => ({ ...prev, count: Number(e.target.value) }))}
                  />
                  <Input
                    type="number"
                    placeholder="每小时成本(CNY)"
                    value={gpuInfo.costPerHour}
                    min={0}
                    step={0.01}
                    onChange={e => setGpuInfo(prev => ({ ...prev, costPerHour: Number(e.target.value) }))}
                  />
                </Space>
              </Form.Item>
              <Form.Item label="选择任务类型">
                <Checkbox.Group
                  options={TASK_CATEGORY_OPTIONS}
                  value={selectedTaskTypes}
                  onChange={(values) => setSelectedTaskTypes(values as TaskCategories[])}
                />
              </Form.Item>
              <Button type="primary" onClick={handleRunBenchmark} loading={loading}>
                开始测试
              </Button>
            </Form>
          </Card>

          <Card title="添加自定义任务">
            <Form form={form} onFinish={handleAddCustomTask}>
              <Form.Item
                name="category"
                label="任务类别"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="tasks"
                label="任务列表 (JSON格式)"
                rules={[{ required: true }]}
              >
                <TextArea rows={4} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  添加任务
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {results && (
            <>
              <Card title="测试结果">
                <BarChart width={800} height={400} data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="accuracy" name="准确率 (%)" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="tokensPerSecond" name="Token/s" fill="#82ca9d" />
                </BarChart>
              </Card>

              {Object.entries(results).map(([category, data]) => (
                <Card key={category} title={`${category} 类别结果`}>
                  <Progress percent={data.accuracy} status="active" />
                  <Table
                    columns={columns}
                    dataSource={data.results}
                    rowKey="question"
                    pagination={false}
                  />
                </Card>
              ))}

              <Card title="成本分析">
                <Table
                  columns={costColumns}
                  dataSource={Object.entries(costSummary.costPerCategory).map(([category, cost]) => ({
                    categoryName: category,
                    totalTokens: 0,
                    totalDuration: 0,
                    costPer1kTokens: cost,
                    totalCost: 0
                  }))}
                  pagination={false}
                  summary={(pageData) => {
                    const totalCost = pageData.reduce((sum, item) => sum + item.totalCost, 0);
                    const totalTokens = pageData.reduce((sum, item) => sum + item.totalTokens, 0);
                    return (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0}>总计</Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>{totalTokens.toLocaleString()}</Table.Summary.Cell>
                          <Table.Summary.Cell index={2}>-</Table.Summary.Cell>
                          <Table.Summary.Cell index={3}>-</Table.Summary.Cell>
                          <Table.Summary.Cell index={4}>{totalCost.toFixed(4)}</Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    );
                  }}
                />
              </Card>

              <Card title="总体成本统计">
                <p>总运行时间: {costSummary.totalDuration.toFixed(2)} 秒</p>
                <p>总成本: {costSummary.totalCost.toFixed(4)} CNY</p>
              </Card>
            </>
          )}
        </Space>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#f0f2f5', padding: '24px' }}>
        <Space>
          <span>作者: </span>
          <a href="https://github.com/pp5ee" target="_blank" rel="noopener noreferrer">pp5ee</a>
          <span>|</span>
          <a href="https://github.com/pp5ee/LLMWebBench" target="_blank" rel="noopener noreferrer">GitHub 项目地址</a>
        </Space>
      </Footer>
    </Layout>
  );
};

export default App; 