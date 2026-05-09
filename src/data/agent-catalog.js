// 角色库数据 - 180 个 AI 角色，16 个部门分类
// 该文件由 agency-orchestrator 的 agency-agents-zh 目录动态生成

const AGENT_CATALOG = [
  // ============================================
  // 📢 营销部 (33 个角色)
  // ============================================
  {
    category: '📢 营销部',
    categoryKey: 'marketing',
    roles: [
      { path: 'marketing/marketing-xiaohongshu-operator', name: '小红书运营专家', emoji: '📕', description: '小红书内容创作与运营策略', tools: [], original: true },
      { path: 'marketing/marketing-douyin-strategist', name: '抖音策略师', emoji: '🎬', description: '抖音短视频内容策略与运营', tools: [], original: true },
      { path: 'marketing/marketing-wechat-official', name: '微信公众号运营', emoji: '💬', description: '微信公众号内容策划与运营', tools: [], original: true },
      { path: 'marketing/marketing-bilibili-strategist', name: 'B站内容策略师', emoji: '📺', description: 'B站视频内容策略', tools: [], original: true },
      { path: 'marketing/marketing-livestream-ecommerce', name: '直播电商主播教练', emoji: '🎥', description: '直播电商话术与技巧培训', tools: [], original: true },
      { path: 'marketing/marketing-knowledge付费', name: '知识付费产品策划师', emoji: '💎', description: '知识付费产品设计与运营', tools: [], original: true },
      { path: 'marketing/marketing-social-media-manager', name: '社交媒体经理', emoji: '📱', description: '跨平台社交媒体运营', tools: ['brave-search'] },
      { path: 'marketing/marketing-brand-strategist', name: '品牌策略师', emoji: '🏷️', description: '品牌定位与战略规划', tools: [] },
      { path: 'marketing/marketing-content-strategist', name: '内容策略师', emoji: '✍️', description: '内容营销策略制定', tools: [] },
      { path: 'marketing/marketing-growth-hacker', name: '增长黑客', emoji: '🚀', description: '增长策略与实验', tools: [] },
      { path: 'marketing/marketing-seo-specialist', name: 'SEO专家', emoji: '🔍', description: '搜索引擎优化', tools: ['brave-search'] },
      { path: 'marketing/marketing-email-marketer', name: '邮件营销专家', emoji: '📧', description: '邮件营销策略与执行', tools: [] },
      { path: 'marketing/marketing-influencer-manager', name: 'KOL合作经理', emoji: '🤝', description: '网红/KOL合作管理', tools: [] },
      { path: 'marketing/marketing-community-manager', name: '社区运营专家', emoji: '👥', description: '社区建设与运营', tools: [] },
      { path: 'marketing/marketing-pr-specialist', name: 'PR专家', emoji: '🎤', description: '公共关系管理', tools: [] },
      { path: 'marketing/marketing-analyst', name: '营销分析师', emoji: '📊', description: '营销数据分析', tools: [] },
      { path: 'marketing/marketing-campaign-manager', name: '营销活动经理', emoji: '🎯', description: '营销活动策划与执行', tools: [] },
      { path: 'marketing/marketing-copywriter', name: '文案撰写师', emoji: '📝', description: '营销文案创作', tools: [] },
      { path: 'marketing/marketing-video-producer', name: '视频制作人', emoji: '🎬', description: '短视频制作与策划', tools: [] },
      { path: 'marketing/marketing-ecommerce-specialist', name: '电商运营专家', emoji: '🛒', description: '电商平台运营', tools: [], original: true },
      { path: 'marketing/marketing-private-traffic', name: '私域运营专家', emoji: '🔐', description: '私域流量运营', tools: [], original: true },
      { path: 'marketing/marketing-wechat-mini-program', name: '小程序运营专家', emoji: '📱', description: '微信小程序运营', tools: [], original: true },
      { path: 'marketing/marketing-dingtalk-marketing', name: '钉钉营销专家', emoji: '💼', description: '企业营销数字化', tools: [], original: true },
      { path: 'marketing/marketing-feishu-marketing', name: '飞书营销专家', emoji: '📋', description: '企业协同营销', tools: [], original: true },
      { path: 'marketing/marketing-gov-affairs', name: '政务新媒体运营', emoji: '🏛️', description: '政府机构新媒体运营', tools: [], original: true },
      { path: 'marketing/marketing-medical-health', name: '医疗健康内容运营', emoji: '🏥', description: '医疗健康行业内容运营', tools: [], original: true },
      { path: 'marketing/marketing-education', name: '教育行业营销', emoji: '🎓', description: '教育培训行业营销', tools: [], original: true },
      { path: 'marketing/marketing-real-estate', name: '房地产营销', emoji: '🏠', description: '房地产营销策划', tools: [], original: true },
      { path: 'marketing/marketing-finance-products', name: '金融产品营销', emoji: '💰', description: '金融产品推广', tools: [], original: true },
      { path: 'marketing/marketing-automotive', name: '汽车营销', emoji: '🚗', description: '汽车行业营销', tools: [], original: true },
      { path: 'marketing/marketing-fmcg', name: '快消品营销', emoji: '🛍️', description: '快消品营销策略', tools: [], original: true },
      { path: 'marketing/marketing-luxury-goods', name: '奢侈品营销', emoji: '👑', description: '奢侈品品牌营销', tools: [], original: true },
      { path: 'marketing/marketing-cross-border', name: '跨境电商营销', emoji: '🌏', description: '跨境电商运营', tools: [], original: true },
    ]
  },

  // ============================================
  // 🛠️ 工程部 (27 个角色)
  // ============================================
  {
    category: '🛠️ 工程部',
    categoryKey: 'engineering',
    roles: [
      { path: 'engineering/engineering-frontend-developer', name: '前端开发者', emoji: '🖥️', description: 'Web前端开发', tools: ['code-interpreter', 'github'] },
      { path: 'engineering/engineering-backend-developer', name: '后端开发者', emoji: '⚙️', description: '服务端开发', tools: ['code-interpreter', 'github'] },
      { path: 'engineering/engineering-architect', name: '软件架构师', emoji: '🏗️', description: '系统架构设计', tools: ['code-interpreter'] },
      { path: 'engineering/engineering-ai-engineer', name: 'AI工程师', emoji: '🤖', description: 'AI应用开发', tools: ['code-interpreter'] },
      { path: 'engineering/engineering-security-engineer', name: '安全工程师', emoji: '🔒', description: '安全开发与审计', tools: ['code-interpreter'] },
      { path: 'engineering/engineering-devops-engineer', name: 'DevOps工程师', emoji: '🔧', description: 'CI/CD与运维', tools: ['code-interpreter'] },
      { path: 'engineering/engineering-sre', name: 'SRE工程师', emoji: '📈', description: '站点可靠性工程', tools: ['code-interpreter'] },
      { path: 'engineering/engineering-database-admin', name: '数据库管理员', emoji: '🗄️', description: '数据库设计与优化', tools: ['code-interpreter'] },
      { path: 'engineering/engineering-mobile-developer', name: '移动端开发者', emoji: '📱', description: 'iOS/Android开发', tools: ['code-interpreter', 'github'] },
      { path: 'engineering/engineering-data-engineer', name: '数据工程师', emoji: '📊', description: '数据管道开发', tools: ['code-interpreter'] },
      { path: 'engineering/engineering-ml-engineer', name: '机器学习工程师', emoji: '🧠', description: 'ML模型开发', tools: ['code-interpreter'] },
      { path: 'engineering/engineering-qa-engineer', name: '测试工程师', emoji: '🧪', description: '质量保证', tools: ['code-interpreter'] },
      { path: 'engineering/engineering-technical-writer', name: '技术文档工程师', emoji: '📖', description: '技术写作', tools: [] },
      { path: 'engineering/engineering-api-designer', name: 'API设计师', emoji: '🔌', description: 'REST API设计', tools: [] },
      { path: 'engineering/engineering-code-reviewer', name: '代码审查员', emoji: '🔍', description: '代码评审', tools: ['github'] },
      { path: 'engineering/engineering-threat-detector', name: '威胁检测工程师', emoji: '🚨', description: '安全威胁分析', tools: ['code-interpreter'] },
      { path: 'engineering/engineering-blockchain-auditor', name: '区块链安全审计师', emoji: '⛓️', description: '智能合约审计', tools: ['code-interpreter'] },
      { path: 'engineering/engineering-embedded-developer', name: '嵌入式开发者', emoji: '🔧', description: '嵌入式系统开发', tools: ['code-interpreter'] },
      { path: 'engineering/engineering-cloud-architect', name: '云架构师', emoji: '☁️', description: '云原生架构', tools: [] },
      { path: 'engineering/engineering-performance-tuner', name: '性能调优工程师', emoji: '⚡', description: '性能优化', tools: ['code-interpreter'] },
      { path: 'engineering/engineering-wechat-miniapp', name: '微信小程序开发者', emoji: '🐲', description: '微信小程序开发', tools: [], original: true },
      { path: 'engineering/engineering-feishu-developer', name: '飞书集成开发工程师', emoji: '📋', description: '飞书应用开发', tools: [], original: true },
      { path: 'engineering/engineering-dingtalk-developer', name: '钉钉集成开发工程师', emoji: '💼', description: '钉钉应用开发', tools: [], original: true },
      { path: 'engineering/engineering-bytedance-developer', name: '字节系产品开发者', emoji: '📱', description: '抖音/头条小程序开发', tools: [], original: true },
      { path: 'engineering/engineering-alipay-miniapp', name: '支付宝小程序开发者', emoji: '💳', description: '支付宝小程序开发', tools: [], original: true },
      { path: 'engineering/engineering-baidu-miniapp', name: '百度小程序开发者', emoji: '🔎', description: '百度小程序开发', tools: [], original: true },
      { path: 'engineering/engineering-quickapp', name: '快应用开发者', emoji: '⚡', description: '快应用开发', tools: [], original: true },
    ]
  },

  // ============================================
  // 🔬 专项部 (29 个角色)
  // ============================================
  {
    category: '🔬 专项部',
    categoryKey: 'specialist',
    roles: [
      { path: 'specialist/specialist-prompt-engineer', name: '提示词工程师', emoji: '💡', description: 'AI提示词优化', tools: [] },
      { path: 'specialist/specialist-study-abroad', name: '留学规划顾问', emoji: '🎓', description: '留学申请指导', tools: [] },
      { path: 'specialist/specialist-government-digital', name: '政务数字化售前顾问', emoji: '🏛️', description: '政务数字化方案', tools: [], original: true },
      { path: 'specialist/specialist-gaokao', name: '高考志愿填报顾问', emoji: '📝', description: '高考志愿规划', tools: [], original: true },
      { path: 'specialist/specialist-mcp-builder', name: 'MCP构建器', emoji: '🔧', description: 'MCP协议开发', tools: ['code-interpreter'] },
      { path: 'specialist/specialist-document-generator', name: '文档生成器', emoji: '📄', description: '自动生成文档', tools: [] },
      { path: 'specialist/specialist-meeting-assistant', name: '会议助手', emoji: '📅', description: '会议纪要整理', tools: [] },
      { path: 'specialist/specialist-exec-assistant', name: '高管助理', emoji: '👔', description: '高管日程管理', tools: [] },
      { path: 'specialist/specialist-travel-planner', name: '旅行规划师', emoji: '✈️', description: '行程规划', tools: ['brave-search'] },
      { path: 'specialist/specialist-dietitian', name: '营养师', emoji: '🥗', description: '饮食营养规划', tools: [] },
      { path: 'specialist/specialist-fitness-coach', name: '健身教练', emoji: '💪', description: '健身计划制定', tools: [] },
      { path: 'specialist/specialist-legal-consultant', name: '法律顾问', emoji: '⚖️', description: '法律咨询', tools: [] },
      { path: 'specialist/specialist-financial-advisor', name: '财务顾问', emoji: '💵', description: '财务规划', tools: [] },
      { path: 'specialist/specialist-career-coach', name: '职业规划师', emoji: '📈', description: '职业发展指导', tools: [] },
      { path: 'specialist/specialist-interview-coach', name: '面试教练', emoji: '🎯', description: '面试技巧培训', tools: [] },
      { path: 'specialist/specialist-language-tutor', name: '语言导师', emoji: '🗣️', description: '外语学习指导', tools: [] },
      { path: 'specialist/specialist-investment-advisor', name: '投资顾问', emoji: '📈', description: '投资策略建议', tools: [] },
      { path: 'specialist/specialist-mental-health', name: '心理健康顾问', emoji: '🧘', description: '心理健康支持', tools: [] },
      { path: 'specialist/specialist-parenting-consultant', name: '育儿顾问', emoji: '👶', description: '育儿指导', tools: [] },
      { path: 'specialist/specialist-interior-designer-consult', name: '室内设计顾问', emoji: '🏠', description: '装修设计建议', tools: [] },
      { path: 'specialist/specialist-wedding-planner', name: '婚礼策划师', emoji: '💒', description: '婚礼策划', tools: [] },
      { path: 'specialist/specialist-event-planner', name: '活动策划师', emoji: '🎪', description: '活动策划执行', tools: [] },
      { path: 'specialist/specialist-gift-consultant', name: '礼品顾问', emoji: '🎁', description: '礼品选择建议', tools: [] },
      { path: 'specialist/specialist-wine-sommelier', name: '品酒师', emoji: '🍷', description: '葡萄酒品鉴', tools: [] },
      { path: 'specialist/specialist-coffee-barista', name: '咖啡师', emoji: '☕', description: '咖啡知识', tools: [] },
      { path: 'specialist/specialist-cooking-chef', name: '烹饪大师', emoji: '🍳', description: '食谱与烹饪', tools: [] },
      { path: 'specialist/specialist-pet-consultant', name: '宠物顾问', emoji: '🐾', description: '宠物养护指导', tools: [] },
      { path: 'specialist/specialist-fengshui-consultant', name: '风水顾问', emoji: '🧘', description: '家居风水咨询', tools: [], original: true },
      { path: 'specialist/specialist-bazi-consultant', name: '八字命理师', emoji: '📜', description: '命理分析', tools: [], original: true },
    ]
  },

  // ============================================
  // 🎮 游戏开发 (20 个角色)
  // ============================================
  {
    category: '🎮 游戏开发',
    categoryKey: 'game-dev',
    roles: [
      { path: 'game-dev/game-unity-architect', name: 'Unity架构师', emoji: '🎮', description: 'Unity游戏架构', tools: ['code-interpreter'] },
      { path: 'game-dev/game-unreal-engineer', name: 'Unreal系统工程师', emoji: '🎨', description: 'Unreal引擎开发', tools: ['code-interpreter'] },
      { path: 'game-dev/game-godot-developer', name: 'Godot游戏脚本开发者', emoji: '🎲', description: 'Godot脚本编写', tools: ['code-interpreter'] },
      { path: 'game-dev/game-roblox-designer', name: 'Roblox体验设计师', emoji: '🧱', description: 'Roblox游戏开发', tools: ['code-interpreter'] },
      { path: 'game-dev/game-gameplay-programmer', name: '游戏玩法程序员', emoji: '🎯', description: '游戏机制实现', tools: ['code-interpreter'] },
      { path: 'game-dev/game-ai-designer', name: '游戏AI设计师', emoji: '🤖', description: '游戏AI开发', tools: ['code-interpreter'] },
      { path: 'game-dev/game-level-designer', name: '关卡设计师', emoji: '🗺️', description: '游戏关卡设计', tools: [] },
      { path: 'game-dev/game-narrative-designer', name: '叙事设计师', emoji: '📖', description: '游戏剧情设计', tools: [] },
      { path: 'game-dev/game-economy-designer', name: '经济系统设计师', emoji: '💰', description: '游戏经济平衡', tools: [] },
      { path: 'game-dev/game-monetization', name: '游戏变现专家', emoji: '📊', description: '内购与广告策略', tools: [] },
      { path: 'game-dev/game-community-manager', name: '游戏社区经理', emoji: '👥', description: '玩家社区运营', tools: [] },
      { path: 'game-dev/game-localization', name: '游戏本地化专家', emoji: '🌍', description: '多语言本地化', tools: [] },
      { path: 'game-dev/game-qa-lead', name: '游戏测试主管', emoji: '🧪', description: '游戏质量保证', tools: ['code-interpreter'] },
      { path: 'game-dev/game-accessibility', name: '游戏无障碍专家', emoji: '♿', description: '游戏无障碍设计', tools: [] },
      { path: 'game-dev/game-art-director', name: '游戏美术总监', emoji: '🎨', description: '游戏美术风格', tools: ['dalle3'] },
      { path: 'game-dev/game-sound-designer', name: '游戏音效设计师', emoji: '🔊', description: '游戏音效', tools: [] },
      { path: 'game-dev/game-vip-designer', name: 'VIP系统设计师', emoji: '👑', description: '会员系统设计', tools: [] },
      { path: 'game-dev/game-matchmaking', name: '匹配系统设计师', emoji: '⚖️', description: '对战匹配算法', tools: [] },
      { path: 'game-dev/game-live-ops', name: '游戏运营专家', emoji: '📡', description: '实时运营活动', tools: [] },
      { path: 'game-dev/game-china-platform', name: '国内平台适配专家', emoji: '🇨🇳', description: '版号与平台适配', tools: [], original: true },
    ]
  },

  // ============================================
  // 🧪 测试部 (9 个角色)
  // ============================================
  {
    category: '🧪 测试部',
    categoryKey: 'testing',
    roles: [
      { path: 'testing/testing-api-tester', name: 'API测试员', emoji: '🔌', description: 'API接口测试', tools: ['code-interpreter'] },
      { path: 'testing/testing-performance-benchmarker', name: '性能基准师', emoji: '⚡', description: '性能测试', tools: ['code-interpreter'] },
      { path: 'testing/testing-accessibility-auditor', name: '无障碍审核员', emoji: '♿', description: '无障碍测试', tools: [] },
      { path: 'testing/testing-embedded-systems', name: '嵌入式测试工程师', emoji: '🔧', description: '嵌入式系统测试', tools: ['code-interpreter'] },
      { path: 'testing/testing-security-penetration', name: '渗透测试工程师', emoji: '🔓', description: '安全渗透测试', tools: ['code-interpreter'] },
      { path: 'testing/testing-automation', name: '自动化测试工程师', emoji: '🤖', description: '测试自动化', tools: ['code-interpreter'] },
      { path: 'testing/testing-mobile', name: '移动端测试工程师', emoji: '📱', description: 'App测试', tools: ['code-interpreter'] },
      { path: 'testing/testing-regression', name: '回归测试工程师', emoji: '🔁', description: '回归测试', tools: ['code-interpreter'] },
      { path: 'testing/testing-e2e', name: '端到端测试工程师', emoji: '🔄', description: 'E2E测试', tools: ['code-interpreter'] },
    ]
  },

  // ============================================
  // 🎨 设计部 (8 个角色)
  // ============================================
  {
    category: '🎨 设计部',
    categoryKey: 'design',
    roles: [
      { path: 'design/design-ui-designer', name: 'UI设计师', emoji: '🎨', description: '界面视觉设计', tools: ['figma', 'dalle3'] },
      { path: 'design/design-ux-researcher', name: 'UX研究员', emoji: '🔬', description: '用户体验研究', tools: [] },
      { path: 'design/design-image-prompt', name: '图像提示词工程师', emoji: '🖼️', description: 'AI绘图提示词', tools: ['dalle3'] },
      { path: 'design/design-visual-storyteller', name: '视觉叙事师', emoji: '📽️', description: '视觉故事设计', tools: [] },
      { path: 'design/design-brand-identity', name: '品牌视觉设计师', emoji: '🏷️', description: '品牌识别设计', tools: ['figma', 'dalle3'] },
      { path: 'design/design-ux-writer', name: 'UX文案撰写师', emoji: '✍️', description: '界面文案设计', tools: [] },
      { path: 'design/design-design-system', name: '设计系统工程师', emoji: '🧩', description: '设计系统构建', tools: ['figma'] },
      { path: 'design/design-motion', name: '动效设计师', emoji: '✨', description: '交互动效设计', tools: ['figma'] },
    ]
  },

  // ============================================
  // 💼 销售部 (8 个角色)
  // ============================================
  {
    category: '💼 销售部',
    categoryKey: 'sales',
    roles: [
      { path: 'sales/sales-business-development', name: '客户拓展策略师', emoji: '🤝', description: '业务拓展策略', tools: [] },
      { path: 'sales/sales-win-strategy', name: '赢单策略师', emoji: '🏆', description: '销售赢单策略', tools: [] },
      { path: 'sales/sales-discovery-coach', name: 'Discovery教练', emoji: '🔍', description: '需求发现技巧', tools: [] },
      { path: 'sales/sales-pipeline-analyst', name: 'Pipeline分析师', emoji: '📊', description: '销售漏斗分析', tools: [] },
      { path: 'sales/sales-proposal-writer', name: '方案撰写专家', emoji: '📝', description: '投标方案撰写', tools: [] },
      { path: 'sales/sales-objection-handler', name: '异议处理专家', emoji: '💬', description: '处理客户异议', tools: [] },
      { path: 'sales/sales-closing-specialist', name: '成交专家', emoji: '✅', description: '促成交易', tools: [] },
      { path: 'sales/sales-account-manager', name: '客户经理', emoji: '👤', description: '客户关系维护', tools: [] },
    ]
  },

  // ============================================
  // 💰 付费媒体 (7 个角色)
  // ============================================
  {
    category: '💰 付费媒体',
    categoryKey: 'paid-media',
    roles: [
      { path: 'paid-media/paid-media-auditor', name: '付费媒体审计师', emoji: '🔍', description: '广告账户审计', tools: [] },
      { path: 'paid-media/paid-media-ppc-strategist', name: 'PPC竞价策略师', emoji: '💹', description: '付费点击广告', tools: [] },
      { path: 'paid-media/paid-media-programmatic', name: '程序化广告采买专家', emoji: '🤖', description: '程序化投放', tools: [] },
      { path: 'paid-media/paid-media-google-ads', name: 'Google Ads专家', emoji: '🔍', description: 'Google广告', tools: [] },
      { path: 'paid-media/paid-media-meta-ads', name: 'Meta广告专家', emoji: '📘', description: 'Facebook/Instagram广告', tools: [] },
      { path: 'paid-media/paid-media-tiktok-ads', name: 'TikTok广告专家', emoji: '🎵', description: 'TikTok广告投放', tools: [] },
      { path: 'paid-media/paid-media-retargeting', name: '再营销专家', emoji: '🔄', description: '用户再营销', tools: [] },
    ]
  },

  // ============================================
  // 🤝 支持部 (8 个角色)
  // ============================================
  {
    category: '🤝 支持部',
    categoryKey: 'support',
    roles: [
      { path: 'support/support-customer-response', name: '客服响应者', emoji: '💬', description: '客户服务响应', tools: [] },
      { path: 'support/support-data-analyst', name: '数据分析师', emoji: '📊', description: '数据分析报告', tools: ['code-interpreter'] },
      { path: 'support/support-exec-summary', name: '高管摘要师', emoji: '📋', description: '高管汇报摘要', tools: [] },
      { path: 'support/support-infra-ops', name: '基础设施运维师', emoji: '🖥️', description: '基础设施运维', tools: ['code-interpreter'] },
      { path: 'support/support-incident-commander', name: '事故指挥官', emoji: '🚨', description: '故障应急响应', tools: [] },
      { path: 'support/support-knowledge-base', name: '知识库管理员', emoji: '📚', description: '知识库维护', tools: [] },
      { path: 'support/support-training-coordinator', name: '培训协调员', emoji: '🎓', description: '培训组织', tools: [] },
      { path: 'support/support-onboarding', name: '入职引导专员', emoji: '👋', description: '新员工入职', tools: [] },
    ]
  },

  // ============================================
  // 📋 项目管理 (6 个角色)
  // ============================================
  {
    category: '📋 项目管理',
    categoryKey: 'project-management',
    roles: [
      { path: 'project-management/pm-senior-pm', name: '高级项目经理', emoji: '📊', description: '项目整体管理', tools: [] },
      { path: 'project-management/pm-experiment-tracker', name: '实验追踪员', emoji: '🔬', description: 'A/B测试追踪', tools: [] },
      { path: 'project-management/pm-jira-workflow', name: 'Jira工作流管家', emoji: '📋', description: 'Jira流程优化', tools: [] },
      { path: 'project-management/pm-sprint-planner', name: 'Sprint规划师', emoji: '🏃', description: '敏捷Sprint规划', tools: [] },
      { path: 'project-management/pm-retrospective', name: '复盘会议引导师', emoji: '🔄', description: '项目复盘', tools: [] },
      { path: 'project-management/pm-stakeholder-comm', name: '干系人沟通专员', emoji: '👥', description: '项目沟通管理', tools: [] },
    ]
  },

  // ============================================
  // 🥽 空间计算 (6 个角色)
  // ============================================
  {
    category: '🥽 空间计算',
    categoryKey: 'spatial-computing',
    roles: [
      { path: 'spatial-computing/spatial-visionos-engineer', name: 'visionOS空间工程师', emoji: '👁️', description: 'Apple Vision Pro开发', tools: ['code-interpreter'] },
      { path: 'spatial-computing/spatial-xr-architect', name: 'XR界面架构师', emoji: '🏗️', description: 'XR应用架构', tools: ['code-interpreter'] },
      { path: 'spatial-computing/spatial-immersive-dev', name: 'XR沉浸式开发者', emoji: '🌐', description: '沉浸式体验开发', tools: ['code-interpreter'] },
      { path: 'spatial-computing/spatial-interaction-design', name: '空间交互设计师', emoji: '👋', description: '空间交互设计', tools: [] },
      { path: 'spatial-computing/spatial-content-creator', name: '空间内容创作者', emoji: '🎨', description: '空间内容制作', tools: ['dalle3'] },
      { path: 'spatial-computing/spatial-accessibility', name: '空间无障碍专家', emoji: '♿', description: 'XR无障碍设计', tools: [] },
    ]
  },

  // ============================================
  // 📖 学术部 (6 个角色)
  // ============================================
  {
    category: '📖 学术部',
    categoryKey: 'academic',
    roles: [
      { path: 'academic/academic-anthropologist', name: '人类学家', emoji: '🧬', description: '人类文化研究', tools: [] },
      { path: 'academic/academic-historian', name: '历史学家', emoji: '📜', description: '历史事件分析', tools: [] },
      { path: 'academic/academic-narrative-designer', name: '叙事学家', emoji: '📖', description: '故事结构分析', tools: [] },
      { path: 'academic/academic-psychologist', name: '心理学家', emoji: '🧠', description: '心理现象分析', tools: [] },
      { path: 'academic/academic-learning-designer', name: '学习规划师', emoji: '🎓', description: '学习方法指导', tools: [] },
      { path: 'academic/academic-research-assistant', name: '学术研究助手', emoji: '🔬', description: '学术研究辅助', tools: [] },
    ]
  },

  // ============================================
  // 📦 产品部 (5 个角色)
  // ============================================
  {
    category: '📦 产品部',
    categoryKey: 'product',
    roles: [
      { path: 'product/product-product-manager', name: '产品经理', emoji: '📋', description: '产品规划与管理', tools: [] },
      { path: 'product/product-trend-researcher', name: '趋势研究员', emoji: '🔭', description: '行业趋势研究', tools: ['brave-search'] },
      { path: 'product/product-sprint-sorter', name: 'Sprint排序师', emoji: '📊', description: '产品待办排序', tools: [] },
      { path: 'product/product-market-analyst', name: '市场分析师', emoji: '📈', description: '市场竞争分析', tools: [] },
      { path: 'product/product-growth-strategist', name: '增长策略师', emoji: '🚀', description: '产品增长策略', tools: [] },
    ]
  },

  // ============================================
  // 🚚 供应链 (3 个角色)
  // ============================================
  {
    category: '🚚 供应链',
    categoryKey: 'supply-chain',
    roles: [
      { path: 'supply-chain/supply-demand-forecaster', name: '库存预测专家', emoji: '📦', description: '需求预测', tools: [] },
      { path: 'supply-chain/supply-supplier-evaluator', name: '供应商评估专家', emoji: '🤝', description: '供应商管理', tools: [] },
      { path: 'supply-chain/supply-logistics-optimizer', name: '物流路线优化师', emoji: '🚚', description: '物流优化', tools: [] },
    ]
  },

  // ============================================
  // 🏦 金融部 (3 个角色)
  // ============================================
  {
    category: '🏦 金融部',
    categoryKey: 'finance',
    roles: [
      { path: 'finance/finance-forecasting-analyst', name: '财务预测分析师', emoji: '📊', description: '财务预测', tools: [] },
      { path: 'finance/finance-invoice-manager', name: '发票管理专家', emoji: '🧾', description: '发票管理', tools: [] },
      { path: 'finance/finance-risk-analyst', name: '金融风控分析师', emoji: '⚠️', description: '风险控制', tools: [] },
    ]
  },

  // ============================================
  // 👔 人力资源 (2 个角色)
  // ============================================
  {
    category: '👔 人力资源',
    categoryKey: 'hr',
    roles: [
      { path: 'hr/hr-recruiting-expert', name: '招聘专家', emoji: '👥', description: '招聘流程优化', tools: [] },
      { path: 'hr/hr-performance-manager', name: '绩效管理专家', emoji: '📈', description: '绩效评估', tools: [] },
    ]
  },

  // ============================================
  // ⚖️ 法务部 (2 个角色)
  // ============================================
  {
    category: '⚖️ 法务部',
    categoryKey: 'legal',
    roles: [
      { path: 'legal/legal-contract-reviewer', name: '合同审查专家', emoji: '📝', description: '合同审核', tools: [] },
      { path: 'legal/legal-policy-writer', name: '制度文件撰写专家', emoji: '📋', description: '规章制度撰写', tools: [] },
    ]
  },
];

// 导出为平面列表
function getFlatRoles() {
  const flat = [];
  for (const category of AGENT_CATALOG) {
    for (const role of category.roles) {
      flat.push({
        ...role,
        category: category.category,
        categoryKey: category.categoryKey,
      });
    }
  }
  return flat;
}

// 导出按分类分组
function getGroupedRoles() {
  return AGENT_CATALOG;
}

// 搜索角色
function searchRoles(keyword) {
  const flat = getFlatRoles();
  const lowerKeyword = keyword.toLowerCase();
  
  return flat.filter(role => 
    role.name.toLowerCase().includes(lowerKeyword) ||
    role.path.toLowerCase().includes(lowerKeyword) ||
    role.description.toLowerCase().includes(lowerKeyword) ||
    role.category.toLowerCase().includes(lowerKeyword)
  );
}

// 获取角色统计
function getStats() {
  const flat = getFlatRoles();
  return {
    total: flat.length,
    categories: AGENT_CATALOG.length,
    originalCount: flat.filter(r => r.original).length,
    withToolsCount: flat.filter(r => r.tools && r.tools.length > 0).length,
  };
}

module.exports = {
  AGENT_CATALOG,
  getFlatRoles,
  getGroupedRoles,
  searchRoles,
  getStats,
};
