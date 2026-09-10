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
你必须严格按照以下格式回复用户，整体输出长度控制在 600-1200 字之间。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【场景标题】（用地点名或场景名作为标题，简洁有力）

【时间 · 天气 · 地点】（放在正文开头，融入场景描写）

【场景正文】（400-800 字，包含以下要素）
1. **环境描写**：用第三人称视角，详细描写当前环境的视觉、声音、气味、触感等感官细节
2. **关键感知**：玩家注意到的重要事物、人物、线索或异常
3. **NPC/事件变化**：根据玩家的行动，描写 NPC 的反应、对话和动作。用 *斜体星号* 包裹动作描写，用 "引号" 包裹对话
4. **冲突/推进**：本次行动带来的事件推进、新信息揭示、或冲突升级
5. **悬念铺垫**：在段落末尾留下新的疑问或悬念

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【当前状态】
生命：XXX/XXX｜金币：XXX｜等级：X｜装备：XXX、XXX、XXX
当前位置：XXX｜时间：XXX

【当前任务】
任务名称｜进度说明
【已知情报】
• 情报条目1
• 情报条目2
• 情报条目3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【你可以】
① 行动选项一（具体描述，有明确的行动方向和预期后果）
② 行动选项二
③ 行动选项三
④ 行动选项四
⑤ 行动选项五
⑥ 自由行动（输入你想做的任何事）

重要规则：
- 始终以角色身份回复，不要提及你是AI
- 用第三人称客观视角描写场景，用第二人称"你"指代玩家
- 场景要有画面感，像小说一样流畅生动
- 每次回复都要推进剧情，不能原地踏步
- 5 个具体选项要有不同的方向和后果
- 时间、地点、人物状态、已知情报必须前后一致
- 不要提到 AI、游戏、系统、玩家等元信息`;
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
                max_tokens: 4000,
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
            max_tokens: 4000
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
                max_tokens: 4000
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
    const time = worldState?.current_time || '第1日 · 白天';
    const weather = worldState?.weather || '晴朗';

    // Build NPC state summary
    let npcSummary = '';
    if (npcStates && npcStates.length > 0) {
        for (const npc of npcStates) {
            const npcName = npc.name || npc.npc_key || '未知NPC';
            npcSummary += `- ${npcName}：位置=${npc.location || '未知'}，情绪=${npc.mood || 'neutral'}，关系值=${npc.relationship || 0}，生命值=${npc.health || 100}\n`;
            if (npc.last_action) {
                npcSummary += `  上次行动：${npc.last_action}\n`;
            }
            if (npc.goals_json) {
                try {
                    const goals = JSON.parse(npc.goals_json);
                    if (Array.isArray(goals) && goals.length > 0) {
                        npcSummary += `  当前目标：${goals.join('、')}\n`;
                    }
                } catch {}
            }
        }
    } else {
        // Default: the character itself is the main NPC
        npcSummary = `- ${chatName}：位置=${location}，情绪=neutral，关系值=0，生命值=100\n`;
    }

    // Player state summary
    let playerSummary = '';
    let playerInv = [];
    let playerStats = {};
    let playerQuests = [];
    if (playerState) {
        playerInv = safeJsonParse(playerState.inventory_json, []);
        playerStats = safeJsonParse(playerState.stats_json, {});
        playerQuests = safeJsonParse(playerState.quests_json, []);
        playerSummary = `位置：${playerState.location || location}\n`;
        if (playerInv.length > 0) playerSummary += `物品：${playerInv.join(', ')}\n`;
        if (Object.keys(playerStats).length > 0) playerSummary += `属性：${JSON.stringify(playerStats)}\n`;
        if (playerQuests.length > 0) playerSummary += `任务：${playerQuests.join('、')}\n`;
    }

    const actionDesc = parsedAction?.content || '玩家进行了行动';
    const actionType = parsedAction?.action_type || 'other';
    const target = parsedAction?.target || '';

    const systemPrompt = `你是一个专业的 RPG 叙事引擎（Narrative Engine）。你的任务是根据角色设定、世界状态和玩家行动，生成一段沉浸式、高质量的 RPG 叙事回复。每次回复都是一个完整的场景片段，就像玩家在真正的 RPG 游戏中经历了一个"小章节"。

【角色设定】
角色名：${charName}
聊天名：${chatName}
${personality ? `性格：${personality}` : ''}
${scenario ? `场景设定：${scenario}` : ''}
${firstMessage ? `初始消息参考：${firstMessage}` : ''}

【当前世界状态】
地点：${location}
时间：${time}
天气：${weather}

【NPC 状态】
${npcSummary}
【玩家状态】
${playerSummary || '位置：' + location + '\n生命值：100/100\n金币：0\n等级：1'}
【玩家行动】
行动类型：${actionType}
${target ? `目标：${target}` : ''}
行动内容：${actionDesc}

【输出格式严格要求】
你必须严格按照以下结构输出，不要有任何额外内容或解释。整体输出长度控制在 600-1200 字之间。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【场景标题】（用地点名或场景名作为标题，简洁有力）

【时间 · 天气 · 地点】（放在正文开头，融入场景描写）

