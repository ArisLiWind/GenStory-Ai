// ============================================
// GenSphere API - Cloudflare Pages Functions
// Default Admin Token: gensphere-admin-2024
// ============================================

// In-memory storage (fallback when D1 is not bound)
const MEM = {
    apiKeys: [],
    keyIdCounter: 1,
    sessions: new Map(),
    nextSessionId: 1
};

const DEFAULT_ADMIN_TOKEN = 'gensphere-admin-2024';

// ===== Utilities =====
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token'
        }
    });
}

function errorResponse(status, message) {
    return jsonResponse({ code: status, message }, status);
}

function getCORS(request) {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token'
            }
        });
    }
    return null;
}

async function parseBody(request) {
    try {
        return await request.json();
    } catch {
        return {};
    }
}

// ===== Admin Auth =====
function checkAdmin(request, env) {
    const adminToken = request.headers.get('X-Admin-Token');
    const expectedToken = env.ADMIN_TOKEN || DEFAULT_ADMIN_TOKEN;
    return !!(adminToken && adminToken === expectedToken);
}

// ===== API Key Storage =====
async function getApiKeys(env) {
    if (env.DB) {
        try {
            const result = await env.DB.prepare(
                'SELECT id, name, provider, base_url, model, is_active, priority, usage_count, last_used_at, created_at FROM api_keys ORDER BY priority ASC, id ASC'
            ).all();
            return result.results || [];
        } catch { /* fall through */ }
    }
    return MEM.apiKeys;
}

