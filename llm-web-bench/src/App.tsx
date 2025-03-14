import React, { useState } from 'react';
import { Layout, Input, Button, Form, Card, Table, Progress, message, Space, Checkbox } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { defaultTasks, executeTasksConcurrently, calculateAccuracy, calculateAverageTokensPerSecond } from './utils';
import { Task, TaskResult, BenchmarkResults, CustomTask, TaskCategories } from './types';

const { Header, Content } = Layout;
const { TextArea } = Input;

const App: React.FC = () => {
  const [endpoint, setEndpoint] = useState('');
  const [concurrency, setConcurrency] = useState(1);
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);
  const [results, setResults] = useState<BenchmarkResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<TaskCategories[]>(Object.keys(defaultTasks) as TaskCategories[]);

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

  const handleRunBenchmark = async () => {
    if (!endpoint) {
      message.error('请输入API端点');
      return;
    }

    if (selectedTaskTypes.length === 0) {
      message.error('请至少选择一个任务类型');
      return;
    }

    setLoading(true);
    try {
      const allTasks = {
        ...defaultTasks,
        ...Object.fromEntries(customTasks.map(ct => [ct.category, ct.tasks]))
      };

      const results: BenchmarkResults = {};
      for (const category of selectedTaskTypes) {
        if (allTasks[category]) {
          const categoryResults = await executeTasksConcurrently(endpoint, allTasks[category], concurrency);
          results[category] = {
            results: categoryResults,
            accuracy: calculateAccuracy(categoryResults),
            averageTokensPerSecond: calculateAverageTokensPerSecond(categoryResults)
          };
        }
      }
      setResults(results);
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
              <Form.Item label="选择任务类型" required>
                <Checkbox.Group
                  options={[
                    { label: '数学问题', value: 'math' },
                    { label: '逻辑问题', value: 'logic' },
                    { label: '基础问答', value: 'qa' },
                    { label: '代码生成', value: 'code' },
                    { label: '文本生成', value: 'text' },
                    ...customTasks.map(ct => ({
                      label: ct.category,
                      value: ct.category
                    }))
                  ]}
                  value={selectedTaskTypes}
                  onChange={handleTaskTypeChange}
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
            </>
          )}
        </Space>
      </Content>
    </Layout>
  );
};

export default App;
