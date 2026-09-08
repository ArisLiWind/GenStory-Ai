# GenSphere 后端部署指南

## 架构

- **前端**: Cloudflare Pages（静态页面）
- **后端**: Cloudflare Workers（API 服务）
- **数据库**: Cloudflare D1（SQLite）
- **管理后台**: `/admin.html`（使用 Admin Token 登录）

## 文件结构

```
gensphere-website/
├── backend/              # 后端 Worker 代码
│   ├── src/
│   │   ├── index.js         # 入口 + 路由分发
│   │   ├── utils.js         # 工具函数
│   │   ├── routes/
│   │   │   ├── auth.js         # 认证接口
│   │   │   ├── characters.js   # 角色 CRUD
│   │   │   ├── chat.js         # 聊天接口
│   │   │   ├── admin.js        # 管理后台接口
│   │   │   └── categories.js   # 分类接口
│   │   └── services/
│   │       └── llm.js          # LLM 多密钥轮询 + RPG 逻辑
│   ├── schema.sql          # 数据库建表脚本
│   ├── wrangler.toml       # Worker 配置
│   └── package.json
├── admin.html              # 管理后台页面
└── ... 前端页面
```

## 部署步骤

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
cd backend
wrangler login
```

### 3. 创建 D1 数据库

```bash
wrangler d1 create gensphere-db
```

创建后会输出 database_id，把它填到 `wrangler.toml` 里：

```toml
[[d1_databases]]
binding = "DB"
database_name = "gensphere-db"
database_id = "你的database_id"
```

### 4. 执行数据库初始化脚本

```bash
wrangler d1 execute gensphere-db --file=./schema.sql
```

### 5. 设置环境变量

```bash
wrangler secret put ADMIN_TOKEN
# 输入一个你自己的管理员令牌（用于登录管理后台）

wrangler secret put JWT_SECRET
# 输入一个随机字符串，用于 token 签名
```

### 6. 部署 Worker

```bash
wrangler deploy
```

部署成功后会得到一个 Worker 地址，比如 `https://gensphere-api.yourname.workers.dev`

### 7. 配置前端 API 地址

如果前端和 Worker 不在同一个域名，需要修改 `js/api.js` 里的 `API_BASE`：

```javascript
const API_BASE = 'https://gensphere-api.yourname.workers.dev/api';
```

**推荐做法**：在 Cloudflare Pages 项目设置里，把 `/api/*` 路径绑定到 Worker（自定义域 + Workers Route），这样前端和后端同域名，不用改配置。

### 8. 部署前端 Pages

```bash
cd ..  # 回到项目根目录
# 在 Cloudflare Pages 控制台连接 Git 仓库自动部署
# 或使用 wrangler pages deploy
```

## 管理后台使用

访问 `https://你的域名/admin.html`，输入 Admin Token 登录。

功能：
- 📊 **数据概览**: 用户数、角色数、消息数、活跃密钥数
- 🔑 **API密钥管理**: 添加/删除/启用 LLM API 密钥，支持多密钥轮询
- 🏷️ **分类管理**: 添加/删除分类，自定义排序
- 🎭 **角色管理**: 审核角色、发布/下架
- 👥 **用户管理**: 设置管理员、禁用用户

## API 接口列表

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/send-code | 发送验证码（万能码：335566） |
| POST | /api/auth/login | 登录/注册 |
| GET | /api/auth/me | 获取当前用户 |
| PUT | /api/auth/me | 更新用户信息 |

### 角色
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/characters | 角色列表（分页+筛选） |
| GET | /api/characters/:id | 角色详情 |
| POST | /api/characters | 创建角色 |
| PUT | /api/characters/:id | 更新角色 |
| DELETE | /api/characters/:id | 删除角色 |
| POST | /api/characters/:id/favorite | 收藏/取消收藏 |
| GET | /api/characters/mine | 我的角色 |

### 分类
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/categories | 获取全部分类 |

### 聊天
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/chat/sessions | 会话列表 |
| POST | /api/chat/sessions | 创建会话 |
| GET | /api/chat/sessions/:id | 会话消息 |
| DELETE | /api/chat/sessions/:id | 删除会话 |
| POST | /api/chat/:id/send | 发送消息 |
| GET | /api/chat/character/:id | 获取或创建角色会话 |

### 管理后台（需要 X-Admin-Token）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/stats | 数据统计 |
| GET/POST | /api/admin/api-keys | API密钥列表/添加 |
| PUT/DELETE | /api/admin/api-keys/:id | 更新/删除密钥 |
| POST | /api/admin/categories | 添加分类 |
| PUT/DELETE | /api/admin/categories/:id | 更新/删除分类 |
| GET | /api/admin/users | 用户列表 |
| PUT | /api/admin/users/:id | 更新用户 |
| GET | /api/admin/characters | 角色列表 |
| PUT | /api/admin/characters/:id | 审核角色 |

## RPG 模式

当角色分类包含 `rpg`、`xianxia`、`wuxia`、`fantasy` 之一时，自动启用 RPG 模式：
- 场景描写更生动详细
- 使用 *动作* 格式增强表现力
- 根据玩家选择推动剧情
- 加入战斗、探索等 RPG 元素
- 控制回复长度，给玩家反应空间

## 多 API 密钥轮询

支持配置多个 API 密钥，自动轮询使用：
- 按优先级排序
- 失败自动切换到下一个密钥
- 记录每个密钥的调用次数
- 支持 OpenAI、Anthropic、DeepSeek、智谱等任何兼容 OpenAI 格式的接口

## 分类系统

默认分类：
- 全部 (all)
- 修仙玄幻 (xianxia) ⚔️
- 江湖武侠 (wuxia) 🗡️
- 古风言情 (ancient) 🏮
- 历史真实 (history) 📜
- 动漫游戏 (anime) 🎮
- 现代都市 (modern) 🏙️
- 科幻未来 (scifi) 🚀
- 异世界 (fantasy) 🐉
- 悬疑恐怖 (horror) 👻
- 搞笑日常 (comedy) 😄
- 甜蜜恋爱 (sweet) 💕
- RPG冒险 (rpg) 🗺️
- 原创OC (oc) 🎭
- 男性角色 (male) ♂️
- 女性角色 (female) ♀️
- 多人角色 (multi) 👥

可在管理后台自由增删改。
