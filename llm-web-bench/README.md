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

## 安装和运行

1. 克隆项目
```bash
git clone [项目地址]
cd llm-web-bench
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm start
```

应用将在 http://localhost:3000 启动。

## 部署指南

### 1. 构建生产版本

```bash
npm run build
```

这将在 `build` 目录下生成优化后的生产版本文件。

### 2. 部署方式

#### 方式一：使用静态文件服务器

1. 安装 `serve` 包（可选）
```bash
npm install -g serve
```

2. 运行静态服务器
```bash
serve -s build
```

#### 方式二：使用 Nginx

1. 将 `build` 目录下的文件复制到 Nginx 的网站目录
```bash
cp -r build/* /usr/share/nginx/html/
```

2. Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 方式三：使用 GitHub Pages

1. 在 `package.json` 中添加 homepage 字段
```json
{
  "homepage": "https://your-username.github.io/llm-web-bench"
}
```

2. 安装 `gh-pages` 包
```bash
npm install --save-dev gh-pages
```

3. 在 `package.json` 的 scripts 中添加部署命令
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

4. 部署到 GitHub Pages
```bash
npm run deploy
```

## 使用说明

1. **配置API端点**
   - 在配置卡片中输入API端点（例如：http://192.168.31.34:8080/）
   - 设置并发请求数（默认为1）

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
       "answer": "答案1"
     },
     {
       "question": "问题2",
       "answer": "答案2"
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

## 技术栈

- React
- TypeScript
- Ant Design
- Recharts
- Tiktoken

## 许可证

MIT
