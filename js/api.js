// ============================================
// GenSphere Backend API (Simulated)
// ============================================
// 这是一个模拟后端 API 层，未来可替换为真实的后端接口调用
// 架构设计：
//   - API 层：统一的请求入口，模拟网络延迟
//   - Service 层：业务逻辑处理
//   - Model 层：数据模型和持久化
//   - 前端通过 API 层调用，未来替换为 fetch/axios 即可
// ============================================

const API_BASE_DELAY = 600; // 模拟网络延迟 ms

// ===== 通用 API 响应格式 =====
// { code: 0, data: {}, message: 'success' }
// code: 0=成功, 400=参数错误, 401=未授权, 404=不存在, 500=服务器错误

function apiResponse(code, data = null, message = '') {
    const messages = {
        0: 'success',
        400: '参数错误',
        401: '未授权',
        404: '资源不存在',
        500: '服务器内部错误'
    };
    return {
        code,
        data,
        message: message || messages[code] || 'unknown error'
    };
}

// ============================================
// Model Layer - 数据模型
// ============================================

const DB = {
    // 用户表
    users: JSON.parse(localStorage.getItem('gensphere_db_users') || '{}'),
    
    // 角色表
    characters: JSON.parse(localStorage.getItem('gensphere_db_characters') || 'null'),
    
    // 保存
    saveUsers() {
        localStorage.setItem('gensphere_db_users', JSON.stringify(this.users));
    },
    
    saveCharacters() {
        localStorage.setItem('gensphere_db_characters', JSON.stringify(this.characters));
    }
};

// 初始化角色数据
if (!DB.characters) {
    DB.characters = generateCharacterDB();
    DB.saveCharacters();
}

