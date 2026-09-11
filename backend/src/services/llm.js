// ============================================
// LLM Service - Multi-key rotation with RPG support
// ============================================

// Load active API keys from database
async function loadKeys(env) {
    const result = await env.DB.prepare(`
        SELECT * FROM api_keys
        WHERE is_active = 1
        ORDER BY priority ASC, id ASC
    `).all();
    return result.results || [];
}

// Build system prompt based on character data
function buildSystemPrompt(character) {
    const title = character.title || character.chat_name || character.chatName || '未知角色';
    const chatName = character.chat_name || character.chatName || title;
    const description = character.description || '';
    const personality = character.personality || '';
    const scenario = character.scenario || '';
    const firstMessage = character.first_message || character.firstMessage || '';
    const exampleDialog = character.example_dialogue || character.exampleDialogue || '';

    let prompt = `你是一个角色扮演AI。你将扮演"${title}"。

【角色】${title}（${chatName}）
【简介】${description}
【性格】${personality}
【场景】${scenario}

`;

    if (firstMessage) {
        prompt += `【初始消息参考】${firstMessage}\n\n`;
    }

    if (exampleDialog) {
        prompt += `【示范对话】\n${exampleDialog}\n\n`;
    }

    prompt += `【RPG回复格式】
每次回复必须包含以下部分，总长度 400-600 字：

【当前状态】
生命：XXX/XXX｜金币：XXX｜等级：X｜装备：XXX
当前位置：XXX｜时间：XXX

【当前任务】
任务名称｜进度

【已知情报】
• 情报1
• 情报2
• 情报3

━━━━━━━━━━━━

【场景标题】（简洁的地点或场景名）

（场景正文 200-400 字：环境描写、NPC反应、事件推进、悬念。用*斜体*写动作，用"引号"写对话。第三人称视角，用"你"指代玩家。像小说一样生动。）

━━━━━━━━━━━━

【你可以】
① 选项一
② 选项二
③ 选项三
④ 选项四
⑤ 选项五

重要规则：
- 状态面板在最前面，场景在中间，选项在最后
- 不要说教、不要给人生建议、不要跳出角色
- 不要提到AI、游戏、系统等元信息
- 每次回复都要推进剧情
- 选项要有不同方向，不能换汤不换药
- 历史对话是已发生的事实，延续剧情不断重置`;

    return prompt;
}

function safeJsonParse(str, defaultValue) {
    try { return JSON.parse(str); } catch { return defaultValue; }
}

// Call LLM API — tries all available keys in sequence
export async function callLLM(env, character, messages) {
    const systemPrompt = buildSystemPrompt(character);
    return callLLMWithPrompt(env, systemPrompt, messages, 0.8);
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
                    max_tokens: 2000,
                    presence_penalty: 0.3,
                    frequency_penalty: 0.3
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
// RPG Narrative Engine (simplified)
// ============================================

export async function generateNarrative(env, character, worldState, npcStates, playerState, parsedAction, history) {
    const charName = character.title || character.chat_name || '未知角色';
    const chatName = character.chat_name || charName;
    const personality = character.personality || '';
    const scenario = character.scenario || '';
    const firstMessage = character.first_message || '';

    const location = worldState?.current_location || '初始场景';
    const time = worldState?.current_time || '白天';
    const weather = worldState?.weather || '晴朗';

    // Build NPC state summary (compact)
    let npcSummary = '';
    if (npcStates && npcStates.length > 0) {
        for (const npc of npcStates) {
            const npcName = npc.name || npc.npc_key || 'NPC';
            npcSummary += `${npcName}(情绪:${npc.mood || 'neutral'},关系:${npc.relationship || 0}) `;
        }
    } else {
        npcSummary = `${chatName}(情绪:neutral,关系:0)`;
    }

    // Player state (compact)
    let playerSummary = '生命100/100 金币0 等级1';
    if (playerState) {
        const inv = safeJsonParse(playerState.inventory_json, []);
        const quests = safeJsonParse(playerState.quests_json, []);
        let parts = ['生命100/100'];
        if (inv.length > 0) parts.push('物品:' + inv.join(','));
        if (quests.length > 0) parts.push('任务:' + quests.join(','));
        playerSummary = parts.join(' ');
    }

    const actionDesc = parsedAction?.content || '玩家行动';

    const systemPrompt = `你是RPG叙事引擎。根据角色设定和玩家行动，生成沉浸式RPG回复。

【角色】${charName}（${chatName}）
${personality ? '性格：' + personality : ''}
${scenario ? '场景：' + scenario : ''}
${firstMessage ? '初始参考：' + firstMessage.slice(0, 200) : ''}

【当前状态】
地点：${location}｜时间：${time}｜天气：${weather}
NPC：${npcSummary}
玩家：${playerSummary}

【玩家行动】${actionDesc}

【输出格式】（严格按此顺序，总长400-600字）

【当前状态】
生命：XXX/XXX｜金币：XXX｜等级：X｜装备：XXX
当前位置：XXX｜时间：XXX

【当前任务】
任务名称｜进度

【已知情报】
• 情报1
• 情报2
• 情报3

━━━━━━━━━━━━

【场景标题】

（场景正文200-400字。第三人称，用"你"指代玩家。*动作描写*，"对话"。要有环境描写、NPC反应、事件推进、悬念。不要说教不要给建议。）

━━━━━━━━━━━━

【你可以】
① 选项一
② 选项二
③ 选项三
④ 选项四
⑤ 选项五

规则：
- 状态面板在最前，场景在中间，选项在最后
- 400-600字，不要写太长
- 不说教、不出戏、不提AI
- 推进剧情，不原地踏步
- 5个选项要有不同方向`;

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
        throw err;
    }
}

// ============================================
// Action Parser (kept for compatibility but simplified)
// ============================================

export async function parseAction(env, userMessage, character, worldState) {
    // Simplified: just return the raw input as action
    return {
        action_type: 'other',
        target: '',
        content: userMessage,
        intent: '',
        expected_effects: []
    };
}

function extractJson(text) {
    if (!text) return '{}';
    try {
        JSON.parse(text);
        return text;
    } catch {}
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match) return match[1].trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return text.slice(firstBrace, lastBrace + 1);
    }
    return '{}';
}
