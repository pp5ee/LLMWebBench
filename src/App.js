import React, { useState } from 'react';
import { Layout, Input, Button, Form, Card, Table, Progress, message, Space, Checkbox, Divider, Tooltip, Modal } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { defaultTasks, executeTasksConcurrently, calculateAccuracy, calculateAverageTokensPerSecond } from './utils';

const { Header, Content, Footer } = Layout;
const { TextArea } = Input;

// Task category values (no TypeScript enum)
const TASK_CATEGORIES = ['math', 'logic', 'qa', 'code', 'text'];

function App() {
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [concurrency, setConcurrency] = useState(1);
  const [customTasks, setCustomTasks] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [selectedTaskTypes, setSelectedTaskTypes] = useState(TASK_CATEGORIES);
  const [gpuInfo, setGpuInfo] = useState({
    model: '',
    count: 1,
    costPerHour: 0
  });
  const [costSummary, setCostSummary] = useState({
    totalCost: 0,
    totalDuration: 0,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    inputDuration: 0,
    outputDuration: 0,
    costPerCategory: {},
    costPerTokenCategory: {}
  });

  const showTaskExamples = (category) => {
    const tasks = defaultTasks[category].slice(0, 5);

    Modal.info({
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} 类型任务示例`,
      width: 600,
      content: (
        <div>
          <p>该类型共有30个预设任务，以下是5个示例：</p>
          <Table
            pagination={false}
            size="small"
            columns={[
              { title: '问题', dataIndex: 'question', key: 'question' },
              { title: '预期答案', dataIndex: 'expectedAnswer', key: 'expectedAnswer' }
            ]}
            dataSource={tasks.map((task, index) => ({
              key: index,
              question: task.question,
              expectedAnswer: task.expectedAnswer
            }))}
          />
        </div>
      ),
      okText: '关闭'
    });
  };

  const initialTaskOptions = TASK_CATEGORIES.map(category => ({
    label: (
      <Space>
        {category.charAt(0).toUpperCase() + category.slice(1)}
        <span style={{ fontSize: '12px', color: '#999' }}>(30个任务)</span>
        <Tooltip title="点击查看示例任务">
          <QuestionCircleOutlined
            style={{ color: '#1890ff', cursor: 'pointer', marginLeft: '5px' }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              showTaskExamples(category);
            }}
          />
        </Tooltip>
      </Space>
    ),
    value: category
  }));

  const [taskOptions, setTaskOptions] = useState(initialTaskOptions);

  const handleAddCustomTask = (values) => {
    try {
      const tasks = JSON.parse(values.tasks);
      const customCategory = values.category;

      const customTaskOption = {
        label: (
          <Space>
            {customCategory}
            <span style={{ fontSize: '12px', color: '#999' }}>({tasks.length}个任务)</span>
            <Tooltip title="点击查看示例任务">
              <QuestionCircleOutlined
                style={{ color: '#1890ff', cursor: 'pointer', marginLeft: '5px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  Modal.info({
                    title: `${customCategory} 类型任务示例`,
                    width: 600,
                    content: (
                      <div>
                        <p>该类型共有{tasks.length}个自定义任务，以下是{Math.min(5, tasks.length)}个示例：</p>
                        <Table
                          pagination={false}
                          size="small"
                          columns={[
                            { title: '问题', dataIndex: 'question', key: 'question' },
                            { title: '预期答案', dataIndex: 'expectedAnswer', key: 'expectedAnswer' }
                          ]}
                          dataSource={tasks.slice(0, 5).map((task, index) => ({
                            key: index,
                            question: task.question,
                            expectedAnswer: task.expectedAnswer
                          }))}
                        />
                      </div>
                    ),
                    okText: '关闭'
                  });
                }}
              />
            </Tooltip>
          </Space>
        ),
        value: customCategory
      };

      setCustomTasks([...customTasks, { category: customCategory, tasks }]);
      setSelectedTaskTypes(prev => [...prev, customCategory]);
      setTaskOptions(prev => [...prev, customTaskOption]);
      form.resetFields();
      message.success('自定义任务添加成功');
    } catch (error) {
      message.error('JSON格式错误，请检查输入');
    }
  };

  const handleTaskTypeChange = (checkedValues) => {
    setSelectedTaskTypes(checkedValues);
  };

  const runBenchmark = async () => {
    if (selectedTaskTypes.length === 0) {
      message.error('请至少选择一种任务类型');
      return;
    }

    if (!endpoint) {
      message.error('请输入API端点');
      return;
    }

    if (!gpuInfo.model || gpuInfo.count < 1 || gpuInfo.costPerHour <= 0) {
      message.error('请输入有效的GPU信息');
      return;
    }

    setLoading(true);
    setResults({});

    try {
      const allResults = {};
      let totalDuration = 0;
      let totalTokens = 0;
      let inputTokens = 0;
      let outputTokens = 0;
      const costPerCategory = {};
      const costPerTokenCategory = {};

      for (const category of selectedTaskTypes) {
        let tasks;
        const customTaskEntry = customTasks.find(ct => ct.category === category);
        tasks = customTaskEntry ? customTaskEntry.tasks : (defaultTasks[category] || []);
        if (tasks.length === 0) continue;

        try {
          const results = await executeTasksConcurrently(endpoint, tasks, concurrency, apiKey || undefined, modelName || undefined);

          const accuracy = calculateAccuracy(results);
          const avgTokensPerSecond = calculateAverageTokensPerSecond(results);

          const categoryDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
          const categoryTokens = results.reduce((sum, r) => sum + ((r.inputTokens || 0) + (r.outputTokens || 0)), 0);
          const categoryInputTokens = results.reduce((sum, r) => sum + (r.inputTokens || 0), 0);
          const categoryOutputTokens = results.reduce((sum, r) => sum + (r.outputTokens || 0), 0);

          totalDuration += categoryDuration;
          totalTokens += categoryTokens;
          inputTokens += categoryInputTokens;
          outputTokens += categoryOutputTokens;

          costPerCategory[category] = (categoryDuration / 3600) * gpuInfo.costPerHour * gpuInfo.count;
          costPerTokenCategory[category] = categoryTokens > 0 ? (costPerCategory[category] * 1000) / categoryTokens : 0;

          allResults[category] = {
            results,
            accuracy,
            avgTokensPerSecond,
            totalTokens: categoryTokens
          };
        } catch (categoryError) {
          message.error(`执行 ${category} 类别任务时出错: ${categoryError instanceof Error ? categoryError.message : '未知错误'}`);
          allResults[category] = {
            results: tasks.map(task => ({
              success: false,
              question: task.question,
              expectedAnswer: task.expectedAnswer,
              actualAnswer: '执行失败',
              error: categoryError instanceof Error ? categoryError.message : '未知错误'
            })),
            accuracy: 0,
            avgTokensPerSecond: 0,
            totalTokens: 0
          };
        }
      }

      const inputRatio = inputTokens / (totalTokens || 1);
      const outputRatio = outputTokens / (totalTokens || 1);
      const inputDuration = totalDuration * inputRatio;
      const outputDuration = totalDuration * outputRatio;

      const totalCost = (totalDuration / 3600) * gpuInfo.costPerHour * gpuInfo.count;

      const costSummaryData = {
        totalCost,
        totalDuration,
        totalTokens,
        inputTokens,
        outputTokens,
        inputDuration,
        outputDuration,
        costPerCategory,
        costPerTokenCategory
      };

      setCostSummary(costSummaryData);
      setResults(allResults);
      message.success('基准测试完成!');
    } catch (error) {
      message.error(`执行基准测试时出错: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const chartData = results ? Object.entries(results).map(([category, data]) => ({
    category,
    successRate: data.accuracy,
    tokensPerSecond: data.avgTokensPerSecond
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
      render: (text) => (
        <div style={{ maxHeight: '150px', overflow: 'auto' }}>
          {text}
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (record) => (
        <span style={{ color: record.success ? 'green' : 'red' }}>
          {record.success ? '成功' : '失败'}
        </span>
      ),
    },
    {
      title: 'Token/s',
      dataIndex: 'tokensPerSecond',
      key: 'tokensPerSecond',
      render: (value) => (value !== undefined && value !== null) ? value.toFixed(2) : '-',
    },
    {
      title: '错误信息',
      dataIndex: 'error',
      key: 'error',
      render: (error) => error ? (
        <Tooltip title={error}>
          <span style={{ color: 'red', cursor: 'pointer' }}>
            {error.length > 30 ? `${error.substring(0, 30)}...` : error}
          </span>
        </Tooltip>
      ) : '-',
    },
  ];

  const costColumns = [
    { title: '任务类别', dataIndex: 'categoryName', key: 'categoryName' },
    { title: '总Token数', dataIndex: 'totalTokens', key: 'totalTokens', render: (v) => v.toLocaleString() },
    { title: '总耗时(秒)', dataIndex: 'totalDuration', key: 'totalDuration', render: (v) => v.toFixed(2) },
    { title: '每1k Token成本(CNY)', dataIndex: 'costPer1kTokens', key: 'costPer1kTokens', render: (v) => v.toFixed(4) },
    { title: '总成本(CNY)', dataIndex: 'totalCost', key: 'totalCost', render: (v) => v.toFixed(4) },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 20px' }}>
        <h1>42labs LLM Web Bench</h1>
      </Header>
      <Content style={{ padding: '20px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="配置">
            <Form layout="vertical" form={form} onFinish={handleAddCustomTask}>
              <Form.Item
                label={<Space>API端点<Tooltip title="输入OpenAI兼容的API端点，例如：http://192.168.31.34:8080/"><QuestionCircleOutlined style={{ color: '#1890ff' }} /></Tooltip></Space>}
                required
              >
                <Input value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="例如: http://192.168.31.34:8080/" />
              </Form.Item>

              <Form.Item label={<Space>API Key<Tooltip title="可选项。如需认证请输入API Key。将作为Authorization头发送。"><QuestionCircleOutlined style={{ color: '#1890ff' }} /></Tooltip></Space>}>
                <Input.Password value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="可选，如需认证请输入API Key" />
              </Form.Item>

              <Form.Item label={<Space>模型名称<Tooltip title="可选项。输入要使用的模型名称，例如：gpt-4o-mini。将作为请求体中的model字段发送。"><QuestionCircleOutlined style={{ color: '#1890ff' }} /></Tooltip></Space>}>
                <Input value={modelName} onChange={e => setModelName(e.target.value)} placeholder="可选，例如：gpt-4o-mini" />
              </Form.Item>

              <Form.Item label={<Space>并发数<Tooltip title="设置同时发送的请求数量，默认值：1。较高的并发数可能会提高测试速度，但也可能增加服务器负载。"><QuestionCircleOutlined style={{ color: '#1890ff' }} /></Tooltip></Space>} required>
                <Input type="number" value={concurrency} onChange={e => setConcurrency(Number(e.target.value))} min={1} />
              </Form.Item>

              <Form.Item label={<Space>GPU信息<Tooltip title="输入GPU相关信息以计算推理成本。所有字段都必须填写才能进行成本计算。"><QuestionCircleOutlined style={{ color: '#1890ff' }} /></Tooltip></Space>} required>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>请输入GPU信息以计算推理成本:</div>
                  <div style={{ color: '#666', marginBottom: '8px', fontSize: '12px' }}>成本计算方式: 总成本 = (运行时间/3600小时) * 每小时成本 * GPU数量</div>
                  <Space>
                    <Tooltip title="输入您使用的GPU型号，例如：RTX 4090">
                      <Input placeholder="GPU型号" value={gpuInfo.model} style={{ width: 150 }} onChange={e => setGpuInfo(prev => ({ ...prev, model: e.target.value }))} />
                    </Tooltip>
                    <Tooltip title="输入使用的GPU数量，默认值：1。总GPU成本 = 单GPU成本 * GPU数量">
                      <Input type="number" placeholder="GPU数量" value={gpuInfo.count} style={{ width: 120 }} min={1} onChange={e => setGpuInfo(prev => ({ ...prev, count: Number(e.target.value) }))} />
                    </Tooltip>
                    <Tooltip title="输入每小时单GPU使用成本（人民币），例如：10.5">
                      <Input type="number" placeholder="每小时成本(CNY)" value={gpuInfo.costPerHour} style={{ width: 150 }} min={0} step={0.01} onChange={e => setGpuInfo(prev => ({ ...prev, costPerHour: Number(e.target.value) }))} />
                    </Tooltip>
                  </Space>
                </Space>
              </Form.Item>

              <Form.Item label={<Space>选择任务类型<Tooltip title="选择要测试的任务类型。默认全选。至少需要选择一个任务类型才能开始测试。"><QuestionCircleOutlined style={{ color: '#1890ff' }} /></Tooltip></Space>}>
                <Checkbox.Group options={taskOptions} value={selectedTaskTypes} onChange={handleTaskTypeChange} />
              </Form.Item>

              <Divider>添加自定义任务</Divider>
              <Form.Item name="category" label={<Space>任务类别<Tooltip title="输入自定义任务的类别名称，例如：translation。建议使用与已有类别相似的命名方式：math, logic, qa, code, text 等。"><QuestionCircleOutlined style={{ color: '#1890ff' }} /></Tooltip></Space>} rules={[{ required: true }]}>
                <Input placeholder="例如: translation" />
              </Form.Item>
              <Form.Item name="tasks" label={<Space>任务列表 (JSON格式)<Tooltip title="输入JSON格式的任务列表，每个任务必须包含question和expectedAnswer字段。请参考下方示例格式。"><QuestionCircleOutlined style={{ color: '#1890ff' }} /></Tooltip></Space>} rules={[{ required: true }]}>
                <TextArea rows={8} placeholder={`[
  {
    "question": "将'Hello World'翻译成中文",
    "expectedAnswer": "你好，世界"
  },
  {
    "question": "将'Good morning'翻译成中文",
    "expectedAnswer": "早上好"
  }
]`} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">添加任务</Button>
              </Form.Item>

              <Button type="primary" onClick={runBenchmark} loading={loading}>开始测试</Button>
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
                  <RechartsTooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="successRate" name="成功率 (%)" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="tokensPerSecond" name="Token/s" fill="#82ca9d" />
                </BarChart>
              </Card>

              {Object.entries(results).map(([category, data]) => (
                <Card key={category} title={`${category} 类别结果`}>
                  <Progress percent={data.accuracy} status="active" format={percent => percent ? `成功率: ${percent.toFixed(2)}%` : '0%'} />
                  <Table columns={columns} dataSource={data.results} rowKey="question" pagination={false} />
                </Card>
              ))}

              <Card title={<Space>成本分析<Tooltip title="基于GPU信息计算的成本分析。总成本 = (运行时间/3600小时) * 每小时成本 * GPU数量，每1k token成本 = (总成本 * 1000) / 总token数。"><QuestionCircleOutlined style={{ color: '#1890ff' }} /></Tooltip></Space>}>
                <div style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
                  成本计算基于: {gpuInfo.count}个 {gpuInfo.model} GPU，每小时总成本 {(gpuInfo.costPerHour * gpuInfo.count).toFixed(2)} CNY
                </div>
                <Table
                  columns={costColumns}
                  dataSource={Object.entries(costSummary.costPerCategory).map(([category, cost]) => ({
                    categoryName: category,
                    totalTokens: results[category]?.totalTokens || 0,
                    totalDuration: results[category]?.results.reduce((sum, r) => sum + (r.duration || 0), 0) || 0,
                    costPer1kTokens: costSummary.costPerTokenCategory[category] || 0,
                    totalCost: cost
                  }))}
                  pagination={false}
                  summary={(pageData) => {
                    const totalCost = pageData.reduce((sum, item) => sum + item.totalCost, 0);
                    const totalTokens = pageData.reduce((sum, item) => sum + item.totalTokens, 0);
                    const avgCostPer1kTokens = totalTokens > 0 ? (totalCost * 1000) / totalTokens : 0;
                    return (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0}>总计</Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>{totalTokens.toLocaleString()}</Table.Summary.Cell>
                          <Table.Summary.Cell index={2}>{costSummary.totalDuration.toFixed(2)}</Table.Summary.Cell>
                          <Table.Summary.Cell index={3}>{avgCostPer1kTokens.toFixed(4)}</Table.Summary.Cell>
                          <Table.Summary.Cell index={4}>{totalCost.toFixed(4)}</Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    );
                  }}
                />

                <Divider>成本构成分析</Divider>
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center', margin: '20px' }}>
                    <h4>输入/输出Token数量占比</h4>
                    <PieChart width={300} height={300}>
                      <Pie
                        data={[
                          { name: '输入Token', value: costSummary.inputTokens },
                          { name: '输出Token', value: costSummary.outputTokens }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#8884d8" />
                        <Cell fill="#82ca9d" />
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${value.toLocaleString()} tokens`} />
                      <Legend />
                    </PieChart>
                  </div>

                  <div style={{ textAlign: 'center', margin: '20px' }}>
                    <h4>输入/输出时间占比</h4>
                    <PieChart width={300} height={300}>
                      <Pie
                        data={[
                          { name: '输入时间', value: costSummary.inputDuration },
                          { name: '输出时间', value: costSummary.outputDuration }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#8884d8" />
                        <Cell fill="#82ca9d" />
                      </Pie>
                      <RechartsTooltip formatter={(value) => typeof value === 'number' ? `${value.toFixed(2)} 秒` : value} />
                      <Legend />
                    </PieChart>
                  </div>

                  <div style={{ textAlign: 'center', margin: '20px' }}>
                    <h4>输入/输出成本占比</h4>
                    <PieChart width={300} height={300}>
                      <Pie
                        data={[
                          { name: '输入成本', value: costSummary.totalCost * costSummary.inputDuration / costSummary.totalDuration },
                          { name: '输出成本', value: costSummary.totalCost * costSummary.outputDuration / costSummary.totalDuration }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#8884d8" />
                        <Cell fill="#82ca9d" />
                      </Pie>
                      <RechartsTooltip formatter={(value) => typeof value === 'number' ? `${value.toFixed(4)} CNY` : value} />
                      <Legend />
                    </PieChart>
                  </div>
                </div>
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
          <a href="https://github.com/42labs/LLMWebBench" target="_blank" rel="noopener noreferrer">GitHub 项目地址</a>
        </Space>
      </Footer>
    </Layout>
  );
}

export default App;
