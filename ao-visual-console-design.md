## AO 可视化控制台设计说明

### 1. 背景与目标

**背景**

- `agency-orchestrator` 通过 `ao` CLI 提供强大的多角色协作编排能力，但当前主要以命令行形式使用，对非工程用户不够友好。
- 已有能力包括：
  - `ao compose`：一句话自动选择角色、自动设计 DAG、生成并运行工作流。
  - `ao run`：运行已有 YAML 工作流模板。
  - `ao roles`：列出所有可用角色。
  - `ao init`：交互式创建工作流。
  - `ao validate`：校验工作流 YAML（不执行）。
  - `ao plan`：查看执行计划（DAG）。
  - `ao explain`：用自然语言解释执行计划。
  - `ao serve`：启动 MCP Server（供 Claude Code / Cursor 调用）。
  - `ao demo`：零配置体验多智能体协作。
- 角色定义来自 `agency-agents-zh`，规模：
  - **17 个部门分类**：工程、设计、营销、付费媒体、销售、金融、HR、法务、供应链、产品、项目管理、测试、支持、专项、空间计算、游戏开发、学术
  - **180 个 AI 角色**：其中 45 个中国市场原创（中国电商、微信生态、政务等）
  - **21 个工具**：Code Interpreter、Brave Search、Dalle3、Figma、Github 等

**目标**

- 提供一个 Web 端"AO 可视化控制台"，实现：
  - **可视化选择并执行 `ao` 命令**（`run / compose / plan / roles / init` 的核心子集）。
  - **选择单个角色直接运行**（包装成单步工作流）。
  - **组合多个角色并运行自定义工作流**。
  - **一句话自动组合角色并运行**（对等于 `ao compose "..." --run`）。
- 面向目标用户：
  - 想要用多 AI 角色协作，但不熟悉命令行 / YAML 的产品经理、运营、创作者。
  - 想快速调试工作流、选择角色组合的工程师。

### 2. 使用场景（User Stories）

- **场景 A：一句话自动组合角色并运行**
  - 用户输入一句自然语言需求，例如："我是一个程序员，想用 AI 做自媒体副业，目标月入 2 万，帮我做完整规划"。
  - 选择语言（中文/英文）与 Provider（可选）。
  - 点击"编排并运行"，系统等价执行 `ao compose "<描述>" --run [--provider xxx]`。
  - SSE 实时推送执行进度，界面展示：
    - 自动选中的角色列表与关系（简易 DAG 视图）。
    - 每步执行状态（⏳ 运行中 / ✅ 完成 / ❌ 错误）与耗时、token 数。
    - 实时日志与执行汇总。

- **场景 B：可视化选择角色，组合成工作流并运行**
  - 用户从"角色库"中浏览或搜索角色（按领域分类：产品、工程、设计、运营、财务等）。
  - 通过点击「+」按钮将角色加入"构建画布"。
  - 为工作流设置名称与 Provider。
  - 一键生成 YAML 预览，确认后点击"运行"，等价调用 `ao run`。

- **场景 C：选择单个角色直接运行**
  - 用户选择一个角色（如 "engineering/engineering-code-reviewer"）。
  - 输入一个简短任务描述和输入内容（例如粘贴代码 / 文本）。
  - 控制台生成一个单步工作流 YAML 并运行，输出该角色的结果。

- **场景 D：可视化选择模板工作流并运行**
  - 在"模板库"区域，罗列仓库已有的内置 YAML（例如 `workflows/*.yaml`）。
  - 用户选中一个模板，可预览 YAML 和步骤。
  - 点击运行，相当于 `ao run workflows/xxx.yaml --input key=value`。

### 3. 功能范围（Scope）

**在范围内（已实现）**

- Web 页面单页应用（纯 HTML + CSS + Vanilla JS，无框架依赖）。
- 四大主功能区：
  - **自动编排**：一句话描述 → 自动选角色与 DAG → SSE 流式执行 → 实时进度展示。
  - **工作流构建**：角色搜索/选择 → 画布组装 → 生成 YAML 预览 → 运行。
  - **角色浏览**：可视化展示角色列表，支持关键字搜索及按分类过滤。
  - **模板库**：按分类展示内置模板，支持运行和 YAML 预览。
