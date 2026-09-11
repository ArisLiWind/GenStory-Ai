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
每次回复严格按以下顺序，总长300-500字：

【当前状态】
生命：XX/XX｜金币：XX｜等级：X
当前位置：XX｜时间：XX

【当前任务】
任务名｜进度

【已知情报】
• 情报1
• 情报2

━━━

【场景标题】

（场景正文150-300字。*动作描写*，"对话"。第三人称，用"你"指代玩家。环境描写+NPC反应+事件推进+悬念。）

━━━

【你可以】
① 选项一
② 选项二
③ 选项三
④ 选项四
⑤ 选项五

铁律：
- 状态面板在最前，场景在中间，选项在最后
- 绝不说教、绝不给建议、绝不跳出角色
- 绝不提AI、游戏、系统
- 每次推进剧情，不原地踏步
- 5个选项方向各异
- 延续历史对话，不重置剧情
- 只输出5个选项，不要第6个"自由行动"选项
- 不要在选项后面加横线或分隔符`;

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
    if (keys.length === 0) {
        console.error('[LLM] No API keys found in database');
        throw new Error('未配置API密钥，请在后台管理中添加API Key');
    }

    console.log(`[LLM] Found ${keys.length} active key(s), trying in order...`);

    // Ensure messages don't start with assistant role (some APIs reject this)
    const cleanedMessages = messages.filter(m => m.content && m.content.trim());
    // If first message is from assistant, prepend a user message
    if (cleanedMessages.length > 0 && cleanedMessages[0].role === 'assistant') {
        cleanedMessages.unshift({ role: 'user', content: '(开始对话)' });
    }

    let lastError = null;
    for (const key of keys) {
        const keyLabel = `key#${key.id}(${key.provider}/${key.model || 'default'})`;
        try {
            const apiMessages = [
                { role: 'system', content: systemPrompt },
                ...cleanedMessages.map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content
                }))
            ];

            // Fix base_url: remove trailing slash, ensure no double slash
            let baseUrl = (key.base_url || 'https://api.openai.com/v1').trim();
            baseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
            const model = key.model || 'gpt-3.5-turbo';

            const url = `${baseUrl}/chat/completions`;
            console.log(`[LLM] Trying ${keyLabel}: ${url} model=${model}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key.api_key}`
                },
                body: JSON.stringify({
                    model,
                    messages: apiMessages,
                    temperature,
                    max_tokens: 1500,
                    presence_penalty: 0.3,
                    frequency_penalty: 0.3
                })
            });

            if (!response.ok) {
                const errBody = await response.text().catch(() => '');
                console.error(`[LLM] ${keyLabel} HTTP ${response.status}: ${errBody.substring(0, 500)}`);
                throw new Error(`API返回 ${response.status}: ${errBody.substring(0, 200) || 'Unknown error'}`);
            }

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content || '';

            if (!reply || !reply.trim()) {
                console.error(`[LLM] ${keyLabel} returned empty content`, JSON.stringify(data).substring(0, 500));
                throw new Error('API返回空内容');
            }

            console.log(`[LLM] ${keyLabel} success! Reply length: ${reply.length}`);

            await env.DB.prepare(`
                UPDATE api_keys SET usage_count = usage_count + 1, last_used_at = ?
                WHERE id = ?
            `).bind(Date.now(), key.id).run();

            return reply.trim();
        } catch (err) {
            console.error(`[LLM] ${keyLabel} failed:`, err.message);
            lastError = err;
            continue;
        }
    }
    throw lastError || new Error('所有API密钥均失败');
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

【输出格式】（严格按此顺序，总长300-500字）

【当前状态】
生命：XX/XX｜金币：XX｜等级：X
当前位置：XX｜时间：XX

【当前任务】
任务名｜进度

【已知情报】
• 情报1
• 情报2

━━━

【场景标题】

（场景正文150-300字。第三人称，用"你"指代玩家。*动作描写*，"对话"。环境描写+NPC反应+事件推进+悬念。不说教不出戏。）

━━━

【你可以】
① 选项一
② 选项二
③ 选项三
④ 选项四
⑤ 选项五

铁律：
- 状态面板在最前，场景在中间，选项在最后
- 300-500字，简短有力
- 绝不说教、绝不给建议、绝不提AI
- 推进剧情，不原地踏步
- 只输出5个选项，不要第6个
- 不要在选项后加横线或分隔符`;

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
// Prologue Generator — 前情提要
// ============================================

export async function generatePrologue(env, character) {
    const title = character.title || character.chat_name || character.chatName || '未知角色';
    const chatName = character.chat_name || character.chatName || title;
    const description = character.description || '';
    const personality = character.personality || '';
    const scenario = character.scenario || '';
    const firstMessage = character.first_message || character.firstMessage || '';

    const systemPrompt = `你是RPG叙事引擎。根据角色设定，生成前情提要，让玩家快速进入故事。

【角色】${title}（${chatName}）
【简介】${description}
【性格】${personality}
【场景】${scenario}
${firstMessage ? '【初始参考】' + firstMessage.slice(0, 300) : ''}

请生成前情提要，严格包含以下三个部分，每部分用【】标记：

【故事背景】
（80-150字。描述这个世界的基本设定、时代背景、关键势力或事件。营造氛围，让玩家身临其境。不要照搬角色简介，要扩展世界观。）

【你的身份】
（50-100字。描述玩家在这个故事中的身份、处境、与角色的关系。用"你"指代玩家。让玩家明确自己是谁。）

【历险目标】
（50-100字。描述玩家需要达成的目标或面临的挑战。给出明确的方向感和紧迫感。）

铁律：
- 绝不说教、绝不给现实建议
- 绝不提AI、游戏、系统
- 用小说化语言，沉浸感强
- 不包含选项、不包含状态面板
- 直接输出三个部分，不加开头寒暄
- 总长200-350字`;

    try {
        const result = await callLLMWithPrompt(env, systemPrompt, [{ role: 'user', content: '请生成前情提要。' }], 0.9);
        return result;
    } catch (err) {
        console.error('[Prologue] LLM failed, constructing fallback:', err.message);
        // Fallback: construct a basic prologue from character data
        let fallback = '';
        fallback += `【故事背景】\n${scenario || description || '一个充满未知与冒险的世界正在展开。'}\n\n`;
        fallback += `【你的身份】\n你是一个踏入这段旅程的旅人，与${chatName}的命运交织在一起。\n\n`;
        fallback += `【历险目标】\n探索这个世界，了解${chatName}的秘密，在冒险中做出你的选择。`;
        return fallback;
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
