// ============================================
// Chat Routes
// ============================================

import { jsonResponse, errorResponse, parseBody, getCurrentUser, now, generateId, safeJsonParse } from '../utils.js';
import { callLLM, generateNarrative } from '../services/llm.js';

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

    const existingSession = await env.DB.prepare(`
        SELECT * FROM chat_sessions
        WHERE user_id = ? AND character_id = ?
        ORDER BY updated_at DESC
        LIMIT 1
    `).bind(user.id, characterId).first();

    if (existingSession) {
        const messages = await getMessagesForSession(env, existingSession.id);
        return jsonResponse({
            id: existingSession.id,
            sessionId: existingSession.id,
            characterId,
            title: existingSession.title,
            messages
        });
    }

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

    const messages = await getMessagesForSession(env, sessionId);
    return jsonResponse({ id: sessionId, sessionId, characterId, title: character.title, messages }, 201);
}

async function getSessionMessages(request, env, sessionId) {
    const user = await getCurrentUser(request, env);
    if (!user) return errorResponse(401, '请先登录');

    // Verify ownership
    const session = await env.DB.prepare(
        'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();

    if (!session) return errorResponse(404, '会话不存在');

    return jsonResponse({
        sessionId,
        messages: await getMessagesForSession(env, sessionId)
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

    // Get conversation history (last 40 messages for RPG continuity)
    const historyResult = await env.DB.prepare(`
        SELECT role, content FROM (
            SELECT id, role, content, created_at
            FROM chat_messages
            WHERE session_id = ?
            ORDER BY created_at DESC
            LIMIT 40
        ) ORDER BY created_at ASC
    `).bind(sessionId).all();

    const messages = historyResult.results || [];

    // ===== Single-call RPG Flow =====
    // 旧流程调用两次 LLM（parseAction + generateNarrative），太慢且容易超时
    // 新流程：一次调用 generateNarrative，内部完成行动解析+叙事生成
    let reply = '';
    try {
        const worldState = await getOrCreateWorldState(env, sessionId, character);
        const npcStates = await getOrCreateNpcStates(env, sessionId, character, worldState);
        const playerState = await getOrCreatePlayerState(env, sessionId, worldState);

        // 更新世界状态（简化版，不需要 parseAction，直接用原始用户输入）
        const simpleAction = {
            action_type: 'other',
            target: '',
            content: content.trim(),
            intent: '',
            expected_effects: []
        };
        await updateWorldStateAfterAction(env, sessionId, worldState, npcStates, playerState, simpleAction, character);

        // 一次 LLM 调用生成 RPG 叙事（包含行动理解+场景生成）
        const updatedWorldState = await getOrCreateWorldState(env, sessionId, character);
        const updatedNpcStates = await getOrCreateNpcStates(env, sessionId, character, updatedWorldState);
        const updatedPlayerState = await getOrCreatePlayerState(env, sessionId, updatedWorldState);

        // 历史消息排除最后一条（当前用户消息），generateNarrative 内部会添加
        const historyForNarrative = messages.slice(0, -1);

        reply = await generateNarrative(env, character, updatedWorldState, updatedNpcStates, updatedPlayerState, simpleAction, historyForNarrative);

        // 尝试更新状态（非关键）
        try {
            await applyStatusChangesFromNarrative(env, sessionId, reply, character);
        } catch (parseErr) {
            console.warn('Status change parse failed (non-critical):', parseErr.message);
        }

    } catch (err) {
        console.error('RPG Chat Error:', err);
        // Fallback to regular LLM call (no RPG formatting)
        try {
            reply = await callLLM(env, character, messages);
        } catch (llmErr) {
            console.error('LLM Fallback Error:', llmErr);
            reply = '（AI服务暂时不可用。错误信息：' + (llmErr.message || '未知错误') + '。请到管理后台测试API Key是否正常。）';
        }
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

// ===== RPG World State Helpers =====

async function getOrCreateWorldState(env, sessionId, character) {
    const existing = await env.DB.prepare(
        'SELECT * FROM world_states WHERE session_id = ?'
    ).bind(sessionId).first();

    if (existing) {
        existing.state_json = safeJsonParse(existing.state_json, {});
        existing.history_json = safeJsonParse(existing.history_json, []);
        return existing;
    }

    // Initialize with character's scenario
    const chatName = character.chat_name || character.title || 'NPC';
    const initialState = {
        current_location: '初始场景',
        weather: '晴朗',
        current_time: '白天'
    };

    // Try to extract location from scenario
    const scenario = character.scenario || '';
    const locMatch = scenario.match(/在(.{2,20}?)[，。,.]/);
    if (locMatch) {
        initialState.current_location = locMatch[1].trim();
    }

    const ts = now();
    await env.DB.prepare(`
        INSERT INTO world_states (session_id, current_time, current_location, weather, state_json, history_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
        sessionId,
        initialState.current_time,
        initialState.current_location,
        initialState.weather,
        JSON.stringify({ mainNpc: chatName }),
        JSON.stringify([]),
        ts
    ).run();

    return {
        id: 0,
        session_id: sessionId,
        current_time: initialState.current_time,
        current_location: initialState.current_location,
        weather: initialState.weather,
        state_json: { mainNpc: chatName },
        history_json: [],
        created_at: ts,
        updated_at: null
    };
}

async function getOrCreateNpcStates(env, sessionId, character, worldState) {
    const result = await env.DB.prepare(
        'SELECT * FROM npc_states WHERE session_id = ?'
    ).bind(sessionId).all();

    const npcStates = result.results || [];

    // If no NPCs exist, create the main character as default NPC
    if (npcStates.length === 0) {
        const chatName = character.chat_name || character.title || 'NPC';
        const location = worldState?.current_location || '';
        const ts = now();

        await env.DB.prepare(`
            INSERT INTO npc_states (session_id, npc_key, name, location, mood, health, relationship, knowledge_json, goals_json, last_action, created_at)
            VALUES (?, ?, ?, ?, 'neutral', 100, 0, '{}', '[]', '', ?)
        `).bind(sessionId, 'main', chatName, location, ts).run();

        return [{
            id: 0,
            session_id: sessionId,
            npc_key: 'main',
            name: chatName,
            location: location,
            mood: 'neutral',
            health: 100,
            relationship: 0,
            knowledge_json: {},
            goals_json: [],
            last_action: '',
            created_at: ts,
            updated_at: null
        }];
    }

    // Parse JSON fields
    return npcStates.map(npc => ({
        ...npc,
        knowledge_json: safeJsonParse(npc.knowledge_json, {}),
        goals_json: safeJsonParse(npc.goals_json, [])
    }));
}

async function getOrCreatePlayerState(env, sessionId, worldState) {
    const existing = await env.DB.prepare(
        'SELECT * FROM player_states WHERE session_id = ?'
    ).bind(sessionId).first();

    if (existing) {
        existing.inventory_json = safeJsonParse(existing.inventory_json, []);
        existing.stats_json = safeJsonParse(existing.stats_json, {});
        existing.knowledge_json = safeJsonParse(existing.knowledge_json, {});
        existing.relationships_json = safeJsonParse(existing.relationships_json, {});
        existing.quests_json = safeJsonParse(existing.quests_json, []);
        return existing;
    }

    const location = worldState?.current_location || '';
    const ts = now();

    await env.DB.prepare(`
        INSERT INTO player_states (session_id, location, inventory_json, stats_json, knowledge_json, relationships_json, quests_json, created_at)
        VALUES (?, ?, '[]', '{}', '{}', '{}', '[]', ?)
    `).bind(sessionId, location, ts).run();

    return {
        id: 0,
        session_id: sessionId,
        location: location,
        inventory_json: [],
        stats_json: {},
        knowledge_json: {},
        relationships_json: {},
        quests_json: [],
        created_at: ts,
        updated_at: null
    };
}

async function updateWorldStateAfterAction(env, sessionId, worldState, npcStates, playerState, parsedAction, character) {
    const ts = now();

    // Add action to history
    const history = safeJsonParse(worldState.history_json, []);
    history.push({
        timestamp: ts,
        role: 'player',
        action_type: parsedAction.action_type,
        target: parsedAction.target,
        content: parsedAction.content
    });
    // Keep last 50 history entries
    while (history.length > 50) history.shift();

    // Update world state history
    await env.DB.prepare(`
        UPDATE world_states
        SET history_json = ?, updated_at = ?
        WHERE session_id = ?
    `).bind(JSON.stringify(history), ts, sessionId).run();

    // Simple relationship adjustment based on action type
    // talk: +1, observe: 0, move: 0, attack: -5, investigate: +1
    let relationshipDelta = 0;
    let moodChange = '';
    switch (parsedAction.action_type) {
        case 'talk':
            relationshipDelta = 1;
            moodChange = 'interested';
            break;
        case 'attack':
            relationshipDelta = -5;
            moodChange = 'angry';
            break;
        case 'investigate':
            relationshipDelta = 1;
            moodChange = 'curious';
            break;
        case 'observe':
            moodChange = 'neutral';
            break;
        default:
            relationshipDelta = 0;
    }

    // Update main NPC state
    if (npcStates && npcStates.length > 0) {
        const mainNpc = npcStates.find(n => n.npc_key === 'main') || npcStates[0];
        const newRelationship = Math.max(-100, Math.min(100, (mainNpc.relationship || 0) + relationshipDelta));
        const newMood = moodChange || mainNpc.mood || 'neutral';

        await env.DB.prepare(`
            UPDATE npc_states
            SET relationship = ?, mood = ?, last_action = ?, updated_at = ?
            WHERE session_id = ? AND npc_key = ?
        `).bind(
            newRelationship,
            newMood,
            parsedAction.content?.substring(0, 200) || '',
            ts,
            sessionId,
            mainNpc.npc_key
        ).run();
    }

    // Update player location if action is move
    if (parsedAction.action_type === 'move' && parsedAction.target) {
        await env.DB.prepare(`
            UPDATE player_states
            SET location = ?, updated_at = ?
            WHERE session_id = ?
        `).bind(parsedAction.target, ts, sessionId).run();

        // Also update world state location
        await env.DB.prepare(`
            UPDATE world_states
            SET current_location = ?, updated_at = ?
            WHERE session_id = ?
        `).bind(parsedAction.target, ts, sessionId).run();
    }
}

async function applyStatusChangesFromNarrative(env, sessionId, narrative, character) {
    const chatName = character.chat_name || character.title || 'NPC';
    const ts = now();

    // Extract 【状态变化】 section
    const statusMatch = narrative.match(/【状态变化】([\s\S]*?)(?=\n【|$)/);
    if (!statusMatch) return;

    const statusSection = statusMatch[1];
    const lines = statusSection.split('\n').filter(l => l.trim().startsWith('-'));

    for (const line of lines) {
        // Try to match NPC relationship changes: "NPC名：关系 +5" or "NPC名：关系 -3 / 情绪变为好奇"
        const relMatch = line.match(/关系\s*([+-]?\d+)/);
        const moodMatch = line.match(/情绪变为?([\u4e00-\u9fa5a-zA-Z]+)/);

        if (relMatch || moodMatch) {
            // Get current NPC state
            const npc = await env.DB.prepare(
                'SELECT * FROM npc_states WHERE session_id = ? AND npc_key = ?'
            ).bind(sessionId, 'main').first();

            if (npc) {
                let newRelationship = npc.relationship || 0;
                let newMood = npc.mood || 'neutral';

                if (relMatch) {
                    const delta = parseInt(relMatch[1], 10);
                    newRelationship = Math.max(-100, Math.min(100, newRelationship + delta));
                }

                if (moodMatch) {
                    newMood = moodMatch[1];
                }

                await env.DB.prepare(`
                    UPDATE npc_states
                    SET relationship = ?, mood = ?, updated_at = ?
                    WHERE session_id = ? AND npc_key = ?
                `).bind(newRelationship, newMood, ts, sessionId, 'main').run();
            }
        }
    }
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
        return jsonResponse({
            sessionId: session.id,
            messages: await getMessagesForSession(env, session.id)
        });
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

    return jsonResponse({
        sessionId,
        messages: await getMessagesForSession(env, sessionId)
    }, 201);
}

async function getMessagesForSession(env, sessionId) {
    const result = await env.DB.prepare(`
        SELECT id, role, content, created_at
        FROM chat_messages
        WHERE session_id = ?
        ORDER BY created_at ASC, id ASC
    `).bind(sessionId).all();

    return result.results || [];
}