function generateCharacterDB() {
    // 生成 200 个角色数据
    const titles = [
        "Mafia Boss", "Willson Wáng", "Neglectful family", "Ayato Hiroshi",
        "Second Life Isekai", "Giovanni Moretti", "Your Three Older Brothers",
        "Your tyrant father", "Best friends trio", "Snow your edgy sister",
        "Another Magic Academy", "星际指挥官", "古代剑客", "龙骑士传说",
        "末世幸存者", "吸血鬼恋人", "校园恋爱物语", "赛博朋克2077",
        "神秘侦探", "精灵王子", "机械少女", "时空旅行者", "海底王国",
        "天使与恶魔", "狼人传说", "魔法少女", "忍者物语", "海盗冒险",
        "超能力学院", "幽灵公寓", "美食厨师", "偶像练习生", "电竞选手",
        "医生与患者", "师生恋曲", "总裁的秘书", "邻家女孩", "青梅竹马",
        "双胞胎兄弟", "傲娇大小姐", "忠犬男友", "病娇女友", "高冷学霸"
    ];
    const creators = ["KLOOMSY", "Shxou_Huang", "hornybite", "Rowlemal", "Hurricanezer",
        "Emi Yuu", "Лик.", "scifiauthor", "wuxiamaster", "storyweaver",
        "edgyqueen", "wizardmaster", "digitalartist", "fantasywriter"];
    const categories = [
        ["male", "oc", "fictional"], ["male", "oc", "fictional", "sweet"],
        ["male", "female", "fictional", "multi"], ["male", "oc", "fictional"],
        ["game", "anime", "fantasy", "drama"], ["male", "oc", "fictional", "sweet"],
        ["male", "multi", "drama"], ["male", "fictional", "drama"],
        ["multi", "sweet", "oc"], ["female", "oc", "drama"],
        ["fantasy", "anime", "drama"], ["scifi", "drama", "male"],
        ["ancient", "drama", "male"], ["fantasy", "male"],
        ["scifi", "horror", "drama"], ["fantasy", "drama", "male", "female"],
        ["sweet", "drama", "modern"], ["scifi", "modern"],
        ["drama", "modern", "male"], ["fantasy", "male"],
        ["scifi", "female"], ["scifi", "drama"],
        ["fantasy", "drama"], ["fantasy", "drama", "male", "female"],
        ["fantasy", "male", "horror"], ["anime", "female", "fantasy"],
        ["ancient", "male"], ["multi"],
        ["anime", "fantasy"], ["horror", "drama", "modern"],
        ["comedy", "modern", "male"], ["modern", "female", "drama"],
        ["modern", "drama", "male"], ["modern", "drama", "male", "female"],
        ["modern", "sweet", "drama"], ["modern", "sweet", "female"],
        ["sweet", "modern"], ["multi", "male", "drama"],
        ["female", "modern"], ["male", "sweet", "modern"],
        ["female", "drama"], ["male", "school"]
    ];
    const tags = [
        ["无限制", "男性", "OC", "虚构", "反派"], ["男性", "OC", "虚构", "甜"],
        ["男性", "女性", "虚构", "多人"], ["男性", "OC", "虚构"],
        ["无限制", "游戏", "动漫", "魔法", "剧情"], ["无限制", "男性", "OC", "虚构", "甜"],
        ["男性", "多人"], ["男性", "虚构", "剧情"],
        ["多人", "甜", "OC"], ["女性", "OC", "剧情"],
        ["魔法", "动漫", "剧情"], ["科幻", "剧情", "英雄"],
        ["古风", "剧情", "男性", "武侠"], ["奇幻", "冒险"],
        ["科幻", "末世", "生存"], ["奇幻", "吸血鬼", "恋爱"],
        ["甜", "校园", "恋爱"], ["科幻", "赛博朋克", "动作"],
        ["悬疑", "侦探", "剧情"], ["奇幻", "精灵", "男性"],
        ["科幻", "机娘", "女性"], ["科幻", "穿越", "剧情"],
        ["奇幻", "海底", "冒险"], ["奇幻", "天使", "恶魔"],
        ["奇幻", "狼人", "男性"], ["魔法少女", "动漫", "女性"],
        ["忍者", "动作", "古风"], ["海盗", "冒险", "多人"],
        ["超能力", "校园", "动漫"], ["恐怖", "幽灵", "悬疑"],
        ["喜剧", "美食", "现代"], ["偶像", "音乐", "女性"],
        ["电竞", "游戏", "现代"], ["医生", "现代", "剧情"],
        ["师生", "校园", "恋爱"], ["总裁", "现代", "甜"],
        ["邻家", "甜", "现代"], ["青梅竹马", "甜", "校园"],
        ["双胞胎", "多人", "男性"], ["傲娇", "大小姐", "女性"],
        ["忠犬", "男友", "甜"], ["病娇", "女友", "恐怖"],
        ["学霸", "校园", "男性"]
    ];
    const descriptions = [
        "一位神秘的角色，有着不为人知的过去和令人着迷的性格。",
        "在这个充满奇幻色彩的世界里，你们将展开一段难忘的冒险。",
        "看似平凡的日常下，隐藏着怎样的秘密和情感纠葛？",
        "命运的齿轮开始转动，你们的相遇是偶然还是必然？",
        "在这个异世界中，你将如何书写属于自己的传奇故事？",
        "一段跨越时空的爱恋，一场惊心动魄的冒险。",
        "当真相浮出水面，你们的关系会发生怎样的变化？",
        "在黑暗中寻找光明，在绝望中寻找希望。",
        "温暖治愈的日常故事，让你的心被甜蜜填满。",
        "紧张刺激的剧情发展，每一个选择都将改变结局。"
    ];
    
    const chars = [];
    for (let i = 0; i < 200; i++) {
        const idx = i % titles.length;
        chars.push({
            id: i + 1,
            title: titles[idx] + (i >= titles.length ? ` ${Math.floor(i / titles.length) + 1}` : ''),
            creatorId: 'user_' + (i % creators.length),
            creatorName: creators[i % creators.length],
            verified: Math.random() > 0.7,
            description: descriptions[Math.floor(Math.random() * 10)],
            viewCount: Math.floor(Math.random() * 50000000) + 100000,
            chatCount: Math.floor(Math.random() * 500) + 5,
            tokenCount: Math.floor(Math.random() * 5000) + 200,
            rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
            ratingCount: Math.floor(Math.random() * 10000) + 100,
            tags: tags[idx],
            categories: categories[idx],
            image: `https://picsum.photos/seed/char${i + 1}/400/520`,
            createdAt: Date.now() - Math.floor(Math.random() * 90 * 24 * 3600 * 1000),
            status: 'published'
        });
    }
    return chars;
}

