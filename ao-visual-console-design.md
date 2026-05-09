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
  - **16 个部门分类**：工程、设计、营销、付费媒体、销售、金融、HR、法务、供应链、产品、项目管理、测试、支持、专项、空间计算、游戏开发、学术
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
  - 点击"自动编排并运行"，系统等价执行 `ao compose "<描述>" --run [--provider xxx]`。
  - 界面展示：
    - 自动选中的角色列表与关系（简易 DAG 视图）。
    - 实时执行日志、每一步的输出摘要。
    - 最终合并结果全文。

- **场景 B：可视化选择角色，组合成工作流并运行**
  - 用户从"角色库"中浏览或搜索角色（按领域分类：产品、工程、设计、运营、财务等）。
  - 通过勾选方式将角色加入"工作流画布"。
  - 为每个角色设置：
    - 步骤 ID（snake_case）。
    - 任务描述 Task。
    - 输出变量名 output。
    - 依赖关系（拖拽或选择"依赖于哪个步骤"）。
  - 一键生成 YAML 预览，确认后点击"运行工作流"，等价调用 `ao run` 对该 YAML。

- **场景 C：选择单个角色直接运行**
  - 用户选择一个角色（如 "engineering/engineering-code-reviewer"）。
  - 输入一个简短任务描述和输入内容（例如粘贴代码 / 文本）。
  - 控制台生成一个单步工作流 YAML 并运行，输出该角色的结果。

- **场景 D：可视化选择模板工作流并运行**
  - 在"工作流模板"区域，罗列仓库已有的内置 YAML（例如 `workflows/*.yaml`）。
  - 用户选中一个模板，填写必要的 inputs（如 idea、prd_content 等）。
  - 点击运行，相当于 `ao run workflows/xxx.yaml --input key=value`。

### 3. 功能范围（Scope）

**在范围内**

- Web 页面单页应用（可先实现静态 HTML + 轻量 JS，再逐步接入真实后端）。
- 四大主功能区：
  - **命令面板**：选择要执行的 AO 命令与基础参数。
  - **角色浏览与选择**：可视化展示角色列表，支持关键字搜索及按分类过滤。
  - **工作流构建器**：角色组合、步骤配置、依赖关系编辑、生成 YAML 预览。
  - **自动编排区域**：一句话描述 → 自动选角色与 DAG → 预览 → 运行。
- **运行结果展示区**：
  - 全局日志（近似 CLI 输出格式）。
  - 步骤执行进度条或时间线。
  - 单步输出摘要 + 最终结果详情。

**不在范围内（当前版本）**

- 完整可拖拽 DAG 画布与复杂图可视化（第一版采用列表 + 简单依赖显示）。
- 用户登录、权限、多租户。
- 工作流版本管理、历史记录（但可通过 `ao-output/` 目录查看历史运行结果）。
- 与实际 LLM Provider 的配置管理界面（可用简单下拉模拟）。

### 3.1 角色库完整分类（16 个部门，180 个角色）

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AI 角色库总览                                  │
├─────────────────────────────────────────────────────────────────────┤
│  📊 总计：180 个角色 | 16 个部门 | 21 个工具支持                       │
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

- 顶部：**全局头部**
  - 左侧：Logo + "Agency Orchestrator 控制台"标题。
  - 中间：当前项目说明 / 文档链接。
  - 右侧：语言切换（中文/English）、Provider 选择（简化为下拉）。

- 中间采用左右分栏布局：
  - 左侧：**操作面板区**（命令模式切换 + 参数配置）。
  - 右侧：**运行视图区**（工作流结构预览 + 日志 + 输出）。

- 底部：**状态栏**
  - 当前 AO CLI 版本 / 当前工作目录 / 提示信息。

**4.2 左侧操作面板区**

- **模块 1：命令模式切换**
  - Tab 切换：
    - "自动编排"（auto compose）
    - "角色组合工作流"（manual workflow）
    - "单角色运行"（single role）
    - "模板工作流"（templates）