- **运行结果展示区**：
  - 工作流步骤卡片（实时状态：等待/运行中/完成/错误）。
  - DAG 有向无环图可视化。
  - 实时日志终端（SSE 流式更新）。
  - YAML 语法高亮预览。
- **后端服务**：
  - Express REST API + SSE 流式转发。
  - `ao` CLI 子进程调用与输出解析。
  - 结构化事件解析（`parseAoOutput()`）。

**不在范围内（当前版本）**

- 完整可拖拽 DAG 画布与复杂图可视化（第一版采用列表 + 简单依赖显示）。
- 用户登录、权限、多租户。
- 工作流版本管理、历史记录（但可通过 `ao-output/` 目录查看历史运行结果）。
- 与实际 LLM Provider 的配置管理界面（可用简单下拉模拟）。
- 单角色独立视图（当前通过后端 API 生成单步 YAML 执行）。

### 3.1 角色库完整分类（17 个部门，180 个角色）

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AI 角色库总览                                  │
├─────────────────────────────────────────────────────────────────────┤
│  📊 总计：180 个角色 | 17 个部门 | 21 个工具支持                       │
├─────────────────────────────────────────────────────────────────────┤
│  📢 营销部 (33)    🔬 专项部 (29)    🛠️ 工程部 (27)                   │
│  🎮 游戏开发 (20)  🧪 测试部 (9)     💰 付费媒体 (7)                  │
│  🎨 设计部 (8)    🤝 支持部 (8)      💼 销售部 (8)                    │
│  📋 项目管理 (6)  🥽 空间计算 (6)    📖 学术部 (6)                    │
│  📦 产品部 (5)    🚚 供应链 (3)      🏦 金融部 (3)                    │
│  👔 人力资源 (2)  ⚖️ 法务部 (2)                                     │
├─────────────────────────────────────────────────────────────────────┤
│  🌟 中国原创 (45)：微信小程序、飞书、钉钉、抖音、小红书、电商、私域等      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 部门角色详细列表

| 部门 | 角色数 | 核心角色示例 |
|------|--------|-------------|
| **营销部** | 33 | 小红书运营专家、抖音策略师、微信公众号运营、B站内容策略师、直播电商主播教练、知识付费产品策划师 |
| **工程部** | 27 | 前端开发者、后端架构师、AI工程师、安全工程师、微信小程序开发者、飞书集成开发、钉钉集成开发 |
| **专项部** | 29 | 提示词工程师、留学规划顾问、政务数字化售前顾问、高考志愿填报顾问、MCP构建器、文档生成器 |
| **游戏开发** | 20 | Unity架构师、Unreal系统工程师、Godot游戏脚本开发者、Roblox体验设计师 |
| **测试部** | 9 | API测试员、性能基准师、无障碍审核员、嵌入式测试工程师 |
| **设计部** | 8 | UI设计师、UX研究员、图像提示词工程师、视觉叙事师 |
| **销售部** | 8 | 客户拓展策略师、赢单策略师、Discovery教练、Pipeline分析师 |
| **付费媒体** | 7 | 付费媒体审计师、PPC竞价策略师、程序化广告采买专家 |
| **支持部** | 8 | 客服响应者、数据分析师、高管摘要师、基础设施运维师 |
| **项目管理** | 6 | 高级项目经理、实验追踪员、Jira工作流管家 |
| **空间计算** | 6 | visionOS空间工程师、XR界面架构师、XR沉浸式开发者 |
| **学术部** | 6 | 人类学家、历史学家、叙事学家、心理学家、学习规划师 |
| **产品部** | 5 | 产品经理、趋势研究员、Sprint排序师 |
| **供应链** | 3 | 库存预测专家、供应商评估专家、物流路线优化师 |
| **金融部** | 3 | 财务预测分析师、发票管理专家、金融风控分析师 |
| **HR** | 2 | 招聘专家、绩效管理专家 |
| **法务部** | 2 | 合同审查专家、制度文件撰写专家 |

#### 角色搜索示例