// ============================================
// Service Layer - 业务逻辑
// ============================================

const AuthService = {
    // 默认万能验证码（开发/测试用）
    MASTER_CODE: '335566',
    
    // 验证码存储 { phone: { code, expireAt } }
    _codeStore: {},
    
    // 发送验证码
    async sendVerifyCode(phone) {
        // 校验手机号格式
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            return apiResponse(400, null, '手机号格式不正确');
        }
        
        // 生成6位验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 存储验证码（5分钟有效）
        this._codeStore[phone] = {
            code,
            expireAt: Date.now() + 5 * 60 * 1000
        };
        
        // 开发环境打印验证码
        console.log(`[Dev] 手机号 ${phone} 的验证码: ${code} (万能验证码: ${this.MASTER_CODE})`);
        
        return apiResponse(0, { sent: true }, '验证码已发送');
    },
    
    // 校验验证码
    verifyCode(phone, code) {
        // 万能验证码（开发用）
        if (code === this.MASTER_CODE) {
            return { valid: true };
        }
        
        const record = this._codeStore[phone];
        if (!record) {
            return { valid: false, error: '请先获取验证码' };
        }
        
        if (Date.now() > record.expireAt) {
            delete this._codeStore[phone];
            return { valid: false, error: '验证码已过期' };
        }
        
        if (record.code !== code) {
            return { valid: false, error: '验证码错误' };
        }
        
        // 验证成功，删除验证码（一次性）
        delete this._codeStore[phone];
        return { valid: true };
    },
    
    // 登录（手机号+验证码）
    async login(phone, code) {
        // 校验验证码
        const verifyResult = this.verifyCode(phone, code);
        if (!verifyResult.valid) {
            return apiResponse(400, null, verifyResult.error);
        }
        
        // 检查用户是否存在
        let user = DB.users[phone];
        const isNewUser = !user;
        
        if (isNewUser) {
            // 自动创建账号
            user = {
                id: 'user_' + Date.now(),
                phone,
                username: '',
                avatar: '',
                topics: [],
                favoriteCharacters: [],
                createdAt: Date.now(),
                onboardingComplete: false,
                status: 'active'
            };
            DB.users[phone] = user;
            DB.saveUsers();
        }
        
        // 生成 token（模拟 JWT）
        const token = btoa(JSON.stringify({
            userId: user.id,
            phone: user.phone,
            exp: Date.now() + 7 * 24 * 3600 * 1000 // 7天过期
        }));
        
        return apiResponse(0, {
            token,
            user: this._sanitizeUser(user),
            isNewUser
        }, isNewUser ? '注册成功' : '登录成功');
    },
    
    // 自动登录（通过 token）
    async autoLogin(token) {
        try {
            const payload = JSON.parse(atob(token));
            
            // 检查过期
            if (Date.now() > payload.exp) {
                return apiResponse(401, null, '登录已过期');
            }
            
            const user = DB.users[payload.phone];
            if (!user || user.status !== 'active') {
                return apiResponse(401, null, '用户不存在或已被禁用');
            }
            
            return apiResponse(0, {
                token,
                user: this._sanitizeUser(user)
            }, '自动登录成功');
        } catch (e) {
            return apiResponse(401, null, '无效的登录凭证');
        }
    },
    
    // 退出登录
    async logout() {
        return apiResponse(0, null, '已退出登录');
    },
    
    // 更新用户信息
    async updateUser(phone, updates) {
        const user = DB.users[phone];
        if (!user) {
            return apiResponse(404, null, '用户不存在');
        }
        
        // 允许更新的字段
        const allowedFields = ['username', 'avatar', 'topics', 'onboardingComplete'];
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                user[field] = updates[field];
            }
        }
        
        user.updatedAt = Date.now();
        DB.saveUsers();
        
        return apiResponse(0, this._sanitizeUser(user), '更新成功');
    },
    
    // 脱敏用户信息
    _sanitizeUser(user) {
        return {
            id: user.id,
            phone: user.phone,
            username: user.username,
            avatar: user.avatar,
            topics: user.topics,
            onboardingComplete: user.onboardingComplete,
            createdAt: user.createdAt
        };
    }
};

