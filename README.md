# Agency Orchestrator 可视化控制台

为 [Agency Orchestrator](https://github.com/jnMetaCode/agency-agents-zh) 多智能体编排引擎提供图形化操作界面，支持中文角色库与工作流模板。

## 功能特性

- ✨ **自动编排**：输入自然语言需求，AI 自动选角色 + 设计 DAG + 生成并执行工作流（SSE 实时流式输出）
- 🎯 **工作流构建**：从 180+ 角色库中手动选择、排序，构建自定义工作流并运行
- 👥 **角色库浏览**：按部门分类浏览全部角色，支持搜索、筛选、批量添加
- 📋 **模板库**：内置工作流模板一键载入运行，支持 YAML 预览
- 🔀 **DAG 可视化**：运行后自动生成工作流有向无环图
- 📄 **YAML 生成/预览/导出**：支持语法高亮的 YAML 查看、导出
- 📟 **实时日志**：流式展示编排执行全过程，结构化解析步骤进度

## 快速开始

### 使用前提

使用本项目前，需要完成以下三步准备工作：

#### 1. 全局安装 Agency Orchestrator

```bash
npm install -g agency-orchestrator
```

安装完成后确认 `ao` 命令可用：

```bash
ao --version
```

#### 2. 下载角色库项目

```bash
git clone https://github.com/jnMetaCode/agency-agents-zh.git
```

记下克隆目录的绝对路径，例如 `D:/SourceCode/agency-agents-zh`。

#### 3. 配置 LLM Provider

在 `agency-agents-zh` 项目根目录下新建 `.env` 文件，填入所选 Provider 的配置。以 DeepSeek 为例：

```bash
# 在 agency-agents-zh 目录下创建 .env
# 例如：D:/SourceCode/agency-agents-zh/.env

AO_PROVIDER=deepseek
AO_MODEL=deepseek-reasoner
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_API_KEY=sk-your-key-here
```

其他 Provider 配置示例：

<details>
<summary>Claude Code</summary>

```bash
AO_PROVIDER=claude-code
# 无需 API Key，需 Claude 会员登录
```
</details>

<details>
<summary>Gemini CLI</summary>

```bash
AO_PROVIDER=gemini-cli
# 无需 API Key，需 Google 账号登录，免费 1000 次/天
```
</details>

<details>
<summary>Ollama（本地部署）</summary>

```bash
AO_PROVIDER=ollama
AO_MODEL=qwen2.5:7b
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
```
</details>

> 💡 更多 Provider 详见下方 [支持的 LLM Provider](#支持的-llm-provider) 章节。

---

### 安装与启动

#### 1. 安装本项目依赖

```bash
npm install
```

#### 2. 配置工作目录

设置 `AO_CWD` 环境变量指向你本机的 `agency-agents-zh` 仓库路径：

```bash
# Windows PowerShell
$env:AO_CWD = "D:/SourceCode/agency-agents-zh"

# Linux/Mac
export AO_CWD=/path/to/agency-agents-zh
```

或在 `server.js` 中直接修改默认值：

```js
const AO_CWD = process.env.AO_CWD || path.resolve('D:/SourceCode/agency-agents-zh');
```

#### 3. 启动服务

```bash
npm start
```

访问 http://localhost:3000/ao-console.html

## 目录结构

```
.
├── ao-console.html          # 前端可视化界面
├── ao-console.js            # 前端交互逻辑（SSE 流式解析、角色/模板渲染）
├── ao-console.css           # 前端样式（深色主题，CSS 变量体系）
├── server.js                # Express 后端服务（API + SSE 流式转发）
├── package.json             # 项目配置
├── src/
│   └── data/
│       └── agent-catalog.js # 角色库前端降级数据
├── oripic/                  # 设计原型文档与截图
├── tmp-workflows/           # 临时工作流文件（自动清理）
├── ao-outputs/              # 运行输出目录
├── CODE_REVIEW.md           # 代码质量审查报告
└── ao-visual-console-design.md  # 设计规格文档
```

## API 接口

### 查询类

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/status` | 健康检查，返回 `ao` 版本与工作目录 |
| GET | `/api/roles` | 获取角色目录（按部门分组） |
| GET | `/api/workflows` | 获取工作流模板列表（按分类分组） |
| GET | `/api/workflow/:id` | 获取指定工作流详情及原始 YAML |
| GET | `/api/outputs` | 获取历史运行输出列表 |

### 编排与执行类

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/compose` | 自动编排（仅生成 YAML，不执行） |
| POST | `/api/compose/stream` | 自动编排（SSE 流式，支持 `--run`） |
| POST | `/api/run` | 运行指定工作流（同步等待） |
| POST | `/api/run/stream` | 运行工作流（SSE 流式） |
| POST | `/api/single-role/run` | 单角色运行（同步等待） |
| POST | `/api/single-role/run/stream` | 单角色运行（SSE 流式） |
| POST | `/api/template/run` | 运行内置模板工作流 |

### 工作流管理类

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/workflow/build` | 构建工作流 YAML（对象 → YAML） |
| POST | `/api/workflow/save` | 保存工作流到 `workflows/` 目录 |
| POST | `/api/workflow/run` | 构建并运行自定义工作流 |
| POST | `/api/validate` | 校验工作流 YAML |
| POST | `/api/plan` | 查看执行计划（支持 `--explain`） |

### SSE 流式事件类型

SSE 端点（`/api/compose/stream`、`/api/run/stream`、`/api/single-role/run/stream`）会发送以下结构化事件：

| 事件类型 | 描述 |
|----------|------|
| `plan` | 参与者列表解析，包含步骤数组 |
| `step` | 步骤开始执行（⏳ 状态） |
| `step_result` | 步骤执行详情（含当前进度 `currentStep/totalSteps`） |
| `step_done` | 单步完成/失败（含耗时、token 数） |
| `summary` | 执行汇总（完成步数、总耗时、总 token） |
| `meta` | 元数据（工作流名、步骤数、YAML 生成路径等） |
| `stdout` | 原始标准输出 |
| `stderr` | 原始错误输出 |
| `close` | 进程结束（含退出码） |

## 支持的 LLM Provider

| Provider | 配置 | 说明 |
|----------|------|------|
| `deepseek` | API Key | API 付费 |
| `claude-code` | Claude 会员 | 免费（需 Claude 会员） |
| `gemini-cli` | Google 账号 | 免费 1000 次/天 |
| `copilot-cli` | GitHub Copilot | 需要 Copilot 订阅 |
| `ollama` | 本地模型 | 免费（本地部署） |

## 角色库

共 **180 个 AI 角色**，覆盖 **17 个部门**：

| 部门 | 数量 | 部门 | 数量 |
|------|------|------|------|
| 📢 营销部 | 33 | 🧪 测试部 | 9 |
| 🔬 专项部 | 29 | 🎨 设计部 | 8 |
| 🛠️ 工程部 | 27 | 💼 销售部 | 8 |
| 🎮 游戏开发 | 20 | 🤝 支持部 | 8 |
| 💰 付费媒体 | — | 📋 项目管理 | 6 |
| 🥽 空间计算 | 6 | 📖 学术部 | 6 |
| 📦 产品部 | 5 | 🚚 供应链 | 3 |
| 🏦 金融部 | 3 | 👔 人力资源 | 2 |
| ⚖️ 法务部 | 2 | | |

其中 **45 个中国原创角色**（微信、抖音、小红书、飞书、钉钉等）

## 技术架构

### 前端

- 纯 HTML/CSS/JS 单页应用，无框架依赖
- 深色主题，CSS 变量驱动设计系统
- SSE (Fetch + ReadableStream) 实现流式通信
- 结构化事件解析 + 正则兜底双重策略

### 后端

- Express 4.x 静态文件服务 + REST API + SSE 流式转发
- `child_process.spawn` 调用 `ao` CLI，实时转发 stdout/stderr
- `parseAoOutput()` 解析 CLI 中文输出为结构化事件（支持 ANSI 转义码清理、Emoji + Unicode 变体选择器处理）
- `fixAgentsDir()` 自动修复 `ao compose` 生成的 YAML 中 `agents_dir` 为 `agency-agents-zh`（CLI 默认生成 `agency-agents` 会导致运行报错）
- `res.on('close')` + SSE 心跳确保连接稳定性

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `AO_CWD` | `D:/SourceCode/agency-agents-zh` | agency-orchestrator 工作目录（`ao` 命令执行路径） |
| `PORT` | `3000` | 服务端口 |

## 许可证

MIT License — 自由使用，商业或个人均可。
