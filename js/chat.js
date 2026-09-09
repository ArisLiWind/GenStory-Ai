// ===== Chat Page - GenSphere RPG =====

let currentCharacter = null;
let currentSessionId = null;
let messages = [];
let isSending = false;
let charInfoExpanded = false;

// RPG World State
let worldState = {
    time: '',
    location: '',
    weather: ''
};
let currentActionOptions = [];

// Mock character data (fallback when backend is empty)
const MOCK_CHARACTERS = [
    {
        id: 1,
        title: 'Mafia Boss',
        chatName: 'Vincent',
        description: '冷酷无情的黑手党家族老大，在地下世界拥有极高的威望和权力。',
        personality: '你是一位冷酷无情的黑手党老大，在地下世界拥有极高的威望和权力。你行事果断，从不拖泥带水，对敌人毫不留情。然而在你冰冷的外表下，隐藏着一段不为人知的过去。你说话低沉有力，简洁而有分量，从不废话。你喜欢掌控局面，享受权力带来的快感。',
        scenario: '你掌握了一些关于他敌对势力的情报，这些情报可能会影响到整个地下世界的格局。他得知了这个消息，派人把你"请"到了他的地盘。现在你正坐在他的办公室里，面对这位传说中的黑手党老大...',
        firstMessage: '*他坐在真皮办公椅上，手指轻轻敲击着桌面，冰冷的目光透过烟雾注视着你*\n\n"说吧，你到底知道多少？关于我那些\'老朋友\'的事。"*他的声音低沉而平静，却带着不容置疑的威胁*',
        exampleDialogue: '"你以为你能轻易逃脱我的手掌心吗？"他缓缓走近，冰冷的目光让你不寒而栗。\n"说吧，你到底知道多少？关于我那些\'老朋友\'的事。"他坐在办公椅上，手指轻轻敲击着桌面。\n"别跟我玩花样，你应该知道和我作对的下场。"他的语气平静却带着不容置疑的威胁。',
        image: 'assets/char-knight.jpg',
        creator: '星河入梦',
        verified: true,
        tags: ['黑手党', '暗黑', '权力', '反派'],
        categories: ['male', 'oc', 'fantasy', 'drama'],
        views: 128500,
        chats: 25680,
        tokens: 786,
        rating: 4.9
    },
    {
        id: 2,
        title: '仙界剑尊',
        chatName: '剑尊',
        description: '万剑归宗，一剑破万法。修仙界最年轻的剑尊，传说中的剑道天才。',
        personality: '你是修仙界最年轻的剑尊，剑道天赋无人能及。你性格孤傲，说话简洁，不喜欢废话。虽然表面冷漠，但内心有自己的坚持和道义。你对剑道有着极致的追求，视剑如命。',
        scenario: '你在宗门大比上意外得罪了某位长老的弟子，被诬陷为魔族奸细。就在你即将被废去修为的时候，剑尊突然现身...',
        firstMessage: '*他脚踏长剑凌空而立，白衣胜雪，长发随风飘舞，周身剑气纵横*\n\n"聒噪。"*只是两个字，便让全场鸦雀无声*\n*他的目光落在你身上，清冷如月*\n"你，随我来。"',
        exampleDialogue: '"道不同，不相为谋。"他转过身去，背影孤傲。\n"剑，乃心之延伸。心不正，剑必斜。"他轻轻抚摸着剑刃。\n"三千大道，吾只取一剑。"',
        image: 'assets/char-mystic.jpg',
        creator: '剑道传人',
        verified: false,
        tags: ['修仙', '剑修', '高冷', '天才'],
        categories: ['xianxia', 'male', 'fantasy'],
        views: 95200,
        chats: 18450,
        tokens: 650,
        rating: 4.8
    },
    {
        id: 3,
        title: '赛博朋克：霓虹猎人',
        chatName: 'V',
        description: '夜之城的传奇雇佣兵，在霓虹与阴影之间游走的独行侠。',
        personality: '你是夜之城的传奇雇佣兵，人称"霓虹猎人"。你玩世不恭，嘴炮一流，但关键时刻非常可靠。你见惯了夜之城的黑暗和堕落，但内心深处仍保留着一丝正义感。你喜欢用黑色幽默来化解尴尬局面。',
        scenario: '你刚刚完成了一笔大生意，正准备去Afterlife喝一杯庆祝。但你发现有人在跟踪你——不是普通的混混，而是荒坂公司的特工。看来你上一个任务动了某些人的蛋糕...',
        firstMessage: '*你靠在霓虹灯闪烁的墙上，点燃了一支烟，看着雨中的夜之城*\n\n"嘿，菜鸟，盯着我看很久了。"*你头也不回地说道*\n"出来吧，躲躲藏藏的，一点都不专业。"*你转过身，嘴角挂着一抹玩世不恭的笑容*',
        exampleDialogue: '"欢迎来到夜之城，梦想成真的地方。"他嘲讽地笑了笑，"当然，前提是你能活到那一天。"\n"在这个城市，信任是最昂贵的奢侈品。"他弹了弹烟灰。\n"有人付钱让我杀你... 但我有个更好的提议。"',
        image: 'assets/char-new-01.jpg',
        creator: 'NightCityFan',
        verified: true,
        tags: ['赛博朋克', '雇佣兵', '夜之城', '科幻'],
        categories: ['cyberpunk', 'scifi', 'male', 'modern'],
        views: 87600,
        chats: 15230,
        tokens: 820,
        rating: 4.7
    }
];

