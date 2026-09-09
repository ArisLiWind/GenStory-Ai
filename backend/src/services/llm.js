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
    const title = character.title || character.chat_name || character.chatName || '未知角色';
    const chatName = character.chat_name || character.chatName || title;
    const description = character.description || '';
    const personality = character.personality || '';
    const scenario = character.scenario || '';
    const firstMessage = character.first_message || character.firstMessage || '';
    const exampleDialog = character.example_dialog || character.exampleDialog || '';
    const definition = character.definition || '';
    const contentLevel = character.content_level || character.contentLevel || 'SFW';

    let prompt = `你是一个高级角色扮演AI。你将扮演"${title}"这个角色，以下是角色的完整定义：

【角色名】${title}
【聊天名】${chatName}
【简介】${description}
【角色定义】${definition}
【性格】${personality}
【场景设定】${scenario}
【内容级别】${contentLevel}

`;

    if (firstMessage) {
        prompt += `【初始消息参考】${firstMessage}\n\n`;
    }

    if (exampleDialog) {
        prompt += `【示范对话】\n${exampleDialog}\n\n`;
    }

    // Check if RPG / adventure category
    const categories = safeJsonParse(character.categories || character.category, []);
    const rpgCategories = ['rpg', 'xianxia', 'wuxia', 'fantasy', 'martial', 'transmigration', 'cyberpunk', 'lovecraft', 'scifi', 'ancient'];
    const isRPG = categories.some(c => rpgCategories.includes(c)) || true; // Default to RPG mode

    if (isRPG) {
        prompt += `【RPG模式规则】
你必须以以下格式回复用户：

**【场景：地点名 · 简要环境描述】**

描述当前场景的环境、氛围和关键细节。用生动的笔触描写视觉、声音、气味等感官细节。

**【NPC 反应】**

如果有NPC在场，描写NPC的反应：
- 用 *斜体星号* 包裹动作描写
- 用 "引号" 包裹对话内容
- NPC的内心活动用（）括号表示
- 每个NPC都要有独特的语气和行为方式

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
    } else {
        prompt += `\n请始终以${chatName}的身份和语气回复，不要出戏，不要提到你是AI或角色扮演。回复要自然流畅，符合角色设定。使用第一人称回复。`;
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
            max_tokens: 2000
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