- **模块 2：自动编排（对应 ao compose）**
  - 字段：
    - 文本域：`需求描述`（支持中文和英文描述）
    - 单选：语言（自动 / 中文 / 英文）
    - 下拉：Provider（deepseek / claude-code / gemini-cli / copilot-cli / codex-cli / openclaw / hermes-cli / ollama）
    - 文本框：自定义模型（可选，CLI providers 可省略）
    - 文本框：并行度 concurrency（默认 2）
    - 复选：`生成后自动运行`（默认勾选，对应 `--run`）
  - 按钮：
    - "只生成 YAML" → 只调用 `ao compose`，展示 YAML，不运行。
    - "自动编排并运行" → 相当于 `ao compose "<描述>" --run`。
  - 示例需求：
    ```
    "我是一个程序员，想用 AI 做自媒体副业，目标月入 2 万"
    "帮我分析做一个 AI 记账工具的可行性"
    "用 10 万块启动一个 AI 教育项目"
    ```

- **模块 3：角色组合工作流**
  - **角色库浏览器**：
    - 左侧分类树（16 个部门，可折叠展开）
    - 右侧角色卡片列表：角色名 + emoji + 简短描述 + 工具标签 + "添加" 按钮
    - 搜索框：支持关键字模糊匹配（如 "安全"、"代码审查"）
  - **已选角色工作流编辑器**：
    - 每个角色项可编辑：
      - 步骤 ID（自动生成，可修改）
      - Task 描述（textarea，支持 `{{变量}}`）
      - 输出变量名 output
      - 依赖于（多选下拉，可选多个依赖步骤）
      - 条件判断 condition（如 `"{{category}} contains bug"`）
      - 类型 type：`normal` | `approval`（人工审批）
    - 支持拖拽排序步骤
    - 可视化依赖关系预览
  - **工作流配置**：
    - 工作流名称 name / 描述 description
    - LLM 配置：Provider / Model / max_tokens / timeout / retry
    - 并行度 `concurrency`（默认 2）
    - 输入变量定义 inputs（名称、描述、是否必填、默认值）
  - 按钮：
    - "生成 YAML 预览"
    - "运行该工作流"
    - "保存到 workflows/"

- **模块 4：单角色运行**
  - 角色选择（支持搜索的 dropdown，从 180 个角色中选择）
  - Task 描述输入框（textarea）
  - 输入内容文本域（粘贴代码/文档/文本）
  - LLM 配置（Provider / Model 选择）
  - 按钮：
    - "生成单步工作流并运行"
  - 示例：
    - 角色：`engineering/engineering-code-reviewer`
    - 任务："审查以下代码的安全性和性能问题"

- **模块 5：模板工作流**
  - 模板分类列表（按目录分组）：
    ```
    📁 开发类 (7) - dev/
    📁 营销类 (5) - marketing/
    📁 数据/设计类 (4) - data/, design/
    📁 运维类 (3) - ops/
    📁 战略类 (4) - strategy/, legal/
    📁 HR类 (2) - hr/
    📁 通用类 (14) - 根目录下的通用模板
    ```
  - 选中模板后展示：
    - 模板说明
    - 所需 inputs 列表（自动解析 YAML 中的 inputs 定义）
    - 步骤预览（角色 + emoji + 依赖关系）
  - 用户填写 inputs 值
  - 按钮：
    - "预览 YAML"
    - "运行模板工作流"

**4.3 右侧运行视图区**

- **区域 A：工作流结构预览**
  - 对于自动编排或手动组合：
    - 显示步骤列表：序号、步骤 ID、角色 name + emoji、依赖（文字表示）。
    - 简易并行/串行标记。
  - 对于单角色运行：
    - 显示单步信息。
  - 对于模板：
    - 显示 YAML 文件名和步骤摘要（可以后续接入 `ao plan`）。

- **区域 B：运行日志（近似 ao CLI 输出）**
  - 滚动区域，按照时间追加日志行：
    - 命令行调用展示（`ao compose "..."`）
    - 步骤执行状态（开始 / 成功 / 失败 / 重试）。
    - 错误信息。

- **区域 C：结果展示**
  - 按 tab 切换：
    - "最终结果"：最终汇总内容（完整报告/文章等）。
    - "按步骤查看"：每个步骤的输出摘要，可展开查看详情。
    - "YAML 源码"：当前运行的 workflow YAML。

### 5. 与 AO 引擎的集成方式

> 本设计文档不限定具体技术栈，只定义抽象接口，为后续前后端实现留空间。

**5.1 后端抽象接口完整设计**