document.addEventListener('DOMContentLoaded', () => {
    initChatPage();
});

async function initChatPage() {
    const params = new URLSearchParams(window.location.search);
    const characterId = params.get('character');
    
    if (characterId) {
        await loadCharacterData(characterId);
    } else {
        // No character specified
        const basePath = window.location.pathname.replace(/[^/]*$/, '');
        window.location.href = basePath + 'index.html';
        return;
    }
    
    setupEventListeners();
}

function setupEventListeners() {
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        chatInput.addEventListener('input', autoResizeTextarea);
    }
}

// ===== Navigation =====
window.goBack = function() {
    const basePath = window.location.pathname.replace(/[^/]*$/, '');
    if (currentCharacter && currentCharacter.id) {
        window.location.href = basePath + 'character.html?id=' + encodeURIComponent(currentCharacter.id);
    } else {
        window.location.href = basePath + 'index.html';
    }
};

window.toggleCharacterInfo = function() {
    const panel = document.getElementById('charInfoPanel');
    if (!panel) return;
    charInfoExpanded = !charInfoExpanded;
    
    if (charInfoExpanded) {
        panel.style.display = 'block';
        setTimeout(() => { panel.style.maxHeight = '400px'; }, 10);
    } else {
        panel.style.maxHeight = '0';
        setTimeout(() => { panel.style.display = 'none'; }, 300);
    }
};

