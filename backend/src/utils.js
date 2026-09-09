// ============================================
// Utility Functions
// ============================================

export function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify({
        code: 0,
        data,
        message: 'success'
    }), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export function errorResponse(code, message) {
    const statusCode = code >= 100 && code < 600 ? code : 500;
    return new Response(JSON.stringify({
        code,
        data: null,
        message
    }), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function parseBody(request) {
    try {
        return await request.json();
    } catch {
        return {};
    }
}

export function getTokenFromRequest(request) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    return null;
}

// Simple JWT-like token (base64 encoded JSON)
export function generateToken(payload, secret) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    // Simple signature (not cryptographically secure, but fine for demo)
    const signature = btoa(secret + ':' + payload.userId + ':' + payload.exp);
    return `${header}.${body}.${signature}`;
}

export function verifyToken(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = JSON.parse(atob(parts[1]));
        const expectedSig = btoa(secret + ':' + payload.userId + ':' + payload.exp);

        if (parts[2] !== expectedSig) return null;
        if (payload.exp < Date.now()) return null;

        return payload;
    } catch {
        return null;
    }
}

export async function getCurrentUser(request, env) {
    const token = getTokenFromRequest(request);
    if (!token) return null;

    const payload = verifyToken(token, env.JWT_SECRET || 'gensphere-secret');
    if (!payload) return null;

    // Get user from DB
    const stmt = env.DB.prepare('SELECT * FROM users WHERE id = ?');
    const user = await stmt.bind(payload.userId).first();

    if (!user || user.status !== 'active') return null;

    // Parse JSON fields
    user.topics = safeJsonParse(user.topics, []);
    user.favorite_characters = safeJsonParse(user.favorite_characters, []);

    return user;
}

export function safeJsonParse(str, defaultValue) {
    try {
        return JSON.parse(str);
    } catch {
        return defaultValue;
    }
}

export function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function now() {
    return Date.now();
}

export function sanitizeUser(user) {
    if (!user) return null;
    const topics = Array.isArray(user.topics) ? user.topics : safeJsonParse(user.topics, []);
    const onboardingComplete = !!user.onboarding_complete || (!!user.username && topics.length > 0);

    return {
        id: user.id,
        phone: user.phone,
        username: user.username,
        avatar: user.avatar,
        topics,
        onboardingComplete,
        isAdmin: !!user.is_admin,
        createdAt: user.created_at
    };
}
