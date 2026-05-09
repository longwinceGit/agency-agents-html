# AO 可视化控制台

为 [Agency Orchestrator](https://github.com/your-repo/agency-orchestrator) 提供图形化操作界面。

## 功能特性

- 🎯 **自动编排**：一句话需求，自动选角色 + 设计 DAG + 生成工作流
- 🎭 **角色组合**：可视化选择 180 个 AI 角色，配置依赖关系，运行自定义工作流
- 👤 **单角色运行**：快速测试单个 AI 角色
- 📋 **模板工作流**：使用内置 39 个工作流模板
- 🔀 **DAG 可视化**：预览工作流步骤与依赖关系

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置工作目录

编辑 `package.json` 或设置环境变量：

```bash
# Windows
set AO_CWD=d:/SourceCode/agency-orchestrator

# Linux/Mac
export AO_CWD=/path/to/agency-orchestrator
```

### 3. 启动服务

```bash
npm start
```

然后访问 http://localhost:3000/ao-console.html

## 目录结构

```
.
├── ao-console.html      # 前端可视化界面
├── server.js            # Express 后端服务
├── package.json         # 项目配置
├── src/
│   └── data/
│       └── agent-catalog.js  # 角色库数据
├── tmp-workflows/       # 临时工作流文件
└── ao-outputs/          # 运行输出目录
```

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/status` | 健康检查 |
| GET | `/api/roles` | 获取角色目录（180 个角色） |
| GET | `/api/workflows` | 获取模板列表（39 个模板） |
| GET | `/api/workflow/:id` | 获取工作流详情 |
| POST | `/api/compose` | 自动编排 |
| POST | `/api/run` | 运行工作流 |
| POST | `/api/template/run` | 运行模板 |
| POST | `/api/single-role/run` | 单角色运行 |
| POST | `/api/workflow/build` | 构建工作流 YAML |
| POST | `/api/workflow/save` | 保存工作流 |
| POST | `/api/workflow/run` | 运行自定义工作流 |

## 支持的 LLM Provider

| Provider | 配置 | 说明 |
|----------|------|------|
| `deepseek` | API Key | API 付费 |
| `claude-code` | Claude 会员 | 免费（Claude 会员） |
| `gemini-cli` | Google 账号 | 免费 1000次/天 |
| `copilot-cli` | GitHub Copilot | 需要 Copilot 订阅 |
| `codex-cli` | ChatGPT Plus/Pro | 需要订阅 |
| `ollama` | 本地模型 | 免费（本地部署） |

## 角色库

共 **180 个 AI 角色**，覆盖 **16 个部门**：

- 📢 营销部 (33)
- 🔬 专项部 (29)
- 🛠️ 工程部 (27)
- 🎮 游戏开发 (20)
- 🧪 测试部 (9)
- 🎨 设计部 (8)
- 💼 销售部 (8)
- 🤝 支持部 (8)
- 📋 项目管理 (6)
- 🥽 空间计算 (6)
- 📖 学术部 (6)
- 📦 产品部 (5)
- 🚚 供应链 (3)
- 🏦 金融部 (3)
- 👔 人力资源 (2)
- ⚖️ 法务部 (2)

其中 **45 个中国原创角色**（微信、抖音、小红书、飞书、钉钉等）

## 工作流模板

共 **39 个内置模板**，分类如下：

- 🛠️ 开发类 (7)：PR 审查、技术债务审计、安全审计等
- 📢 营销类 (5)：竞品分析、小红书种草、SEO 内容矩阵等
- 📊 数据/设计类 (4)：数据管道评审、仪表盘设计等
- 🔧 运维类 (3)：事故复盘、SRE 健康检查、周报生成等
- 📈 战略类 (4)：商业计划书，投资分析、法律咨询等
- 👔 HR类 (2)：面试题设计、简历优化
- 📋 通用类 (14)：一人公司全员大会、产品评审等

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `AO_CWD` | `d:/SourceCode/agency-orchestrator` | agency-orchestrator 工作目录 |
| `PORT` | `3000` | 服务端口 |

## 许可证

MIT
