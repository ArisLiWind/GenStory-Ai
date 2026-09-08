// ============================================
// Chat Routes
// ============================================

import { jsonResponse, errorResponse, parseBody, getCurrentUser, now, generateId, safeJsonParse } from '../utils.js';
import { callLLM } from '../services/llm.js';

export async function handleChat(request, env, path) {
    // List sessions
    if (path === '/api/chat/sessions' && request.method === 'GET') {
        return listSessions(request, env);
    }

    // Create session
    if (path === '/api/chat/sessions' && request.method === 'POST') {
        return createSession(request, env);
    }

    // Session messages
    const sessionMatch = path.match(/^\/api\/chat\/sessions\/([^/]+)$/);
    if (sessionMatch) {
        const sessionId = sessionMatch[1];
        if (request.method === 'GET') return getSessionMessages(request, env, sessionId);
        if (request.method === 'DELETE') return deleteSession(request, env, sessionId);
    }

    // Send message
    const sendMatch = path.match(/^\/api\/chat\/([^/]+)\/send$/);
    if (sendMatch && request.method === 'POST') {
        return sendMessage(request, env, sendMatch[1]);
    }

    // Get or create session for character
    const charMatch = path.match(/^\/api\/chat\/character\/(\d+)$/);
    if (charMatch && request.method === 'GET') {
        return getOrCreateSession(request, env, parseInt(charMatch[1]));
    }

    return errorResponse(404, 'Not found');
}

async function listSessions(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) return errorResponse(401, '请先登录');

    const result = await env.DB.prepare(`
        SELECT cs.*, c.title as character_title, c.image as character_image
        FROM chat_sessions cs
        JOIN characters c ON cs.character_id = c.id
        WHERE cs.user_id = ?
        ORDER BY cs.updated_at DESC
    `).bind(user.id).all();

    return jsonResponse({ items: result.results || [] });
}

async function createSession(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) return errorResponse(401, '请先登录');

    const { characterId } = await parseBody(request);
    if (!characterId) return errorResponse(400, '缺少角色ID');

    const character = await env.DB.prepare(
        'SELECT * FROM characters WHERE id = ?'
    ).bind(characterId).first();

    if (!character) return errorResponse(404, '角色不存在');

    const sessionId = generateId('chat');
    const createdAt = now();

    await env.DB.prepare(`
        INSERT INTO chat_sessions (id, user_id, character_id, title, created_at, updated_at, message_count)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    `).bind(sessionId, user.id, characterId, character.title, createdAt, createdAt).run();

    // If character has first message, add it
    if (character.first_message) {
        await env.DB.prepare(`
            INSERT INTO chat_messages (session_id, role, content, created_at)
            VALUES (?, 'assistant', ?, ?)
        `).bind(sessionId, character.first_message, createdAt).run();

        await env.DB.prepare(
            'UPDATE chat_sessions SET message_count = 1 WHERE id = ?'
        ).bind(sessionId).run();
    }

    return jsonResponse({ id: sessionId, characterId, title: character.title }, 201);
}

