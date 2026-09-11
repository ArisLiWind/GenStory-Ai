// ============================================
// GenSphere API Client (Real Backend)
// ============================================
// 连接真实的 Cloudflare Workers 后端 API
// ============================================

const API_BASE = '/api';

// ===== Token 管理 =====
function getToken() {
    return localStorage.getItem('gensphere_token') || '';
}

function setToken(token) {
    if (token) {
        localStorage.setItem('gensphere_token', token);
    } else {
        localStorage.removeItem('gensphere_token');
    }
}

// ===== 通用请求封装 =====
async function request(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        // 检查响应是否为有效 JSON
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseErr) {
            console.error('API Response Parse Error:', path, 'Status:', response.status, 'Body:', text.substring(0, 200));
            return {
                code: response.status || 500,
                data: null,
                message: `服务器返回格式错误 (HTTP ${response.status})`
            };
        }

        // 如果 HTTP 状态码不是 2xx，但响应体有 code 字段，用响应体的 code
        if (!response.ok && data.code === undefined) {
            data.code = response.status;
        }

        return data;
    } catch (err) {
        console.error('API Request Error:', path, err);
        return {
            code: 500,
            data: null,
            message: '网络请求失败：' + (err.message || '未知错误')
        };
    }
}

// ============================================
// Auth API
// ============================================

const GenSphereAPI = {
    auth: {
        async sendCode(phone) {
            return request('/auth/send-code', {
                method: 'POST',
                body: JSON.stringify({ phone })
            });
        },

        async login(phone, code) {
            const res = await request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ phone, code })
            });
            if (res.code === 0 && res.data.token) {
                setToken(res.data.token);
            }
            return res;
        },

        async autoLogin() {
            const token = getToken();
            if (!token) {
                return { code: 401, data: null, message: '未登录' };
            }
            return request('/auth/me');
        },

        async logout() {
            setToken('');
            return { code: 0, data: null, message: '已退出登录' };
        },

        async getMe() {
            return request('/auth/me');
        },

        async updateUser(updates) {
            return request('/auth/me', {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
        },

        async completeOnboarding(data) {
            const { username, topics } = data || {};
            return request('/auth/complete-onboarding', {
                method: 'POST',
                body: JSON.stringify({ username, topics })
            });
        }
    },

    // ===== Characters API =====
    characters: {
        async getList(params = {}) {
            const {
                page = 1,
                pageSize = 12,
                category = 'all',
                sortBy = 'views',
                keyword = ''
            } = params;

            const query = new URLSearchParams({
                page,
                pageSize,
                category,
                sortBy,
                keyword
            });

            return request(`/characters?${query.toString()}`);
        },

        async getDetail(id) {
            return request(`/characters/${id}`);
        },

        async create(data) {
            return request('/characters', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async update(id, data) {
            return request(`/characters/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        async delete(id) {
            return request(`/characters/${id}`, {
                method: 'DELETE'
            });
        },

        async toggleFavorite(id) {
            return request(`/characters/${id}/favorite`, {
                method: 'POST'
            });
        },

        async getMine(status = '') {
            const query = status ? `?status=${status}` : '';
            return request(`/characters/mine${query}`);
        }
    },

    // ===== Categories API =====
    categories: {
        async getAll() {
            return request('/categories');
        }
    },

    // ===== Chat API =====
    chat: {
        async getSessions() {
            return request('/chat/sessions');
        },

        async createSession(characterId, characterData) {
            return request('/chat/sessions', {
                method: 'POST',
                body: JSON.stringify({ characterId, character: characterData })
            });
        },

        async getMessages(sessionId) {
            return request(`/chat/sessions/${sessionId}`);
        },

        async sendMessage(sessionId, content) {
            return request(`/chat/${sessionId}/send`, {
                method: 'POST',
                body: JSON.stringify({ content })
            });
        },

        async deleteSession(sessionId) {
            return request(`/chat/sessions/${sessionId}`, {
                method: 'DELETE'
            });
        },

        async getOrCreateSession(characterId) {
            return request(`/chat/character/${characterId}`);
        },

        // 游客聊天（不需要登录，会话创建失败时降级使用）
        async guestSend(characterId, content, history = []) {
            return request('/chat/guest-send', {
                method: 'POST',
                body: JSON.stringify({ characterId, content, history })
            });
        }
    }
};

// 暴露到全局
window.GenSphereAPI = GenSphereAPI;
