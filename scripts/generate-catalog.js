#!/usr/bin/env node

/**
 * generate-catalog.js
 * 从 agency-agents-zh 角色库目录自动生成 src/data/agent-catalog.js
 *
 * 用法:
 *   node scripts/generate-catalog.js [角色库路径]
 *   node scripts/generate-catalog.js                          # 使用默认路径
 *   node scripts/generate-catalog.js D:/SourceCode/agency-agents-zh
 *
 * 也可通过环境变量指定:
 *   AO_CWD=D:/SourceCode/agency-agents-zh node scripts/generate-catalog.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ─── 配置 ───────────────────────────────────────────────
const AGENTS_DIR = process.argv[2] || process.env.AO_CWD || 'D:/SourceCode/agency-agents-zh';
const OUTPUT_FILE = path.resolve(__dirname, '..', 'src', 'data', 'agent-catalog.js');

// 要跳过的非角色目录
const SKIP_DIRS = new Set([
  'ao-output', 'examples', 'integrations', 'scripts', 'workflows',
  '.github', '.idea', '.git', 'node_modules', '.vscode',
]);

// 部门映射（与 server.js 保持一致）
const CATEGORY_MAP = {
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
  'strategy': '🎯 战略部',
};

// ─── 核心逻辑 ───────────────────────────────────────────

function parseAgentCatalog(agentsDir) {
  const allRoles = [];

  if (!fs.existsSync(agentsDir)) {
    console.error(`❌ 角色目录不存在: ${agentsDir}`);
    process.exit(1);
  }

  const dirs = fs.readdirSync(agentsDir).sort();

  for (const dirName of dirs) {
    if (SKIP_DIRS.has(dirName)) continue;

    const dirPath = path.join(agentsDir, dirName);
    if (!fs.statSync(dirPath).isDirectory()) continue;

    const categoryInfo = CATEGORY_MAP[dirName];
    const categoryEmoji = categoryInfo?.split(' ')[0] || '📁';
    const categoryName = categoryInfo?.split(' ').slice(1).join(' ') || dirName;

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md')).sort();

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // 解析 frontmatter
      const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fmMatch) {
        console.warn(`  ⚠ 跳过（无 frontmatter）: ${dirName}/${file}`);
        continue;
      }

      try {
        const fm = yaml.load(fmMatch[1]);
        if (!fm.name) {
          console.warn(`  ⚠ 跳过（无 name 字段）: ${dirName}/${file}`);
          continue;
        }

        const rolePath = `${dirName}/${file.replace('.md', '')}`;

        allRoles.push({
          path: rolePath,
          name: fm.name,
          emoji: fm.emoji || '🤖',
          description: fm.description || '',
        tools: Array.isArray(fm.tools) ? fm.tools : (fm.tools ? [String(fm.tools)] : []),
        original: fm.original || false,
          category: categoryName,
          categoryKey: dirName,
          categoryEmoji: categoryEmoji,
        });
      } catch (e) {
        console.warn(`  ⚠ 解析失败: ${dirName}/${file} — ${e.message}`);
      }
    }
  }

  return allRoles;
}

function generateCatalogFile(roles) {
  // 按部门分组
  const groups = {};
  for (const r of roles) {
    const key = r.categoryKey;
    if (!groups[key]) {
      groups[key] = {
        category: `${r.categoryEmoji} ${r.category}`,
        categoryKey: key,
        roles: [],
      };
    }
    groups[key].roles.push(r);
  }

  // 按映射顺序排列分组
  const orderedKeys = Object.keys(CATEGORY_MAP);
  const sortedGroups = orderedKeys
    .filter(k => groups[k])
    .map(k => groups[k]);

  // 统计
  const totalRoles = roles.length;
  const totalCategories = sortedGroups.length;

  // 生成 JS 代码
  const lines = [];
  lines.push('// 角色库数据 - 自动生成，请勿手动修改');
  lines.push(`// 生成时间: ${new Date().toISOString()}`);
  lines.push(`// 源目录: ${AGENTS_DIR}`);
  lines.push(`// 共 ${totalRoles} 个角色，${totalCategories} 个部门分类`);
  lines.push('// 生成命令: node scripts/generate-catalog.js');
  lines.push('');
  lines.push('const AGENT_CATALOG = [');

  for (const group of sortedGroups) {
    lines.push('  // ============================================');
    lines.push(`  // ${group.category} (${group.roles.length} 个角色)`);
    lines.push('  // ============================================');
    lines.push('  {');
    lines.push(`    category: '${group.category}',`);
    lines.push(`    categoryKey: '${group.categoryKey}',`);
    lines.push('    roles: [');

    for (const r of group.roles) {
      const toolsStr = r.tools.length > 0
        ? `[${r.tools.map(t => `'${t}'`).join(', ')}]`
        : '[]';
      const originalStr = r.original ? ', original: true' : '';
      const desc = r.description.replace(/'/g, "\\'");
      const name = r.name.replace(/'/g, "\\'");

      lines.push(`      { path: '${r.path}', name: '${name}', emoji: '${r.emoji}', description: '${desc}', tools: ${toolsStr}${originalStr} },`);
    }

    lines.push('    ]');
    lines.push('  },');
    lines.push('');
  }

  lines.push('];');
  lines.push('');
  lines.push('// 导出为平面列表');
  lines.push('function getFlatRoles() {');
  lines.push('  const flat = [];');
  lines.push('  for (const category of AGENT_CATALOG) {');
  lines.push('    for (const role of category.roles) {');
  lines.push('      flat.push({');
  lines.push('        ...role,');
  lines.push('        category: category.category,');
  lines.push('        categoryKey: category.categoryKey,');
  lines.push('      });');
  lines.push('    }');
  lines.push('  }');
  lines.push('  return flat;');
  lines.push('}');
  lines.push('');
  lines.push('// 导出按分类分组');
  lines.push('function getGroupedRoles() {');
  lines.push('  return AGENT_CATALOG;');
  lines.push('}');
  lines.push('');
  lines.push('// 搜索角色');
  lines.push('function searchRoles(keyword) {');
  lines.push('  const flat = getFlatRoles();');
  lines.push('  const lowerKeyword = keyword.toLowerCase();');
  lines.push('  return flat.filter(role =>');
  lines.push('    role.name.toLowerCase().includes(lowerKeyword) ||');
  lines.push("    role.path.toLowerCase().includes(lowerKeyword) ||");
  lines.push("    role.description.toLowerCase().includes(lowerKeyword) ||");
  lines.push("    role.category.toLowerCase().includes(lowerKeyword)");
  lines.push('  );');
  lines.push('}');
  lines.push('');
  lines.push('// 获取角色统计');
  lines.push('function getStats() {');
  lines.push('  const flat = getFlatRoles();');
  lines.push('  return {');
  lines.push('    total: flat.length,');
  lines.push('    categories: AGENT_CATALOG.length,');
  lines.push('    originalCount: flat.filter(r => r.original).length,');
  lines.push('    withToolsCount: flat.filter(r => r.tools && r.tools.length > 0).length,');
  lines.push('  };');
  lines.push('}');
  lines.push('');
  lines.push('module.exports = {');
  lines.push('  AGENT_CATALOG,');
  lines.push('  getFlatRoles,');
  lines.push('  getGroupedRoles,');
  lines.push('  searchRoles,');
  lines.push('  getStats,');
  lines.push('};');
  lines.push('');

  return lines.join('\n');
}

// ─── 主流程 ─────────────────────────────────────────────

console.log(`📂 角色库目录: ${AGENTS_DIR}`);
console.log(`📝 输出文件:   ${OUTPUT_FILE}`);
console.log('');

const roles = parseAgentCatalog(AGENTS_DIR);

console.log('');
console.log(`✅ 共解析 ${roles.length} 个角色`);

// 按部门统计
const deptStats = {};
for (const r of roles) {
  const key = `${r.categoryEmoji} ${r.category}`;
  deptStats[key] = (deptStats[key] || 0) + 1;
}
for (const [dept, count] of Object.entries(deptStats)) {
  console.log(`   ${dept}: ${count} 个`);
}

const content = generateCatalogFile(roles);

// 确保输出目录存在
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');
console.log('');
console.log(`🎉 已生成: ${OUTPUT_FILE}`);