const CharacterService = {
    // 获取角色列表
    async getList(params = {}) {
        const {
            page = 1,
            pageSize = 12,
            category = 'all',
            sortBy = 'views', // views, rating, newest
            keyword = ''
        } = params;
        
        let list = [...DB.characters];
        
        // 分类筛选
        if (category && category !== 'all') {
            list = list.filter(c => c.categories.includes(category));
        }
        
        // 关键词搜索
        if (keyword) {
            const kw = keyword.toLowerCase();
            list = list.filter(c => 
                c.title.toLowerCase().includes(kw) ||
                c.creatorName.toLowerCase().includes(kw) ||
                c.description.toLowerCase().includes(kw)
            );
        }
        
        // 排序
        if (sortBy === 'views') {
            list.sort((a, b) => b.viewCount - a.viewCount);
        } else if (sortBy === 'rating') {
            list.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === 'newest') {
            list.sort((a, b) => b.createdAt - a.createdAt);
        }
        
        // 分页
        const total = list.length;
        const start = (page - 1) * pageSize;
        const items = list.slice(start, start + pageSize);
        
        return apiResponse(0, {
            items,
            total,
            page,
            pageSize,
            hasMore: start + pageSize < total
        });
    },
    
    // 获取角色详情
    async getDetail(id) {
        const character = DB.characters.find(c => c.id === parseInt(id));
        if (!character) {
            return apiResponse(404, null, '角色不存在');
        }
        return apiResponse(0, character);
    },
    
    // 收藏/取消收藏
    async toggleFavorite(userId, characterId) {
        // TODO: 实现收藏功能
        return apiResponse(0, { favorited: true });
    }
};

// ============================================
// API Layer - 统一 API 入口
// ============================================
// 前端通过 GenSphereAPI.xxx() 调用
// 未来替换为真实 HTTP 请求时只需修改这一层
// ============================================

const GenSphereAPI = {
    // ===== Auth =====
    auth: {
        sendCode: (phone) => delay(() => AuthService.sendVerifyCode(phone)),
        login: (phone, code) => delay(() => AuthService.login(phone, code)),
        autoLogin: (token) => delay(() => AuthService.autoLogin(token)),
        logout: () => delay(() => AuthService.logout()),
        updateUser: (phone, updates) => delay(() => AuthService.updateUser(phone, updates))
    },
    
    // ===== Characters =====
    characters: {
        getList: (params) => delay(() => CharacterService.getList(params)),
        getDetail: (id) => delay(() => CharacterService.getDetail(id)),
        toggleFavorite: (userId, charId) => delay(() => CharacterService.toggleFavorite(userId, charId))
    }
};

// 模拟网络延迟
function delay(fn) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(fn());
        }, API_BASE_DELAY + Math.random() * 200);
    });
}

// 暴露到全局
window.GenSphereAPI = GenSphereAPI;
window.GenSphereDB = DB;
