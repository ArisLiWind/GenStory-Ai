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
    return callLLMWithKeyAndPrompt(env, apiKey, systemPrompt, messages);
}

// Generic LLM call with custom system prompt (reused by parseAction / generateNarrative)
async function callLLMWithKeyAndPrompt(env, apiKey, systemPrompt, messages) {
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

// Try all keys with a custom system prompt
async function callLLMWithPrompt(env, systemPrompt, messages, temperature = 0.8) {
    const keys = await loadKeys(env);
    if (keys.length === 0) throw new Error('No API keys configured');

    let lastError = null;
    for (const key of keys) {
        try {
            const apiMessages = [
                { role: 'system', content: systemPrompt },
                ...messages.map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content
                }))
            ];

            const baseUrl = key.base_url || 'https://api.openai.com/v1';
            const model = key.model || 'gpt-3.5-turbo';

            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key.api_key}`
                },
                body: JSON.stringify({
                    model,
                    messages: apiMessages,
                    temperature,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`LLM API error: ${response.status}`);
            }

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content || '';

            await env.DB.prepare(`
                UPDATE api_keys SET usage_count = usage_count + 1, last_used_at = ?
                WHERE id = ?
            `).bind(Date.now(), key.id).run();

            return reply.trim();
        } catch (err) {
            lastError = err;
            console.error(`LLM key ${key.id} failed:`, err.message);
            continue;
        }
    }
    throw lastError || new Error('All API keys failed');
}

// ============================================
// RPG Action Parser
// ============================================

/**
 * 解析玩家行动为结构化 JSON
 * @param {*} env 
 * @param {string} userMessage - 用户原始输入
 * @param {*} character - 角色数据
 * @param {*} worldState - 当前世界状态
 * @returns {object} 解析后的行动对象
 */
export async function parseAction(env, userMessage, character, worldState) {
    const charName = character.title || character.chat_name || '未知角色';
    const location = worldState?.current_location || '未知地点';
    const time = worldState?.current_time || '';
    const weather = worldState?.weather || '';

    const systemPrompt = `你是一个 RPG 游戏的行动解析器（Action Parser）。你的任务是将玩家的自然语言输入解析为结构化的行动数据。

【当前场景】
角色：${charName}
地点：${location}
${time ? `时间：${time}` : ''}
${weather ? `天气：${weather}` : ''}

【解析规则】
你必须严格输出 JSON 格式，不要有任何额外文字、解释或 markdown 标记。直接输出 JSON 对象。

JSON 结构：
{
  "action_type": "talk|observe|move|attack|investigate|other",
  "target": "目标NPC或地点名称",
  "content": "具体行动内容的详细描述",
  "intent": "玩家的真实意图",
  "expected_effects": ["预期效果1", "预期效果2"]
}

action_type 说明：
- talk：对话、交流、提问、打招呼等语言互动
- observe：观察、查看、打量、环顾四周
- move：移动、前往、走向某个地点
- attack：攻击、打斗、使用武力
- investigate：调查、搜索、检查、探查线索
- other：其他行动