| 搜索关键字 | 匹配角色 |
|------------|----------|
| `安全` | 安全工程师、威胁检测工程师、区块链安全审计师 |
| `代码审查` | 代码审查员 |
| `小红书` | 小红书运营专家、小红书专家 |
| `抖音` | 抖音策略师 |
| `微信` | 微信公众号运营、微信小程序开发者 |
| `飞书` | 飞书集成开发工程师 |
| `钉钉` | 钉钉集成开发工程师 |
| `简历` | 招聘专家、简历优化 |
| `面试` | 面试题设计 |
| `商业` | 商业计划书、财务预测分析师 |

### 4. 信息架构与页面区块

**4.1 页面整体布局**

采用 **顶栏 + 侧边图标栏 + 主面板** 三区布局：

- **顶栏（Topbar）**：
  - 左侧：Logo 🔗 + "Agency Orchestrator" 标题。
  - 中间：四大功能导航按钮（✨ 自动编排 / 🎯 工作流构建 / 👥 角色库 / 📋 模板）。
  - 右侧：LLM Provider 下拉、语言切换下拉、连接状态指示灯 + `ao` 版本号。

- **侧边图标栏（Sidebar）**：
  - 竖排图标快捷入口，与顶栏导航同步。
  - 底部：设置（⚙️）、帮助（❓）。

- **主面板（Main Panel）**：
  - 根据当前激活的视图切换内容。

**4.2 视图一：自动编排（默认视图）**

采用左右分栏布局：

- **左侧操作面板**：
  - 需求描述文本域（5 行，支持中文和英文描述）。
  - 角色语言选择（自动检测 / 中文 / 英文）。
  - 并发数输入（默认 2，1-10）。
  - 最大步骤数（默认 6，1-20）。
  - 超时秒数（默认 300，30-3600）。
  - 生成后自动执行工作流复选框（默认勾选，对应 `--run`）。
  - 快速示例列表（5 个示例，点击填入）。
  - 底部按钮：「📝 生成 YAML」+「▶ 编排并运行」。

- **右侧运行视图区**：
  - **统计栏**：角色数 / 步骤 / 并发 / 状态 + 运行指示器。
  - **输出标签页**（4 个）：
    - 📊 **工作流**：步骤卡片列表，实时更新状态（○ 等待 / ⟳ 运行中 / ✓ 完成 / ✗ 错误）。
    - 🔀 **DAG 图**：垂直排列的有向无环图（开始 → 步骤节点 → 输出）。
    - 📟 **实时日志**：终端风格的滚动日志区，带时间戳和颜色分类。
    - 📄 **YAML**：语法高亮的 YAML 源码预览。
  - 清空按钮。

**4.3 视图二：工作流构建**

采用左右分栏布局：

- **左侧角色选择器**：
  - 搜索框：支持关键字模糊匹配。
  - 角色列表（最多显示 60 个）：角色名 + emoji + 「+」添加按钮。
  - 底部：工作流名称输入 + 清空/运行按钮。

- **右侧构建画布**：
  - 顶部：画布标题 + 步骤计数 + 「📄 导出 YAML」按钮。
  - 画布区域：已添加的步骤卡片，步骤之间用「→ 下一步」连接。
  - 每个步骤卡片：序号 + emoji + 名称 + 部门描述 + ✕ 删除按钮。
  - 空状态提示："从左侧角色库点击「+ 添加」"。

**4.4 视图三：角色库**

采用左侧导航 + 右侧网格布局：

- **左侧部门导航**：
  - "全部"（带总数）+ 17 个部门分类项（名称 + 角色数）。
  - 点击筛选右侧列表。

- **右侧角色网格**：
  - 工具栏：搜索框 + 角色计数 + 「批量添加到构建器」按钮。
  - 角色卡片网格：
    - emoji 头像 + 名称 + 部门。
    - 简短描述。
    - 工具标签 + 「原创」标记。
  - 点击卡片选中/取消选中。

**4.5 视图四：模板库**

采用顶部工具栏 + 网格布局：

- **顶部**：标题 + 描述 + 搜索框。
- **模板卡片网格**：
  - 图标（颜色轮换）+ 标题 + 描述。
  - 底部：分类标签 + 步骤数 + 「运行」+「预览」按钮。

