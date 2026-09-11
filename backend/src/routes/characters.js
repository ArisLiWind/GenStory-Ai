// ============================================
// Characters Routes
// ============================================

import { jsonResponse, errorResponse, parseBody, getCurrentUser, now, generateId, safeJsonParse } from '../utils.js';

export async function handleCharacters(request, env, path) {
    // List characters
    if (path === '/api/characters' && request.method === 'GET') {
        return listCharacters(request, env);
    }

    // Create character
    if (path === '/api/characters' && request.method === 'POST') {
        return createCharacter(request, env);
    }

    // Character detail / update / delete
    const detailMatch = path.match(/^\/api\/characters\/(\d+)$/);
    if (detailMatch) {
        const id = parseInt(detailMatch[1]);
        if (request.method === 'GET') return getCharacterDetail(request, env, id);
        if (request.method === 'PUT') return updateCharacter(request, env, id);
        if (request.method === 'DELETE') return deleteCharacter(request, env, id);
    }

    // Favorite toggle
    const favMatch = path.match(/^\/api\/characters\/(\d+)\/favorite$/);
    if (favMatch && request.method === 'POST') {
        return toggleFavorite(request, env, parseInt(favMatch[1]));
    }

    // My characters
    if (path === '/api/characters/mine' && request.method === 'GET') {
        return getMyCharacters(request, env);
    }

    return errorResponse(404, 'Not found');
}

async function listCharacters(request, env) {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '12');
    const category = url.searchParams.get('category') || 'all';
    const sortBy = url.searchParams.get('sortBy') || 'views';
    const keyword = url.searchParams.get('keyword') || '';

    let whereClauses = ["status = 'published'", 'is_public = 1'];
    let params = [];

    if (category && category !== 'all') {
        whereClauses.push('categories LIKE ?');
        params.push(`%"${category}"%`);
    }

    if (keyword) {
        whereClauses.push('(title LIKE ? OR creator_name LIKE ? OR description LIKE ?)');
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // Count total
    const countResult = await env.DB.prepare(
        `SELECT COUNT(*) as total FROM characters ${whereSql}`
    ).bind(...params).first();
    const total = countResult.total;

    console.log(`[Characters] List query: total=${total}, page=${page}, pageSize=${pageSize}, category=${category}, sortBy=${sortBy}`);

    // Sort
    let orderSql = 'view_count DESC';
    if (sortBy === 'rating') orderSql = 'rating DESC';
    if (sortBy === 'newest') orderSql = 'created_at DESC';

    // Pagination
    const offset = (page - 1) * pageSize;
    params.push(pageSize, offset);

    const result = await env.DB.prepare(`
        SELECT id, title, description, image, creator_id, creator_name, verified,
               tags, categories, view_count, chat_count, rating, rating_count,
               content_rating, created_at
        FROM characters
        ${whereSql}
        ORDER BY ${orderSql}
        LIMIT ? OFFSET ?
    `).bind(...params).all();

    const items = (result.results || []).map(row => ({
        ...row,
        tags: safeJsonParse(row.tags, []),
        categories: safeJsonParse(row.categories, []),
        viewCount: row.view_count,
        chatCount: row.chat_count,
        ratingCount: row.rating_count,
        createdAt: row.created_at,
        creatorId: row.creator_id,
        creatorName: row.creator_name,
        contentRating: row.content_rating
    }));

    console.log(`[Characters] Returning ${items.length} items`);

    return jsonResponse({
        items,
        total,
        page,
        pageSize,
        hasMore: offset + pageSize < total
    });
}

async function getCharacterDetail(request, env, id) {
    const row = await env.DB.prepare(`
        SELECT * FROM characters WHERE id = ? AND status = 'published'
    `).bind(id).first();

    if (!row) {
        return errorResponse(404, '角色不存在');
    }

    // Increment view count
    await env.DB.prepare('UPDATE characters SET view_count = view_count + 1 WHERE id = ?').bind(id).run();

    const user = await getCurrentUser(request, env);
    let isFavorited = false;
    if (user) {
        const favorite = await env.DB.prepare(
            'SELECT id FROM favorites WHERE user_id = ? AND character_id = ?'
        ).bind(user.id, id).first();
        isFavorited = !!favorite;
    }

    const character = {
        ...row,
        tags: safeJsonParse(row.tags, []),
        categories: safeJsonParse(row.categories, []),
        viewCount: row.view_count + 1,
        chatCount: row.chat_count,
        ratingCount: row.rating_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        creatorId: row.creator_id,
        creatorName: row.creator_name,
        contentRating: row.content_rating,
        chatName: row.chat_name,
        firstMessage: row.first_message,
        exampleDialogue: row.example_dialogue,
        creatorNote: row.creator_note || '',
        creator: row.creator_name,
        views: row.view_count + 1,
        chats: row.chat_count,
        isPublic: !!row.is_public,
        isFavorited
    };

    return jsonResponse(character);
}