```typescript
// POST /api/compose - 生成工作流 YAML
// 入参：{ description, provider?, lang?, autoRun? }
// 出参：{ yaml: string, code: number, stdout: string, stderr: string }
app.post('/api/compose', async (req, res) => {
  const { description, provider, lang, autoRun } = req.body;
  // 调用 ao compose 命令
  const args = ['compose', description];
  if (provider) args.push('--provider', provider);
  if (lang) args.push('--lang', lang);
  if (autoRun) args.push('--run');
  const result = await runAoCommand(args);
  res.json(result);
});

// POST /api/run - 运行指定工作流 YAML
// 入参：{ workflowPath, inputs?: Record<string, string>, resume?: boolean }
// 出参：{ code, stdout, stderr }
app.post('/api/run', async (req, res) => {
  const { workflowPath, inputs, resume } = req.body;
  const args = ['run', workflowPath];
  if (inputs) {
    for (const [k, v] of Object.entries(inputs)) {
      args.push('--input', `${k}=${v}`);
    }
  }
  if (resume) args.push('--resume', 'last');
  res.json(await runAoCommand(args));
});

// POST /api/template/run - 运行内置模板
// 入参：{ workflowId: string, inputs?: Record<string,string> }
app.post('/api/template/run', async (req, res) => {
  const { workflowId, inputs } = req.body;
  const workflowPath = `workflows/${workflowId}.yaml`;
  // ...
});

// POST /api/single-role/run - 单角色运行
// 入参：{ role: string, task: string, inputText?: string, provider?: string }
app.post('/api/single-role/run', async (req, res) => {
  const { role, task, inputText, provider } = req.body;
  // 生成临时单步 YAML 并执行
});

// POST /api/workflow/build - 构建自定义工作流
// 入参：{ workflow: WorkflowDefinition }
// 出参：{ yaml: string, path: string }
app.post('/api/workflow/build', async (req, res) => {
  const { workflow } = req.body;
  // 将 workflow 对象序列化为 YAML
});

// GET /api/roles - 获取角色目录
// 出参：{ roles: AgentCatalog[] }
app.get('/api/roles', async (req, res) => {
  // 调用 ao roles 或直接读取 agency-agents-zh 目录
});

// GET /api/workflows - 获取模板列表
// 出参：{ workflows: WorkflowTemplate[] }
app.get('/api/workflows', async (req, res) => {
  // 读取 workflows/ 目录，返回所有 YAML 文件的元信息
});

// GET /api/workflow/:id - 获取指定工作流详情
// 出参：{ workflow: WorkflowDefinition, yaml: string }
app.get('/api/workflow/:id', async (req, res) => {
  // 读取指定 YAML 文件并解析
});

// GET /api/status - 健康检查
// 出参：{ ok: boolean, aoVersion: string, cwd: string }
app.get('/api/status', async (req, res) => {
  const result = await runAoCommand(['--version']);
  res.json({ ok: true, aoVersion: result.stdout.trim() });
});
```

**5.2 角色数据来源**

```typescript
// 角色目录数据结构
interface AgentCatalog {
  path: string;        // 如 "engineering/engineering-code-reviewer"
  name: string;        // 如 "代码审查员"
  emoji: string;       // 如 "🔍"
  description: string; // 简短描述
  category: string;    // 部门分类
  tools?: string[];   // 支持的工具
  original?: boolean;  // 是否中国原创
}

// 数据来源：
// 1. 读取 agency-agents-zh/*.md 文件（frontmatter + markdown）
// 2. 解析每个角色的 metadata
// 3. 按部门目录分类
```

**5.3 工作流 YAML Schema（完整版）**

```yaml
name: "工作流名称"                    # 必填
description: "简短描述"               # 可选

agents_dir: "agency-agents-zh"       # 必填：角色目录

llm:                                 # 必填
  provider: "deepseek"               # 必填：10 种之一
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
      max_iterations: 5             # 最大循环次数（1-10）
      exit_condition: ""             # 退出条件表达式
```

**5.4 执行结果数据结构**

```typescript
interface WorkflowResult {
  name: string;
  success: boolean;
  steps: StepResult[];
  totalDuration: number;
  totalTokens: { input: number; output: number };
  inputs?: Record<string, string>;  // 用于 resume
}

interface StepResult {
  id: string;
  role: string;
  agentName?: string;               // 如 "趋势研究员"
  agentEmoji?: string;              // 如 "🔭"
  status: 'completed' | 'failed' | 'skipped';
  output?: string;
  output_var?: string;               // 输出变量名
  error?: string;
  duration: number;
  tokens: { input: number; output: number };
  iterations?: number;              // 循环场景 > 1
}
```