【场景正文】（400-800 字，包含以下要素）
1. **环境描写**：用第三人称视角，详细描写当前环境的视觉、声音、气味、触感等感官细节，营造沉浸感
2. **关键感知**：玩家注意到的重要事物、人物、线索或异常
3. **NPC/事件变化**：根据玩家的行动，描写 NPC 的反应、对话和动作。对话要自然，符合角色性格。用动作描写增强表现力（*动作*）
4. **冲突/推进**：本次行动带来的事件推进、新信息揭示、或冲突升级。要有事件的起伏，不能只是平淡的对话
5. **悬念铺垫**：在段落末尾留下新的疑问或悬念，激发探索欲望

写作要求：
- 用第三人称客观视角描写场景，用第二人称"你"指代玩家
- 场景要有画面感，像小说一样流畅生动
- NPC 的对话要符合其性格和身份
- 自然地融入时间流逝和环境变化
- 可以有多个 NPC 互动或环境事件

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【当前状态】
生命：XXX/XXX｜金币：XXX｜等级：X｜装备：XXX、XXX、XXX
当前位置：XXX｜时间：XXX

【当前任务】
任务名称｜进度说明
【已知情报】
• 情报条目1
• 情报条目2
• 情报条目3
（根据已有信息和本次行动获得的新情报整理，3-6条）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【你可以】
① 行动选项一（具体描述，有明确的行动方向和预期后果）
② 行动选项二
③ 行动选项三
④ 行动选项四
⑤ 行动选项五
⑥ 自由行动（输入你想做的任何事）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【重要规则】
1. **严格遵守格式**：必须包含场景标题、场景正文、当前状态、当前任务、已知情报、行动选项六个部分
2. **叙事质量**：场景描写要生动详细，有感官细节和画面感，不能干巴巴的
3. **事件推进**：每次回复都要推进剧情，不能原地踏步。玩家的每个行动都应该带来新的信息、新的变化或新的冲突
4. **角色一致性**：NPC 的性格、语气、行为必须符合角色设定，不能出戏
5. **选项有意义**：5 个具体选项要有不同的方向和后果，不能只是换个说法的同一个选项
6. **世界一致性**：时间、地点、人物状态、已知情报必须前后一致，不能矛盾
7. **沉浸感**：不要提到 AI、游戏、系统、玩家等元信息，要让玩家感觉真的身处那个世界
8. **长度控制**：整体 600-1200 字，场景正文占主要部分
9. **状态更新**：根据本次行动的结果，合理更新玩家状态、任务进度和已知情报
10. **自由行动**：第⑥项固定为"自由行动"，允许玩家输入任何内容

【示例参考】
场景标题：灰狼酒馆

第12日 · 黄昏 · 暴雨 · 灰狼酒馆

暴雨已经持续了一整天。你推开酒馆的橡木门，温暖的炉火和麦酒的气味扑面而来。大厅里坐着十几名旅人，湿透的斗篷挂在壁炉旁，几个佣兵正在低声谈论北方道路上的怪物。你扫视一圈，很快注意到壁炉旁那个独自饮酒的男人——深绿色斗篷，旧式长剑，靴子上还沾着黑森林的泥。

你走过去。他抬头看了你一眼，没有起身，只是指了指对面的椅子。「坐吧。如果你是准备去黑森林的，我劝你最好改变主意。三天前，一支商队在那里失踪了。我跟着他们留下的车辙找了半天，只找到六具马尸和一辆被撕开的货车。昨晚我又听见了狼嚎，但那不是狼——我在北境生活了二十年，从没听过那种声音。」

他端起酒杯，又补充道：「镇上的人都说是山里的兽人干的，可我不这么认为。兽人不会把尸体全部带走，也不会在树上留下那种符号。如果你真的要去，我可以带你到商队失踪的地方，但我要先知道，你为什么非去不可？」

你还没来得及回答，酒馆外突然传来急促的马蹄声。所有人都安静下来。酒馆老板走到门边，却没有打开门。壁炉旁的男人已经把手放在剑柄上。

「看来不用等到明天了。」他说。

当前状态：生命 100/100｜金币 36｜等级 2｜装备：铁剑、旧皮甲、火把、绳索
当前位置：灰狼酒馆｜时间：第12日 18:40

当前任务：调查黑森林失踪商队｜进度：刚抵达灰狼酒馆
已知情报：
• 三天前商队在黑森林失踪
• 现场只发现马尸和被撕裂的货车
• 夜里出现不明狼嚎，不同于普通狼群
• 现场发现异常符号，非兽人所为
• 神秘剑士愿意带路，但需要知道理由

你可以：
① 回答剑士的问题，说明你去黑森林的原因
② 询问他关于黑森林和异常符号的更多信息
③ 去查看酒馆外发生了什么
④ 先在酒馆打听其他消息
⑤ 放弃调查，离开酒馆
⑥ 自由行动`;

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
        return `【${location}】

${time} · ${weather} · ${location}

空气中弥漫着紧张的气息，周围的环境似乎在等待着什么发生。你能感觉到${chatName}的目光落在你身上，似乎在等待你的回应。

*${chatName}微微皱眉，似乎在思考着什么*
「你刚才说的... 让我想想。」
（对方似乎对你的举动有些意外）

当前状态：生命 100/100｜金币 0｜等级 1｜装备：无
当前位置：${location}｜时间：${time}

当前任务：探索当前场景
已知情报：
• 正在与 ${chatName} 对话
• 场景设定：${scenario ? scenario.slice(0, 50) + '...' : '待探索'}

你可以：
① 继续说下去
② 换个话题
③ 观察周围环境
④ 询问对方的身份
⑤ 离开这里
⑥ 自由行动`;
    }
}
