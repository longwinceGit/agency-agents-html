// Agency Orchestrator 可视化控制台后端服务
// Run with: npm install && npm start

const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// YAML 解析器（尝试加载，失败则使用简单解析）
let yaml;
try {
  yaml = require('js-yaml');
} catch (e) {
  // 使用简单的 YAML 解析
  yaml = {
    load: (str) => {
      const result = {};
      const lines = str.split('\n');
      let currentKey = null;
      let currentArray = null;
      let indent = 0;
      
      for (const line of lines) {
        if (line.trim() === '' || line.trim().startsWith('#')) continue;
        
        const match = line.match(/^(\s*)(.*?):\s*(.*)?$/);
        if (match) {
          const [, spaces, key, value] = match;
          const currentIndent = spaces.length;
          
          if (value && value.trim()) {
            // 简单键值对
            let val = value.trim().replace(/^["']|["']$/g, '');
            if (!isNaN(val) && val !== '') val = Number(val);
            else if (val === 'true') val = true;
            else if (val === 'false') val = false;
            result[key] = val;
          } else {
            // 检查是否是数组
            const nextLines = lines.slice(lines.indexOf(line) + 1);
            const nextNonEmpty = nextLines.find(l => l.trim() && !l.trim().startsWith('#'));
            if (nextNonEmpty && nextNonEmpty.match(/^\s*-\s/)) {
              result[key] = [];
              currentArray = result[key];
            } else {
              result[key] = {};
            }
            currentKey = key;
            indent = currentIndent;
          }
        } else if (line.trim().startsWith('-')) {
          const match = line.match(/^\s*-\s*(.*)$/);
          if (match && currentArray) {
            let val = match[1].trim().replace(/^["']|["']$/g, '');
            if (val.includes(':')) {
              // 对象
              const objMatch = val.match(/^(\w+):\s*(.*)$/);
              if (objMatch) {
                currentArray.push({ [objMatch[1]]: objMatch[2].replace(/^["']|["']$/g, '') });
              }
            } else {
              if (!isNaN(val) && val !== '') val = Number(val);
              currentArray.push(val);
            }
          }
        }
      }
      return result;
    }
  };
  console.log('使用内置简单 YAML 解析器');
}

// TODO: 根据你本机的 agency-orchestrator 仓库或 ao 安装路径调整
const AO_CWD = process.env.AO_CWD || path.resolve('D:/SourceCode/agency-agents-zh');
const AGENTS_DIR = path.join(AO_CWD, '');
const WORKFLOWS_DIR = path.join(AO_CWD, 'workflows');
const TMP_WORKFLOWS_DIR = path.join(__dirname, 'tmp-workflows');
const TMP_OUTPUTS_DIR = path.join(__dirname, 'ao-outputs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 静态文件服务
app.use(express.static(__dirname));

// 确保临时目录存在
if (!fs.existsSync(TMP_WORKFLOWS_DIR)) {
  fs.mkdirSync(TMP_WORKFLOWS_DIR, { recursive: true });
}
if (!fs.existsSync(TMP_OUTPUTS_DIR)) {
  fs.mkdirSync(TMP_OUTPUTS_DIR, { recursive: true });
}

// ============================================
// 工具函数
// ============================================

// 运行 ao 命令
function runAoCommand(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('ao', args, {
      cwd: AO_CWD,
      shell: true,
      env: { ...process.env, AO_CWD },
      ...options,
    });

    let stdout = '';
    let stderr = '';
    let outputData = [];

    child.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      outputData.push({ type: 'stdout', text });
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      outputData.push({ type: 'stderr', text });
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr,
        output: outputData,
        success: code === 0
      });
    });
  });
}

// 异步运行 ao 命令（用于 SSE 流式输出）
function runAoCommandStream(args, onData, options = {}) {
  const child = spawn('ao', args, {
    cwd: AO_CWD,
    shell: true,
    env: { ...process.env, AO_CWD },
    ...options,
  });

  child.stdout.on('data', (data) => {
    onData({ type: 'stdout', text: data.toString() });
  });

  child.stderr.on('data', (data) => {
    onData({ type: 'stderr', text: data.toString() });
  });

  return child;
}

// 解析角色目录
async function parseAgentCatalog() {
  const roles = [];
  
  if (!fs.existsSync(AGENTS_DIR)) {
    console.warn(`角色目录不存在: ${AGENTS_DIR}`);
    return roles;
  }

  // 部门映射
  const categoryMap = {
    'marketing': '📢 营销部',
    'engineering': '🛠️ 工程部',
    'specialized': '🔬 专项部',
    'game-development': '🎮 游戏开发',
    'testing': '🧪 测试部',
    'design': '🎨 设计部',
    'sales': '💼 销售部',
    'paid-media': '💰 付费媒体',
    'support': '🤝 支持部',
    'project-management': '📋 项目管理',
    'spatial-computing': '🥽 空间计算',
    'academic': '📖 学术部',
    'product': '📦 产品部',
    'supply-chain': '🚚 供应链',
    'finance': '🏦 金融部',
    'hr': '👔 人力资源',
    'legal': '⚖️ 法务部',
  };

  // 遍历部门目录
  const categories = fs.readdirSync(AGENTS_DIR);
  
  for (const category of categories) {
    const categoryPath = path.join(AGENTS_DIR, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;
    
    const categoryEmoji = categoryMap[category]?.split(' ')[0] || '📁';
    const categoryName = categoryMap[category]?.split(' ').slice(1).join(' ') || category;
    
    // 遍历角色文件
    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 解析 frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) continue;
      
      try {
        const frontmatter = yaml.load(frontmatterMatch[1]);
        const rolePath = `${category}/${file.replace('.md', '')}`;
        
        roles.push({
          path: rolePath,
          name: frontmatter.name || file.replace('.md', ''),
          emoji: frontmatter.emoji || '🤖',
          description: frontmatter.description || '',
          category: categoryName,
          categoryKey: category,
          categoryEmoji: categoryEmoji,
          tools: frontmatter.tools || [],
          original: frontmatter.original || false,
        });
      } catch (e) {
        console.warn(`解析角色文件失败: ${filePath}`, e.message);
      }
    }
  }
  
  return roles;
}

// 解析工作流模板
async function parseWorkflows() {
  const workflows = [];
  
  if (!fs.existsSync(WORKFLOWS_DIR)) {
    console.warn(`工作流目录不存在: ${WORKFLOWS_DIR}`);
    return workflows;
  }

  // 递归遍历工作流目录
  function walkDir(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath, prefix ? `${prefix}/${item}` : item);
      } else if (item.endsWith('.yaml') || item.endsWith('.yml')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const frontmatter = yaml.load(content);
          
          const relativePath = prefix ? `${prefix}/${item}` : item;
          
          workflows.push({
            id: relativePath.replace('.yaml', '').replace('.yml', ''),
            path: relativePath,
            name: frontmatter.name || item.replace(/\.(yaml|yml)$/, ''),
            description: frontmatter.description || '',
            category: prefix || '通用',
            steps: frontmatter.steps || [],
            inputs: frontmatter.inputs || [],
          });
        } catch (e) {
          console.warn(`解析工作流失败: ${fullPath}`, e.message);
        }
      }
    }
  }
  
  walkDir(WORKFLOWS_DIR);
  return workflows;
}

