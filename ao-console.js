/* ========================================================
   STATE
   ======================================================== */
let currentView = 'compose';
let currentDept = 'all';
let builderSteps = [];
let isRunning = false;
let selectedTemplate = null;

/* ========================================================
   API LAYER
   ======================================================== */
const API_BASE = '';  // 同源，留空即可

async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// SSE 流式请求
function apiSSE(path, body, onEvent, onDone) {
  return fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // 保留不完整的行
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'close') {
              onDone && onDone(data);
            } else {
              onEvent && onEvent(data);
            }
          } catch (e) {}
        }
      }
    }
    // 处理剩余 buffer
    if (buffer.startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.slice(6));
        if (data.type === 'close') {
          onDone && onDone(data);
        } else {
          onEvent && onEvent(data);
        }
      } catch (e) {}
    }
  });
}

// 角色数据缓存
let cachedRolesData = null;
let cachedCategories = null;
// 模板数据缓存
let cachedWorkflows = null;
let cachedWorkflowCategories = null;

/* ========================================================
   VIEW SWITCHING
   ======================================================== */
function switchView(name, triggerEl) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (triggerEl) triggerEl.classList.add('active');
  else {
    const btn = document.querySelector(`.nav-btn[data-view="${name}"]`);
    if (btn) btn.classList.add('active');
  }

  currentView = name;

  if (name === 'roles' && !document.getElementById('roles-grid').children.length) {
    renderRoles();
  }
  if (name === 'builder' && !document.getElementById('builder-roles-container').children.length) {
    renderBuilderRoles('');
  }
  if (name === 'templates' && !document.getElementById('templates-grid').children.length) {
    renderTemplates();
  }
}

function setSideIcon(el) {
  document.querySelectorAll('.sidebar-icon').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}

/* ========================================================
   TOAST
   ======================================================== */