// ===== Character Loading =====
async function loadCharacterData(characterId) {
    const result = await GenSphereAPI.characters.getDetail(characterId);

    if (result.code === 0 && result.data) {
        currentCharacter = normalizeCharacter(result.data);
        renderCharacterInfo();
        startChatSession();
        return;
    }

    // 后端加载失败时 fallback 到 mock 数据
    const mockChar = MOCK_CHARACTERS.find(c => String(c.id) === String(characterId)) || MOCK_CHARACTERS[0];
    if (mockChar) {
        currentCharacter = normalizeCharacter(mockChar);
        renderCharacterInfo();
        startMockChatSession();
        return;
    }

    const messagesContainer = document.getElementById('messagesList');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:#888;">
                <h3 style="color:#fff;margin-bottom:8px;">角色加载失败</h3>
                <p>${escapeHtml(result.message || '角色不存在或未发布')}</p>
            </div>
        `;
    }
}

function renderCharacterInfo() {
    // Update header
    const headerName = document.getElementById('headerCharName');
    if (headerName) headerName.textContent = currentCharacter.chatName || currentCharacter.title;

    // Update character info panel
    const panelName = document.getElementById('panelCharName');
    const panelDesc = document.getElementById('panelCharDesc');
    const panelAvatar = document.getElementById('panelAvatar');

    if (panelName) panelName.textContent = currentCharacter.chatName || currentCharacter.title;
    if (panelDesc) {
        let desc = currentCharacter.description || '';
        if (currentCharacter.personality) desc += '\n性格：' + currentCharacter.personality;
        if (currentCharacter.scenario) desc += '\n场景：' + currentCharacter.scenario;
        panelDesc.textContent = desc;
    }
    if (panelAvatar && currentCharacter.image) {
        panelAvatar.src = currentCharacter.image;
        panelAvatar.style.display = 'block';
    }
}

// Mock chat session (fallback when backend is empty)
async function startMockChatSession() {
    if (!currentCharacter?.firstMessage) return;

    // Initialize RPG world state
    initWorldState();

    messages = [{
        id: 'm_first',
        role: 'bot',
        name: currentCharacter.chatName || currentCharacter.title,
        content: currentCharacter.firstMessage,
        timestamp: Date.now(),
        verified: false
    }];

    renderMessages();

    // Parse first message for RPG data
    const firstMsg = messages[0];
    const rpgData = parseRpgMessage(firstMsg.content);
    if (rpgData?.isRpg) {
        if (rpgData.worldState) updateWorldState(rpgData.worldState);
        if (rpgData.actionOptions?.length > 0) {
            updateActionOptions(rpgData.actionOptions);
        }
    }

    scrollToBottom();
}

function normalizeCharacter(char) {
    return {
        ...char,
        chatName: char.chatName || char.chat_name || char.title,
        firstMessage: char.firstMessage || char.first_message || '你好...',
        exampleDialogue: char.exampleDialogue || char.example_dialogue || ''
    };
}

// ===== RPG World State =====
function initWorldState() {
    // Try to extract world state from scenario
    if (currentCharacter?.scenario) {
        const scenario = currentCharacter.scenario;
        // Try to find location hints
        const locMatch = scenario.match(/在([^，。,.\s]+的?[^，。,.\s]*[地馆房间殿洞村城山林海]+)/);
        if (locMatch) {
            worldState.location = locMatch[1].replace(/^在/, '');
        }
    }

    // Default values if not set
    if (!worldState.time) worldState.time = '白天';
    if (!worldState.location) worldState.location = '未知之地';
    if (!worldState.weather) worldState.weather = '晴朗';

    updateWorldStateBar();
}

function updateWorldState(newState) {
    if (!newState) return;
    if (newState.time) worldState.time = newState.time;
    if (newState.location) worldState.location = newState.location;
    if (newState.weather) worldState.weather = newState.weather;
    updateWorldStateBar();
}

function updateWorldStateBar() {
    const bar = document.getElementById('worldStateBar');
    if (!bar) return;

    if (worldState.time || worldState.location || worldState.weather) {
        bar.style.display = 'block';
        const timeEl = document.getElementById('worldStateTime');
        const locEl = document.getElementById('worldStateLocation');
        const weatherEl = document.getElementById('worldStateWeather');
        if (timeEl) timeEl.textContent = worldState.time || '未知';
        if (locEl) locEl.textContent = worldState.location || '未知';
        if (weatherEl) weatherEl.textContent = worldState.weather || '未知';
    }
}

// ===== RPG Message Parsing =====
function parseRpgMessage(content) {
    if (!content) return null;

    const result = {
        isRpg: false,
        worldState: null,
        sceneDesc: '',
        npcReaction: '',
        statusChanges: [],
        actionOptions: [],
        rawContent: content
    };

    let text = content.trim();

    // ===== 1. Parse header: 【时间·地点】 =====
    const headerMatch = text.match(/^【([^】·]+)[·\s]+([^】]+)】/);
    if (headerMatch) {
        result.isRpg = true;
        result.worldState = {
            time: headerMatch[1].trim(),
            location: headerMatch[2].trim(),
            weather: null
        };
        text = text.substring(headerMatch[0].length).trim();
    }

    // ===== 2. Parse sections by 【section name】 markers =====
    const sections = {};
    const sectionRegex = /【([^】]+)】/g;
    const sectionPositions = [];
    let match;
    while ((match = sectionRegex.exec(text)) !== null) {
        sectionPositions.push({
            name: match[1].trim(),
            start: match.index,
            end: match.index + match[0].length
        });
    }

    for (let i = 0; i < sectionPositions.length; i++) {
        const sec = sectionPositions[i];
        const nextStart = i < sectionPositions.length - 1
            ? sectionPositions[i + 1].start
            : text.length;
        const content = text.substring(sec.end, nextStart).trim();
        sections[sec.name] = content;
    }

    // Extract scene description
    if (sections['场景']) {
        result.isRpg = true;
        result.sceneDesc = sections['场景'];
    }

    // Extract NPC reaction
    const npcKeys = ['NPC反应', 'NPC 反应', 'npc反应'];
    for (const key of npcKeys) {
        if (sections[key]) {
            result.isRpg = true;
            result.npcReaction = sections[key];
            break;
        }
    }

    // Extract status changes
    const statusKeys = ['状态变化', '状态', '角色状态更新'];
    for (const key of statusKeys) {
        if (sections[key]) {
            result.isRpg = true;
            const statusText = sections[key];
            const lines = statusText.split('\n').map(s => s.trim()).filter(s => s);
            const changes = [];
            for (const line of lines) {
                // Remove leading bullet markers
                const cleaned = line.replace(/^[-•▪▸►]\s*/, '').trim();
                if (cleaned) changes.push(cleaned);
            }
            result.statusChanges = changes.length > 0 ? changes : lines;
            break;
        }
    }

    // Extract action options
    const optionKeys = ['行动选项', '选项', '任务分支'];
    for (const key of optionKeys) {
        if (sections[key]) {
            result.isRpg = true;
            const optionsText = sections[key];
            result.actionOptions = parseOptionsText(optionsText);
            break;
        }
    }

    // ===== 3. If no sections found, check end-of-text options =====
    if (result.actionOptions.length === 0) {
        const opts = parseOptionsFromEnd(text);
        if (opts.length >= 2) {
            result.isRpg = true;
            result.actionOptions = opts;
            // Remove options from text
            const lastOptionIdx = findLastOptionStart(text);
            if (lastOptionIdx > 0) {
                text = text.substring(0, lastOptionIdx).trim();
            }
        }
    }

    // ===== 4. Fill remaining content =====
    // If we have NPC reaction but no scene desc,
    // the content before the first section might be scene desc
    if (!result.sceneDesc && sectionPositions.length > 0) {
        const beforeFirst = text.substring(0, sectionPositions[0].start).trim();
        if (beforeFirst) {
            result.sceneDesc = beforeFirst;
        }
    }

    // If no NPC reaction found, all remaining text is NPC reaction
    if (!result.npcReaction) {
        // Get text that's not in any recognized section
        let remaining = text;
        // Remove all section markers and their content
        for (const key of Object.keys(sections)) {
            const lowerKey = key.toLowerCase();
            if (['场景', 'npc反应', 'npc 反应', '状态变化', '状态', '角色状态更新', '行动选项', '选项', '任务分支']
                .some(k => lowerKey.includes(k.toLowerCase()))) {
                // This section was already extracted
            }
        }
        // Simpler: if we have section positions but no NPC reaction,
        // use the text between sections as NPC reaction
        if (sectionPositions.length > 0) {
            // Try to find unrecognized content between sections
            let npcContent = '';
            for (let i = 0; i < sectionPositions.length; i++) {
                const secName = sectionPositions[i].name;
                const isKnown = ['场景', 'NPC反应', 'NPC 反应', '状态变化', '状态', '角色状态更新', '行动选项', '选项', '任务分支']
                    .some(k => secName.includes(k) || k.includes(secName));
                if (!isKnown && sections[secName]) {
                    npcContent += (npcContent ? '\n' : '') + sections[secName];
                }
            }
            if (npcContent) {
                result.npcReaction = npcContent.trim();
            }
        }
        // If still nothing, use all text
        if (!result.npcReaction && text.trim()) {
            result.npcReaction = text.trim();
        }
    }

    // ===== 5. Fallback: detect RPG-style from formatting =====
    if (!result.isRpg && content) {
        const hasActions = /\*[^*]+\*/.test(content);
        const hasDialogue = /"[^"]+"/.test(content);
        if (hasActions && hasDialogue) {
            result.isRpg = true;
            result.npcReaction = content;
        }
    }

    return result;
}

// Helper: parse options from text with ①②③ or 1. 2. numbering
function parseOptionsText(optionsText) {
    const options = [];
    const circled = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

    // Try circled numbers first
    let foundAny = false;
    for (let i = 0; i < circled.length; i++) {
        const num = circled[i];
        if (optionsText.indexOf(num) === -1) continue;
        foundAny = true;
        const startIdx = optionsText.indexOf(num) + num.length;
        let endIdx = optionsText.length;
        for (let j = i + 1; j < circled.length; j++) {
            const nextIdx = optionsText.indexOf(circled[j], startIdx);
            if (nextIdx !== -1) {
                endIdx = nextIdx;
                break;
            }
        }
        const optText = optionsText.substring(startIdx, endIdx).trim()
            .replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        if (optText && optText !== '自由行动') {
            options.push(optText);
        }
    }

    // If no circled numbers, try numbered list
    if (!foundAny) {
        const lines = optionsText.split('\n').map(l => l.trim()).filter(l => l);
        for (const line of lines) {
            const numMatch = line.match(/^\d+[\.、]\s*(.+)/);
            if (numMatch) {
                const opt = numMatch[1].trim();
                if (opt && opt !== '自由行动') {
                    options.push(opt);
                }
            }
        }
    }

    return options;
}

// Helper: find options at end of text
function parseOptionsFromEnd(text) {
    const circled = ['①', '②', '③', '④', '⑤'];
    const lines = text.split('\n').reverse();
    const optionLines = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            if (optionLines.length > 0) break;
            continue;
        }
        // Check if it starts with circled number
        let isOption = false;
        for (const num of circled) {
            if (trimmed.startsWith(num)) {
                isOption = true;
                break;
            }
        }
        // Or numbered list
        if (!isOption && /^\d+[\.、]/.test(trimmed)) {
            isOption = true;
        }
        if (isOption) {
            optionLines.unshift(trimmed);
        } else if (optionLines.length > 0) {
            break;
        }
    }

    if (optionLines.length < 2) return [];

    const options = [];
    for (const line of optionLines) {
        let cleaned = line;
        // Remove circled number
        for (const num of circled) {
            if (cleaned.startsWith(num)) {
                cleaned = cleaned.substring(num.length).trim();
                break;
            }
        }
        // Remove numbered list prefix
        cleaned = cleaned.replace(/^\d+[\.、]\s*/, '').trim();
        if (cleaned && cleaned !== '自由行动') {
            options.push(cleaned);
        }
    }
    return options;
}

function findLastOptionStart(text) {
    const circled = ['①', '②', '③', '④', '⑤'];
    const lines = text.split('\n');
    let startIdx = -1;
    let inOptions = false;

    for (let i = lines.length - 1; i >= 0; i--) {
        const trimmed = lines[i].trim();
        if (!trimmed) {
            if (inOptions) {
                startIdx = i + 1;
                break;
            }
            continue;
        }
        let isOption = false;
        for (const num of circled) {
            if (trimmed.startsWith(num)) { isOption = true; break; }
        }
        if (!isOption && /^\d+[\.、]/.test(trimmed)) isOption = true;

        if (isOption) {
            inOptions = true;
            startIdx = i;
        } else if (inOptions) {
            startIdx = i + 1;
            break;
        }
    }

    if (startIdx === -1) return -1;
    // Calculate character index
    let charIdx = 0;
    for (let i = 0; i < startIdx; i++) {
        charIdx += lines[i].length + 1; // +1 for newline
    }
    return charIdx;
}

// ===== RPG Action Options =====
function updateActionOptions(options) {
    currentActionOptions = options || [];
    const container = document.getElementById('actionOptions');
    const buttonsEl = document.getElementById('actionButtons');
    if (!container || !buttonsEl) return;

    if (currentActionOptions.length > 0) {
        container.style.display = 'block';
        buttonsEl.innerHTML = currentActionOptions.map((opt, i) => {
            const num = i + 1;
            return `
                <button class="rpg-action-pill" onclick="selectActionOption(${i})" data-index="${i}">
                    <span class="rpg-action-num">${num}</span>
                    <span class="rpg-action-text">${escapeHtml(opt)}</span>
                </button>
            `;
        }).join('');
    } else {
        container.style.display = 'none';
    }
}

window.selectActionOption = function(index) {
    const option = currentActionOptions[index];
    if (!option || isSending) return;

    const input = document.getElementById('chatInput');
    if (input) {
        input.value = option;
        input.focus();
        autoResizeTextarea();
    }
    // Auto-send the selected option
    sendMessage();
};

async function startChatSession() {
    // Initialize RPG world state (from character scenario as baseline)
    initWorldState();

    // Show loading state
    const messagesContainer = document.getElementById('messagesList');
    if (messagesContainer) {
        messagesContainer.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">正在连接AI服务...</div>';
    }
    
    // Try to use real API session - pass full character data
    try {
        const result = await GenSphereAPI.chat.createSession(currentCharacter.id, currentCharacter);
        
        if (result && result.code === 0 && result.data) {
            currentSessionId = result.data.sessionId || result.data.id;

            // If session has world_state, use it
            if (result.data.worldState || result.data.world_state) {
                const ws = result.data.worldState || result.data.world_state;
                updateWorldState(ws);
            }
            
            // If session returned messages, use them
            if (result.data.messages && result.data.messages.length > 0) {
                messages = result.data.messages.map((m, i) => ({
                    id: 'msg_' + i,
                    role: m.role === 'assistant' ? 'bot' : 'user',
                    name: m.role === 'assistant' ? (currentCharacter.chatName || currentCharacter.title) : '我',
                    content: m.content,
                    timestamp: m.created_at || Date.now(),
                    verified: false
                }));
            }
            
            // If no messages, use character's first message
            if (messages.length === 0 && currentCharacter.firstMessage) {
                messages = [{
                    id: 'm_first',
                    role: 'bot',
                    name: currentCharacter.chatName || currentCharacter.title,
                    content: currentCharacter.firstMessage,
                    timestamp: Date.now(),
                    verified: false
                }];
            }
            
            renderMessages();

            // Parse last bot message for RPG data (action options, etc.)
            const lastBotMsg = [...messages].reverse().find(m => m.role === 'bot');
            if (lastBotMsg) {
                const rpgData = parseRpgMessage(lastBotMsg.content);
                if (rpgData?.isRpg) {
                    if (rpgData.worldState) updateWorldState(rpgData.worldState);
                    if (rpgData.actionOptions?.length > 0) {
                        updateActionOptions(rpgData.actionOptions);
                    }
                }
            }
        } else {
            throw new Error(result?.message || 'Failed to create session');
        }
    } catch (error) {
        console.error('Session creation failed:', error);
        
        // Backend not available - show error, NO mock responses
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div style="text-align:center;padding:60px 20px;">
                    <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
                    <h3 style="color:#fff;margin-bottom:8px;">AI服务未连接</h3>
                    <p style="color:#888;font-size:14px;line-height:1.6;max-width:400px;margin:0 auto;">
                        后端API服务尚未部署或未配置API密钥。<br>
                        管理员请在 <a href="admin.html" style="color:#818cf8;">管理后台</a> 配置DeepSeek API密钥后重试。
                    </p>
                </div>
            `;
        }
        
        // Still show the first message for preview
        if (currentCharacter.firstMessage) {
            messages = [{
                id: 'm_first',
                role: 'bot',
                name: currentCharacter.chatName || currentCharacter.title,
                content: currentCharacter.firstMessage,
                timestamp: Date.now(),
                verified: false
            }];
            renderMessages();
        }
    }
}

