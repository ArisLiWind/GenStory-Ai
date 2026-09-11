// ============================================
// Admin Routes
// ============================================

import { jsonResponse, errorResponse, parseBody, getCurrentUser, now, getTokenFromRequest, safeJsonParse } from '../utils.js';

function checkAdmin(request, env) {
    const adminToken = request.headers.get('X-Admin-Token');
    if (adminToken === 'gensphere-admin-2024') {
        return { isAdmin: true, viaToken: true };
    }

    // Check via user auth
    return null;
}

export async function handleAdmin(request, env, path) {
    const admin = checkAdmin(request, env);
    const user = await getCurrentUser(request, env);

    const isAdmin = admin || (user && user.is_admin);
    if (!isAdmin) {
        return errorResponse(403, '无权访问');
    }

    // API Key management
    if (path === '/api/admin/api-keys' && request.method === 'GET') {
        return listApiKeys(env);
    }
    if (path === '/api/admin/api-keys' && request.method === 'POST') {
        return createApiKey(request, env);
    }

    const keyMatch = path.match(/^\/api\/admin\/api-keys\/(\d+)$/);
    if (keyMatch) {
        const id = parseInt(keyMatch[1]);
        if (request.method === 'PUT') return updateApiKey(request, env, id);
        if (request.method === 'DELETE') return deleteApiKey(env, id);
    }

    // Category management
    if (path === '/api/admin/categories' && request.method === 'POST') {
        return createCategory(request, env);
    }
    const catMatch = path.match(/^\/api\/admin\/categories\/(\d+)$/);
    if (catMatch) {
        const id = parseInt(catMatch[1]);
        if (request.method === 'PUT') return updateCategory(request, env, id);
        if (request.method === 'DELETE') return deleteCategory(env, id);
    }

    // User management
    if (path === '/api/admin/users' && request.method === 'GET') {
        return listUsers(env);
    }
    const userMatch = path.match(/^\/api\/admin\/users\/([^/]+)$/);
    if (userMatch && request.method === 'PUT') {
        return updateUser(request, env, userMatch[1]);
    }

    // Character management
    if (path === '/api/admin/characters' && request.method === 'GET') {
        return listAllCharacters(request, env);
    }
    const charAdminMatch = path.match(/^\/api\/admin\/characters\/(\d+)$/);
    if (charAdminMatch) {
        const id = parseInt(charAdminMatch[1]);
        if (request.method === 'GET') return adminGetCharacter(env, id);
        if (request.method === 'PUT') return adminUpdateCharacter(request, env, id);
    }

    // Stats
    if (path === '/api/admin/stats' && request.method === 'GET') {
        return getStats(env);
    }

    return errorResponse(404, 'Not found');
}

// ===== API Keys =====
async function listApiKeys(env) {
    const result = await env.DB.prepare(`
        SELECT id, name, provider, base_url, model, is_active, priority, usage_count, last_used_at, created_at
        FROM api_keys
        ORDER BY priority ASC, id ASC
    `).all();

    return jsonResponse({ items: result.results || [] });
}