**5.5 LLM Provider 配置对照表**

| Provider | 配置 | 环境变量 | 说明 |
|----------|------|----------|------|
| `claude-code` | `--provider claude-code` | - | Claude 会员，不花钱 |
| `gemini-cli` | `--provider gemini-cli` | - | Google 账号，免费 1000次/天 |
| `copilot-cli` | `--provider copilot-cli` | - | GitHub Copilot 会员 |
| `codex-cli` | `--provider codex-cli` | - | ChatGPT Plus/Pro 会员 |
| `openclaw` | `--provider openclaw` | - | OpenClaw 账号 |
| `hermes-cli` | `--provider hermes-cli` | - | NousResearch 开源 |
| `ollama` | `--provider ollama` | - | 本地模型，免费 |
| `deepseek` | `--provider deepseek` | `DEEPSEEK_API_KEY` | API 付费 |
| `claude` | `--provider claude` | `ANTHROPIC_API_KEY` | Claude API |
| `openai` | `--provider openai` | `OPENAI_API_KEY` | OpenAI API |

### 6. 交互流程（详细）

**自动编排流程**

1. 用户在"自动编排" Tab 输入一句话需求，选择 Provider、语言。
2. 点击"自动编排并运行"。
3. 前端调用 `POST /api/compose`，传入描述、provider、lang、autoRun=true。
4. 后端执行 `ao compose "描述" --provider xxx --run`。
5. 实时返回执行日志（通过轮询或 SSE）。
6. 右侧展示自动生成的工作流结构预览（步骤列表 + DAG 关系）。
7. 执行完成后，展示最终结果与 YAML。
8. 结果自动保存到 `ao-output/<名称>-<时间戳>/`。

**角色组合工作流流程**

1. 用户在角色库里搜索或浏览角色（16 个部门分类）。
2. 点击角色卡片的"添加"按钮，将角色加入"已选角色"列表。
3. 在编辑器中配置每个步骤：
   - 自动生成步骤 ID（如 `step_1`），可修改
   - 填写 Task 描述
   - 设置 output 变量名
   - 选择依赖步骤（从下拉框选择）
   - 可选：添加 condition、loop、approval 等高级配置
4. 右侧实时预览生成的 YAML 源码。
5. 点击"运行工作流"，调用 `POST /api/workflow/run`。
6. 实时显示执行日志与结果。
7. 可选：保存工作流到 `workflows/` 目录。

**单角色运行流程**

1. 用户在角色搜索框输入关键字（如 "代码审查"）。
2. 从下拉列表选择匹配的角色。
3. 填写 Task 描述和输入内容（粘贴代码/文本）。
4. 选择 LLM Provider（可选，默认 deepseek）。
5. 点击"生成单步工作流并运行"。
6. 后端生成临时 YAML 并执行。
7. 显示角色输出结果。
8. 临时 YAML 文件执行后自动清理。

**模板工作流流程**

1. 用户从分类列表中选择一个模板（如 "dev/pr-review"）。
2. 系统自动解析 YAML，提取 inputs 定义。
3. 显示模板说明、步骤预览（角色 + emoji + 依赖关系）。
4. 用户填写 inputs 值（如 prd_content、code 等）。
5. 点击"运行模板工作流"，调用 `POST /api/template/run`。
6. 实时显示执行日志与结果。

### 7. DAG 可视化设计（简化版）

**第一版：列表 + 依赖关系**