请根据玩家输入的真实含义进行解析，不要字面直译。如果玩家输入含糊，做出最合理的推断。`;

    const messages = [{ role: 'user', content: userMessage }];

    try {
        const result = await callLLMWithPrompt(env, systemPrompt, messages, 0.3);
        // Try to extract JSON from the response (in case LLM wraps it in markdown)
        const jsonStr = extractJson(result);
        const parsed = JSON.parse(jsonStr);
        return {
            action_type: parsed.action_type || 'other',
            target: parsed.target || '',
            content: parsed.content || userMessage,
            intent: parsed.intent || '',
            expected_effects: Array.isArray(parsed.expected_effects) ? parsed.expected_effects : []
        };
    } catch (err) {
        console.error('Action parse error:', err.message);
        // Fallback: return a default action
        return {
            action_type: 'talk',
            target: charName,
            content: userMessage,
            intent: '',
            expected_effects: []
        };
    }
}

function extractJson(text) {
    if (!text) return '{}';
    // Try direct parse first
    try {
        JSON.parse(text);
        return text;
    } catch {}
    // Try to find JSON in code blocks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match) return match[1].trim();
    // Try to find first { ... }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return text.slice(firstBrace, lastBrace + 1);
    }
    return '{}';
}

// ============================================
// RPG Narrative Engine
// ============================================

/**
 * 生成 RPG 格式的叙事回复
 * @param {*} env 
 * @param {*} character - 角色设定
 * @param {*} worldState - 世界状态
 * @param {Array} npcStates - NPC 状态列表
 * @param {*} playerState - 玩家状态
 * @param {*} parsedAction - 解析后的玩家行动
 * @param {Array} history - 历史消息
 * @returns {string} RPG 格式的叙事文本
 */
export async function generateNarrative(env, character, worldState, npcStates, playerState, parsedAction, history) {
    const charName = character.title || character.chat_name || '未知角色';
    const chatName = character.chat_name || charName;
    const personality = character.personality || '';
    const scenario = character.scenario || '';
    const firstMessage = character.first_message || '';

    const location = worldState?.current_location || '未知之地';
    const time = worldState?.current_time || '';
    const weather = worldState?.weather || '';

    // Build NPC state summary
    let npcSummary = '';
    if (npcStates && npcStates.length > 0) {
        for (const npc of npcStates) {
            const npcName = npc.name || npc.npc_key || '未知NPC';
            npcSummary += `- ${npcName}：位置=${npc.location || '未知'}，情绪=${npc.mood || 'neutral'}，关系值=${npc.relationship || 0}，生命值=${npc.health || 100}\n`;
            if (npc.last_action) {
                npcSummary += `  上次行动：${npc.last_action}\n`;
            }
        }
    } else {
        // Default: the character itself is the main NPC
        npcSummary = `- ${chatName}：位置=${location}，情绪=neutral，关系值=0，生命值=100\n`;
    }

    // Player state summary
    let playerSummary = '';
    if (playerState) {
        const inv = safeJsonParse(playerState.inventory_json, []);
        const stats = safeJsonParse(playerState.stats_json, {});
        playerSummary = `位置：${playerState.location || location}\n`;
        if (inv.length > 0) playerSummary += `物品：${inv.join(', ')}\n`;
        if (Object.keys(stats).length > 0) playerSummary += `属性：${JSON.stringify(stats)}\n`;
    }

    const actionDesc = parsedAction?.content || '玩家进行了行动';
    const actionType = parsedAction?.action_type || 'other';
    const target = parsedAction?.target || '';

    const systemPrompt = `你是一个 RPG 游戏的叙事引擎（Narrative Engine）。你的任务是根据角色设定、世界状态和玩家行动，生成一段沉浸式的 RPG 叙事回复。

【角色设定】
角色名：${charName}
聊天名：${chatName}
${personality ? `性格：${personality}` : ''}
${scenario ? `场景设定：${scenario}` : ''}
${firstMessage ? `初始消息参考：${firstMessage}` : ''}

【当前世界状态】
地点：${location}
${time ? `时间：${time}` : ''}
${weather ? `天气：${weather}` : ''}

【NPC 状态】
${npcSummary}
【玩家状态】
${playerSummary || '暂无特殊状态'}
【玩家行动】
行动类型：${actionType}
${target ? `目标：${target}` : ''}
行动内容：${actionDesc}

【输出格式要求】
你必须严格按照以下格式输出，不要有任何额外内容：

【时间 · 地点】

场景描述（2-3句话，包含视觉、声音、气味等感官细节，营造沉浸感）

【NPC反应】
*动作描写*
"对话内容"
（内心活动，如果有的话）

【状态变化】
- NPC名：关系 +5 / 情绪变为好奇
- 地点：获得线索XXX

【行动选项】
① 选项描述
② 选项描述
③ 选项描述
④ 自由行动

【重要规则】
1. 场景描述要生动，用第三人称视角，包含感官细节
2. NPC 反应要符合角色性格和当前情绪状态，用 *动作* 和 "对话" 格式
3. 状态变化部分要简洁明了，列出本次行动导致的所有变化
4. 行动选项要有 3 个具体选项 + 1 个自由行动选项
5. 选项要有意义，不同选择导向不同方向
6. 整体回复控制在 300-600 字
7. 始终保持沉浸感，不要提到 AI、游戏、系统等元信息
8. NPC 关系值变化范围通常在 -10 到 +10 之间`;

    // Build message history (last 10 messages for context)
    const historyMessages = (history || []).slice(-10).map(m => ({
        role: m.role,
        content: m.content
    }));

    // Add the current action as user message
    const messages = [
        ...historyMessages,
        { role: 'user', content: actionDesc }
    ];

    try {
        const result = await callLLMWithPrompt(env, systemPrompt, messages, 0.85);
        return result;
    } catch (err) {
        console.error('Narrative generation error:', err.message);
        // Fallback response
        return `【${time || '未知时间'} · ${location}】

空气中弥漫着紧张的气息，周围的环境似乎在等待着什么发生。

【NPC反应】
*${chatName}微微皱眉，似乎在思考着什么*
"你刚才说的... 让我想想。"
（对方似乎对你的举动有些意外）

【状态变化】
- ${chatName}：关系 0 / 情绪变为疑惑

【行动选项】
① 继续说下去
② 换个话题
③ 观察周围环境
④ 自由行动`;
    }
}