// 将工作流对象转换为 YAML
function workflowToYaml(workflow) {
  const lines = [];
  
  lines.push(`name: "${workflow.name || '未命名工作流'}"`);
  if (workflow.description) {
    lines.push(`description: "${workflow.description}"`);
  }
  lines.push('');
  lines.push(`agents_dir: "${workflow.agents_dir || 'agency-agents-zh'}"`);
  lines.push('');
  
  // LLM 配置
  if (workflow.llm) {
    lines.push('llm:');
    lines.push(`  provider: ${workflow.llm.provider || 'deepseek'}`);
    if (workflow.llm.model) {
      lines.push(`  model: ${workflow.llm.model}`);
    }
    if (workflow.llm.max_tokens) {
      lines.push(`  max_tokens: ${workflow.llm.max_tokens}`);
    }
    if (workflow.llm.timeout) {
      lines.push(`  timeout: ${workflow.llm.timeout}`);
    }
    if (workflow.llm.retry) {
      lines.push(`  retry: ${workflow.llm.retry}`);
    }
  } else {
    lines.push('llm:');
    lines.push('  provider: deepseek');
    lines.push('  model: deepseek-chat');
    lines.push('  max_tokens: 4096');
  }
  lines.push('');
  
  // 并行度
  if (workflow.concurrency) {
    lines.push(`concurrency: ${workflow.concurrency}`);
    lines.push('');
  }
  
  // 输入变量
  if (workflow.inputs && workflow.inputs.length > 0) {
    lines.push('inputs:');
    for (const input of workflow.inputs) {
      lines.push(`  - name: ${input.name}`);
      if (input.description) {
        lines.push(`    description: "${input.description}"`);
      }
      if (input.required !== undefined) {
        lines.push(`    required: ${input.required}`);
      }
      if (input.default) {
        lines.push(`    default: "${input.default}"`);
      }
    }
    lines.push('');
  }
  
  // 步骤
  if (workflow.steps && workflow.steps.length > 0) {
    lines.push('steps:');
    for (const step of workflow.steps) {
      lines.push(`  - id: ${step.id}`);
      lines.push(`    role: "${step.role}"`);
      if (step.name) {
        lines.push(`    name: "${step.name}"`);
      }
      if (step.emoji) {
        lines.push(`    emoji: "${step.emoji}"`);
      }
      lines.push('    task: |');
      for (const taskLine of step.task.split('\n')) {
        lines.push(`      ${taskLine}`);
      }
      if (step.output) {
        lines.push(`    output: ${step.output}`);
      }
      if (step.depends_on && step.depends_on.length > 0) {
        lines.push(`    depends_on: [${step.depends_on.map(d => `"${d}"`).join(', ')}]`);
      }
      if (step.condition) {
        lines.push(`    condition: "${step.condition}"`);
      }
      if (step.type && step.type !== 'normal') {
        lines.push(`    type: ${step.type}`);
      }
      if (step.loop) {
        lines.push('    loop:');
        if (step.loop.back_to) {
          lines.push(`      back_to: ${step.loop.back_to}`);
        }
        if (step.loop.max_iterations) {
          lines.push(`      max_iterations: ${step.loop.max_iterations}`);
        }
        if (step.loop.exit_condition) {
          lines.push(`      exit_condition: "${step.loop.exit_condition}"`);
        }
      }
    }
  }
  
  return lines.join('\n');
}

// ============================================
// API 路由
// ============================================