```
┌─────────────────────────────────────────────────────────────┐
│ 工作流：产品需求评审                              [并行度: 2]  │
├─────────────────────────────────────────────────────────────┤
│ 步骤  │ 角色            │ 依赖         │ 状态               │
├───────┼─────────────────┼──────────────┼───────────────────┤
│  1    │ 📋 产品经理     │ —            │ ✅ 完成 (12.3s)    │
│  2    │ 🏗️ 软件架构师   │ [1] analyze  │ ✅ 完成 (8.5s)    │
│  3    │ 🔍 UX研究员     │ [1] analyze  │ ⏳ 运行中         │
│  4    │ 📝 技术文档     │ [2,3]        │ ⏸️ 等待中         │
├───────┴─────────────────┴──────────────┴───────────────────┤
│ DAG 预览：                                                   │
│                                                             │
│   [1: 产品经理]                                              │
│        │                                                     │
│   ┌────┴────┐                                               │
│   ▼         ▼                                               │
│  [2: 架构师] [3: UX研究员]  ← 并行执行                       │
│   │         │                                               │
│   └────┬────┘                                               │
│        ▼                                                    │
│   [4: 技术文档] ← 等待 [2,3] 完成                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**后续版本（v0.7+）：拖拽 DAG 画布**

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
| 网络请求失败 | API 调用失败 | 重试 3 次，指数退避 | "请求失败，请重试" |
| YAML 语法错误 | 工作流 YAML 不合法 | 调用 `ao validate` 定位错误 | 高亮错误行，提示修改 |
| 步骤执行失败 | LLM 调用失败/超时 | 自动重试（默认 3 次） | 显示错误日志，可重试该步骤 |
| API Key 缺失 | 未配置 Provider Key | 提示用户配置 | 显示环境变量配置指南 |
| 角色不存在 | role 路径错误 | 列出可用角色 | 提示正确的 role 路径 |
| 依赖循环 | steps 存在循环依赖 | DAG 检测并报错 | 提示哪个步骤导致循环 |
| 超时 | 步骤执行超时 | 指数退避重试，最多 60min | 显示超时日志，可增加 timeout |

**执行状态流转**

```
[空闲] → [生成中] → [运行中] → [完成]
   ↓        ↓          ↓
 [失败]   [失败]    [部分失败]
                     ↘
                  [可恢复] → [继续运行]
```

**断点续跑（Resume）**

```bash
# 场景：某步骤失败后修复了输入数据，需要从该步骤重新运行
ao run workflow.yaml --resume last --from <step_id>

# 场景：只想重试失败的步骤
ao run workflow.yaml --resume last

# 场景：基于指定版本继续
ao run workflow.yaml --resume ao-output/具体目录/ --from <step_id>
```

### 9. 可扩展性与后续迭代方向

**v0.2 迭代方向**

- [ ] 真正的 DAG 画布（拖拽连线、节点编辑）
- [ ] 工作流保存 / 分享 / 导入导出
- [ ] 与 `ao demo` 深度集成，为首次访问用户展示演示工作流
- [ ] 直接在页面中编辑和保存 YAML 文件
- [ ] 角色收藏与最近使用记录

**v0.3 迭代方向**

- [ ] WebSocket 实时通信（替代轮询）
- [ ] 多语言界面（中文 / English）
- [ ] 工作流版本管理
- [ ] 自定义角色上传
- [ ] 团队协作与权限管理

**v0.4+ 迭代方向**

- [ ] 云端执行（无需本地安装 ao）
- [ ] 工作流市场（模板分享社区）
- [ ] API 调用统计与计费
- [ ] 与更多 AI 编程工具集成
- [ ] 企业 SSO 登录

### 10. 技术实现建议

**前端技术栈（推荐）**

```javascript
// 选项 1：纯 HTML + Vanilla JS（当前实现）
// - 轻量，无需构建工具
// - 适合快速原型

// 选项 2：React + Tailwind CSS
// - 组件化开发
// - 更好的状态管理

// 选项 3：Vue 3 + Vite
// - 上手快，文档友好
// - 适合快速迭代
```

**后端技术栈（推荐）**

```javascript
// Express.js（当前实现）
// - 轻量、灵活
// - 易于部署

// 可选替代：
// - Fastify（更高性能）
// - NestJS（企业级）
// - Next.js API Routes（前后端一体化）
```

**与 ao CLI 集成方式**

```javascript
// 方式 1：直接 spawn 子进程（当前实现）
const { spawn } = require('child_process');
const child = spawn('ao', ['compose', description], { cwd: AO_CWD });

// 方式 2：通过 Node API 调用（推荐）
import { run, compose, validate } from 'agency-orchestrator';
const result = await run('workflow.yaml', { inputs });
```

**目录结构建议**

```
ao-console/
├── public/
│   ├── index.html          # 主页面
│   ├── css/
│   │   └── styles.css      # 样式文件
│   └── js/
│       ├── app.js          # 主逻辑
│       ├── api.js          # API 调用封装
│       └── components/     # UI 组件
├── src/
│   └── server.js           # Express 服务
├── package.json
└── README.md
```