async function createCharacter(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) {
        return errorResponse(401, '请先登录');
    }

    const body = await parseBody(request);
    const {
        title,
        chatName = '',
        description = '',
        personality = '',
        scenario = '',
        firstMessage = '',
        exampleDialogue = '',
        creatorNote = '',
        image = '',
        tags = [],
        categories = [],
        contentRating = 'general',
        status = 'draft',
        isPublic = 1
    } = body;

    if (!title || title.trim().length < 1) {
        return errorResponse(400, '请输入角色名称');
    }

    console.log('[Character] Creating character:', {
        title: title.trim(),
        chatName,
        hasPersonality: !!personality,
        hasScenario: !!scenario,
        hasFirstMessage: !!firstMessage,
        hasExample: !!exampleDialogue,
        hasCreatorNote: !!creatorNote,
        status,
        isPublic
    });

    // Safety check: if image is too large for D1 (base64 > 500KB), truncate
    let safeImage = image || '';
    if (safeImage.length > 500000) {
        console.warn(`[Character] Image too large (${safeImage.length} bytes), truncating`);
        // Keep the data URL prefix and truncate the base64 data
        safeImage = safeImage.substring(0, 500000);
    }

    const createdAt = now();
    const result = await env.DB.prepare(`
        INSERT INTO characters (
            title, chat_name, description, personality, scenario, first_message,
            example_dialogue, creator_note, image, creator_id, creator_name, tags, categories,
            content_rating, status, is_public, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
        title.trim(),
        chatName,
        description,
        personality,
        scenario,
        firstMessage,
        exampleDialogue,
        creatorNote,
        safeImage,
        user.id,
        user.username || '匿名用户',
        JSON.stringify(tags),
        JSON.stringify(categories),
        contentRating,
        status,
        isPublic ? 1 : 0,
        createdAt
    ).run();

    const characterId = result.meta.last_row_id;
    console.log('[Character] Created successfully, id:', characterId);

    return jsonResponse({
        id: characterId,
        title: title.trim(),
        status,
        createdAt
    }, 201);
}

async function updateCharacter(request, env, id) {
    const user = await getCurrentUser(request, env);
    if (!user) {
        return errorResponse(401, '请先登录');
    }

    const character = await env.DB.prepare(
        'SELECT * FROM characters WHERE id = ?'
    ).bind(id).first();

    if (!character) {
        return errorResponse(404, '角色不存在');
    }

    if (character.creator_id !== user.id && !user.is_admin) {
        return errorResponse(403, '无权修改此角色');
    }

    const body = await parseBody(request);
    const allowedFields = [
        'title', 'chatName', 'description', 'personality', 'scenario',
        'firstMessage', 'exampleDialogue', 'creatorNote', 'image', 'tags', 'categories',
        'contentRating', 'status', 'isPublic'
    ];

    const setClauses = [];
    const values = [];

    const fieldMap = {
        chatName: 'chat_name',
        firstMessage: 'first_message',
        exampleDialogue: 'example_dialogue',
        creatorNote: 'creator_note',
        contentRating: 'content_rating',
        isPublic: 'is_public'
    };

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            const dbField = fieldMap[field] || field;
            setClauses.push(`${dbField} = ?`);
            if (field === 'tags' || field === 'categories') {
                values.push(JSON.stringify(body[field]));
            } else if (field === 'isPublic') {
                values.push(body[field] ? 1 : 0);
            } else if (field === 'image') {
                // Safety: truncate large images
                let imgVal = body[field] || '';
                if (imgVal.length > 500000) {
                    console.warn(`[Character] Update image too large (${imgVal.length} bytes), truncating`);
                    imgVal = imgVal.substring(0, 500000);
                }
                values.push(imgVal);
            } else {
                values.push(body[field]);
            }
        }
    }

    if (setClauses.length > 0) {
        setClauses.push('updated_at = ?');
        values.push(now(), id);

        await env.DB.prepare(`
            UPDATE characters SET ${setClauses.join(', ')} WHERE id = ?
        `).bind(...values).run();
    }

    return jsonResponse({ id, updated: true });
}

async function deleteCharacter(request, env, id) {
    const user = await getCurrentUser(request, env);
    if (!user) {
        return errorResponse(401, '请先登录');
    }

    const character = await env.DB.prepare(
        'SELECT * FROM characters WHERE id = ?'
    ).bind(id).first();

    if (!character) {
        return errorResponse(404, '角色不存在');
    }

    if (character.creator_id !== user.id && !user.is_admin) {
        return errorResponse(403, '无权删除此角色');
    }

    await env.DB.prepare('DELETE FROM characters WHERE id = ?').bind(id).run();

    return jsonResponse({ deleted: true });
}

async function toggleFavorite(request, env, characterId) {
    const user = await getCurrentUser(request, env);
    if (!user) {
        return errorResponse(401, '请先登录');
    }

    // Check if already favorited
    const existing = await env.DB.prepare(
        'SELECT * FROM favorites WHERE user_id = ? AND character_id = ?'
    ).bind(user.id, characterId).first();

    if (existing) {
        // Unfavorite
        await env.DB.prepare(
            'DELETE FROM favorites WHERE user_id = ? AND character_id = ?'
        ).bind(user.id, characterId).run();
        return jsonResponse({ favorited: false });
    } else {
        // Favorite
        await env.DB.prepare(
            'INSERT INTO favorites (user_id, character_id, created_at) VALUES (?, ?, ?)'
        ).bind(user.id, characterId, now()).run();
        return jsonResponse({ favorited: true });
    }
}

async function getMyCharacters(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) {
        return errorResponse(401, '请先登录');
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || '';

    let whereSql = 'creator_id = ?';
    let params = [user.id];

    if (status) {
        whereSql += ' AND status = ?';
        params.push(status);
    }

    const result = await env.DB.prepare(`
        SELECT id, title, description, image, status, is_public, created_at,
               view_count, chat_count, categories, tags
        FROM characters
        WHERE ${whereSql}
        ORDER BY created_at DESC
    `).bind(...params).all();

    const items = (result.results || []).map(row => ({
        ...row,
        tags: safeJsonParse(row.tags, []),
        categories: safeJsonParse(row.categories, []),
        viewCount: row.view_count,
        chatCount: row.chat_count,
        createdAt: row.created_at,
        isPublic: !!row.is_public
    }));

    return jsonResponse({ items });
}