// GET /api/status - 健康检查
app.get('/api/status', async (req, res) => {
  try {
    const result = await runAoCommand(['--version']);
    res.json({
      ok: true,
      aoVersion: result.stdout.trim() || undefined,
      cwd: AO_CWD,
      agentsDir: AGENTS_DIR,
      workflowsDir: WORKFLOWS_DIR,
    });
  } catch (err) {
    res.json({
      ok: false,
      error: err.message,
      cwd: AO_CWD,
    });
  }
});

// GET /api/roles - 获取角色目录
app.get('/api/roles', async (req, res) => {
  try {
    const roles = await parseAgentCatalog();
    
    // 按部门分组
    const grouped = {};
    for (const role of roles) {
      if (!grouped[role.categoryKey]) {
        grouped[role.categoryKey] = {
          key: role.categoryKey,
          name: role.category,
          emoji: role.categoryEmoji,
          count: 0,
          roles: [],
        };
      }
      grouped[role.categoryKey].roles.push({
        path: role.path,
        name: role.name,
        emoji: role.emoji,
        description: role.description,
        tools: role.tools,
        original: role.original,
      });
      grouped[role.categoryKey].count++;
    }
    
    res.json({
      success: true,
      total: roles.length,
      categories: Object.values(grouped),
      roles,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/workflows - 获取模板列表
app.get('/api/workflows', async (req, res) => {
  try {
    const workflows = await parseWorkflows();
    
    // 按目录分组
    const grouped = {};
    for (const wf of workflows) {
      if (!grouped[wf.category]) {
        grouped[wf.category] = {
          name: wf.category,
          workflows: [],
        };
      }
      grouped[wf.category].workflows.push({
        id: wf.id,
        name: wf.name,
        description: wf.description,
        stepCount: wf.steps.length,
        inputCount: wf.inputs.length,
      });
    }
    
    res.json({
      success: true,
      total: workflows.length,
      categories: Object.values(grouped),
      workflows,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/workflow/:id - 获取指定工作流详情
app.get('/api/workflow/:id(*)', async (req, res) => {
  try {
    const workflowId = req.params.id;
    const workflowPath = path.join(WORKFLOWS_DIR, workflowId + '.yaml');
    
    if (!fs.existsSync(workflowPath)) {
      return res.status(404).json({ success: false, error: '工作流不存在' });
    }
    
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = yaml.load(content);
    
    res.json({
      success: true,
      workflow: {
        id: workflowId,
        path: workflowPath,
        name: workflow.name,
        description: workflow.description,
        llm: workflow.llm,
        concurrency: workflow.concurrency,
        inputs: workflow.inputs || [],
        steps: workflow.steps || [],
      },
      yaml: content,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 修复 ao compose 生成 YAML 中的 agents_dir（默认为 agency-agents，需改为 agency-agents-zh）
function fixAgentsDir(yamlContent) {
  return yamlContent.replace(
    /agents_dir:\s*["']?agency-agents(?!-zh)["']?/,
    'agents_dir: "agency-agents-zh"'
  );
}

// POST /api/compose - 等价 ao compose
app.post('/api/compose', async (req, res) => {
  const { description, provider, lang, autoRun, concurrency } = req.body || {};

  if (!description || typeof description !== 'string') {
    return res.status(400).json({ success: false, error: 'description 字段必填' });
  }

  // 生成输出文件名
  const outputFileName = `composed-${Date.now()}.yaml`;
  const yamlPath = path.join(WORKFLOWS_DIR, outputFileName);

  // 先生成 YAML（不使用 --run，避免 agents_dir 错误导致执行失败）
  const composeArgs = ['compose', description, '--output', yamlPath];

  if (provider) {
    composeArgs.push('--provider', String(provider));
  }
  if (lang === 'zh' || lang === 'en') {
    composeArgs.push('--lang', lang);
  }
  if (concurrency) {
    composeArgs.push('--concurrency', String(concurrency));
  }

  try {
    const composeResult = await runAoCommand(composeArgs);

    if (composeResult.code !== 0) {
      return res.json(composeResult);
    }

    // 读取并修复生成的 YAML
    let yamlContent = '';
    let yamlFilePath = yamlPath;

    if (fs.existsSync(yamlPath)) {
      yamlContent = fs.readFileSync(yamlPath, 'utf-8');
    } else {
      // 尝试从 stdout 中提取 YAML
      composeResult.stdout = composeResult.stdout || '';
      const yamlMatch = composeResult.stdout.match(/^name:[\s\S]*$/m);
      if (yamlMatch) {
        yamlContent = yamlMatch[0].trim();
      }
    }

    // 修复 agents_dir
    if (yamlContent) {
      yamlContent = fixAgentsDir(yamlContent);
      // 保存修复后的 YAML
      fs.writeFileSync(yamlPath, yamlContent, 'utf-8');
    }

    // 如果需要自动运行，使用修复后的 YAML 执行 ao run
    if (autoRun && yamlContent) {
      const runResult = await runAoCommand(['run', yamlPath]);
      composeResult.runOutput = runResult;
      // 清理临时文件
      try { fs.unlinkSync(yamlPath); } catch (e) {}
      return res.json(composeResult);
    }

    // 只生成 YAML（不执行）
    if (yamlContent) {
      composeResult.yaml = yamlContent;
      composeResult.yamlPath = yamlPath;
      composeResult.yamlRelativePath = outputFileName;

      // 清理临时生成的文件（只保留在 result 中）
      try { fs.unlinkSync(yamlPath); } catch (e) {}
    }

    res.json(composeResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/validate - 校验工作流 YAML
app.post('/api/validate', async (req, res) => {
  const { workflowYaml, workflowPath } = req.body || {};

  let targetPath;
  let needCleanup = false;

  if (workflowYaml) {
    // 使用传入的 YAML 内容，保存到工作流目录
    const fileName = `validate-${Date.now()}.yaml`;
    targetPath = path.join(WORKFLOWS_DIR, fileName);
    fs.writeFileSync(targetPath, workflowYaml, 'utf-8');
    needCleanup = true;
  } else if (workflowPath) {
    // 如果是相对路径，转换为绝对路径
    targetPath = workflowPath.startsWith('/') ? workflowPath : path.join(WORKFLOWS_DIR, workflowPath);
  } else {
    return res.status(400).json({ success: false, error: 'workflowYaml 或 workflowPath 必填' });
  }

  if (!fs.existsSync(targetPath)) {
    return res.status(404).json({ success: false, error: `工作流文件不存在: ${targetPath}` });
  }

  const args = ['validate', targetPath];

  try {
    const result = await runAoCommand(args);

    // 清理临时文件
    if (needCleanup) {
      try {
        fs.unlinkSync(targetPath);
      } catch (e) {}
    }

    res.json(result);
  } catch (err) {
    // 清理临时文件
    if (needCleanup) {
      try {
        fs.unlinkSync(targetPath);
      } catch (e) {}
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/plan - 查看执行计划
app.post('/api/plan', async (req, res) => {
  const { workflowYaml, workflowPath, explain } = req.body || {};

  let targetPath;
  let needCleanup = false;

  if (workflowYaml) {
    // 使用传入的 YAML 内容，保存到工作流目录
    const fileName = `plan-${Date.now()}.yaml`;
    targetPath = path.join(WORKFLOWS_DIR, fileName);
    fs.writeFileSync(targetPath, workflowYaml, 'utf-8');
    needCleanup = true;
  } else if (workflowPath) {
    // 如果是相对路径，转换为绝对路径
    targetPath = workflowPath.startsWith('/') ? workflowPath : path.join(WORKFLOWS_DIR, workflowPath);
  } else {
    return res.status(400).json({ success: false, error: 'workflowYaml 或 workflowPath 必填' });
  }

  if (!fs.existsSync(targetPath)) {
    return res.status(404).json({ success: false, error: `工作流文件不存在: ${targetPath}` });
  }

  const args = ['plan', targetPath];

  if (explain) {
    args.push('--explain');
  }

  try {
    const result = await runAoCommand(args);

    // 清理临时文件
    if (needCleanup) {
      try {
        fs.unlinkSync(targetPath);
      } catch (e) {}
    }

    res.json(result);
  } catch (err) {
    // 清理临时文件
    if (needCleanup) {
      try {
        fs.unlinkSync(targetPath);
      } catch (e) {}
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// 解析 ao compose 输出中的结构化信息
function parseAoOutput(text) {
  const events = [];

  // 清理 ANSI 转义码
  const cleanText = text.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/\x1b\[K/g, '');

  // 解析头部 "参与者: ✍️ 技术文档工程师 | 🎯 现实检验者"
  const planMatch = cleanText.match(/参与者[:：]\s*(.+)/);
  if (planMatch) {
    const agents = planMatch[1].split('|').map(s => s.trim()).filter(Boolean);
    const steps = agents.map((a, i) => {
      // 匹配 emoji（含变体选择器 U+FE0F）+ 后续空格
      const emojiMatch = a.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F?)\s*/u);
      const emoji = emojiMatch ? emojiMatch[0].trim() : '🤖';
      const name = a.slice(emojiMatch ? emojiMatch[0].length : 0).trim();
      return { id: `step_${i + 1}`, emoji, name, role: name, status: 'pending', dept: '', desc: '' };
    });
    events.push({ type: 'plan', steps });
  }

  // 解析步骤数 "步骤数: 2 | 并发: 1 | 模型: deepseek-reasoner"
  const stepCountMatch = cleanText.match(/步骤数[:：]\s*(\d+)/);
  if (stepCountMatch) {
    events.push({ type: 'meta', stepCount: parseInt(stepCountMatch[1]) });
  }

  // 解析工作流名 "工作流: 生成一句测试用例"
  const wfNameMatch = cleanText.match(/工作流[:：]\s*(.+)/);
  if (wfNameMatch) {
    events.push({ type: 'meta', workflowName: wfNameMatch[1].trim() });
  }

  // 解析步骤开始执行 "⏳ ✍️ 技术文档工程师 执行中 ..."
  const stepStartMatch = cleanText.match(/[⏳▶]\s*((?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F?)\s*)?(\S+.*?)\s+执行中/u);
  if (stepStartMatch) {
    const emoji = stepStartMatch[1] ? stepStartMatch[1].trim() : '🤖';
    const name = stepStartMatch[2].trim();
    events.push({ type: 'step', emoji, name, status: 'running', role: name });
  }

  // 解析步骤结果 "── [1/2] ✍️ 技术文档工程师 (draft) ──" 后跟 "完成 | 2.2s | 5262 tokens"
  const stepResultMatch = cleanText.match(/[─]+\s*\[(\d+)\/(\d+)\]\s*((?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F?)\s*)?(\S+.*?)\s*\((\w+)\)\s*[─]+/u);
  if (stepResultMatch) {
    const currentStep = parseInt(stepResultMatch[1]);
    const totalSteps = parseInt(stepResultMatch[2]);
    const emoji = stepResultMatch[3] ? stepResultMatch[3].trim() : '🤖';
    const name = stepResultMatch[4].trim();
    const stepType = stepResultMatch[5]; // draft, review, etc.
    events.push({ type: 'step_result', currentStep, totalSteps, emoji, name, stepType, index: currentStep - 1 });
  }

  // 解析 "完成 | 2.2s | 5262 tokens" (步骤完成)
  const stepDoneMatch = cleanText.match(/^\s*(完成|失败|错误)\s*\|\s*([\d.]+)\s*s\s*\|\s*([\d,]+)\s*tokens/m);
  if (stepDoneMatch) {
    const statusText = stepDoneMatch[1];
    const duration = stepDoneMatch[2];
    const tokens = stepDoneMatch[3];
    events.push({
      type: 'step_done',
      status: statusText === '完成' ? 'done' : 'error',
      duration,
      tokens,
    });
  }

  // 解析步骤输出摘要（紧跟步骤结果后的缩进文本）
  const summaryLineMatch = cleanText.match(/^\s{2,}(\S.{5,})$/m);
  if (summaryLineMatch && !cleanText.includes('执行中') && !cleanText.includes('工作流:') && !cleanText.includes('步骤数')) {
    // 这是步骤输出摘要，仅在其他解析无结果时发送
  }

  // 兼容旧版格式 "✅ 🔭 趋势研究员    31.3s  → 6个赛道竞争度..."
  const legacyStepMatch = cleanText.match(/^[\s]*(✅|❌|⏳)\s*((?:\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*)?(\S+.*?)\s+(\d+\.?\d*)\s*s\s*→\s*(.*)$/mu);
  if (legacyStepMatch) {
    const statusEmoji = legacyStepMatch[1];
    const emoji = legacyStepMatch[2] ? legacyStepMatch[2].trim() : '🤖';
    const name = legacyStepMatch[3].trim();
    const duration = legacyStepMatch[4];
    const summary = legacyStepMatch[5].trim();
    const status = statusEmoji === '✅' ? 'done' : statusEmoji === '❌' ? 'error' : 'running';
    events.push({ type: 'step', emoji, name, duration, summary, status, role: name });
  }

  // 解析汇总 "完成: 2/2 步 | 9.4s | 9267 tokens"
  const summaryMatch = cleanText.match(/完成[:：]\s*(\d+)\/(\d+)\s*步\s*\|\s*([\d.]+)\s*s\s*\|\s*([\d,]+)\s*tokens/);
  if (summaryMatch) {
    events.push({
      type: 'summary',
      completed: parseInt(summaryMatch[1]),
      total: parseInt(summaryMatch[2]),
      duration: summaryMatch[3],
      tokens: summaryMatch[4],
    });
  }

  // 解析 "开始执行工作流..."
  if (cleanText.includes('开始执行工作流')) {
    events.push({ type: 'meta', executing: true });
  }

  // 解析 "✅ 工作流已生成: workflows\xxy.yaml"
  const yamlGenMatch = cleanText.match(/✅\s*工作流已生成[:：]\s*(.+)/);
  if (yamlGenMatch) {
    events.push({ type: 'meta', yamlGenerated: yamlGenMatch[1].trim() });
  }

  // 解析详细输出路径
  const outputMatch = cleanText.match(/详细输出[:：]\s*(.+)/);
  if (outputMatch) {
    events.push({ type: 'meta', outputDir: outputMatch[1].trim() });
  }

  return events;
}

// POST /api/compose/stream - 流式执行 compose（SSE）
app.post('/api/compose/stream', async (req, res) => {
  const { description, provider, lang, autoRun, concurrency } = req.body || {};

  if (!description || typeof description !== 'string') {
    return res.status(400).json({ success: false, error: 'description 字段必填' });
  }

  // 设置 SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // 发送心跳确保连接活跃
  res.write(':\n\n');

  // 第一阶段：ao compose 生成 YAML（不使用 --run，避免 agents_dir 错误）
  const outputFileName = `composed-${Date.now()}.yaml`;
  const yamlPath = path.join(WORKFLOWS_DIR, outputFileName);

  const composeArgs = ['compose', description, '--output', yamlPath];
  if (provider) {
    composeArgs.push('--provider', String(provider));
  }
  if (lang === 'zh' || lang === 'en') {
    composeArgs.push('--lang', lang);
  }
  if (concurrency) {
    composeArgs.push('--concurrency', String(concurrency));
  }

  let plannedSteps = null;
  let composeStdout = '';

  const composeChild = runAoCommandStream(composeArgs, (data) => {
    // 转发原始输出
    res.write(`data: ${JSON.stringify(data)}\n\n`);

    if (data.type === 'stdout' && data.text) {
      composeStdout += data.text;
      const events = parseAoOutput(data.text);
      for (const evt of events) {
        if (evt.type === 'plan') {
          plannedSteps = evt.steps;
        }
        res.write(`data: ${JSON.stringify(evt)}\n\n`);
      }
    }
  });

  // 等待 compose 完成
  await new Promise((resolve) => {
    composeChild.on('close', (code) => {
      if (code !== 0) {
        res.write(`data: ${JSON.stringify({ type: 'close', code, phase: 'compose' })}\n\n`);
        res.end();
      }
      resolve(code);
    });
    res.on('close', () => {
      composeChild.kill();
      resolve(-1);
    });
  }).then(async (code) => {
    if (code !== 0) return;

    // 读取并修复生成的 YAML
    let yamlContent = '';
    if (fs.existsSync(yamlPath)) {
      yamlContent = fs.readFileSync(yamlPath, 'utf-8');
    } else if (composeStdout) {
      const yamlMatch = composeStdout.match(/^name:[\s\S]*$/m);
      if (yamlMatch) {
        yamlContent = yamlMatch[0].trim();
      }
    }

    if (yamlContent) {
      yamlContent = fixAgentsDir(yamlContent);
      fs.writeFileSync(yamlPath, yamlContent, 'utf-8');
    }

    // 发送 YAML 生成完成的元数据事件
    res.write(`data: ${JSON.stringify({ type: 'meta', yamlPath, yamlContent, phase: 'compose_done' })}\n\n`);

    // 第二阶段：如果需要自动运行，使用修复后的 YAML 执行 ao run
    if (autoRun && yamlContent) {
      const runArgs = ['run', yamlPath];
      if (provider) {
        runArgs.push('--provider', String(provider));
      }
      if (concurrency) {
        runArgs.push('--concurrency', String(concurrency));
      }

      const runChild = runAoCommandStream(runArgs, (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);

        if (data.type === 'stdout' && data.text) {
          const events = parseAoOutput(data.text);
          for (const evt of events) {
            if (evt.type === 'plan') {
              plannedSteps = evt.steps;
            }
            if (evt.type === 'step' && plannedSteps) {
              const idx = plannedSteps.findIndex(s => s.name === evt.name || s.role === evt.name);
              if (idx >= 0) {
                evt.index = idx;
                evt.id = plannedSteps[idx].id;
              }
            }
            res.write(`data: ${JSON.stringify(evt)}\n\n`);
          }
        }
      });

      runChild.on('close', (runCode) => {
        // 清理临时文件
        try { fs.unlinkSync(yamlPath); } catch (e) {}
        res.write(`data: ${JSON.stringify({ type: 'close', code: runCode, steps: plannedSteps, phase: 'run' })}\n\n`);
        res.end();
      });

      res.on('close', () => {
        runChild.kill();
      });
    } else {
      // 不运行，只返回生成的 YAML
      try { fs.unlinkSync(yamlPath); } catch (e) {}
      res.write(`data: ${JSON.stringify({ type: 'close', code: 0, steps: plannedSteps, phase: 'compose' })}\n\n`);
      res.end();
    }
  });
});

// POST /api/run - 运行指定工作流 YAML
app.post('/api/run', async (req, res) => {
  const { workflowId, workflowYaml, workflowPath: providedPath, inputs, resume, provider } = req.body || {};

  let workflowPath;
  let needCleanup = false;

  if (workflowYaml) {
    // 使用传入的 YAML 内容，保存到工作流目录
    const fileName = `run-${Date.now()}.yaml`;
    workflowPath = path.join(WORKFLOWS_DIR, fileName);
    fs.writeFileSync(workflowPath, workflowYaml, 'utf-8');
    needCleanup = true;
  } else if (workflowId) {
    workflowPath = path.join(WORKFLOWS_DIR, workflowId + '.yaml');
  } else if (providedPath) {
    // 如果是相对路径，转换为绝对路径
    workflowPath = providedPath.startsWith('/') ? providedPath : path.join(WORKFLOWS_DIR, providedPath);
  } else {
    return res.status(400).json({ success: false, error: 'workflowId、workflowYaml 或 workflowPath 必填' });
  }

  if (!fs.existsSync(workflowPath)) {
    return res.status(404).json({ success: false, error: `工作流文件不存在: ${workflowPath}` });
  }

  const args = ['run', workflowPath];

  // 添加 provider 参数
  if (provider) {
    args.push('--provider', String(provider));
  }

  if (inputs && typeof inputs === 'object') {
    for (const [key, value] of Object.entries(inputs)) {
      if (value === undefined || value === null) continue;
      args.push('--input', `${key}=${String(value).replace(/"/g, '\\"')}`);
    }
  }

  if (resume) {
    args.push('--resume', 'last');
  }

  try {
    const result = await runAoCommand(args);

    // 清理临时文件
    if (needCleanup) {
      try {
        fs.unlinkSync(workflowPath);
      } catch (e) {}
    }

    res.json(result);
  } catch (err) {
    // 清理临时文件
    if (needCleanup) {
      try {
        fs.unlinkSync(workflowPath);
      } catch (e) {}
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/run/stream - 流式执行工作流（SSE）
app.post('/api/run/stream', async (req, res) => {
  const { workflowId, workflowYaml, inputs, resume } = req.body || {};

  let workflowPath;
  
  if (workflowYaml) {
    const fileName = `custom-${Date.now()}.yaml`;
    workflowPath = path.join(TMP_WORKFLOWS_DIR, fileName);
    fs.writeFileSync(workflowPath, workflowYaml, 'utf-8');
  } else if (workflowId) {
    workflowPath = path.join(WORKFLOWS_DIR, workflowId + '.yaml');
  } else {
    res.status(400).json({ success: false, error: 'workflowId 或 workflowYaml 必填' });
    return;
  }

  if (!fs.existsSync(workflowPath)) {
    res.status(404).json({ success: false, error: `工作流文件不存在: ${workflowPath}` });
    return;
  }

  const args = ['run', workflowPath];

  if (inputs && typeof inputs === 'object') {
    for (const [key, value] of Object.entries(inputs)) {
      if (value === undefined || value === null) continue;
      args.push('--input', `${key}=${String(value).replace(/"/g, '\\"')}`);
    }
  }

  if (resume) {
    args.push('--resume', 'last');
  }

  // 设置 SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(':\n\n'); // 心跳

  let plannedSteps = null;

  const child = runAoCommandStream(args, (data) => {
    // 发送原始输出
    res.write(`data: ${JSON.stringify(data)}\n\n`);

    // 解析结构化步骤信息
    if (data.type === 'stdout' && data.text) {
      const events = parseAoOutput(data.text);
      for (const evt of events) {
        if (evt.type === 'plan') {
          plannedSteps = evt.steps;
        }
        if (evt.type === 'step' && plannedSteps) {
          const idx = plannedSteps.findIndex(s => s.name === evt.name || s.role === evt.name);
          if (idx >= 0) {
            evt.index = idx;
            evt.id = plannedSteps[idx].id;
          }
        }
        res.write(`data: ${JSON.stringify(evt)}\n\n`);
      }
    }
  });

  child.on('close', (code) => {
    res.write(`data: ${JSON.stringify({ type: 'close', code, success: code === 0, steps: plannedSteps })}\n\n`);
    res.end();
    
    // 清理临时文件
    if (workflowYaml) {
      try {
        fs.unlinkSync(workflowPath);
      } catch (e) {}
    }
  });

  // 使用 res.on('close') 检测客户端断连
  res.on('close', () => {
    child.kill();
  });
});

// POST /api/single-role/run - 生成单步 YAML 并运行
app.post('/api/single-role/run', async (req, res) => {
  const { role, task, inputText, provider, model } = req.body || {};

  if (!role || !task) {
    return res.status(400).json({ success: false, error: 'role 与 task 字段必填' });
  }

  const fileName = `single-role-${Date.now()}.yaml`;
  const filePath = path.join(TMP_WORKFLOWS_DIR, fileName);

  const yamlContent = `name: "单角色临时工作流"
description: "Single role ad-hoc run"

agents_dir: "agency-agents-zh"

llm:
  provider: ${provider || 'deepseek'}
  ${model ? `model: ${model}` : ''}
  max_tokens: 4096

concurrency: 1

inputs:
  - name: input_text
    description: "Input text for this role"
    required: false

steps:
  - id: single_role_step
    role: "${role.replace(/"/g, '\\"')}"
    task: |
      ${task.replace(/\n/g, '\n      ')}

      输入内容（可选）如下：
      {{input_text}}
    output: single_role_output
`;

  fs.writeFileSync(filePath, yamlContent, 'utf-8');

  const args = ['run', filePath];
  if (inputText) {
    args.push('--input', `input_text=${String(inputText).replace(/"/g, '\\"')}`);
  }

  try {
    const result = await runAoCommand(args);
    
    // 清理临时文件
    try {
      fs.unlinkSync(filePath);
    } catch (e) {}

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/single-role/run/stream - 流式执行单角色（SSE）
app.post('/api/single-role/run/stream', async (req, res) => {
  const { role, task, inputText, provider, model } = req.body || {};

  if (!role || !task) {
    res.status(400).json({ success: false, error: 'role 与 task 字段必填' });
    return;
  }

  const fileName = `single-role-${Date.now()}.yaml`;
  const filePath = path.join(TMP_WORKFLOWS_DIR, fileName);

  const yamlContent = `name: "单角色临时工作流"
description: "Single role ad-hoc run"

agents_dir: "agency-agents-zh"

llm:
  provider: ${provider || 'deepseek'}
  ${model ? `model: ${model}` : ''}
  max_tokens: 4096

concurrency: 1

inputs:
  - name: input_text
    description: "Input text for this role"
    required: false

steps:
  - id: single_role_step
    role: "${role.replace(/"/g, '\\"')}"
    task: |
      ${task.replace(/\n/g, '\n      ')}

      输入内容（可选）如下：
      {{input_text}}
    output: single_role_output
`;

  fs.writeFileSync(filePath, yamlContent, 'utf-8');

  const args = ['run', filePath];
  if (inputText) {
    args.push('--input', `input_text=${String(inputText).replace(/"/g, '\\"')}`);
  }

  // 设置 SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(':\n\n'); // 心跳

  let plannedSteps = null;

  const child = runAoCommandStream(args, (data) => {
    // 发送原始输出
    res.write(`data: ${JSON.stringify(data)}\n\n`);

    // 解析结构化步骤信息
    if (data.type === 'stdout' && data.text) {
      const events = parseAoOutput(data.text);
      for (const evt of events) {
        if (evt.type === 'plan') {
          plannedSteps = evt.steps;
        }
        if (evt.type === 'step' && plannedSteps) {
          const idx = plannedSteps.findIndex(s => s.name === evt.name || s.role === evt.name);
          if (idx >= 0) {
            evt.index = idx;
            evt.id = plannedSteps[idx].id;
          }
        }
        res.write(`data: ${JSON.stringify(evt)}\n\n`);
      }
    }
  });

  child.on('close', (code) => {
    res.write(`data: ${JSON.stringify({ type: 'close', code, success: code === 0, steps: plannedSteps })}\n\n`);
    res.end();

    // 清理临时文件
    try {
      fs.unlinkSync(filePath);
    } catch (e) {}
  });

  // 使用 res.on('close') 检测客户端断连
  res.on('close', () => {
    child.kill();
  });
});

// POST /api/template/run - 运行内置模板工作流
app.post('/api/template/run', async (req, res) => {
  const { workflowId, inputs } = req.body || {};
  
  if (!workflowId) {
    return res.status(400).json({ success: false, error: 'workflowId 字段必填' });
  }

  const workflowPath = path.join(WORKFLOWS_DIR, workflowId + '.yaml');
  
  if (!fs.existsSync(workflowPath)) {
    return res.status(404).json({ success: false, error: `模板不存在: ${workflowId}` });
  }

  const args = ['run', workflowPath];

  if (inputs && typeof inputs === 'object') {
    for (const [key, value] of Object.entries(inputs)) {
      if (value === undefined || value === null) continue;
      args.push('--input', `${key}=${String(value).replace(/"/g, '\\"')}`);
    }
  }

  try {
    const result = await runAoCommand(args);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/workflow/build - 构建自定义工作流
app.post('/api/workflow/build', async (req, res) => {
  const { workflow } = req.body || {};

  if (!workflow || !workflow.steps || workflow.steps.length === 0) {
    return res.status(400).json({ success: false, error: 'workflow.steps 至少需要一个步骤' });
  }

  try {
    const yaml = workflowToYaml(workflow);
    res.json({
      success: true,
      yaml,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/workflow/save - 保存工作流到 workflows/ 目录
app.post('/api/workflow/save', async (req, res) => {
  const { workflow, fileName } = req.body || {};

  if (!workflow || !workflow.steps || workflow.steps.length === 0) {
    return res.status(400).json({ success: false, error: 'workflow.steps 至少需要一个步骤' });
  }

  try {
    const yaml = workflowToYaml(workflow);
    const name = fileName || workflow.name || `workflow-${Date.now()}`;
    const safeName = name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]/g, '-').toLowerCase();
    const filePath = path.join(WORKFLOWS_DIR, `${safeName}.yaml`);
    
    fs.writeFileSync(filePath, yaml, 'utf-8');
    
    res.json({
      success: true,
      path: filePath,
      name: safeName,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/workflow/run - 运行自定义工作流（构建 + 执行）
app.post('/api/workflow/run', async (req, res) => {
  const { workflow, inputs, resume } = req.body || {};

  if (!workflow || !workflow.steps || workflow.steps.length === 0) {
    return res.status(400).json({ success: false, error: 'workflow.steps 至少需要一个步骤' });
  }

  try {
    const yamlContent = workflowToYaml(workflow);
    const fileName = `custom-${Date.now()}.yaml`;
    const filePath = path.join(TMP_WORKFLOWS_DIR, fileName);
    
    fs.writeFileSync(filePath, yamlContent, 'utf-8');

    const args = ['run', filePath];

    if (inputs && typeof inputs === 'object') {
      for (const [key, value] of Object.entries(inputs)) {
        if (value === undefined || value === null) continue;
        args.push('--input', `${key}=${String(value).replace(/"/g, '\\"')}`);
      }
    }

    if (resume) {
      args.push('--resume', 'last');
    }

    const result = await runAoCommand(args);

    // 清理临时文件
    try {
      fs.unlinkSync(filePath);
    } catch (e) {}

    res.json({
      ...result,
      generatedYaml: yamlContent,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/outputs - 获取运行输出列表
app.get('/api/outputs', async (req, res) => {
  try {
    const outputs = [];
    const outputDirs = [
      path.join(AO_CWD, 'ao-output'),
      TMP_OUTPUTS_DIR,
    ];
    
    for (const dir of outputDirs) {
      if (!fs.existsSync(dir)) continue;
      
      const items = fs.readdirSync(dir).filter(f => {
        return fs.statSync(path.join(dir, f)).isDirectory();
      });
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        const files = fs.readdirSync(itemPath);
        
        outputs.push({
          name: item,
          path: itemPath,
          created: stats.birthtime,
          modified: stats.mtime,
          files,
        });
      }
    }
    
    // 按时间排序
    outputs.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    
    res.json({
      success: true,
      outputs,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// 静态页面路由
// ============================================

// 首页重定向到控制台
app.get('/', (req, res) => {
  res.redirect('/ao-console.html');
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 AO 可视化控制台服务器已启动');
  console.log('='.repeat(60));
  console.log(`📍 访问地址: http://localhost:${PORT}/ao-console.html`);
  console.log(`📁 AO 工作目录: ${AO_CWD}`);
  console.log(`📁 角色目录: ${AGENTS_DIR}`);
  console.log(`📁 工作流目录: ${WORKFLOWS_DIR}`);
  console.log('='.repeat(60));
  console.log('可用 API 端点:');
  console.log('  GET  /api/status           - 健康检查');
  console.log('  GET  /api/roles           - 获取角色目录');
  console.log('  GET  /api/workflows       - 获取模板列表');
  console.log('  GET  /api/workflow/:id    - 获取工作流详情');
  console.log('  GET  /api/outputs         - 获取运行输出列表');
  console.log('  POST /api/compose         - 自动编排');
  console.log('  POST /api/run             - 运行工作流');
  console.log('  POST /api/template/run    - 运行模板');
  console.log('  POST /api/single-role/run - 单角色运行');
  console.log('  POST /api/workflow/build  - 构建工作流 YAML');
  console.log('  POST /api/workflow/save   - 保存工作流');
  console.log('  POST /api/workflow/run    - 运行自定义工作流');
  console.log('='.repeat(60));
});