function renderMessages() {
    const messagesContainer = document.getElementById('messagesList');
    if (!messagesContainer) return;
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = '';
        return;
    }
    
    messagesContainer.innerHTML = messages.map(msg => renderMessage(msg)).join('');
    
    // Scroll to bottom
    const msgArea = document.querySelector('.messages-area');
    if (msgArea) {
        msgArea.scrollTop = msgArea.scrollHeight;
    }
}

function renderMessage(msg) {
    const isUser = msg.role === 'user';
    const avatarText = isUser ? '我' : (msg.name || '角色').charAt(0).toUpperCase();
    const rpgData = parseRpgMessage(msg.content);
    const isRpg = rpgData?.isRpg && !isUser;

    // User message - always simple style
    if (isUser) {
        return `
            <div class="message user rpg-user-turn" data-msg-id="${msg.id}">
                <div class="message-avatar">${avatarText}</div>
                <div class="message-content">
                    <div class="rpg-user-action">
                        <span class="rpg-user-label">你的行动</span>
                        <div class="rpg-user-text">${formatMessage(msg.content)}</div>
                    </div>
                    <div class="message-actions">
                        <button class="message-action-btn" title="编辑" onclick="editMessage('${msg.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="message-action-btn" title="删除" onclick="deleteMessage('${msg.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Bot message - RPG style if detected
    if (isRpg) {
        return renderRpgBotMessage(msg, rpgData, avatarText);
    }

    // Bot message - classic bubble style (fallback)
    return `
        <div class="message bot" data-msg-id="${msg.id}">
            <div class="message-avatar">${avatarText}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-name">${escapeHtml(msg.name)}</span>
                </div>
                <div class="message-bubble">${formatMessage(msg.content)}</div>
                <div class="message-actions">
                    <button class="message-action-btn" title="重新生成" onclick="regenerateMessage('${msg.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23 4 23 10 17 10"/>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                    </button>
                    <button class="message-action-btn" title="复制" onclick="copyMessage('${msg.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                    <button class="message-action-btn" title="删除" onclick="deleteMessage('${msg.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderRpgBotMessage(msg, rpgData, avatarText) {
    const sceneDesc = rpgData.sceneDesc || '';
    const npcReaction = rpgData.npcReaction || '';
    const statusChanges = rpgData.statusChanges || [];

    let bodyHtml = '';

    // Scene description
    if (sceneDesc) {
        bodyHtml += `
            <div class="rpg-scene-desc">
                ${formatRpgText(sceneDesc)}
            </div>
        `;
    }

    // NPC reaction (action + dialogue)
    if (npcReaction) {
        bodyHtml += `
            <div class="rpg-npc-reaction">
                <div class="rpg-npc-name">${escapeHtml(msg.name)}</div>
                <div class="rpg-npc-text">${formatRpgText(npcReaction)}</div>
            </div>
        `;
    }

    // Status changes as badges
    if (statusChanges.length > 0) {
        bodyHtml += `
            <div class="rpg-status-changes">
                ${statusChanges.map(change => `
                    <span class="rpg-status-badge">${escapeHtml(change)}</span>
                `).join('')}
            </div>
        `;
    }

    // Turn divider
    bodyHtml += `<div class="rpg-turn-divider"><span>— 回合结束 —</span></div>`;

    return `
        <div class="message bot rpg-turn" data-msg-id="${msg.id}">
            <div class="message-avatar">${avatarText}</div>
            <div class="message-content">
                <div class="rpg-turn-body">
                    ${bodyHtml}
                </div>
                <div class="message-actions">
                    <button class="message-action-btn" title="重新生成" onclick="regenerateMessage('${msg.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23 4 23 10 17 10"/>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                    </button>
                    <button class="message-action-btn" title="复制" onclick="copyMessage('${msg.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                    <button class="message-action-btn" title="删除" onclick="deleteMessage('${msg.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Format RPG text (actions + dialogue)
function formatRpgText(text) {
    if (!text) return '';
    
    let html = escapeHtml(text);
    
    // Format bold **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Format dialogue: "text" -> quoted style (do this BEFORE action formatting,
    // before any HTML class attributes with quotes are introduced)
    html = html.replace(/"([^"]+)"/g, '<span class="rpg-dialogue">"$1"</span>');
    
    // Format action descriptions: *action* -> italic action style
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em class="rpg-action-text">$1</em>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
}

// ===== Markdown Formatting =====
function formatMessage(text) {
    if (!text) return '';
    
    // Escape HTML first
    let html = escapeHtml(text);
    
    // Format bold **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Format italic *text* (but not ** which is bold)
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    
    // Format line breaks
    html = html.replace(/\n/g, '<br>');
    
    // Parse RPG choices (1. 2. 3. at end of message)
    const choiceRegex = /(?:^|\n)((?:\d+\.\s+\*\*[^<]+?\*\*(?:<br>|$))+)/g;
    html = html.replace(choiceRegex, (match, choices) => {
        const choiceItems = choices.split(/\n?\d+\.\s+/).filter(s => s.trim());
        if (choiceItems.length === 0) return match;
        
        const buttons = choiceItems.map((choice, i) => {
            const cleanChoice = choice.replace(/<br>/g, '').replace(/<\/?strong>/g, '').trim();
            const displayChoice = choice.replace(/<br>/g, '').trim();
            return `<button class="rpg-choice-btn" onclick="selectChoice(this)" data-choice="${escapeAttr(cleanChoice)}">${displayChoice}</button>`;
        }).join('');
        
        return `<div class="rpg-choices">${buttons}</div>`;
    });
    
    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ===== RPG Choice Selection =====
window.selectChoice = function(btn) {
    const choice = btn.getAttribute('data-choice');
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = choice;
        input.focus();
        autoResizeTextarea();
    }
};

// ===== Send Message =====
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();

    if (!text || isSending) return;

    isSending = true;
    input.value = '';
    autoResizeTextarea();

    // Add user message immediately
    const userMsg = {
        id: 'u_' + Date.now(),
        role: 'user',
        name: '我',
        content: text,
        timestamp: Date.now()
    };
    messages.push(userMsg);
    renderMessages();

    // Show typing indicator
    showTypingIndicator();

    // Mock mode: no real backend session
    if (!currentSessionId) {
        setTimeout(() => {
            removeTypingIndicator();
            const mockReply = generateMockReply(text);
            const botMsg = {
                id: 'b_' + Date.now(),
                role: 'bot',
                name: currentCharacter.chatName || currentCharacter.title,
                content: mockReply,
                timestamp: Date.now(),
                verified: false
            };
            messages.push(botMsg);
            renderMessages();

            // Parse RPG data from reply
            const rpgData = parseRpgMessage(mockReply);
            if (rpgData?.isRpg) {
                if (rpgData.worldState) updateWorldState(rpgData.worldState);
                updateActionOptions(rpgData.actionOptions);
            } else {
                updateActionOptions([]);
            }

            isSending = false;
        }, 1200 + Math.random() * 800);
        return;
    }

    // Call real API
    try {
        const res = await GenSphereAPI.chat.sendMessage(currentSessionId, text);

        removeTypingIndicator();

        if (res && res.code === 0 && res.data) {
            const replyContent = res.data.content || res.data.reply || '';
            const botMsg = {
                id: 'b_' + Date.now(),
                role: 'bot',
                name: currentCharacter.chatName || currentCharacter.title,
                content: replyContent,
                timestamp: Date.now(),
                verified: false
            };
            messages.push(botMsg);

            // Parse RPG data from reply
            const rpgData = parseRpgMessage(replyContent);
            if (rpgData?.isRpg) {
                if (rpgData.worldState) updateWorldState(rpgData.worldState);
                updateActionOptions(rpgData.actionOptions);
            } else {
                updateActionOptions([]);
            }

            // Also check for worldState in response data
            if (res.data.worldState || res.data.world_state) {
                updateWorldState(res.data.worldState || res.data.world_state);
            }
        } else {
            const errorMsg = {
                id: 'b_' + Date.now(),
                role: 'bot',
                name: currentCharacter.chatName || currentCharacter.title,
                content: '(AI服务暂时不可用，请稍后再试。错误信息：' + (res.message || '未知错误') + ')',
                timestamp: Date.now(),
                verified: false
            };
            messages.push(errorMsg);
            updateActionOptions([]);
        }
    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator();

        const errorMsg = {
            id: 'b_' + Date.now(),
            role: 'bot',
            name: currentCharacter.chatName || currentCharacter.title,
            content: '(网络请求失败，请检查网络连接后重试。)',
            timestamp: Date.now(),
            verified: false
        };
        messages.push(errorMsg);
        updateActionOptions([]);
    }

    renderMessages();
    isSending = false;
}

// Generate mock reply based on character
function generateMockReply(userText) {
    const char = currentCharacter;
    if (!char) return '...';

    const replies = [
        '*他微微挑眉，目光中带着几分玩味地看着你*\n\n"有意思，继续说。"',
        '*他沉默了片刻，缓缓开口*\n\n"你说的这些... 我凭什么相信你？"',
        '*他轻笑一声，似乎觉得有些好笑*\n\n"你倒是挺有胆量的，敢在我面前说这种话。"',
        '*他站起身，背对着你望向窗外*\n\n"这个世界不是非黑即白的... 你还太年轻了。"',
        '*他的手指轻轻敲击着桌面，似乎在思考什么*\n\n"你的提议... 我需要考虑一下。"',
        '*他的目光变得锐利起来*\n\n"你最好不要骗我，否则后果自负。"'
    ];

    return replies[Math.floor(Math.random() * replies.length)];
}

// ===== Typing Indicator =====
function showTypingIndicator() {
    const messagesContainer = document.getElementById('messagesList');
    if (!messagesContainer) return;
    
    const typingEl = document.createElement('div');
    typingEl.id = 'typingIndicator';
    typingEl.className = 'typing-indicator';
    
    const avatarText = currentCharacter?.chatName?.charAt(0).toUpperCase() || 
                       currentCharacter?.title?.charAt(0).toUpperCase() || '角';
    
    typingEl.innerHTML = `
        <div class="message-avatar">${avatarText}</div>
        <div class="typing-bubble">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    messagesContainer.appendChild(typingEl);
    
    const msgArea = document.querySelector('.messages-area');
    if (msgArea) msgArea.scrollTop = msgArea.scrollHeight;
}

function removeTypingIndicator() {
    const typingEl = document.getElementById('typingIndicator');
    if (typingEl) typingEl.remove();
}

// ===== Toast Notification =====
function showToast(message) {
    let toast = document.getElementById('chatToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'chatToast';
        toast.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:12px 24px;border-radius:10px;font-size:14px;z-index:9999;backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 3000);
}

// ===== Scroll =====
function scrollToBottom() {
    const msgArea = document.querySelector('.messages-area');
    if (msgArea) {
        msgArea.scrollTop = msgArea.scrollHeight;
    }
}

// ===== Textarea Auto Resize =====
function autoResizeTextarea() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 200) + 'px';
}

