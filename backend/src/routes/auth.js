// ============================================
// Auth Routes - 重写版
// ============================================

import { jsonResponse, errorResponse, parseBody, generateToken, getCurrentUser, now, generateId, sanitizeUser, safeJsonParse } from '../utils.js';

const MASTER_CODE = '335566';

export async function handleAuth(request, env, path) {
    if (path === '/api/auth/send-code' && request.method === 'POST') {
        return sendCode(request, env);
    }
    if (path === '/api/auth/login' && request.method === 'POST') {
        return login(request, env);
    }
    if (path === '/api/auth/logout' && request.method === 'POST') {
        return logout(request, env);
    }
    if (path === '/api/auth/me' && request.method === 'GET') {
        return getMe(request, env);
    }
    if (path === '/api/auth/me' && request.method === 'PUT') {
        return updateMe(request, env);
    }
    if (path === '/api/auth/complete-onboarding' && request.method === 'POST') {
        return completeOnboarding(request, env);
    }
    return errorResponse(404, 'Not found');
}

async function sendCode(request, env) {
    const { phone } = await parseBody(request);

    if (!phone || phone.length < 6) {
        return errorResponse(400, '请输入有效的手机号');
    }

    // 检查手机号是否已注册
    const existing = await env.DB.prepare('SELECT id FROM users WHERE phone = ?').bind(phone).first();
    const isRegistered = !!existing;

    // 开发环境直接返回成功，不真发短信
    // 生产环境这里接短信服务商
    console.log('[send-code] phone:', phone, 'code:', MASTER_CODE, 'registered:', isRegistered);

    return jsonResponse({
        message: '验证码已发送',
        isRegistered: isRegistered,
        debug: MASTER_CODE
    });
}

async function login(request, env) {
    const { phone, code } = await parseBody(request);

    if (!phone || !code) {
        return errorResponse(400, '请输入手机号和验证码');
    }

    // 验证验证码
    if (code !== MASTER_CODE) {
        return errorResponse(400, '验证码错误');
    }

    // 查用户
    let user = await env.DB.prepare('SELECT * FROM users WHERE phone = ?').bind(phone).first();
    let isNewUser = false;

    if (!user) {
        // 新用户：创建账号（只有手机号，用户名和兴趣为空）
        isNewUser = true;
        const userId = generateId('user');
        const createdAt = now();

        await env.DB.prepare(`
            INSERT INTO users (id, phone, username, avatar, topics, favorite_characters, is_admin, created_at, onboarding_complete, status)
            VALUES (?, ?, '', '', '[]', '[]', 0, ?, 0, 'active')
        `).bind(userId, phone, createdAt).run();

        user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    }

    // 生成 token
    const token = generateToken(
        { userId: user.id, phone: user.phone, exp: now() + 7 * 24 * 3600 * 1000 },
        env.JWT_SECRET || 'gensphere-secret'
    );

    return jsonResponse({
        token,
        user: sanitizeUser(user),
        isNewUser
    });
}

async function logout(request, env) {
    return jsonResponse({ success: true });
}

async function getMe(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) {
        return errorResponse(401, '未登录或登录已过期');
    }
    return jsonResponse(sanitizeUser(user));
}

async function updateMe(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) {
        return errorResponse(401, '未登录或登录已过期');
    }

    const updates = await parseBody(request);
    const allowedFields = ['username', 'avatar', 'topics'];
    const setClauses = [];
    const values = [];

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            const dbField = field;
            setClauses.push(`${dbField} = ?`);
            if (field === 'topics') {
                values.push(JSON.stringify(updates[field]));
            } else {
                values.push(updates[field]);
            }
        }
    }

    if (setClauses.length > 0) {
        setClauses.push('updated_at = ?');
        values.push(now());
        values.push(user.id);

        await env.DB.prepare(`
            UPDATE users SET ${setClauses.join(', ')} WHERE id = ?
        `).bind(...values).run();
    }

    const updatedUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
    return jsonResponse(sanitizeUser(updatedUser));
}

async function completeOnboarding(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) {
        return errorResponse(401, '未登录或登录已过期');
    }

    const { username, topics } = await parseBody(request);

    const setClauses = ['onboarding_complete = 1', 'updated_at = ?'];
    const values = [now()];

    if (username && username.trim().length > 0) {
        setClauses.push('username = ?');
        values.push(username.trim());
    }
    if (topics && Array.isArray(topics)) {
        setClauses.push('topics = ?');
        values.push(JSON.stringify(topics));
    }

    values.push(user.id);

    await env.DB.prepare(`
        UPDATE users SET ${setClauses.join(', ')} WHERE id = ?
    `).bind(...values).run();

    const updatedUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
    return jsonResponse(sanitizeUser(updatedUser));
}