### 5. 与 AO 引擎的集成方式

**5.1 后端 API 接口（已实现）**

**查询类接口**

```typescript
// GET /api/status - 健康检查
// 出参：{ ok: boolean, aoVersion?: string, cwd: string, agentsDir: string, workflowsDir: string }
app.get('/api/status', async (req, res) => { ... });

// GET /api/roles - 获取角色目录（按部门分组）
// 出参：{ success: boolean, total: number, categories: CategoryGroup[], roles: AgentCatalog[] }
app.get('/api/roles', async (req, res) => { ... });

// GET /api/workflows - 获取工作流模板列表（按分类分组）
// 出参：{ success: boolean, total: number, categories: WorkflowCategoryGroup[], workflows: Workflow[] }
app.get('/api/workflows', async (req, res) => { ... });

// GET /api/workflow/:id - 获取指定工作流详情
// 出参：{ success: boolean, workflow: WorkflowDefinition, yaml: string }
app.get('/api/workflow/:id(*)', async (req, res) => { ... });

// GET /api/outputs - 获取历史运行输出列表
// 出参：{ success: boolean, outputs: OutputEntry[] }
app.get('/api/outputs', async (req, res) => { ... });
```

**编排与执行类接口（同步）**

```typescript
// POST /api/compose - 自动编排（仅生成 YAML，不执行）
// 入参：{ description: string, provider?: string, lang?: 'zh'|'en', concurrency?: number, autoRun: false }
// 出参：{ code: number, stdout: string, stderr: string, yaml?: string, yamlPath?: string }
app.post('/api/compose', async (req, res) => { ... });

// POST /api/run - 运行指定工作流（同步等待）
// 入参：{ workflowId?, workflowYaml?, workflowPath?, inputs?, resume?, provider? }
// 出参：{ code: number, stdout: string, stderr: string, success: boolean }
app.post('/api/run', async (req, res) => { ... });

// POST /api/single-role/run - 单角色运行（同步等待）
// 入参：{ role: string, task: string, inputText?: string, provider?: string, model?: string }
// 出参：{ code: number, stdout: string, stderr: string, success: boolean }
app.post('/api/single-role/run', async (req, res) => { ... });

// POST /api/template/run - 运行内置模板工作流
// 入参：{ workflowId: string, inputs?: Record<string, string> }
// 出参：{ code: number, stdout: string, stderr: string, success: boolean }
app.post('/api/template/run', async (req, res) => { ... });

// POST /api/validate - 校验工作流 YAML
// 入参：{ workflowYaml?, workflowPath? }
// 出参：{ code: number, stdout: string, stderr: string }
app.post('/api/validate', async (req, res) => { ... });

// POST /api/plan - 查看执行计划
// 入参：{ workflowYaml?, workflowPath?, explain?: boolean }
// 出参：{ code: number, stdout: string, stderr: string }
app.post('/api/plan', async (req, res) => { ... });
```

**工作流管理类接口**

```typescript
// POST /api/workflow/build - 构建工作流 YAML（对象 → YAML）
// 入参：{ workflow: WorkflowDefinition }
// 出参：{ success: boolean, yaml: string }
app.post('/api/workflow/build', async (req, res) => { ... });

// POST /api/workflow/save - 保存工作流到 workflows/ 目录
// 入参：{ workflow: WorkflowDefinition, fileName?: string }
// 出参：{ success: boolean, path: string, name: string }
app.post('/api/workflow/save', async (req, res) => { ... });

// POST /api/workflow/run - 构建并运行自定义工作流
// 入参：{ workflow: WorkflowDefinition, inputs?, resume? }
// 出参：{ code: number, stdout: string, stderr: string, generatedYaml: string }
app.post('/api/workflow/run', async (req, res) => { ... });
```

**5.2 SSE 流式接口（已实现）**

三个 SSE 流式端点，均采用相同的事件协议：