let toastId = 0;
function showToast(msg, type = 'info') {
  const stack = document.getElementById('toast-stack');
  const id = ++toastId;
  const icons = { info:'ℹ️', success:'✅', warn:'⚠️', error:'❌' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

/* ========================================================
   COMPOSE: EXAMPLES
   ======================================================== */
const EXAMPLES = [
  '我是一个程序员，想用 AI 做自媒体副业，目标月入 2 万，帮我制定完整的内容矩阵+变现计划',
  '分析 AI 记账 App 的市场可行性：竞品分析、目标用户、商业模式、技术选型',
  '用 10 万元启动一个 AI 教育项目：市场定位、课程设计、运营策略、财务规划',
  '对一段 Solidity 智能合约代码进行全面安全审计，找出漏洞并给出修复建议',
  '深度调研国内 AI 写作工具市场：主要玩家、功能对比、定价策略、差异化机会'
];

function fillExample(i) {
  document.getElementById('compose-desc').value = EXAMPLES[i];
  showToast('已填入示例需求', 'info');
}

/* ========================================================
   COMPOSE: RUN ORCHESTRATION
   ======================================================== */
function runOrchestration() {
  const desc = document.getElementById('compose-desc').value.trim();
  if (!desc) { showToast('请先输入需求描述', 'warn'); return; }
  if (isRunning) { showToast('任务运行中，请稍候', 'warn'); return; }

  const provider = document.getElementById('provider-select').value;
  const lang = document.getElementById('compose-lang').value;
  const concurrency = document.getElementById('compose-concurrency').value;
  const autoRun = document.getElementById('compose-auto-run').checked;

  isRunning = true;
  document.getElementById('run-badge').classList.remove('hidden');
  document.getElementById('btn-run').disabled = true;
  document.getElementById('btn-preview').disabled = true;
  document.getElementById('stat-status').textContent = '编排中';

  switchOutputTab('workflow', document.querySelector('.output-tab'));

  appendLog('[SYSTEM] Agency Orchestrator 启动', 'sys');
  appendLog(`[SYSTEM] 分析需求: "${desc.slice(0, 40)}..."`, 'sys');
  appendLog('[INFO] 正在调用 AI 编排引擎…', 'muted');

  // 使用 SSE 流式执行
  const body = {
    description: desc,
    provider: provider,
    lang: lang === 'auto' ? undefined : lang,
    autoRun: autoRun,
    concurrency: parseInt(concurrency) || 2,
  };

  // 追踪发现的步骤
  let discoveredSteps = [];

  apiSSE('/api/compose/stream', body,
    // onEvent: 处理每条流式数据
    (data) => {
      if (data.type === 'plan') {
        // 后端解析出参与者列表
        discoveredSteps = data.steps || [];
        updateStats(discoveredSteps.length, discoveredSteps.length, concurrency);
        renderWorkflowSteps(discoveredSteps.map(s => ({ ...s, status: 'pending' })));
        appendLog(`[PLAN] 发现 ${discoveredSteps.length} 个步骤: ${discoveredSteps.map(s => s.emoji + ' ' + s.name).join(' → ')}`, 'sys');
      } else if (data.type === 'step') {
        // 步骤开始执行 "⏳ emoji 名称 执行中"
        const { index, id, emoji, name, duration, summary, status, role } = data;
        const idx = index !== undefined ? index : discoveredSteps.findIndex(s => s.name === name || s.role === name);
        if (idx >= 0 && discoveredSteps[idx]) {
          discoveredSteps[idx].status = status;
          if (emoji) discoveredSteps[idx].emoji = emoji;
          if (duration) discoveredSteps[idx].duration = duration;
          if (summary) discoveredSteps[idx].summary = summary;
        } else {
          discoveredSteps.push({ id, emoji: emoji || '🤖', name, role: role || name, status, dept: '', desc: summary || '', duration, summary });
        }
        const stepsForRender = discoveredSteps.map((s, i) => {
          if (s.status === 'done' || s.status === 'error') return { ...s };
          if (i < idx) return { ...s, status: 'done' };
          if (i === idx) return { ...s, status };
          return { ...s, status: 'pending' };
        });
        renderWorkflowSteps(stepsForRender);
        const statusIcon = status === 'done' ? '✅' : status === 'error' ? '❌' : '⏳';
        appendLog(`${statusIcon} ${emoji || '🤖'} ${name} ${duration ? duration + 's' : ''} ${summary ? '→ ' + summary : ''}`, status === 'error' ? 'err' : 'out');
      } else if (data.type === 'step_result') {
        // "── [1/2] ✍️ 技术文档工程师 (draft) ──"
        const { currentStep, totalSteps, emoji, name, stepType, index } = data;
        const idx = index !== undefined ? index : discoveredSteps.findIndex(s => s.name === name || s.role === name);
        if (idx >= 0 && discoveredSteps[idx]) {
          discoveredSteps[idx].status = 'running';
          discoveredSteps[idx].stepType = stepType;
          if (emoji) discoveredSteps[idx].emoji = emoji;
        }
        const stepsForRender = discoveredSteps.map((s, i) => {
          if (s.status === 'done') return { ...s };
          if (i < idx) return { ...s, status: 'done' };
          if (i === idx) return { ...s, status: 'running' };
          return { ...s, status: 'pending' };
        });
        renderWorkflowSteps(stepsForRender);
        appendLog(`⏳ [${currentStep}/${totalSteps}] ${emoji || '🤖'} ${name} (${stepType})`, 'out');
      } else if (data.type === 'step_done') {
        // "完成 | 2.2s | 5262 tokens" (单步完成)
        const { status, duration, tokens } = data;
        // 找到最后一个 running 的步骤标记为完成
        const runningIdx = discoveredSteps.findIndex(s => s.status === 'running');
        if (runningIdx >= 0) {
          discoveredSteps[runningIdx].status = status;
          discoveredSteps[runningIdx].duration = duration;
        }
        renderWorkflowSteps(discoveredSteps.map(s => ({ ...s })));
        const icon = status === 'done' ? '✅' : '❌';
        if (runningIdx >= 0) {
          appendLog(`${icon} ${discoveredSteps[runningIdx].emoji} ${discoveredSteps[runningIdx].name} ${duration}s | ${tokens} tokens`, status === 'done' ? 'out' : 'err');
        }
      } else if (data.type === 'meta') {
        // 元数据更新
        if (data.workflowName) {
          appendLog(`[META] 工作流: ${data.workflowName}`, 'sys');
        }
        if (data.stepCount) {
          updateStats(data.stepCount, data.stepCount, concurrency);
        }
        if (data.yamlGenerated) {
          appendLog(`[META] YAML 已生成: ${data.yamlGenerated}`, 'sys');
        }
        if (data.executing) {
          appendLog('[META] 开始执行工作流...', 'sys');
        }
        // compose 完成，YAML 已生成
        if (data.phase === 'compose_done' && data.yamlContent) {
          const escaped = data.yamlContent
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const highlighted = escaped
            .replace(/^(\s*)([\w_-]+):/gm, '$1<span class="y-key">$2</span>:')
            .replace(/: "(.*?)"/g, ': <span class="y-str">"$1"</span>')
            .replace(/: (\d+)/g, ': <span class="y-num">$1</span>')
            .replace(/(#.*)/g, '<span class="y-comment">$1</span>');
          appendYaml(highlighted);
          appendLog('[META] 工作流 YAML 已生成' + (autoRun ? '，准备执行...' : ''), 'sys');
        }
      } else if (data.type === 'summary') {
        // 执行汇总
        appendLog(`[SUMMARY] 完成: ${data.completed}/${data.total} 步 | ${data.duration}s | ${data.tokens} tokens`, 'ok');
      } else if (data.type === 'stdout') {
        const text = data.text || '';
        // 兼容：如果后端没有发送结构化事件，仍然用正则兜底
        if (discoveredSteps.length === 0) {
          const stepMatch = text.match(/参与者[:：]\s*(.+)/);
          if (stepMatch) {
            const agents = stepMatch[1].split('|').map(s => s.trim()).filter(Boolean);
            discoveredSteps = agents.map((a, i) => {
              const emojiMatch = a.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/u);
              const emoji = emojiMatch ? emojiMatch[1] : '🤖';
              const name = a.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/u, '').trim();
              return { id: `step_${i + 1}`, name, emoji, dept: '', desc: '', status: 'pending' };
            });
            updateStats(discoveredSteps.length, discoveredSteps.length, concurrency);
            renderWorkflowSteps(discoveredSteps);
            appendLog(`[PLAN] 发现 ${discoveredSteps.length} 个步骤: ${discoveredSteps.map(s => s.emoji + ' ' + s.name).join(' → ')}`, 'sys');
          }
        }
        // 写入日志（跳过已知结构化行避免重复）
        const isStructuredLine = /参与者[:：]|步骤数[:：]|工作流[:：]|──\s*\[|完成\s*\||完成[:：]\s*\d+\/\d+/.test(text);
        if (!isStructuredLine) {
          appendLog(text.replace(/\n$/, '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, ''), text.toLowerCase().includes('error') ? 'err' : 'out');
        }
      } else if (data.type === 'stderr') {
        const text = data.text || '';
        if (text.trim()) appendLog(text.replace(/\n$/, ''), 'warn');
      }
    },
    // onDone: 流式结束
    (data) => {
      isRunning = false;
      document.getElementById('run-badge').classList.add('hidden');
      document.getElementById('btn-run').disabled = false;
      document.getElementById('btn-preview').disabled = false;

      const success = data && data.code === 0;
      const phase = data && data.phase;
      const isComposeOnly = phase === 'compose';

      document.getElementById('stat-status').textContent = success ? (isComposeOnly ? '📝 YAML 已生成' : '✅ 完成') : '❌ 失败';

      // 如果后端返回了步骤信息，使用它
      if (data.steps && data.steps.length > 0 && discoveredSteps.length === 0) {
        discoveredSteps = data.steps;
      }

      // 所有步骤标记为最终状态
      if (discoveredSteps.length > 0) {
        const finalStatus = isComposeOnly ? 'pending' : (success ? 'done' : (s => s.status === 'error' ? 'error' : 'done'));
        renderWorkflowSteps(discoveredSteps.map(s => ({ ...s, status: typeof finalStatus === 'function' ? finalStatus(s) : finalStatus })));
        renderDag(discoveredSteps);
        // 自动切换到 DAG 视图（仅运行完成后）
        if (!isComposeOnly) {
          switchOutputTab('dag', null);
        }
      } else {
        // 如果没有解析到步骤信息，至少显示完成
        appendLog('[SYSTEM] 编排完成（未能解析步骤详情）', success ? 'ok' : 'err');
      }

      appendLog(success ? (isComposeOnly ? '[SYSTEM] 工作流 YAML 已生成，可点击运行' : '[SYSTEM] 所有步骤已完成') : '[SYSTEM] 执行异常退出', success ? 'ok' : 'err');
      showToast(success ? '工作流执行完成！' : '工作流执行失败', success ? 'success' : 'error');
    }
  ).catch(err => {
    isRunning = false;
    document.getElementById('run-badge').classList.add('hidden');
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-preview').disabled = false;
    document.getElementById('stat-status').textContent = '❌ 错误';
    appendLog(`[ERROR] ${err.message}`, 'err');
    showToast(`编排失败: ${err.message}`, 'error');
  });
}

async function runPreview() {
  const desc = document.getElementById('compose-desc').value.trim();
  if (!desc) { showToast('请先输入需求描述', 'warn'); return; }
  if (isRunning) { showToast('任务运行中，请稍候', 'warn'); return; }

  const provider = document.getElementById('provider-select').value;
  const lang = document.getElementById('compose-lang').value;
  const concurrency = document.getElementById('compose-concurrency').value;

  document.getElementById('btn-preview').disabled = true;
  appendLog('[SYSTEM] 正在生成工作流 YAML…', 'sys');

  try {
    const result = await api('POST', '/api/compose', {
      description: desc,
      provider: provider,
      lang: lang === 'auto' ? undefined : lang,
      autoRun: false,
      concurrency: parseInt(concurrency) || 2,
    });

    if (result.yaml) {
      // 显示真实 YAML
      const escaped = result.yaml
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const highlighted = escaped
        .replace(/^(\s*)([\w_-]+):/gm, '$1<span class="y-key">$2</span>:')
        .replace(/: "(.*?)"/g, ': <span class="y-str">"$1"</span>')
        .replace(/: (\d+)/g, ': <span class="y-num">$1</span>')
        .replace(/(#.*)/g, '<span class="y-comment">$1</span>');
      appendYaml(highlighted);

      // 尝试解析步骤信息更新工作流视图
      try {
        const parsed = result.yaml;
        const stepMatches = [...parsed.matchAll(/(?:- id:|role:)\s*(.+)/g)];
        if (stepMatches.length > 0) {
          const steps = stepMatches.map((m, i) => ({
            name: m[1].trim().replace(/["']/g, ''),
            emoji: '🤖', dept: '', desc: '', status: 'pending'
          }));
          updateStats(steps.length, steps.length, concurrency);
          renderWorkflowSteps(steps);
        }
      } catch (e) {}

      switchOutputTab('yaml', null);
      showToast('YAML 已生成', 'success');
    } else if (result.stdout) {
      document.getElementById('yaml-block').textContent = result.stdout;
      switchOutputTab('yaml', null);
      showToast('YAML 已生成（从输出提取）', 'success');
    } else {
      showToast('未能生成 YAML，请检查后端日志', 'warn');
    }
  } catch (err) {
    appendLog(`[ERROR] ${err.message}`, 'err');
    showToast(`生成失败: ${err.message}`, 'error');
  } finally {
    document.getElementById('btn-preview').disabled = false;
  }
}

function updateStats(agents, steps, concurrency) {
  document.getElementById('stat-agents').textContent = agents;
  document.getElementById('stat-steps').textContent = steps;
  document.getElementById('stat-concurrency').textContent = concurrency;
}

/* ========================================================
   WORKFLOW STEPS RENDER
   ======================================================== */
function renderWorkflowSteps(agents) {
  const el = document.getElementById('workflow-canvas');
  el.innerHTML = '';
  agents.forEach((a, i) => {
    const card = document.createElement('div');
    card.className = `step-card ${a.status || 'pending'}`;
    card.innerHTML = `
      <div class="step-num">${a.status === 'running' ? '⟳' : i + 1}</div>
      <div class="step-body">
        <div class="step-name">
          <span>${a.emoji || '🤖'}</span> ${a.name || a.role || `Step ${i + 1}`}
          <span class="tag ${a.status === 'done' ? 'tag-success' : a.status === 'running' ? 'tag-info' : a.status === 'error' ? 'tag-danger' : 'tag-neutral'}" style="font-size:10px;">
            ${a.status === 'done' ? '✓ 完成' : a.status === 'running' ? '⟳ 运行中' : a.status === 'error' ? '✗ 错误' : '○ 等待'}
          </span>
        </div>
        <div class="step-meta">${a.dept || a.role || ''}${a.desc ? ' · ' + a.desc : ''}</div>
      </div>
    `;
    el.appendChild(card);

    if (i < agents.length - 1) {
      const conn = document.createElement('div');
      conn.className = 'step-connector';
      conn.innerHTML = `<span class="connector-label">→ 输出传递</span>`;
      el.appendChild(conn);
    }
  });
}

/* ========================================================
   DAG RENDER
   ======================================================== */
function renderDag(agents) {
  const el = document.getElementById('dag-canvas');
  el.innerHTML = '';

  // Start node
  const startRow = document.createElement('div');
  startRow.className = 'dag-row';
  startRow.innerHTML = `<div class="dag-node start"><div class="dag-emoji">🎯</div><div class="dag-label">开始</div><div class="dag-sub">用户输入</div></div>`;
  el.appendChild(startRow);

  // Sequential agents
  agents.forEach((a, i) => {
    const arr = document.createElement('div');
    arr.className = 'dag-arrow';
    arr.textContent = '↓';
    el.appendChild(arr);

    const row = document.createElement('div');
    row.className = 'dag-row';
    row.innerHTML = `<div class="dag-node ${i === 2 || i === 3 ? 'parallel' : ''}">
      <div class="dag-emoji">${a.emoji}</div>
      <div class="dag-label">${a.name}</div>
      <div class="dag-sub">${a.dept}</div>
    </div>`;
    el.appendChild(row);
  });

  const endArr = document.createElement('div');
  endArr.className = 'dag-arrow';
  endArr.textContent = '↓';
  el.appendChild(endArr);

  const endRow = document.createElement('div');
  endRow.className = 'dag-row';
  endRow.innerHTML = `<div class="dag-node end"><div class="dag-emoji">✅</div><div class="dag-label">输出</div><div class="dag-sub">最终报告</div></div>`;
  el.appendChild(endRow);
}

/* ========================================================
   LOG
   ======================================================== */
function appendLog(msg, type = 'out') {
  const el = document.getElementById('log-terminal');
  const line = document.createElement('span');
  line.className = `log-line log-${type}`;
  const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  line.textContent = `[${ts}] ${msg}`;
  el.appendChild(line);
  el.appendChild(document.createElement('br'));
  el.scrollTop = el.scrollHeight;
}

/* ========================================================
   YAML
   ======================================================== */
function appendYaml(yaml) {
  document.getElementById('yaml-block').innerHTML = yaml;
}

/* ========================================================
   OUTPUT TABS
   ======================================================== */
function switchOutputTab(name, triggerEl) {
  document.querySelectorAll('.output-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.output-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('pane-' + name).classList.add('active');
  if (triggerEl) triggerEl.classList.add('active');
  else {
    const tab = document.querySelector(`.output-tab[onclick*="${name}"]`);
    if (tab) tab.classList.add('active');
  }
}

function clearOutput() {
  document.getElementById('workflow-canvas').innerHTML = `<div class="empty-state" id="workflow-empty"><div class="empty-icon">🤖</div><div class="empty-title">等待编排指令</div><div class="empty-desc">在左侧输入需求描述，点击「编排并运行」自动规划多 Agent 工作流</div></div>`;
  document.getElementById('log-terminal').innerHTML = '<span class="log-muted"># 已清空日志</span>';
  document.getElementById('yaml-block').innerHTML = '<span class="y-comment"># 点击「生成 YAML」后将在此显示</span>';
  document.getElementById('dag-canvas').innerHTML = `<div class="empty-state"><div class="empty-icon">🔀</div><div class="empty-title">DAG 图</div><div class="empty-desc">运行后展示工作流有向无环图</div></div>`;
  document.getElementById('stat-agents').textContent = '—';
  document.getElementById('stat-steps').textContent = '—';
  document.getElementById('stat-concurrency').textContent = '—';
  document.getElementById('stat-status').textContent = '就绪';
  showToast('已清空输出', 'info');
}

/* ========================================================
   ROLES VIEW
   ======================================================== */
/* ========================================================
   ROLES DATA LOADER
   ======================================================== */
async function loadRolesFromAPI() {
  try {
    const data = await api('GET', '/api/roles');
    if (data.success && data.categories) {
      // 映射后端格式为前端格式
      cachedCategories = data.categories.map(cat => ({
        category: cat.name,
        categoryKey: cat.key,
        categoryEmoji: cat.emoji,
        roles: cat.roles || []
      }));
      cachedRolesData = data.roles || [];
      return true;
    }
  } catch (err) {
    console.warn('从 API 加载角色失败，使用内嵌数据:', err.message);
  }
  // 降级到内嵌数据
  if (typeof AGENT_CATALOG !== 'undefined') {
    cachedCategories = AGENT_CATALOG;
    cachedRolesData = [];
    AGENT_CATALOG.forEach(d => d.roles.forEach(r => cachedRolesData.push({ ...r, category: d.category, categoryKey: d.categoryKey })));
    return true;
  }
  return false;
}

function renderDeptList() {
  const cats = cachedCategories || (typeof AGENT_CATALOG !== 'undefined' ? AGENT_CATALOG : []);
  if (!cats.length) return;
  const el = document.getElementById('dept-list');
  el.innerHTML = '';
  let total = 0;
  cats.forEach(dept => {
    const count = dept.roles ? dept.roles.length : (dept.count || 0);
    total += count;
    const key = dept.categoryKey || dept.key || '';
    const name = dept.category || dept.name || '';
    const item = document.createElement('div');
    item.className = 'cat-item';
    item.setAttribute('data-dept', key);
    item.onclick = () => filterDept(key, item);
    item.innerHTML = `<span style="font-size:13px">${name}</span><span class="cat-count">${count}</span>`;
    el.appendChild(item);
  });
  document.getElementById('total-count').textContent = total;
}

function filterDept(key, el) {
  document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  currentDept = key;
  searchRoles(document.getElementById('role-search').value);
}

function getRolesFiltered(query = '', dept = 'all') {
  const cats = cachedCategories || (typeof AGENT_CATALOG !== 'undefined' ? AGENT_CATALOG : []);
  if (!cats.length) return [];
  let all = [];
  cats.forEach(d => {
    const key = d.categoryKey || d.key || '';
    const name = d.category || d.name || '';
    if (dept === 'all' || key === dept) {
      (d.roles || []).forEach(r => all.push({
        ...r,
        deptName: name,
        deptKey: key,
      }));
    }
  });
  if (query) {
    const q = query.toLowerCase();
    all = all.filter(r =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.deptName || '').includes(q)
    );
  }
  return all;
}

async function renderRoles() {
  if (!cachedCategories) {
    await loadRolesFromAPI();
  }
  renderDeptList();
  searchRoles('');
}

function searchRoles(q) {
  const roles = getRolesFiltered(q, currentDept);
  const grid = document.getElementById('roles-grid');
  grid.innerHTML = '';

  document.getElementById('role-count-label').textContent = `${roles.length} 个角色`;

  if (roles.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">未找到角色</div><div class="empty-desc">尝试其他关键词</div></div>`;
    return;
  }

  roles.forEach(r => {
    const card = document.createElement('div');
    card.className = 'role-card';
    const toolTags = (r.tools || []).map(t => `<span class="role-tool">${t}</span>`).join('');
    const origTag = r.original ? '<span class="role-tool role-orig">原创</span>' : '';
    const safePath = (r.path || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeName = (r.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeDept = (r.deptName || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    card.innerHTML = `
      <div class="role-header">
        <div class="role-avatar">${r.emoji || '🤖'}</div>
        <div class="role-info">
          <div class="role-name">${r.name}</div>
          <div class="role-dept">${r.deptName}</div>
        </div>
        <div style="display:flex;gap:2px;flex-shrink:0;">
          <button class="btn btn-ghost btn-sm role-preview-btn" onclick="previewRole(event, '${safePath}', '${r.emoji || '🤖'}', '${safeName}', '${safeDept}')" title="预览角色详情">👁</button>
          <button class="btn btn-ghost btn-sm role-preview-btn" onclick="downloadRoleMdDirect(event, '${safePath}', '${safeName}')" title="导出MD文件">⬇</button>
        </div>
      </div>
      <div class="role-desc">${r.description}</div>
      ${toolTags || origTag ? `<div class="role-tools">${toolTags}${origTag}</div>` : ''}
    `;
    card.onclick = () => {
      card.classList.toggle('selected');
      showToast(card.classList.contains('selected')
        ? `已选中: ${r.name}` : `取消选中: ${r.name}`, 'info');
    };
    grid.appendChild(card);
  });
}

/* ========================================================
   ROLE PREVIEW
   ======================================================== */
async function previewRole(evt, rolePath, emoji, name, dept) {
  evt.stopPropagation();
  if (!rolePath) { showToast('缺少角色路径', 'warn'); return; }

  const overlay = document.getElementById('role-preview-overlay');
  const rpEmoji = document.getElementById('rp-emoji');
  const rpName = document.getElementById('rp-name');
  const rpDept = document.getElementById('rp-dept');
  const rpContent = document.getElementById('rp-content');
  const rpDownloadBtn = document.getElementById('rp-download-btn');

  rpEmoji.textContent = emoji || '🤖';
  rpName.textContent = name || '';
  rpDept.textContent = dept || '';
  rpContent.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-3)">加载中…</div>';
  rpDownloadBtn.style.display = 'none';

  // 存储到全局，供下载使用
  window._rpRawContent = '';
  window._rpRolePath = rolePath;
  window._rpRoleName = name || 'role';

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  try {
    const data = await api('GET', `/api/role/${rolePath.split('/').map(s => encodeURIComponent(s)).join('/')}`);
    if (data.success && data.content) {
      window._rpRawContent = data.content;
      rpContent.innerHTML = renderMarkdown(data.content);
      rpDownloadBtn.style.display = '';
    } else {
      rpContent.innerHTML = `<div style="text-align:center;padding:40px;color:var(--warning)">加载失败: ${data.error || '未知错误'}</div>`;
    }
  } catch (err) {
    rpContent.innerHTML = `<div style="text-align:center;padding:40px;color:var(--warning)">请求失败: ${err.message}</div>`;
  }
}

function downloadRoleMd() {
  const content = window._rpRawContent;
  if (!content) { showToast('无内容可导出', 'warn'); return; }

  const roleName = window._rpRoleName || 'role';
  const fileName = roleName.replace(/[\\/:*?"<>|]/g, '_') + '.md';
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`已导出: ${fileName}`, 'success');
}

async function downloadRoleMdDirect(evt, rolePath, name) {
  evt.stopPropagation();
  if (!rolePath) { showToast('缺少角色路径', 'warn'); return; }

  try {
    const data = await api('GET', `/api/role/${rolePath.split('/').map(s => encodeURIComponent(s)).join('/')}`);
    if (data.success && data.content) {
      const fileName = (name || 'role').replace(/[\\/:*?"<>|]/g, '_') + '.md';
      const blob = new Blob([data.content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`已导出: ${fileName}`, 'success');
    } else {
      showToast(`导出失败: ${data.error || '未知错误'}`, 'warn');
    }
  } catch (err) {
    showToast(`导出失败: ${err.message}`, 'warn');
  }
}

function closeRolePreview() {
  const overlay = document.getElementById('role-preview-overlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// 简易 Markdown → HTML 渲染（无需第三方库）
function renderMarkdown(md) {
  let html = md;

  // 移除 frontmatter
  html = html.replace(/^---\n[\s\S]*?\n---\n?/, '');

  // 代码块
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre class="md-code-block"><code class="lang-${lang || 'text'}">${escaped}</code></pre>`;
  });

  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

  // 标题
  html = html.replace(/^### (.+)$/gm, '<h4 class="md-h">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="md-h">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2 class="md-h">$1</h2>');

  // 粗体 / 斜体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 无序列表
  html = html.replace(/^[*-] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul class="md-ul">$1</ul>');
  // 合并相邻 ul
  html = html.replace(/<\/ul>\s*<ul class="md-ul">/g, '');

  // 有序列表
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // 水平线
  html = html.replace(/^---+$/gm, '<hr class="md-hr">');

  // 段落（连续非空行）
  html = html.replace(/\n{2,}/g, '\n</p><p>\n');

  // 换行
  html = html.replace(/\n/g, '<br>');

  return `<p>${html}</p>`;
}

// ESC 关闭模态框
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeRolePreview();
});

function addAllToBuilder() {
  const selected = document.querySelectorAll('#roles-grid .role-card.selected');
  if (selected.length === 0) {
    showToast('请先在角色库中勾选角色', 'warn');
    return;
  }
  // 从 DOM 中提取角色信息并添加到构建器
  selected.forEach(card => {
    const emoji = card.querySelector('.role-avatar')?.textContent?.trim() || '🤖';
    const name = card.querySelector('.role-name')?.textContent?.trim() || '';
    const dept = card.querySelector('.role-dept')?.textContent?.trim() || '';
    const desc = card.querySelector('.role-desc')?.textContent?.trim() || '';
    if (name) {
      builderSteps.push({ emoji, name, dept, desc });
    }
    card.classList.remove('selected');
  });
  document.getElementById('wf-step-count').textContent = `${builderSteps.length} 步骤`;
  showToast(`已将 ${selected.length} 个角色添加到构建器`, 'success');
  switchView('builder', null);
  renderBuilderCanvas();
}

/* ========================================================
   BUILDER VIEW
   ======================================================== */
async function renderBuilderRoles(q) {
  if (!cachedCategories) {
    await loadRolesFromAPI();
  }
  const roles = getRolesFiltered(q, 'all').slice(0, 60);
  const el = document.getElementById('builder-roles-container');
  el.innerHTML = '';
  roles.forEach(r => {
    const item = document.createElement('div');
    item.className = 'example-item';
    item.style.cssText = 'justify-content:space-between; margin-bottom:5px;';
    const safeDesc = (r.description || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeName = (r.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeDept = (r.deptName || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safePath = (r.path || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    item.innerHTML = `
      <span style="display:flex;align-items:center;gap:8px;font-size:12px;overflow:hidden">
        <span style="font-size:15px;flex-shrink:0">${r.emoji || '🤖'}</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.name || ''}</span>
      </span>
      <span style="display:flex;gap:4px;flex-shrink:0;">
        <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 5px;" onclick="previewRole(event, '${safePath}', '${r.emoji || '🤖'}', '${safeName}', '${safeDept}')" title="预览">👁</button>
        <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 5px;" onclick="downloadRoleMdDirect(event, '${safePath}', '${safeName}')" title="导出MD">⬇</button>
        <button class="btn btn-secondary btn-sm" style="flex-shrink:0;font-size:11px;" onclick="addToBuilder(event, '${r.emoji || '🤖'}', '${safeName}', '${safeDept}', '${safeDesc}')">+</button>
      </span>
    `;
    el.appendChild(item);
  });
}

function filterBuilderRoles(q) {
  renderBuilderRoles(q);
}

function addToBuilder(evt, emoji, name, dept, desc) {
  evt.stopPropagation();
  builderSteps.push({ emoji, name, dept, desc });
  renderBuilderCanvas();
  document.getElementById('wf-step-count').textContent = `${builderSteps.length} 步骤`;
  showToast(`已添加: ${name}`, 'success');
}

function renderBuilderCanvas() {
  const canvas = document.getElementById('builder-canvas');
  const empty = document.getElementById('builder-empty');
  const steps = document.getElementById('builder-steps');

  if (builderSteps.length === 0) {
    empty.style.display = 'flex';
    steps.classList.add('hidden');
    return;
  }

  empty.style.display = 'none';
  steps.classList.remove('hidden');
  steps.innerHTML = '';

  builderSteps.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'step-card';
    card.innerHTML = `
      <div class="step-num">${i + 1}</div>
      <div class="step-body">
        <div class="step-name"><span>${s.emoji}</span> ${s.name}</div>
        <div class="step-meta">${s.dept} · ${s.desc}</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="removeBuilderStep(${i})" style="flex-shrink:0">✕</button>
    `;
    steps.appendChild(card);

    if (i < builderSteps.length - 1) {
      const conn = document.createElement('div');
      conn.className = 'step-connector';
      conn.innerHTML = `<span class="connector-label">→ 下一步</span>`;
      steps.appendChild(conn);
    }
  });
}

function removeBuilderStep(idx) {
  builderSteps.splice(idx, 1);
  renderBuilderCanvas();
  document.getElementById('wf-step-count').textContent = `${builderSteps.length} 步骤`;
  showToast('已移除步骤', 'info');
}

function clearWorkflow() {
  builderSteps = [];
  renderBuilderCanvas();
  document.getElementById('wf-step-count').textContent = '0 步骤';
  showToast('已清空工作流', 'info');
}

async function runBuilderWorkflow() {
  if (builderSteps.length === 0) {
    showToast('请先添加至少一个角色步骤', 'warn');
    return;
  }
  if (isRunning) { showToast('任务运行中，请稍候', 'warn'); return; }

  const name = document.getElementById('wf-name').value || '自定义工作流';
  const provider = document.getElementById('provider-select').value;

  // 构建工作流对象
  const workflow = {
    name: name,
    agents_dir: 'agency-agents-zh',
    llm: { provider: provider },
    concurrency: 1,
    steps: builderSteps.map((s, i) => ({
      id: `step_${i + 1}`,
      role: s.name,
      name: s.name,
      emoji: s.emoji,
      task: s.desc || `执行 ${s.name} 任务`,
      depends_on: i > 0 ? [`step_${i}`] : [],
    })),
  };

  isRunning = true;
  switchView('compose', null);
  document.getElementById('run-badge').classList.remove('hidden');
  document.getElementById('btn-run').disabled = true;
  document.getElementById('btn-preview').disabled = true;
  document.getElementById('stat-status').textContent = '运行中';
  updateStats(builderSteps.length, builderSteps.length, 1);
  renderWorkflowSteps(builderSteps.map(s => ({ ...s, status: 'pending' })));
  appendLog(`[SYSTEM] 自定义工作流 "${name}" 已启动`, 'sys');

  try {
    const result = await api('POST', '/api/workflow/run', { workflow, inputs: {} });

    if (result.stdout) {
      appendLog(result.stdout, 'out');
    }
    if (result.stderr) {
      appendLog(result.stderr, 'warn');
    }
    if (result.generatedYaml) {
      const escaped = result.generatedYaml
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const highlighted = escaped
        .replace(/^(\s*)([\w_-]+):/gm, '$1<span class="y-key">$2</span>:')
        .replace(/: "(.*?)"/g, ': <span class="y-str">"$1"</span>')
        .replace(/: (\d+)/g, ': <span class="y-num">$1</span>')
        .replace(/(#.*)/g, '<span class="y-comment">$1</span>');
      appendYaml(highlighted);
    }

    const success = result.success !== false && result.code === 0;
    document.getElementById('stat-status').textContent = success ? '✅ 完成' : '❌ 失败';
    renderWorkflowSteps(builderSteps.map(s => ({ ...s, status: success ? 'done' : 'error' })));
    renderDag(builderSteps);
    appendLog(success ? '[SYSTEM] 工作流执行完成' : `[SYSTEM] 工作流执行失败 (exit code: ${result.code})`, success ? 'ok' : 'err');
    showToast(success ? `工作流 "${name}" 执行完成！` : '工作流执行失败', success ? 'success' : 'error');
  } catch (err) {
    appendLog(`[ERROR] ${err.message}`, 'err');
    showToast(`运行失败: ${err.message}`, 'error');
    document.getElementById('stat-status').textContent = '❌ 错误';
  } finally {
    isRunning = false;
    document.getElementById('run-badge').classList.add('hidden');
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-preview').disabled = false;
  }
}

async function exportBuilderYaml() {
  if (builderSteps.length === 0) {
    showToast('请先添加角色步骤', 'warn');
    return;
  }

  const name = document.getElementById('wf-name').value || '自定义工作流';
  const provider = document.getElementById('provider-select').value;

  const workflow = {
    name: name,
    agents_dir: 'agency-agents-zh',
    llm: { provider: provider },
    concurrency: 1,
    steps: builderSteps.map((s, i) => ({
      id: `step_${i + 1}`,
      role: s.name,
      name: s.name,
      emoji: s.emoji,
      task: s.desc || `执行 ${s.name} 任务`,
      depends_on: i > 0 ? [`step_${i}`] : [],
    })),
  };

  try {
    const result = await api('POST', '/api/workflow/build', { workflow });
    if (result.success && result.yaml) {
      const escaped = result.yaml
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const highlighted = escaped
        .replace(/^(\s*)([\w_-]+):/gm, '$1<span class="y-key">$2</span>:')
        .replace(/: "(.*?)"/g, ': <span class="y-str">"$1"</span>')
        .replace(/: (\d+)/g, ': <span class="y-num">$1</span>')
        .replace(/(#.*)/g, '<span class="y-comment">$1</span>');
      appendYaml(highlighted);
      switchView('compose', null);
      switchOutputTab('yaml', null);
      showToast('YAML 已生成并导出', 'success');
    } else {
      showToast('YAML 生成失败', 'warn');
    }
  } catch (err) {
    showToast(`导出失败: ${err.message}`, 'error');
  }
}

/* ========================================================
   TEMPLATES
   ======================================================== */
/* ========================================================
   TEMPLATES DATA LOADER
   ======================================================== */
async function loadWorkflowsFromAPI() {
  try {
    const data = await api('GET', '/api/workflows');
    if (data.success) {
      cachedWorkflowCategories = data.categories || [];
      cachedWorkflows = data.workflows || [];
      return true;
    }
  } catch (err) {
    console.warn('从 API 加载模板失败:', err.message);
  }
  // 降级：空数据
  cachedWorkflows = [];
  cachedWorkflowCategories = [];
  return false;
}

async function renderTemplates() {
  if (!cachedWorkflows) {
    await loadWorkflowsFromAPI();
  }
  searchTemplates('');
}

function searchTemplates(q) {
  const grid = document.getElementById('templates-grid');
  grid.innerHTML = '';

  const wfs = cachedWorkflows || [];
  const filtered = q
    ? wfs.filter(t => (t.name || '').includes(q) || (t.description || '').includes(q) || (t.category || '').includes(q))
    : wfs;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📋</div><div class="empty-title">暂无模板</div><div class="empty-desc">${cachedWorkflows ? '尝试其他关键词或检查后端连接' : '正在加载...'}</div></div>`;
    return;
  }

  // 模板图标颜色映射
  const colorMap = ['indigo', 'sky', 'green', 'amber', 'rose'];
  const iconPool = ['🚀', '📱', '📊', '✍️', '🔒', '🧠', '💰', '🎮', '🌍', '📈', '🏥', '🎓', '🔧', '📋', '🎯', '🛠️', '⚡', '🧪', '🎨', '📦'];

  filtered.forEach((t, i) => {
    const icon = iconPool[i % iconPool.length];
    const color = colorMap[i % colorMap.length];
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
      <div class="tmpl-header">
        <div class="tmpl-icon ${color}">${icon}</div>
        <div>
          <div class="tmpl-title">${t.name || t.id}</div>
        </div>
      </div>
      <div class="tmpl-desc">${t.description || '暂无描述'}</div>
      <div class="tmpl-footer">
        <div style="display:flex;gap:5px;flex-wrap:wrap;">
          <span class="tag tag-neutral">${t.category || '通用'}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="tmpl-steps">${t.stepCount || (t.steps && t.steps.length) || '?'} 步</span>
          <button class="btn btn-primary btn-sm" onclick="loadTemplate('${t.id}')">运行</button>
          <button class="btn btn-secondary btn-sm" onclick="previewTemplate('${t.id}')">预览</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function loadTemplate(workflowId) {
  if (!workflowId) { showToast('无效的模板 ID', 'warn'); return; }
  if (isRunning) { showToast('任务运行中，请稍候', 'warn'); return; }

  isRunning = true;
  document.getElementById('run-badge').classList.remove('hidden');
  document.getElementById('btn-run').disabled = true;
  switchView('compose', null);

  appendLog(`[SYSTEM] 运行模板: ${workflowId}`, 'sys');
  document.getElementById('stat-status').textContent = '运行中';

  try {
    // 使用 SSE 流式执行模板
    let tplSteps = [];
    await apiSSE('/api/run/stream', { workflowId: workflowId },
      (data) => {
        if (data.type === 'plan') {
          tplSteps = data.steps || [];
          updateStats(tplSteps.length, tplSteps.length, 1);
          renderWorkflowSteps(tplSteps.map(s => ({ ...s, status: 'pending' })));
          appendLog(`[PLAN] 发现 ${tplSteps.length} 个步骤: ${tplSteps.map(s => s.emoji + ' ' + s.name).join(' → ')}`, 'sys');
        } else if (data.type === 'step') {
          const { index, emoji, name, duration, summary, status } = data;
          const idx = index !== undefined ? index : tplSteps.findIndex(s => s.name === name);
          if (idx >= 0 && tplSteps[idx]) {
            tplSteps[idx].status = status;
            if (emoji) tplSteps[idx].emoji = emoji;
          } else {
            tplSteps.push({ emoji: emoji || '🤖', name, role: name, status, dept: '', desc: summary || '' });
          }
          renderWorkflowSteps(tplSteps.map((s, i) => {
            if (s.status === 'done' || s.status === 'error') return { ...s };
            if (i < idx) return { ...s, status: 'done' };
            if (i === idx) return { ...s, status };
            return { ...s, status: 'pending' };
          }));
          const statusIcon = status === 'done' ? '✅' : status === 'error' ? '❌' : '⏳';
          appendLog(`${statusIcon} ${emoji || '🤖'} ${name} ${duration ? duration + 's' : ''} ${summary ? '→ ' + summary : ''}`, status === 'error' ? 'err' : 'out');
        } else if (data.type === 'step_result') {
          const { currentStep, totalSteps, emoji, name, stepType, index } = data;
          const idx = index !== undefined ? index : tplSteps.findIndex(s => s.name === name);
          if (idx >= 0 && tplSteps[idx]) {
            tplSteps[idx].status = 'running';
            if (emoji) tplSteps[idx].emoji = emoji;
          }
          renderWorkflowSteps(tplSteps.map((s, i) => {
            if (s.status === 'done') return { ...s };
            if (i < idx) return { ...s, status: 'done' };
            if (i === idx) return { ...s, status: 'running' };
            return { ...s, status: 'pending' };
          }));
          appendLog(`⏳ [${currentStep}/${totalSteps}] ${emoji || '🤖'} ${name} (${stepType})`, 'out');
        } else if (data.type === 'step_done') {
          const { status, duration, tokens } = data;
          const runningIdx = tplSteps.findIndex(s => s.status === 'running');
          if (runningIdx >= 0) {
            tplSteps[runningIdx].status = status;
            tplSteps[runningIdx].duration = duration;
          }
          renderWorkflowSteps(tplSteps.map(s => ({ ...s })));
          const icon = status === 'done' ? '✅' : '❌';
          if (runningIdx >= 0) {
            appendLog(`${icon} ${tplSteps[runningIdx].emoji} ${tplSteps[runningIdx].name} ${duration}s | ${tokens} tokens`, status === 'done' ? 'out' : 'err');
          }
        } else if (data.type === 'summary') {
          appendLog(`[SUMMARY] 完成: ${data.completed}/${data.total} 步 | ${data.duration}s | ${data.tokens} tokens`, 'ok');
        } else if (data.type === 'stdout') {
          const text = (data.text || '').replace(/\n$/, '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
          const isStructuredLine = /参与者[:：]|步骤数[:：]|工作流[:：]|──\s*\[|完成\s*\||完成[:：]\s*\d+\/\d+/.test(text);
          if (!isStructuredLine && text.trim()) appendLog(text, 'out');
        } else if (data.type === 'stderr') {
          const text = (data.text || '').replace(/\n$/, '');
          if (text.trim()) appendLog(text, 'warn');
        }
      },
      (data) => {
        isRunning = false;
        document.getElementById('run-badge').classList.add('hidden');
        document.getElementById('btn-run').disabled = false;
        const success = data && data.code === 0;
        document.getElementById('stat-status').textContent = success ? '✅ 完成' : '❌ 失败';
        if (tplSteps.length > 0) {
          renderWorkflowSteps(tplSteps.map(s => ({ ...s, status: success ? 'done' : (s.status === 'error' ? 'error' : 'done') })));
          renderDag(tplSteps);
        }
        appendLog(success ? '[SYSTEM] 模板执行完成' : '[SYSTEM] 模板执行失败', success ? 'ok' : 'err');
        showToast(success ? '模板执行完成！' : '模板执行失败', success ? 'success' : 'error');
      }
    );
  } catch (err) {
    isRunning = false;
    document.getElementById('run-badge').classList.add('hidden');
    document.getElementById('btn-run').disabled = false;
    document.getElementById('stat-status').textContent = '❌ 错误';
    appendLog(`[ERROR] ${err.message}`, 'err');
    showToast(`模板运行失败: ${err.message}`, 'error');
  }
}

async function previewTemplate(workflowId) {
  if (!workflowId) return;
  try {
    const data = await api('GET', `/api/workflow/${encodeURIComponent(workflowId)}`);
    if (data.success && data.yaml) {
      const escaped = data.yaml
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const highlighted = escaped
        .replace(/^(\s*)([\w_-]+):/gm, '$1<span class="y-key">$2</span>:')
        .replace(/: "(.*?)"/g, ': <span class="y-str">"$1"</span>')
        .replace(/: (\d+)/g, ': <span class="y-num">$1</span>')
        .replace(/(#.*)/g, '<span class="y-comment">$1</span>');
      appendYaml(highlighted);
      switchView('compose', null);
      switchOutputTab('yaml', null);

      // 渲染步骤到工作流视图
      if (data.workflow && data.workflow.steps) {
        const steps = data.workflow.steps.map(s => ({
          name: s.name || s.role || s.id,
          emoji: s.emoji || '🤖',
          dept: s.role || '',
          desc: (s.task || '').slice(0, 60),
          status: 'pending'
        }));
        renderWorkflowSteps(steps);
      }

      showToast('模板预览已加载', 'success');
    } else {
      showToast('无法加载模板详情', 'warn');
    }
  } catch (err) {
    showToast(`加载模板失败: ${err.message}`, 'error');
  }
}

/* ========================================================
   PROVIDER CHANGE
   ======================================================== */
function onProviderChange(val) {
  showToast(`已切换 LLM: ${val}`, 'success');
}

/* ========================================================
   INIT
   ======================================================== */
async function initApp() {
  // 尝试连接后端 API
  try {
    const status = await api('GET', '/api/status');
    document.getElementById('status-dot').className = 'pulse-dot online';
    document.getElementById('ao-version').textContent = status.aoVersion || 'connected';
    console.log('✅ 后端连接成功:', status);
  } catch (err) {
    document.getElementById('status-dot').className = 'pulse-dot';
    document.getElementById('ao-version').textContent = 'offline';
    console.warn('⚠️ 后端未连接:', err.message);
    showToast('后端服务未连接，部分功能可能不可用', 'warn');
  }

  // 尝试加载角色数据（预加载）
  await loadRolesFromAPI();
  renderDeptList();
}

initApp();
