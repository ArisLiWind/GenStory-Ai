// ============================================
// LLM Service - Multi-key rotation with RPG support
// ============================================

const KEY_ROTATION = {
    index: 0,
    keys: []
};

// Load active API keys
async function loadKeys(env) {
    const result = await env.DB.prepare(`
        SELECT * FROM api_keys
        WHERE is_active = 1
        ORDER BY priority ASC, id ASC
    `).all();
    KEY_ROTATION.keys = result.results || [];
    KEY_ROTATION.index = 0;
    return KEY_ROTATION.keys;
}

// Get next API key (round-robin)
async function getNextKey(env) {
    if (KEY_ROTATION.keys.length === 0) {
        await loadKeys(env);
    }
    if (KEY_ROTATION.keys.length === 0) {
        throw new Error('No API keys configured');
    }
    const key = KEY_ROTATION.keys[KEY_ROTATION.index % KEY_ROTATION.keys.length];
    KEY_ROTATION.index++;
    return key;
}

// Build system prompt based on character data
function buildSystemPrompt(character) {
    let prompt = `你正在扮演一个角色：${character.title || '未知角色'}\n\n`;

    if (character.description) {
        prompt += `角色背景：${character.description}\n\n`;
    }
    if (character.personality) {
        prompt += `性格特点：${character.personality}\n\n`;
    }
    if (character.scenario) {
        prompt += `场景设定：${character.scenario}\n\n`;
    }

    prompt += `请始终以${character.chat_name || character.title}的身份和语气回复，不要出戏，不要提到你是AI或角色扮演。
回复要自然流畅，符合角色设定。使用第一人称回复。`;

    // Check if RPG / adventure category
    const categories = safeJsonParse(character.categories, []);
    const rpgCategories = ['rpg', 'xianxia', 'wuxia', 'fantasy', 'martial', 'transmigration', 'cyberpunk', 'lovecraft'];
    const isRPG = categories.some(c => rpgCategories.includes(c));

    if (isRPG) {
        prompt += `\n\n【RPG模式】
这是一个RPG冒险类角色，请：
1. 描述环境和场景时生动详细，营造沉浸感
2. 用动作描写（*动作*）来增强表现力
3. 根据玩家的选择推动剧情发展
4. 可以加入战斗、探索、对话等RPG元素
5. 适当设置悬念和挑战，让玩家有探索欲望
6. 控制回复长度，不要一次说太多，给玩家反应空间`;
    }

    return prompt;
}

function safeJsonParse(str, defaultValue) {
    try { return JSON.parse(str); } catch { return defaultValue; }
}

// Call LLM API
export async function callLLM(env, character, messages) {
    const apiKey = await getNextKey(env);

    const systemPrompt = buildSystemPrompt(character);

    // Format messages for API
    const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
        }))
    ];

    const baseUrl = apiKey.base_url || 'https://api.openai.com/v1';
    const model = apiKey.model || 'gpt-3.5-turbo';

    try {
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
                max_tokens: 1000,
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

        // Update key usage
        await env.DB.prepare(`
            UPDATE api_keys SET usage_count = usage_count + 1, last_used_at = ?
            WHERE id = ?
        `).bind(Date.now(), apiKey.id).run();

        return reply.trim();
    } catch (err) {
        console.error('LLM call failed:', err.message);
        // Try next key on failure
        if (KEY_ROTATION.keys.length > 1) {
            console.log('Trying next API key...');
            const nextKey = await getNextKey(env);
            if (nextKey.id !== apiKey.id) {
                try {
                    return await callLLMWithKey(env, nextKey, character, messages);
                } catch (e2) {
                    throw new Error('All API keys failed');
                }
            }
        }
        throw err;
    }
}

async function callLLMWithKey(env, apiKey, character, messages) {
    const systemPrompt = buildSystemPrompt(character);
    const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
        }))
    ];

    const baseUrl = apiKey.base_url || 'https://api.openai.com/v1';
    const model = apiKey.model || 'gpt-3.5-turbo';

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
            max_tokens: 1000
        })
    });

    if (!response.ok) throw new Error(`LLM API error: ${response.status}`);

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';

    await env.DB.prepare(`
        UPDATE api_keys SET usage_count = usage_count + 1, last_used_at = ?
        WHERE id = ?
    `).bind(Date.now(), apiKey.id).run();

    return reply.trim();
}