```typescript
// POST /api/compose/stream - 流式执行 compose
// 入参：{ description, provider?, lang?, autoRun?, concurrency? }

// POST /api/run/stream - 流式运行工作流
// 入参：{ workflowId?, workflowYaml?, inputs?, resume? }

// POST /api/single-role/run/stream - 流式执行单角色
// 入参：{ role, task, inputText?, provider?, model? }
```

**SSE 事件协议**

所有 SSE 端点设置 `Content-Type: text/event-stream`，发送心跳 `:\n\n`，并推送以下结构化事件：

```typescript
// SSE 事件类型定义
type SSEEvent =
  | { type: 'plan', steps: PlanStep[] }           // 参与者列表解析
  | { type: 'step', index?, id?, emoji, name,      // 步骤开始执行
      status: 'running'|'done'|'error',
      role, duration?, summary? }
  | { type: 'step_result', currentStep,            // 步骤执行详情
      totalSteps, emoji, name, stepType, index }
  | { type: 'step_done', status: 'done'|'error',   // 单步完成/失败
      duration: string, tokens: string }
  | { type: 'summary', completed, total,           // 执行汇总
      duration, tokens }
  | { type: 'meta', stepCount?,                     // 元数据更新
      workflowName?, yamlGenerated?,
      outputDir?, executing? }
  | { type: 'stdout', text: string }                // 原始标准输出
  | { type: 'stderr', text: string }                // 原始错误输出
  | { type: 'close', code: number,                  // 进程结束
      success: boolean, steps?: PlanStep[] }

interface PlanStep {
  id: string;        // "step_1"
  emoji: string;     // "✍️"
  name: string;      // "技术文档工程师"
  role: string;      // 同 name
  status: string;    // "pending"
  dept: string;
  desc: string;
}
```

**5.3 后端输出解析器（parseAoOutput）**

后端通过 `parseAoOutput(text)` 函数解析 `ao` CLI 的中文输出，将其转换为结构化事件推送给前端：

```typescript
// 解析规则（正则匹配中文输出格式）
function parseAoOutput(text: string): SSEEvent[] {
  // 1. 清理 ANSI 转义码
  const clean = text.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
                    .replace(/\x1b\[K/g, '');

  // 2. 解析参与者列表
  // "参与者: ✍️ 技术文档工程师 | 🎯 现实检验者"
  /参与者[:：]\s*(.+)/ → { type: 'plan', steps: [...] }

  // 3. 解析元数据
  // "步骤数: 2 | 并发: 1 | 模型: deepseek-reasoner"
  /步骤数[:：]\s*(\d+)/ → { type: 'meta', stepCount: N }

  // "工作流: 生成一句测试用例"
  /工作流[:：]\s*(.+)/ → { type: 'meta', workflowName: '...' }

  // 4. 解析步骤开始
  // "⏳ ✍️ 技术文档工程师 执行中 ..."
  /[⏳▶]\s*...执行中/u → { type: 'step', status: 'running' }

  // 5. 解析步骤结果
  // "── [1/2] ✍️ 技术文档工程师 (draft) ──"
  /[─]+\s*\[(\d+)\/(\d+)\].../u → { type: 'step_result', ... }

  // 6. 解析步骤完成
  // "完成 | 2.2s | 5262 tokens"
  /(完成|失败|错误)\s*\|\s*([\d.]+)\s*s\s*\|\s*([\d,]+)\s*tokens/
  → { type: 'step_done', status, duration, tokens }

  // 7. 解析执行汇总
  // "完成: 2/2 步 | 9.4s | 9267 tokens"
  /完成[:：]\s*(\d+)\/(\d+)\s*步.../ → { type: 'summary', ... }

  // 8. 兼容旧版英文格式
  // "✅ 🔭 趋势研究员    31.3s  → 摘要"
  /(✅|❌|⏳)\s*...→/mu → { type: 'step', ... }
}
```

**Emoji 解析**：支持 Unicode Emoji + 变体选择器（U+FE0F），使用 `\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F?` 正则匹配，确保 `✍️`（写字手势 + 变体选择器）等 emoji 正确解析。

**5.4 SSE 连接稳定性**

