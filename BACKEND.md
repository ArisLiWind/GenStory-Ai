# GenSphere 后端架构设计

## 概述

当前使用前端模拟后端 API（`js/api.js`），便于快速开发和调试。未来接入真实后端时，只需替换 API 层的实现即可，前端业务代码无需改动。

## 架构分层

```
┌─────────────────────────────────────────┐
│           前端 (Frontend)               │
│  main.js / login.js / onboarding-*.js   │
└──────────────────┬──────────────────────┘
                   │ 调用
┌──────────────────▼──────────────────────┐
│          API 层 (API Layer)             │
│       GenSphereAPI.xxx()                │
│  统一入口 / 统一响应格式 / 模拟延迟    │
└──────────────────┬──────────────────────┘
                   │ 调用
┌──────────────────▼──────────────────────┐
│        Service 层 (Service Layer)       │
│  AuthService / CharacterService / ...   │
│  业务逻辑处理 / 参数校验 / 数据组装    │
└──────────────────┬──────────────────────┘
                   │ 读写
┌──────────────────▼──────────────────────┐
│         Model 层 (Model Layer)          │
│              DB 对象                    │
│   数据模型定义 / 持久化 (localStorage)  │
└─────────────────────────────────────────┘
```

## API 响应格式

所有接口统一返回格式：

```javascript
{
    code: 0,           // 状态码：0=成功，400=参数错误，401=未授权，404=不存在，500=服务器错误
    data: { ... },     // 响应数据
    message: 'success' // 提示信息
}
```

## 模块划分

### 1. AuthService - 认证服务

| 方法 | 说明 | 参数 |
|------|------|------|
| `sendVerifyCode(phone)` | 发送验证码 | phone: 手机号 |
| `login(phone, code)` | 登录（未注册自动创建） | phone, code |
| `autoLogin(token)` | 自动登录 | token: 登录凭证 |
| `logout()` | 退出登录 | - |
| `updateUser(phone, updates)` | 更新用户信息 | phone, updates: { username, avatar, topics, ... } |

**万能验证码**：`335566`（开发/测试用，任何手机号都可使用）

**Token 结构**：模拟 JWT，Base64 编码，包含 userId、phone、exp（过期时间）

### 2. CharacterService - 角色服务

| 方法 | 说明 | 参数 |
|------|------|------|
| `getList(params)` | 获取角色列表 | page, pageSize, category, sortBy, keyword |
| `getDetail(id)` | 获取角色详情 | id: 角色ID |
| `toggleFavorite(userId, charId)` | 收藏/取消收藏 | userId, charId |

**分类**：all, male, female, oc, fictional, anime, game, fantasy, scifi, ancient, modern, horror, comedy, sweet, drama, multi

**排序**：views（热度）, rating（评分）, newest（最新）

## 用户数据模型

```javascript
{
    id: 'user_xxx',           // 用户ID
    phone: '13800138000',     // 手机号
    username: '',             // 用户名
    avatar: '',               // 头像
    topics: [],               // 感兴趣的话题
    favoriteCharacters: [],   // 收藏的角色
    createdAt: timestamp,     // 创建时间
    updatedAt: timestamp,     // 更新时间
    onboardingComplete: false,// 是否完成新手引导
    status: 'active'          // 状态：active / disabled
}
```

## 角色数据模型

```javascript
{
    id: 1,                     // 角色ID
    title: '角色名',           // 角色标题
    creatorId: 'user_xxx',     // 创建者ID
    creatorName: '创作者名',   // 创建者名称
    verified: false,           // 是否认证
    description: '描述',       // 角色描述
    viewCount: 100000,         // 浏览量
    chatCount: 50,             // 聊天数
    tokenCount: 2000,          // Token数
    rating: 4.8,               // 评分
    ratingCount: 1000,         // 评分人数
    tags: ['标签1', '标签2'],  // 标签
    categories: ['male','oc'], // 分类
    image: '图片URL',          // 封面图
    createdAt: timestamp,      // 创建时间
    status: 'published'        // 状态：draft / published / hidden
}
```

## 未来接入真实后端

### 替换方式

只需修改 `js/api.js` 中的 API 层实现，将 `delay()` 模拟调用替换为真实的 HTTP 请求：

```javascript
// 示例：替换为 fetch 调用
const GenSphereAPI = {
    auth: {
        async sendCode(phone) {
            const res = await fetch('/api/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            return res.json();
        },
        // ... 其他接口
    }
};
```

### 推荐后端技术栈

- **框架**：Node.js (NestJS) / Python (FastAPI) / Go (Gin)
- **数据库**：PostgreSQL（关系型数据） + Redis（缓存/验证码/会话）
- **对象存储**：阿里云 OSS / AWS S3（角色头像、图片）
- **AI 服务**：对接大语言模型 API（OpenAI / Anthropic / 国产模型）
- **短信服务**：阿里云短信 / 腾讯云短信

### API 端点规划

```
POST   /api/auth/send-code          发送验证码
POST   /api/auth/login              登录
POST   /api/auth/logout             退出登录
GET    /api/auth/me                 获取当前用户信息
PUT    /api/users/me                更新用户信息

GET    /api/characters              角色列表
GET    /api/characters/:id          角色详情
POST   /api/characters              创建角色
PUT    /api/characters/:id          更新角色
DELETE /api/characters/:id          删除角色
POST   /api/characters/:id/favorite 收藏/取消收藏

POST   /api/chat/:characterId       发送消息
GET    /api/chat/:characterId       获取聊天记录
DELETE /api/chat/:characterId       删除聊天
```

## 开发调试

- 验证码会在浏览器控制台打印：`[Dev] 手机号 138xxxx 的验证码: xxxxxx (万能验证码: 335566)`
- 用户数据存储在 localStorage 的 `gensphere_db_users` 中
- 角色数据存储在 localStorage 的 `gensphere_db_characters` 中
- 清除数据：在控制台执行 `localStorage.clear()` 即可重置