async function addApiKey(env, data) {
    if (env.DB) {
        try {
            const result = await env.DB.prepare(
                'INSERT INTO api_keys (name, provider, api_key, base_url, model, is_active, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(data.name, data.provider, data.apiKey, data.baseUrl || '', data.model || '', data.isActive ? 1 : 0, data.priority || 0, Date.now()).run();
            return { id: result.meta.last_row_id };
        } catch { /* fall through */ }
    }
    const id = MEM.keyIdCounter++;
    MEM.apiKeys.push({
        id, name: data.name, provider: data.provider,
        api_key: data.apiKey, base_url: data.baseUrl || '', model: data.model || '',
        is_active: data.isActive ? 1 : 0, priority: data.priority || 0,
        usage_count: 0, last_used_at: null, created_at: Date.now()
    });
    return { id };
}

async function updateApiKey(env, id, updates) {
    const fieldMap = { apiKey: 'api_key', baseUrl: 'base_url', isActive: 'is_active', usageCount: 'usage_count' };
    if (env.DB) {
        try {
            const setClauses = [], values = [];
            for (const [field, value] of Object.entries(updates)) {
                const dbField = fieldMap[field] || field;
                setClauses.push(`${dbField} = ?`);
                values.push(field === 'isActive' ? (value ? 1 : 0) : value);
            }
            if (!setClauses.length) return { updated: false };
            values.push(id);
            await env.DB.prepare(`UPDATE api_keys SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run();
            return { updated: true };
        } catch { /* fall through */ }
    }
    const key = MEM.apiKeys.find(k => k.id === id);
    if (key) {
        for (const [field, value] of Object.entries(updates)) {
            const dbField = fieldMap[field] || field;
            key[dbField] = field === 'isActive' ? (value ? 1 : 0) : value;
        }
        return { updated: true };
    }
    return { updated: false };
}

async function deleteApiKey(env, id) {
    if (env.DB) {
        try { await env.DB.prepare('DELETE FROM api_keys WHERE id = ?').bind(id).run(); return { deleted: true }; }
        catch { /* fall through */ }
    }
    MEM.apiKeys = MEM.apiKeys.filter(k => k.id !== id);
    return { deleted: true };
}

// ===== LLM Service =====
let keyRotationIndex = 0;

function buildSystemPrompt(character) {
    const title = character.title || character.chat_name || character.chatName || '未知角色';
    const chatName = character.chat_name || character.chatName || title;
    const description = character.description || '';
    const personality = character.personality || '';
    const scenario = character.scenario || '';
    const firstMessage = character.first_message || character.firstMessage || '';
    const exampleDialog = character.example_dialog || character.exampleDialog || '';
    const definition = character.definition || '';
    const contentLevel = character.content_level || character.contentLevel || 'SFW';

    let prompt = `你是一个高级角色扮演AI。你将扮演"${title}"这个角色，以下是角色的完整定义：\n\n【角色名】${title}\n【聊天名】${chatName}\n【简介】${description}\n【角色定义】${definition}\n【性格】${personality}\n【场景设定】${scenario}\n【内容级别】${contentLevel}\n\n`;
    if (firstMessage) prompt += `【初始消息参考】${firstMessage}\n\n`;
    if (exampleDialog) prompt += `【示范对话】\n${exampleDialog}\n\n`;

    prompt += `【RPG模式规则】
你必须以以下格式回复用户：

**【场景：地点名 · 简要环境描述】**

描述当前场景的环境、氛围和关键细节。

**【NPC 反应】**

如果有NPC在场，描写NPC的反应：
- 用 *斜体星号* 包裹动作描写
- 用 "引号" 包裹对话内容
- NPC的内心活动用（）括号表示

**【角色状态更新】**

如果有状态变化，用以下格式更新：
**角色名（英文/中文）**
* 状态：简述当前状态

**【任务分支】**

在每次回复的末尾，给出3个选项供玩家选择：
1. **选项描述**（简短说明这个选择的后果方向）
2. **选项描述**
3. **选项描述**

**你打算如何行动？** 或 **你打算如何下达指令？**

重要规则：
- 始终以角色身份回复，不要提及你是AI
- 回复要自然流畅，使用第一人称（NPC视角）或第三人称（场景描写）
- 控制回复长度在300-600字之间
- 根据玩家的选择推动剧情发展
- 保持角色设定的一致性
- 可以加入战斗、探索、对话等RPG元素
- 设置悬念和挑战，激发探索欲望
- 选项要有意义，不同选择导向不同剧情分支
- 用*动作*增强表现力
- 对话要符合角色性格和语气`;

    return prompt;
}

async function callLLM(env, character, messages) {
    const keys = (await getApiKeys(env)).filter(k => k.is_active);
    if (!keys.length) throw new Error('No API keys configured. Please add API keys in admin panel.');

    const apiKey = keys[keyRotationIndex % keys.length];
    keyRotationIndex++;

    const systemPrompt = buildSystemPrompt(character);
    const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
            role: m.role === 'assistant' || m.role === 'bot' ? 'assistant' : 'user',
            content: m.content
        }))
    ];

    const baseUrl = apiKey.base_url || 'https://api.deepseek.com/v1';
    const model = apiKey.model || 'deepseek-chat';

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.api_key}`
        },
        body: JSON.stringify({
            model,
            messages: apiMessages,
            temperature: 0.8,
            max_tokens: 2000,
            presence_penalty: 0.3,
            frequency_penalty: 0.3
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`LLM API Error (${apiKey.provider}):`, response.status, errorText);
        throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';

    // Update usage count in memory
    apiKey.usage_count = (apiKey.usage_count || 0) + 1;
    apiKey.last_used_at = Date.now();
    if (env.DB) {
        try {
            await env.DB.prepare('UPDATE api_keys SET usage_count = usage_count + 1, last_used_at = ? WHERE id = ?').bind(Date.now(), apiKey.id).run();
        } catch { /* ignore */ }
    }

    return reply.trim();
}

// ===== Character helper - get character from frontend =====
function getCharacterFromBody(body) {
    // The frontend may pass character data in different ways
    if (body.character) return body.character;
    if (body.characterData) return body.characterData;
    return body;
}

// ===== Main Handler =====
export async function onRequest(request, env) {
    const corsResponse = getCORS(request);
    if (corsResponse) return corsResponse;

    const url = new URL(request.url);
    const path = url.pathname;

    try {
        // ===== Admin: Stats =====
        if (path === '/api/admin/stats' && request.method === 'GET') {
            if (!checkAdmin(request, env)) return errorResponse(403, '无权访问');
            const keys = await getApiKeys(env);
            return jsonResponse({
                userCount: 0,
                characterCount: 0,
                messageCount: 0,
                activeApiKeys: keys.filter(k => k.is_active).length
            });
        }

        // ===== Admin: API Keys =====
        if (path === '/api/admin/api-keys' && request.method === 'GET') {
            if (!checkAdmin(request, env)) return errorResponse(403, '无权访问');
            return jsonResponse({ items: await getApiKeys(env) });
        }

        if (path === '/api/admin/api-keys' && request.method === 'POST') {
            if (!checkAdmin(request, env)) return errorResponse(403, '无权访问');
            const body = await parseBody(request);
            const { name, provider, apiKey, baseUrl = '', model = '', isActive = true, priority = 0 } = body;
            if (!name || !apiKey || !provider) return errorResponse(400, '请填写完整信息');
            const result = await addApiKey(env, { name, provider, apiKey, baseUrl, model, isActive, priority });
            return jsonResponse(result, 201);
        }

        const keyMatch = path.match(/^\/api\/admin\/api-keys\/(\d+)$/);
        if (keyMatch) {
            if (!checkAdmin(request, env)) return errorResponse(403, '无权访问');
            const id = parseInt(keyMatch[1]);
            if (request.method === 'PUT') {
                const body = await parseBody(request);
                return jsonResponse(await updateApiKey(env, id, body));
            }
            if (request.method === 'DELETE') {
                return jsonResponse(await deleteApiKey(env, id));
            }
        }

        // ===== Admin: Categories (stub) =====
        if (path === '/api/admin/categories' && request.method === 'POST') {
            if (!checkAdmin(request, env)) return errorResponse(403, '无权访问');
            return jsonResponse({ id: 1 }, 201);
        }

        // ===== Admin: Users (stub) =====
        if (path === '/api/admin/users' && request.method === 'GET') {
            if (!checkAdmin(request, env)) return errorResponse(403, '无权访问');
            return jsonResponse({ items: [] });
        }

        // ===== Admin: Characters (stub) =====
        if (path === '/api/admin/characters' && request.method === 'GET') {
            if (!checkAdmin(request, env)) return errorResponse(403, '无权访问');
            return jsonResponse({ items: [], total: 0, page: 1, pageSize: 20 });
        }

        // ===== Chat: Get or create session for character =====
        const charSessionMatch = path.match(/^\/api\/chat\/character\/(\d+)$/);
        if (charSessionMatch && request.method === 'GET') {
            const characterId = parseInt(charSessionMatch[1]);
            const sessionId = 's_' + characterId + '_' + Date.now();
            MEM.sessions.set(sessionId, {
                id: sessionId,
                characterId,
                character: {},
                messages: []
            });
            return jsonResponse({ code: 0, data: { sessionId, messages: [] } });
        }

        // ===== Chat: Create session =====
        if (path === '/api/chat/sessions' && request.method === 'POST') {
            const body = await parseBody(request);
            const characterId = body.characterId || 0;
            const sessionId = 's_' + characterId + '_' + Date.now();
            const character = getCharacterFromBody(body);

            const session = {
                id: sessionId,
                characterId,
                character,
                messages: []
            };

            // If character has first message, add it
            const firstMsg = character.firstMessage || character.first_message || '';
            if (firstMsg) {
                session.messages.push({
                    role: 'assistant',
                    content: firstMsg,
                    created_at: Date.now()
                });
            }

            MEM.sessions.set(sessionId, session);

            return jsonResponse({
                code: 0,
                data: {
                    sessionId,
                    messages: session.messages
                }
            });
        }

        // ===== Chat: Get messages =====
        const sessionGetMatch = path.match(/^\/api\/chat\/sessions\/([^/]+)$/);
        if (sessionGetMatch && request.method === 'GET') {
            const sessionId = sessionGetMatch[1];
            const session = MEM.sessions.get(sessionId);
            if (!session) return errorResponse(404, 'Session not found');
            return jsonResponse({ code: 0, data: { messages: session.messages } });
        }

        // ===== Chat: Send message =====
        // Match both /chat/{sessionId}/send and /chat/sessions/{sessionId}/messages
        const sendMatch1 = path.match(/^\/api\/chat\/([^/]+)\/send$/);
        const sendMatch2 = path.match(/^\/api\/chat\/sessions\/([^/]+)\/messages$/);

        const sendMatch = sendMatch1 || sendMatch2;
        if (sendMatch && request.method === 'POST') {
            const sessionId = sendMatch[1];
            const body = await parseBody(request);
            const userText = body.message || body.content || '';

            const session = MEM.sessions.get(sessionId);
            if (!session) return errorResponse(404, 'Session not found');

            // Add user message
            session.messages.push({
                role: 'user',
                content: userText,
                created_at: Date.now()
            });

            // Call LLM
            try {
                const reply = await callLLM(env, session.character, session.messages);
                session.messages.push({
                    role: 'assistant',
                    content: reply,
                    created_at: Date.now()
                });

                return jsonResponse({
                    code: 0,
                    data: {
                        content: reply,
                        reply: reply
                    }
                });
            } catch (err) {
                return jsonResponse({
                    code: 1,
                    message: err.message || 'AI服务调用失败'
                });
            }
        }

        // ===== Chat: Get sessions list (stub) =====
        if (path === '/api/chat/sessions' && request.method === 'GET') {
            return jsonResponse({ code: 0, data: { sessions: [] } });
        }

        // ===== Characters (stub - generated client-side) =====
        if (path === '/api/characters' || path === '/api/characters/featured') {
            return jsonResponse({ items: [], total: 0 });
        }

        // ===== Categories (stub) =====
        if (path === '/api/categories') {
            return jsonResponse({ items: [] });
        }

        return errorResponse(404, 'API endpoint not found: ' + path);
    } catch (err) {
        console.error('API Error:', err);
        return errorResponse(500, err.message || 'Internal server error');
    }
}