```typescript
// 关键实现：使用 res.on('close') 而非 req.on('close') 检测客户端断连
// 原因：Express 的 req.on('close') 在 POST 请求中会立即触发，导致子进程被误杀
res.on('close', () => { child.kill(); });

// SSE 心跳：flushHeaders 后立即发送心跳包
res.flushHeaders();
res.write(':\n\n'); // SSE 注释行，浏览器会忽略
```

**5.5 角色数据来源**

```typescript
// 角色目录数据结构
interface AgentCatalog {
  path: string;        // 如 "engineering/engineering-code-reviewer"
  name: string;        // 如 "代码审查员"
  emoji: string;       // 如 "🔍"
  description: string; // 简短描述
  category: string;    // 部门分类名（如 "工程部"）
  categoryKey: string; // 部门目录名（如 "engineering"）
  categoryEmoji: string; // 部门 emoji（如 "🛠️"）
  tools?: string[];   // 支持的工具
  original?: boolean;  // 是否中国原创
}

// 数据来源：
// 1. 后端解析：读取 agency-agents-zh/<category>/<role>.md 的 frontmatter
// 2. 前端降级：使用内嵌的 src/data/agent-catalog.js 静态数据
```

**5.6 工作流 YAML Schema（完整版）**

```yaml
name: "工作流名称"                    # 必填
description: "简短描述"               # 可选

agents_dir: "agency-agents-zh"       # 必填：角色目录

llm:                                 # 必填
  provider: "deepseek"               # 必填
  model: "deepseek-chat"             # 可选（CLI providers 可省略）
  max_tokens: 4096                   # 可选，默认 4096
  timeout: 120000                    # 可选，默认 120000ms
  retry: 3                           # 可选，默认 3

concurrency: 2                       # 可选，最大并行步骤数

inputs:                              # 可选，输入变量定义
  - name: prd_content                # 必填
    description: "PRD 内容"         # 可选
    required: true                   # 可选，是否必填
    default: "xxx"                   # 可选，默认值

steps:                               # 必填，步骤列表
  - id: step_1                       # 必填，步骤唯一 ID
    role: "product/product-manager"  # 必填，角色路径
    name: "自定义名称"                # 可选，覆盖角色 name
    emoji: "📋"                      # 可选，覆盖角色 emoji
    task: |                          # 必填，任务描述
      请分析以下需求：
      {{prd_content}}
    output: requirements             # 可选，输出变量名
    depends_on: []                   # 可选，依赖的步骤 ID
    depends_on_mode: "all"           # 可选：all | any_completed
    condition: ""                    # 可选，条件表达式
    type: "normal"                   # 可选：normal | approval
    prompt: ""                       # 可选，approval 类型的提示
    llm:                             # 可选，步骤级 LLM 覆盖
      provider: "deepseek"
      model: "deepseek-chat"
    loop:                            # 可选，循环配置
      back_to: "step_id"             # 跳回的步骤 ID
      max_iterations: 5              # 最大循环次数（1-10）
      exit_condition: ""             # 退出条件表达式
```

**5.7 LLM Provider 配置对照表**

| Provider | 配置 | 环境变量 | 说明 |
|----------|------|----------|------|
| `deepseek` | `--provider deepseek` | `DEEPSEEK_API_KEY` | API 付费（默认选项） |
| `claude-code` | `--provider claude-code` | - | Claude 会员，免费 |
| `gemini-cli` | `--provider gemini-cli` | - | Google 账号，免费 1000 次/天 |
| `copilot-cli` | `--provider copilot-cli` | - | GitHub Copilot 会员 |
| `ollama` | `--provider ollama` | - | 本地模型，免费 |

### 6. 交互流程（详细）

**自动编排流程（SSE 流式）**

1. 用户在"自动编排"视图输入一句话需求，选择 Provider、语言、并发数。
2. 点击「▶ 编排并运行」。
3. 前端调用 `apiSSE('/api/compose/stream', body, onEvent, onDone)`。
4. 后端执行 `ao compose "描述" --provider xxx --run`，spawn 子进程。
5. 后端 `parseAoOutput()` 实时解析 CLI 输出为结构化事件，通过 SSE 推送：
   - `plan` 事件 → 前端渲染步骤卡片（○ 等待状态）。
   - `step`/`step_result` 事件 → 前端更新步骤为 ⟳ 运行中。
   - `step_done` 事件 → 前端更新步骤为 ✓ 完成 / ✗ 错误（含耗时、token）。
   - `summary` 事件 → 前端显示执行汇总。
   - `stdout`/`stderr` 事件 → 前端写入实时日志（已解析的行不重复写入）。
