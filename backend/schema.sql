-- ============================================
-- GenSphere Database Schema
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    username TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    topics TEXT DEFAULT '[]',
    favorite_characters TEXT DEFAULT '[]',
    is_admin INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    onboarding_complete INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active'
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '',
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
);

-- 角色表
CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    chat_name TEXT DEFAULT '',
    description TEXT DEFAULT '',
    personality TEXT DEFAULT '',
    scenario TEXT DEFAULT '',
    first_message TEXT DEFAULT '',
    example_dialogue TEXT DEFAULT '',
    image TEXT DEFAULT '',
    creator_id TEXT NOT NULL,
    creator_name TEXT NOT NULL,
    verified INTEGER DEFAULT 0,
    tags TEXT DEFAULT '[]',
    categories TEXT DEFAULT '[]',
    content_rating TEXT DEFAULT 'general',
    view_count INTEGER DEFAULT 0,
    chat_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    is_public INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- API密钥表（管理用）
CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    api_key TEXT NOT NULL,
    base_url TEXT DEFAULT '',
    model TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    last_used_at INTEGER,
    created_at INTEGER NOT NULL
);

-- 聊天会话表
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    character_id INTEGER NOT NULL,
    title TEXT DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    message_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- 聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
);

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    character_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(user_id, character_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- 验证码表
CREATE TABLE IF NOT EXISTS verify_codes (
    phone TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expire_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

-- ============================================
-- 初始化数据
-- ============================================

-- 插入默认分类
INSERT OR IGNORE INTO categories (slug, name, icon, description, sort_order, is_active, created_at) VALUES
    ('all', '全部', '✨', '所有角色', 0, 1, UNIXEPOCH()),
    ('xianxia', '修仙玄幻', '⚔️', '修仙、玄幻、奇幻类角色', 1, 1, UNIXEPOCH()),
    ('wuxia', '江湖武侠', '🗡️', '武侠、江湖、武林类角色', 2, 1, UNIXEPOCH()),
    ('ancient', '古风言情', '🏮', '古代、古风、宫廷类角色', 3, 1, UNIXEPOCH()),
    ('history', '历史真实', '📜', '历史人物、真实改编角色', 4, 1, UNIXEPOCH()),
    ('anime', '动漫游戏', '🎮', '动漫、游戏衍生角色', 5, 1, UNIXEPOCH()),
    ('modern', '现代都市', '🏙️', '现代、都市、校园类角色', 6, 1, UNIXEPOCH()),
    ('scifi', '科幻未来', '🚀', '科幻、未来、赛博朋克角色', 7, 1, UNIXEPOCH()),
    ('fantasy', '异世界', '🐉', '异世界、穿越、魔法类角色', 8, 1, UNIXEPOCH()),
    ('horror', '悬疑恐怖', '👻', '恐怖、悬疑、惊悚类角色', 9, 1, UNIXEPOCH()),
    ('comedy', '搞笑日常', '😄', '搞笑、日常、治愈类角色', 10, 1, UNIXEPOCH()),
    ('sweet', '甜蜜恋爱', '💕', '恋爱、甜宠、 romance 角色', 11, 1, UNIXEPOCH()),
    ('rpg', 'RPG冒险', '🗺️', 'RPG、冒险、探索类角色', 12, 1, UNIXEPOCH()),
    ('oc', '原创OC', '🎭', '原创角色设定', 13, 1, UNIXEPOCH()),
    ('male', '男性角色', '♂️', '男性主导角色', 14, 1, UNIXEPOCH()),
    ('female', '女性角色', '♀️', '女性主导角色', 15, 1, UNIXEPOCH()),
    ('multi', '多人角色', '👥', '多人、群像角色', 16, 1, UNIXEPOCH());
