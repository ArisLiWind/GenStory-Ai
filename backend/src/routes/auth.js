// ============================================
// Auth Routes
// ============================================

import { jsonResponse, errorResponse, parseBody, generateToken, verifyToken, getCurrentUser, now, generateId, sanitizeUser, safeJsonParse } from '../utils.js';

const MASTER_CODE = '335566'; // Dev universal code

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
    return errorResponse(404, 'Not found');
}

async function sendCode(request, env) {
    const { phone } = await parseBody(request);

    if (!/^1[3-9]\d{9}$/.test(phone)) {
        return errorResponse(400, '手机号格式不正确');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expireAt = now() + 5 * 60 * 1000;

    // Upsert verify code
    await env.DB.prepare(`
        INSERT INTO verify_codes (phone, code, expire_at, created_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(phone) DO UPDATE SET
            code = excluded.code,
            expire_at = excluded.expire_at,
            created_at = excluded.created_at
    `).bind(phone, code, expireAt, now()).run();

    // For dev, log the code
    console.log(`[Dev] 验证码: ${code} (万能验证码: ${MASTER_CODE})`);

    return jsonResponse({ sent: true });
}

async function login(request, env) {
    const { phone, code } = await parseBody(request);

    if (!phone || !code) {
        return errorResponse(400, '请输入手机号和验证码');
    }

    // Verify code
    let valid = false;
    if (code === MASTER_CODE) {
        valid = true;
    } else {
        const record = await env.DB.prepare(
            'SELECT * FROM verify_codes WHERE phone = ?'
        ).bind(phone).first();

        if (!record) {
            return errorResponse(400, '请先获取验证码');
        }
        if (now() > record.expire_at) {
            await env.DB.prepare('DELETE FROM verify_codes WHERE phone = ?').bind(phone).run();
            return errorResponse(400, '验证码已过期');
        }
        if (record.code !== code) {
            return errorResponse(400, '验证码错误');
        }
        // Delete used code
        await env.DB.prepare('DELETE FROM verify_codes WHERE phone = ?').bind(phone).run();
        valid = true;
    }

    if (!valid) {
        return errorResponse(400, '验证码错误');
    }

    // Check if user exists
    let user = await env.DB.prepare('SELECT * FROM users WHERE phone = ?').bind(phone).first();
    let isNewUser = false;

    if (!user) {
        isNewUser = true;
        const userId = generateId('user');
        const createdAt = now();

        await env.DB.prepare(`
            INSERT INTO users (id, phone, username, avatar, topics, favorite_characters, is_admin, created_at, status)
            VALUES (?, ?, '', '', '[]', '[]', 0, ?, 'active')
        `).bind(userId, phone, createdAt).run();

        user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    }

    // Generate token
    const token = generateToken({
        userId: user.id,
        phone: user.phone,
        exp: now() + 7 * 24 * 3600 * 1000
    }, env.JWT_SECRET || 'gensphere-secret');

    const userData = sanitizeUser(user);

    return jsonResponse({
        token,
        user: userData,
        isNewUser
    }, isNewUser ? 201 : 200);
}

async function logout(request, env) {
    return jsonResponse(null);
}

async function getMe(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) {
        return errorResponse(401, '未登录');
    }
    return jsonResponse(sanitizeUser(user));
}

async function updateMe(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) {
        return errorResponse(401, '未登录');
    }

    const updates = await parseBody(request);
    const allowedFields = ['username', 'avatar', 'topics', 'onboardingComplete'];
    const setClauses = [];
    const values = [];

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            const dbField = field === 'onboardingComplete' ? 'onboarding_complete' : field;
            setClauses.push(`${dbField} = ?`);
            if (field === 'topics') {
                values.push(JSON.stringify(updates[field]));
            } else if (field === 'onboardingComplete') {
                values.push(updates[field] ? 1 : 0);
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