6. `close` 事件 → 前端更新最终状态，渲染 DAG 图。
7. 前端同时具有正则兜底解析：若后端未发送结构化事件，仍能从 `stdout` 中提取步骤信息。

**角色组合工作流流程**

1. 用户在角色库里搜索或浏览角色（17 个部门分类）。
2. 点击角色旁的「+」按钮，将角色加入"构建画布"。
3. 在画布中查看步骤顺序，可删除步骤。
4. 设置工作流名称，选择 Provider。
5. 点击「▶ 运行」→ 前端构建工作流对象，调用 `POST /api/workflow/run`（同步）。
6. 点击「📄 导出 YAML」→ 调用 `POST /api/workflow/build` 生成 YAML 预览。

**单角色运行流程**

1. 用户在后端调用 `POST /api/single-role/run`。
2. 后端生成临时单步 YAML（包含 `input_text` 输入变量）。
3. 执行 `ao run <临时文件> --input input_text=xxx`。
4. 返回结果后自动清理临时文件。
5. SSE 版本（`/api/single-role/run/stream`）支持流式输出。

**模板工作流流程**

1. 用户在"模板库"视图中浏览分类模板。
2. 点击「运行」→ 前端调用 `apiSSE('/api/run/stream', { workflowId })`。
3. SSE 流式展示执行过程（同自动编排流程）。
4. 点击「预览」→ 调用 `GET /api/workflow/:id` 获取 YAML，语法高亮显示。

### 7. DAG 可视化设计

**当前实现：垂直列表 + 箭头连接**

```
  ┌──────────────────┐
  │ 🎯 开始          │
  │ 用户输入          │
  └────────┬─────────┘
           ↓
  ┌──────────────────┐
  │ ✍️ 技术文档工程师 │
  │ 工程部            │
  └────────┬─────────┘
           ↓
  ┌──────────────────┐
  │ 🎯 现实检验者    │
  │ 专项部            │
  └────────┬─────────┘
           ↓
  ┌──────────────────┐
  │ ✅ 输出          │
  │ 最终报告          │
  └──────────────────┘
```

- 开始节点：🎯 用户输入
- 步骤节点：emoji + 角色名 + 部门
- 结束节点：✅ 输出 / 最终报告
- 并行步骤标记为 `parallel` 类（视觉区分）

**后续版本：拖拽 DAG 画布**

```
┌─────────────────────────────────────────────────────────────┐
│  DAG 编辑器画布                                              │
│                                                              │
│   [🔭 趋势研究员] ───────────┐                              │
│        │                      │                              │
│        ▼                      ▼                              │
│   [📱 平台分析师]      [💰 财务规划师]  ← 可拖拽节点        │
│        │                      │                              │
│        └──────────┬────────────┘                              │
│                   ▼                                          │
│            [✍️ 内容策略师]                                    │
│                   │                                          │
│                   ▼                                          │
│            [📋 执行规划师]                                    │
│                                                              │
│  [+ 添加步骤]  [自动布局]  [导出 PNG]                        │
└─────────────────────────────────────────────────────────────┘
```

### 8. 错误处理与状态管理

**错误类型与处理策略**

| 错误类型 | 触发场景 | 处理方式 | UI 反馈 |
|----------|----------|----------|---------|
| 网络请求失败 | API 调用失败 | 前端 `catch` 捕获 | Toast 错误提示 + 日志 |
| YAML 语法错误 | 工作流 YAML 不合法 | 调用 `ao validate` 定位错误 | 高亮错误行，提示修改 |
| 步骤执行失败 | LLM 调用失败/超时 | `ao` CLI 自动重试 | 步骤卡片 ✗ 错误 + 日志 |
| API Key 缺失 | 未配置 Provider Key | CLI 返回错误 | 日志显示错误信息 |
| 角色不存在 | role 路径错误 | CLI 返回错误 | 日志显示错误信息 |
| SSE 连接断开 | 网络波动 | `res.on('close')` 终止子进程 | 日志显示"执行异常退出" |
| ANSI 解析失败 | CLI 输出格式变化 | `parseAoOutput()` 返回空数组 | 降级为纯文本日志 |

