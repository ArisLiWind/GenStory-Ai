# GenSphere - AI 角色扮演平台

> 成为你想要的角色，书写属于你的传奇之旅

GenSphere 是一个沉浸式 AI 角色扮演平台，用户可以与独一无二的 AI 角色展开互动，自定义角色、创造故事。

## 项目特性

- 🎭 **海量角色库** - 超过 50 万个精心设计的 AI 角色
- ✨ **自定义创作** - 轻松创建属于你的专属角色
- 💬 **沉浸式对话** - 智能 AI 带来流畅自然的对话体验
- 👥 **社区互动** - 加入活跃的创作者社区

## 技术栈

- 纯 HTML / CSS / JavaScript
- 响应式设计，支持移动端
- 无框架依赖，开箱即用

## 项目结构

```
gensphere-website/
├── index.html          # 主页
├── css/
│   └── style.css       # 样式文件
├── js/
│   └── main.js         # 交互脚本
├── assets/
│   ├── logo.png        # Logo 图标
│   └── logo-text.png   # Logo 文字
└── README.md
```

## 快速开始

直接在浏览器中打开 `index.html` 即可预览。

或者使用本地服务器：

```bash
# 使用 Python
python3 -m http.server 8000

# 使用 Node.js
npx serve .
```

然后访问 `http://localhost:8000`

## 功能说明

### 已实现功能

- ✅ 响应式导航栏（含搜索框、登录/注册按钮）
- ✅ Hero 区域（大标题、副标题、CTA 按钮、数据统计）
- ✅ 分类标签筛选（16个分类）
- ✅ 角色卡片网格展示
- ✅ 角色/创作者切换
- ✅ 热门/最新排序
- ✅ 热度/评分排序
- ✅ 加载更多功能
- ✅ 搜索功能
- ✅ 特色功能展示区
- ✅ CTA 号召区
- ✅ 页脚
- ✅ 移动端适配
- ✅ 滚动动画效果
- ✅ 暗色主题设计

### 设计风格

- 深色主题 + 蓝紫色渐变
- 玻璃态 (Glassmorphism) 效果
- 发光光晕背景装饰
- 卡片悬停动效
- 平滑过渡动画

## 自定义

### 修改配色

编辑 `css/style.css` 中的 CSS 变量：

```css
:root {
    --accent-primary: #6366f1;      /* 主色调 */
    --accent-secondary: #8b5cf6;    /* 次要色 */
    --accent-tertiary: #a78bfa;     /* 第三色 */
    --bg-primary: #0a0a14;          /* 主背景 */
    --bg-secondary: #12121f;        /* 次背景 */
}
```

### 修改角色数据

编辑 `js/main.js` 中的 `characters` 数组。

## License

MIT
