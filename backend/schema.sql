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
    ('xianxia', '修仙', '⚔️', '修仙、玄幻类角色', 1, 1, UNIXEPOCH()),
    ('martial', '高武', '💪', '高武、战神、战力类角色', 2, 1, UNIXEPOCH()),
    ('transmigration', '穿越', '🔄', '穿越类题材角色', 3, 1, UNIXEPOCH()),
    ('rebirth', '重生', '🌀', '重生类题材角色', 4, 1, UNIXEPOCH()),
    ('system', '系统', '🎮', '系统流角色', 5, 1, UNIXEPOCH()),
    ('infinite', '无限流', '♾️', '无限流题材角色', 6, 1, UNIXEPOCH()),
    ('cyberpunk', '赛博朋克', '🌆', '赛博朋克、机械、反乌托邦角色', 7, 1, UNIXEPOCH()),
    ('lovecraft', '克苏鲁', '🐙', '克苏鲁、未知恐惧类角色', 8, 1, UNIXEPOCH()),
    ('palace', '宫斗', '👑', '宫斗题材角色', 9, 1, UNIXEPOCH()),
    ('strategy', '权谋', '🧠', '权谋、智斗类角色', 10, 1, UNIXEPOCH()),
    ('rich', '豪门', '💎', '豪门、总裁类角色', 11, 1, UNIXEPOCH()),
    ('mystery', '推理', '🔍', '推理、侦探、解谜类角色', 12, 1, UNIXEPOCH()),
    ('horror', '灵异', '👻', '灵异、恐怖、惊悚类角色', 13, 1, UNIXEPOCH()),
    ('openworld', '开放世界', '🗺️', '开放世界、探索类角色', 14, 1, UNIXEPOCH()),
    ('management', '经营', '🏠', '经营、模拟类角色', 15, 1, UNIXEPOCH()),
    ('raising', '养成', '🌸', '养成类角色', 16, 1, UNIXEPOCH()),
    ('fantasy', '异世界', '🐉', '异世界、魔法类角色', 17, 1, UNIXEPOCH()),
    ('scifi', '科幻', '🚀', '科幻、未来类角色', 18, 1, UNIXEPOCH()),
    ('ancient', '古风', '🏮', '古代、古风类角色', 19, 1, UNIXEPOCH()),
    ('sweet', '恋爱', '💕', '恋爱、甜宠类角色', 20, 1, UNIXEPOCH()),
    ('anime', '动漫', '🎮', '动漫、游戏衍生角色', 21, 1, UNIXEPOCH()),
    ('modern', '现代', '🏙️', '现代、都市类角色', 22, 1, UNIXEPOCH()),
    ('oc', '原创OC', '🎭', '原创角色设定', 23, 1, UNIXEPOCH()),
    ('male', '男性', '♂️', '男性主导角色', 24, 1, UNIXEPOCH()),
    ('female', '女性', '♀️', '女性主导角色', 25, 1, UNIXEPOCH()),
    ('multi', '多人', '👥', '多人、群像角色', 26, 1, UNIXEPOCH());