// ===== Message Actions =====
window.regenerateMessage = async function(msgId) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.role !== 'bot' || !currentSessionId) return;
    
    const index = messages.findIndex(m => m.id === msgId);
    if (index > -1) {
        messages.splice(index, 1);
    }
    
    renderMessages();
    showTypingIndicator();
    
    // Find the previous user message
    const prevUserMsg = messages.filter(m => m.role === 'user').pop();
    if (!prevUserMsg) {
        removeTypingIndicator();
        return;
    }
    
    try {
        const res = await GenSphereAPI.chat.sendMessage(currentSessionId, prevUserMsg.content);
        removeTypingIndicator();
        
        if (res && res.code === 0 && res.data) {
            const replyContent = res.data.content || res.data.reply || '';
            const newMsg = {
                id: 'b_' + Date.now(),
                role: 'bot',
                name: currentCharacter.chatName || currentCharacter.title,
                content: replyContent,
                timestamp: Date.now(),
                verified: false
            };
            messages.splice(index, 0, newMsg);

            // Update RPG state from the new message (if it's the last bot message)
            const isLastBotMsg = index === messages.length - 1 || 
                !messages.slice(index + 1).some(m => m.role === 'bot');
            if (isLastBotMsg) {
                const rpgData = parseRpgMessage(replyContent);
                if (rpgData?.isRpg) {
                    if (rpgData.worldState) updateWorldState(rpgData.worldState);
                    updateActionOptions(rpgData.actionOptions);
                } else {
                    updateActionOptions([]);
                }
            }
        }
    } catch (error) {
        removeTypingIndicator();
        console.error('Regenerate error:', error);
    }
    
    renderMessages();
};

window.copyMessage = function(msgId) {
    const msg = messages.find(m => m.id === msgId);
    if (msg) {
        navigator.clipboard.writeText(msg.content).then(() => {
            showToast('已复制到剪贴板');
        }).catch(() => {});
    }
};

window.editMessage = function(msgId) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.role !== 'user') return;
    
    const newContent = prompt('编辑消息：', msg.content);
    if (newContent !== null && newContent.trim()) {
        msg.content = newContent.trim();
        renderMessages();
    }
};

window.deleteMessage = function(msgId) {
    if (!confirm('确定要删除这条消息吗？')) return;
    const index = messages.findIndex(m => m.id === msgId);
    if (index > -1) {
        messages.splice(index, 1);
        renderMessages();
    }
};