async function getSessionMessages(request, env, sessionId) {
    const user = await getCurrentUser(request, env);
    if (!user) return errorResponse(401, '请先登录');

    // Verify ownership
    const session = await env.DB.prepare(
        'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();

    if (!session) return errorResponse(404, '会话不存在');

    const result = await env.DB.prepare(`
        SELECT id, role, content, created_at
        FROM chat_messages
        WHERE session_id = ?
        ORDER BY created_at ASC
    `).bind(sessionId).all();

    return jsonResponse({
        sessionId,
        messages: result.results || []
    });
}

async function deleteSession(request, env, sessionId) {
    const user = await getCurrentUser(request, env);
    if (!user) return errorResponse(401, '请先登录');

    const session = await env.DB.prepare(
        'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();

    if (!session) return errorResponse(404, '会话不存在');

    await env.DB.prepare('DELETE FROM chat_messages WHERE session_id = ?').bind(sessionId).run();
    await env.DB.prepare('DELETE FROM chat_sessions WHERE id = ?').bind(sessionId).run();

    return jsonResponse({ deleted: true });
}

async function sendMessage(request, env, sessionId) {
    const user = await getCurrentUser(request, env);
    if (!user) return errorResponse(401, '请先登录');

    const session = await env.DB.prepare(
        'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();

    if (!session) return errorResponse(404, '会话不存在');

    const { content } = await parseBody(request);
    if (!content || !content.trim()) return errorResponse(400, '请输入消息内容');

    const character = await env.DB.prepare(
        'SELECT * FROM characters WHERE id = ?'
    ).bind(session.character_id).first();

    if (!character) return errorResponse(404, '角色不存在');

    // Save user message
    const userMsgTime = now();
    await env.DB.prepare(`
        INSERT INTO chat_messages (session_id, role, content, created_at)
        VALUES (?, 'user', ?, ?)
    `).bind(sessionId, content.trim(), userMsgTime).run();

    // Get conversation history (last 20 messages for context)
    const historyResult = await env.DB.prepare(`
        SELECT role, content FROM (
            SELECT id, role, content, created_at
            FROM chat_messages
            WHERE session_id = ?
            ORDER BY created_at DESC
            LIMIT 20
        ) ORDER BY created_at ASC
    `).bind(sessionId).all();

    const messages = historyResult.results || [];

    // Call LLM
    let reply = '';
    try {
        reply = await callLLM(env, character, messages);
    } catch (err) {
        console.error('LLM Error:', err);
        reply = '（抱歉，我现在有点忙，请稍后再试...）';
    }

    // Save assistant reply
    const assistantMsgTime = now();
    await env.DB.prepare(`
        INSERT INTO chat_messages (session_id, role, content, created_at)
        VALUES (?, 'assistant', ?, ?)
    `).bind(sessionId, reply, assistantMsgTime).run();

    // Update session
    await env.DB.prepare(`
        UPDATE chat_sessions
        SET updated_at = ?, message_count = message_count + 2
        WHERE id = ?
    `).bind(assistantMsgTime, sessionId).run();

    // Increment character chat count
    await env.DB.prepare(
        'UPDATE characters SET chat_count = chat_count + 1 WHERE id = ?'
    ).bind(character.id).run();

    return jsonResponse({
        role: 'assistant',
        content: reply,
        createdAt: assistantMsgTime
    });
}

async function getOrCreateSession(request, env, characterId) {
    const user = await getCurrentUser(request, env);
    if (!user) return errorResponse(401, '请先登录');

    // Find most recent session
    const session = await env.DB.prepare(`
        SELECT * FROM chat_sessions
        WHERE user_id = ? AND character_id = ?
        ORDER BY updated_at DESC
        LIMIT 1
    `).bind(user.id, characterId).first();

    if (session) {
        return jsonResponse({ sessionId: session.id });
    }

    // Create new session
    const character = await env.DB.prepare(
        'SELECT * FROM characters WHERE id = ?'
    ).bind(characterId).first();

    if (!character) return errorResponse(404, '角色不存在');

    const sessionId = generateId('chat');
    const createdAt = now();

    await env.DB.prepare(`
        INSERT INTO chat_sessions (id, user_id, character_id, title, created_at, updated_at, message_count)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    `).bind(sessionId, user.id, characterId, character.title, createdAt, createdAt).run();

    if (character.first_message) {
        await env.DB.prepare(`
            INSERT INTO chat_messages (session_id, role, content, created_at)
            VALUES (?, 'assistant', ?, ?)
        `).bind(sessionId, character.first_message, createdAt).run();
        await env.DB.prepare(
            'UPDATE chat_sessions SET message_count = 1 WHERE id = ?'
        ).bind(sessionId).run();
    }

    return jsonResponse({ sessionId }, 201);
}