async function createApiKey(request, env) {
    const body = await parseBody(request);
    const { name, provider, apiKey, baseUrl = '', model = '', isActive = 1, priority = 0 } = body;

    if (!name || !apiKey || !provider) {
        return errorResponse(400, '请填写完整信息');
    }

    const result = await env.DB.prepare(`
        INSERT INTO api_keys (name, provider, api_key, base_url, model, is_active, priority, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(name, provider, apiKey, baseUrl, model, isActive ? 1 : 0, priority, now()).run();

    return jsonResponse({ id: result.meta.last_row_id }, 201);
}

async function updateApiKey(request, env, id) {
    const body = await parseBody(request);
    const allowedFields = ['name', 'provider', 'apiKey', 'baseUrl', 'model', 'isActive', 'priority'];
    const fieldMap = { apiKey: 'api_key', baseUrl: 'base_url', isActive: 'is_active' };

    const setClauses = [];
    const values = [];

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            const dbField = fieldMap[field] || field;
            setClauses.push(`${dbField} = ?`);
            values.push(field === 'isActive' ? (body[field] ? 1 : 0) : body[field]);
        }
    }

    if (setClauses.length === 0) {
        return jsonResponse({ updated: false });
    }

    values.push(id);
    await env.DB.prepare(`
        UPDATE api_keys SET ${setClauses.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return jsonResponse({ updated: true });
}

async function deleteApiKey(env, id) {
    await env.DB.prepare('DELETE FROM api_keys WHERE id = ?').bind(id).run();
    return jsonResponse({ deleted: true });
}

// ===== Categories =====
async function createCategory(request, env) {
    const body = await parseBody(request);
    const { slug, name, icon = '', description = '', sortOrder = 0 } = body;

    if (!slug || !name) return errorResponse(400, '请填写分类标识和名称');

    const result = await env.DB.prepare(`
        INSERT INTO categories (slug, name, icon, description, sort_order, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, 1, ?)
    `).bind(slug, name, icon, description, sortOrder, now()).run();

    return jsonResponse({ id: result.meta.last_row_id }, 201);
}

async function updateCategory(request, env, id) {
    const body = await parseBody(request);
    const allowedFields = ['slug', 'name', 'icon', 'description', 'sortOrder', 'isActive'];
    const fieldMap = { sortOrder: 'sort_order', isActive: 'is_active' };

    const setClauses = [];
    const values = [];

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            const dbField = fieldMap[field] || field;
            setClauses.push(`${dbField} = ?`);
            values.push(field === 'isActive' ? (body[field] ? 1 : 0) : body[field]);
        }
    }

    if (setClauses.length === 0) return jsonResponse({ updated: false });

    values.push(id);
    await env.DB.prepare(`
        UPDATE categories SET ${setClauses.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return jsonResponse({ updated: true });
}

async function deleteCategory(env, id) {
    await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    return jsonResponse({ deleted: true });
}

// ===== Users =====
async function listUsers(env) {
    const result = await env.DB.prepare(`
        SELECT id, phone, username, avatar, is_admin, status, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 100
    `).all();

    return jsonResponse({ items: result.results || [] });
}

async function updateUser(request, env, userId) {
    const body = await parseBody(request);
    const allowedFields = ['username', 'isAdmin', 'status'];
    const fieldMap = { isAdmin: 'is_admin' };

    const setClauses = [];
    const values = [];

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            const dbField = fieldMap[field] || field;
            setClauses.push(`${dbField} = ?`);
            values.push(field === 'isAdmin' ? (body[field] ? 1 : 0) : body[field]);
        }
    }

    if (setClauses.length === 0) return jsonResponse({ updated: false });

    values.push(userId);
    await env.DB.prepare(`
        UPDATE users SET ${setClauses.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return jsonResponse({ updated: true });
}

// ===== Characters =====
async function listAllCharacters(request, env) {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    const countResult = await env.DB.prepare(
        'SELECT COUNT(*) as total FROM characters'
    ).first();

    const offset = (page - 1) * pageSize;
    const result = await env.DB.prepare(`
        SELECT id, title, creator_name, status, is_public, view_count, chat_count, created_at
        FROM characters
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `).bind(pageSize, offset).all();

    return jsonResponse({
        items: result.results || [],
        total: countResult.total,
        page,
        pageSize
    });
}

async function adminGetCharacter(env, id) {
    const character = await env.DB.prepare(
        'SELECT * FROM characters WHERE id = ?'
    ).bind(id).first();

    if (!character) return errorResponse(404, '角色不存在');

    // Parse JSON fields
    character.tags = safeJsonParse(character.tags, []);
    character.categories = safeJsonParse(character.categories, []);

    return jsonResponse(character);
}

async function adminUpdateCharacter(request, env, id) {
    const body = await parseBody(request);

    const allowedFields = [
        'title', 'chatName', 'chat_name',
        'description', 'personality', 'scenario',
        'firstMessage', 'first_message',
        'exampleDialogue', 'example_dialogue',
        'image', 'tags', 'categories',
        'contentRating', 'content_rating',
        'status', 'isPublic', 'is_public', 'verified'
    ];

    const fieldMap = {
        chatName: 'chat_name',
        firstMessage: 'first_message',
        exampleDialogue: 'example_dialogue',
        contentRating: 'content_rating',
        isPublic: 'is_public'
    };

    const booleanFields = ['isPublic', 'is_public', 'verified'];
    const jsonFields = ['tags', 'categories'];

    const setClauses = [];
    const values = [];

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            const dbField = fieldMap[field] || field;
            let value = body[field];

            // Boolean fields: convert to 1/0
            if (booleanFields.includes(field)) {
                value = value ? 1 : 0;
            }

            // JSON fields: stringify arrays/objects
            if (jsonFields.includes(field)) {
                try {
                    value = typeof value === 'string' ? value : JSON.stringify(value);
                } catch {
                    value = '[]';
                }
            }

            setClauses.push(`${dbField} = ?`);
            values.push(value);
        }
    }

    if (setClauses.length === 0) return jsonResponse({ updated: false });

    // Add updated_at
    setClauses.push('updated_at = ?');
    values.push(Date.now());

    values.push(id);
    await env.DB.prepare(`
        UPDATE characters SET ${setClauses.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return jsonResponse({ updated: true });
}

// ===== Stats =====
async function getStats(env) {
    const [userCount, charCount, chatCount, keyCount] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM users').first(),
        env.DB.prepare("SELECT COUNT(*) as count FROM characters WHERE status = 'published'").first(),
        env.DB.prepare('SELECT COUNT(*) as count FROM chat_messages').first(),
        env.DB.prepare('SELECT COUNT(*) as count FROM api_keys WHERE is_active = 1').first()
    ]);

    return jsonResponse({
        userCount: userCount.count,
        characterCount: charCount.count,
        messageCount: chatCount.count,
        activeApiKeys: keyCount.count
    });
}
