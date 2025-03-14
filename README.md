# LLM Web Benchmark

一个纯前端的Web应用，用于测试大语言模型（LLM）的推理能力。该工具支持多种测试任务类型，并提供详细的性能报告。

## 功能特点

1. **API端点配置**
   - 支持配置OpenAI API兼容的endpoint
   - 支持自定义并发请求数

2. **测试任务类型**
   - 数学问题（30个默认任务）
   - 逻辑问题（30个默认任务）
   - 基础问答（30个默认任务）
   - 代码生成（30个默认任务）
   - 文本生成（30个默认任务）
   - 支持添加自定义任务类别和任务
   - 支持灵活选择要执行的任务类型

3. **性能测试**
   - 支持并发请求测试
   - 计算每个请求的token/s
   - 统计准确率
   - 详细的错误报告

4. **可视化报告**
   - 柱状图展示各类别的准确率和token/s
   - 进度条显示准确率
   - 详细的测试结果表格

5. **成本分析**
   - 支持输入GPU型号、数量和每小时成本
   - 计算每个任务类别的成本
   - 统计总体运行时间和成本

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/pp5ee/LLMWebBench.git
cd LLMWebBench
```

### 2. 安装依赖

```bash
npm install
# 或者使用 yarn
yarn install
```

### 3. 启动开发服务器

```bash
npm start
# 或者使用 yarn
yarn start
```

应用将在 http://localhost:3000 启动。

## 使用说明

1. **配置API端点**
   - 在配置卡片中输入API端点（例如：http://192.168.31.34:8080/）
   - 设置并发请求数（默认为1）
   - 输入GPU相关信息（型号、数量、每小时成本）

2. **选择任务类型**
   - 在配置卡片中的"选择任务类型"部分，可以看到所有可用的任务类型
   - 默认所有任务类型都被选中
   - 可以通过取消勾选来排除不需要测试的任务类型
   - 至少需要选择一个任务类型才能开始测试

3. **添加自定义任务**
   - 在"添加自定义任务"卡片中填写任务类别
   - 在任务列表输入框中输入JSON格式的任务列表，例如：
   ```json
   [
     {
       "question": "问题1",
       "expectedAnswer": "答案1"
     },
     {
       "question": "问题2",
       "expectedAnswer": "答案2"
     }
   ]
   ```
   - 添加的自定义任务会自动出现在任务类型选择列表中

4. **运行测试**
   - 点击"开始测试"按钮
   - 等待测试完成
   - 查看测试结果和性能报告

## 注意事项

1. 确保API端点支持CORS，否则可能无法正常发送请求
2. 建议根据API服务器的性能调整并发数
3. 自定义任务的JSON格式必须严格遵循示例格式
4. 测试过程中请勿关闭页面，以免中断测试
5. 必须至少选择一个任务类型才能开始测试
6. 添加自定义任务后，新的任务类型会自动被选中
7. 请确保输入正确的GPU信息以获得准确的成本分析

## 技术栈

- React 18
- TypeScript
- Ant Design
- Recharts (数据可视化)
- Tiktoken (Token计算)

## 许可证

MIT

## 作者

[pp5ee](https://github.com/pp5ee)

## 项目地址

[LLMWebBench](https://github.com/pp5ee/LLMWebBench)