**执行状态流转**

```
[就绪] → [编排中] → [运行中] → [✅ 完成]
   ↓        ↓          ↓
 [错误]   [错误]    [❌ 失败]
```

前端状态管理：
- `isRunning`：全局锁，防止并发运行。
- `discoveredSteps[]`：运行中追踪发现的步骤。
- 步骤状态：`pending` → `running` → `done` / `error`。
- 统计栏实时更新：角色数、步骤数、并发数、状态。

**断点续跑（Resume）**

```bash
# 场景：某步骤失败后修复了输入数据，需要从该步骤重新运行
ao run workflow.yaml --resume last

# 场景：基于指定版本继续
ao run workflow.yaml --resume ao-output/具体目录/
```

前端通过 `POST /api/run` 的 `resume: true` 参数触发。

### 9. 技术实现（已实现）

**前端技术栈**

```javascript
// 纯 HTML + Vanilla JS（已实现）
// - 深色主题 CSS 变量设计系统
// - SSE 流式通信（Fetch + ReadableStream）
// - 结构化事件解析 + 正则兜底双重策略
// - 零框架依赖，单文件架构
```

**后端技术栈**

```javascript
// Express.js 4.x（已实现）
// - REST API + SSE 流式转发
// - child_process.spawn 调用 ao CLI
// - parseAoOutput() 结构化事件解析
// - res.on('close') + SSE 心跳确保连接稳定性
// - ANSI 转义码清理
// - Emoji + Unicode 变体选择器处理
```

**与 ao CLI 集成方式**

```javascript
// 方式 1：spawn 子进程（已实现）
const { spawn } = require('child_process');
const child = spawn('ao', ['compose', description], { cwd: AO_CWD, shell: true });

// 同步模式：等待子进程结束后返回完整结果
// 流式模式：实时监听 stdout/stderr，解析并通过 SSE 推送
```

**目录结构（已实现）**

```
agency-agents-html/
├── ao-console.html          # 前端可视化界面
├── ao-console.js            # 前端交互逻辑
├── ao-console.css           # 前端样式（深色主题）
├── server.js                # Express 后端服务
├── package.json             # 项目配置
├── src/
│   └── data/
│       └── agent-catalog.js # 角色库前端降级数据
├── oripic/                  # 设计原型文档与截图
├── tmp-workflows/           # 临时工作流文件（自动清理）
├── ao-outputs/              # 运行输出目录
├── CODE_REVIEW.md           # 代码质量审查报告
└── ao-visual-console-design.md  # 本设计文档
```

### 10. 可扩展性与后续迭代方向

**v0.2 迭代方向**

- [x] SSE 流式通信（已替代轮询）
- [x] 结构化事件解析（`parseAoOutput()`）
- [x] 实时步骤进度展示
- [ ] 真正的 DAG 画布（拖拽连线、节点编辑）
- [ ] 工作流保存 / 分享 / 导入导出
- [ ] 与 `ao demo` 深度集成，为首次访问用户展示演示工作流
- [ ] 直接在页面中编辑和保存 YAML 文件
- [ ] 角色收藏与最近使用记录

**v0.3 迭代方向**

- [ ] WebSocket 实时通信（替代 SSE，支持双向通信）
- [ ] 多语言界面（中文 / English）
- [ ] 工作流版本管理
- [ ] 自定义角色上传
- [ ] 团队协作与权限管理
- [ ] 单角色独立视图（脱离自动编排）

**v0.4+ 迭代方向**

- [ ] 云端执行（无需本地安装 ao）
- [ ] 工作流市场（模板分享社区）
- [ ] API 调用统计与计费
- [ ] 与更多 AI 编程工具集成
- [ ] 企业 SSO 登录
