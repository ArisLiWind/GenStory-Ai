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
    try {
        const result = await GenSphereAPI.characters.getDetail(characterId);

        if (result.code === 0 && result.data) {
            currentCharacter = normalizeCharacter(result.data);
            renderCharacterInfo();
            startChatSession();
            return;
        }

        // Backend returned error — try frontend default characters
        if (typeof getDefaultCharacter === 'function') {
            const defaultChar = getDefaultCharacter(characterId);
            if (defaultChar) {
                currentCharacter = normalizeCharacter(defaultChar);
                renderCharacterInfo();
                startChatSession();
                return;
            }
        }

        // 加载失败，显示错误
        showCharacterLoadError(result.message || '角色不存在或已被删除');
    } catch (err) {
        console.error('Load character error:', err);

        // Network error — try frontend default characters
        if (typeof getDefaultCharacter === 'function') {
            const defaultChar = getDefaultCharacter(characterId);
            if (defaultChar) {
                currentCharacter = normalizeCharacter(defaultChar);
                renderCharacterInfo();
                startChatSession();
                return;
            }
        }

        showCharacterLoadError('网络错误，请稍后重试');
    }
}

function showCharacterLoadError(message) {
    const messagesContainer = document.getElementById('messagesList');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:#888;">
                <h3 style="color:#fff;margin-bottom:8px;">角色加载失败</h3>
                <p>${escapeHtml(message)}</p>
                <a href="index.html" style="display:inline-block;margin-top:16px;padding:10px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:12px;text-decoration:none;">返回首页</a>
            </div>
        `;
    }
    // 同时更新头部标题
    const headerName = document.getElementById('headerCharName');
    if (headerName) headerName.textContent = '加载失败';
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
        currentStatus: '',
        currentQuest: '',
        knownIntel: [],
        rawContent: content
    };

    let text = content.trim();

    // ===== 1. Parse header: 【时间·地点】 or time/location/weather in text =====
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

    // Try to extract time/weather/location from first line (e.g. "第12日 · 黄昏 · 暴雨 · 灰岩镇")
    if (!result.worldState) {
        const firstLineMatch = text.match(/^([^\n]+·[^\n]+·[^\n]+·[^\n]+)\n/);
        if (firstLineMatch) {
            const parts = firstLineMatch[1].split('·').map(p => p.trim());
            if (parts.length >= 3) {
                result.isRpg = true;
                result.worldState = {
                    time: parts.slice(0, parts.length - 2).join(' · '),
                    weather: parts[parts.length - 2],
                    location: parts[parts.length - 1]
                };
            }
        }
    }

    // ===== 2. Parse all sections by 【section name】 markers =====
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

    // ===== 3. Extract scene description =====
    // Scene desc = everything before the first recognized status/options section
    const statusSectionNames = ['当前状态', '状态', '角色状态', '当前任务', '任务', '已知情报', '情报', '你可以', '行动选项', '选项'];
    let firstStatusIdx = -1;
    for (let i = 0; i < sectionPositions.length; i++) {
        const name = sectionPositions[i].name;
        if (statusSectionNames.some(s => name.includes(s))) {
            firstStatusIdx = sectionPositions[i].start;
            break;
        }
    }

    if (firstStatusIdx > 0) {
        result.isRpg = true;
        result.sceneDesc = text.substring(0, firstStatusIdx).trim();
    } else if (sectionPositions.length === 0) {
        // No sections found - all text is scene desc + NPC reaction
        result.sceneDesc = text.trim();
    } else if (!result.sceneDesc && sectionPositions.length > 0) {
        // Content before first section
        const beforeFirst = text.substring(0, sectionPositions[0].start).trim();
        if (beforeFirst) {
            result.isRpg = true;
            result.sceneDesc = beforeFirst;
        }
    }

    // ===== 4. Extract NPC reaction =====
    // In new format, NPC dialog is embedded in scene description
    const npcKeys = ['NPC反应', 'NPC 反应', 'npc反应'];
    for (const key of npcKeys) {
        if (sections[key]) {
            result.isRpg = true;
            result.npcReaction = sections[key];
            break;
        }
    }
    // If no separate NPC section, the scene desc itself contains NPC interaction
    if (!result.npcReaction && result.sceneDesc) {
        result.npcReaction = result.sceneDesc;
    }

    // ===== 5. Extract current status =====
    const currentStatusKeys = ['当前状态', '角色状态', '状态'];
    for (const key of currentStatusKeys) {
        if (sections[key]) {
            result.isRpg = true;
            result.currentStatus = sections[key].trim();
            // Also parse for world state updates
            const locMatch = sections[key].match(/当前位置[：:]\s*([^\n｜|]+)/);
            if (locMatch && result.worldState) {
                result.worldState.location = locMatch[1].trim();
            }
            const timeMatch = sections[key].match(/时间[：:]\s*([^\n｜|]+)/);
            if (timeMatch && result.worldState) {
                result.worldState.time = timeMatch[1].trim();
            }
            break;
        }
    }

    // ===== 6. Extract current quest =====
    const questKeys = ['当前任务', '任务'];
    for (const key of questKeys) {
        if (sections[key]) {
            result.isRpg = true;
            result.currentQuest = sections[key].trim();
            break;
        }
    }

    // ===== 7. Extract known intel =====
    const intelKeys = ['已知情报', '情报', '线索'];
    for (const key of intelKeys) {
        if (sections[key]) {
            result.isRpg = true;
            const intelText = sections[key];
            const lines = intelText.split('\n').map(s => s.trim()).filter(s => s);
            const intel = [];
            for (const line of lines) {
                const cleaned = line.replace(/^[-•▪▸►·]\s*/, '').trim();
                if (cleaned) intel.push(cleaned);
            }
            result.knownIntel = intel.length > 0 ? intel : lines;
            break;
        }
    }

    // ===== 8. Extract status changes =====
    const statusKeys = ['状态变化', '角色状态更新'];
    for (const key of statusKeys) {
        if (sections[key]) {
            result.isRpg = true;
            const statusText = sections[key];
            const lines = statusText.split('\n').map(s => s.trim()).filter(s => s);
            const changes = [];
            for (const line of lines) {
                const cleaned = line.replace(/^[-•▪▸►]\s*/, '').trim();
                if (cleaned) changes.push(cleaned);
            }
            result.statusChanges = changes.length > 0 ? changes : lines;
            break;
        }
    }

    // ===== 9. Extract action options =====
    const optionKeys = ['你可以', '行动选项', '选项', '任务分支', '可选行动'];
    for (const key of optionKeys) {
        if (sections[key]) {
            result.isRpg = true;
            const optionsText = sections[key];
            result.actionOptions = parseOptionsText(optionsText);
            break;
        }
    }

    // ===== 10. If no sections found, check end-of-text options =====
    if (result.actionOptions.length === 0) {
        const opts = parseOptionsFromEnd(text);
        if (opts.length >= 2) {
            result.isRpg = true;
            result.actionOptions = opts;
            // Remove options from scene desc
            const lastOptionIdx = findLastOptionStart(text);
            if (lastOptionIdx > 0) {
                result.sceneDesc = text.substring(0, lastOptionIdx).trim();
                if (!result.npcReaction) result.npcReaction = result.sceneDesc;
            }
        }
    }

    // ===== 11. Fallback: detect RPG-style from formatting =====
    if (!result.isRpg && content) {
        const hasActions = /\*[^*]+\*/.test(content);
        const hasDialogue = /"[^"]+"/.test(content) || /「[^」]+」/.test(content);
        if (hasActions && hasDialogue) {
            result.isRpg = true;
            result.npcReaction = content;
            result.sceneDesc = content;
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
    
    messages = [];

    // Show character's first message immediately (so user sees content right away)
    if (currentCharacter.firstMessage) {
        messages = [{
            id: 'm_first',
            role: 'bot',
            name: currentCharacter.chatName || currentCharacter.title,
            content: currentCharacter.firstMessage,
            timestamp: Date.now(),
            verified: false
        }];
    }

    // Try to create a persistent session for this character.
    try {
        console.log('[Chat] Creating session for character:', currentCharacter.id, currentCharacter.title);
        const result = await GenSphereAPI.chat.createSession(currentCharacter.id, currentCharacter);
        console.log('[Chat] Session creation response:', { code: result?.code, hasData: !!result?.data, message: result?.message });

        if (result && result.code === 0 && result.data) {
            currentSessionId = result.data.sessionId || result.data.id;
            console.log('[Chat] Session created:', currentSessionId);

            // If session has world_state, use it
            if (result.data.worldState || result.data.world_state) {
                const ws = result.data.worldState || result.data.world_state;
                updateWorldState(ws);
            }
            
            // If session returned messages, use them
            if (result.data.messages && result.data.messages.length > 0) {
                messages = result.data.messages.map((m, i) => ({
                    id: m.id || 'msg_' + i,
                    role: m.role === 'assistant' ? 'bot' : 'user',
                    name: m.role === 'assistant' ? (currentCharacter.chatName || currentCharacter.title) : '我',
                    content: m.content,
                    timestamp: m.created_at || Date.now(),
                    verified: false
                }));
            }
            
            // If no messages from session, use character's first message
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
            console.warn('[Chat] Session creation failed:', result);
            const error = new Error(result?.message || 'Failed to create session');
            error.code = result?.code;
            throw error;
        }
    } catch (error) {
        console.error('[Chat] Session creation error:', error);

        const isAuthError = error?.code === 401 || /登录|未登录|请先登录/.test(error?.message || '');

        if (messagesContainer) {
            if (isAuthError) {
                messagesContainer.innerHTML = `
                    <div style="text-align:center;padding:60px 20px;">
                        <div style="font-size:48px;margin-bottom:16px;">🔐</div>
                        <h3 style="color:#fff;margin-bottom:8px;">请先登录后开始聊天</h3>
                        <p style="color:#888;font-size:14px;line-height:1.6;max-width:400px;margin:0 auto;">
                            角色会话需要登录后保存剧情进度和历史记录。
                        </p>
                        <a href="login.html" style="display:inline-block;margin-top:18px;padding:10px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:12px;text-decoration:none;">去登录</a>
                    </div>
                `;
            } else {
                // 会话创建失败，但仍可使用游客模式聊天
                messagesContainer.innerHTML = `
                    <div style="text-align:center;padding:40px 20px;">
                        <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
                        <h3 style="color:#fff;margin-bottom:8px;">会话连接异常</h3>
                        <p style="color:#888;font-size:14px;line-height:1.6;max-width:400px;margin:0 auto;margin-bottom:16px;">
                            ${escapeHtml(error?.message || '后端服务暂时不可用，请稍后重试。')}
                        </p>
                        <p style="color:#666;font-size:13px;line-height:1.6;max-width:400px;margin:0 auto;">
                            你仍可以在下方输入框直接发送消息进行聊天。
                        </p>
                    </div>
                `;
            }
        }
        
        // 仍然显示角色的首条消息，让用户可以开始聊天
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
    const currentStatus = rpgData.currentStatus || '';
    const currentQuest = rpgData.currentQuest || '';
    const knownIntel = rpgData.knownIntel || [];

    let bodyHtml = '';

    // Scene description (includes time/weather/location + scene body)
    if (sceneDesc) {
        bodyHtml += `
            <div class="rpg-scene-desc">
                ${formatRpgText(sceneDesc)}
            </div>
        `;
    }

    // NPC reaction (only render if different from scene desc)
    if (npcReaction && npcReaction !== sceneDesc) {
        bodyHtml += `
            <div class="rpg-npc-reaction">
                <div class="rpg-npc-name">${escapeHtml(msg.name)}</div>
                <div class="rpg-npc-text">${formatRpgText(npcReaction)}</div>
            </div>
        `;
    }

    // Current status
    if (currentStatus) {
        bodyHtml += `
            <div class="rpg-status-section">
                <div class="rpg-status-label">当前状态</div>
                <div class="rpg-status-content">${formatRpgText(currentStatus)}</div>
            </div>
        `;
    }

    // Current quest
    if (currentQuest) {
        bodyHtml += `
            <div class="rpg-quest-section">
                <div class="rpg-quest-label">当前任务</div>
                <div class="rpg-quest-content">${formatRpgText(currentQuest)}</div>
            </div>
        `;
    }

    // Known intel
    if (knownIntel.length > 0) {
        bodyHtml += `
            <div class="rpg-intel-section">
                <div class="rpg-intel-label">已知情报</div>
                <ul class="rpg-intel-list">
                    ${knownIntel.map(intel => `<li>${escapeHtml(intel)}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Status changes as badges (legacy format support)
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

    // No backend session — use guest chat (still works with API keys)
    if (!currentSessionId) {
        try {
            // Build history from current messages (exclude the one just added)
            const history = messages.slice(0, -1).map(m => ({
                role: m.role === 'bot' ? 'assistant' : 'user',
                content: m.content
            }));

            const res = await GenSphereAPI.chat.guestSend(currentCharacter.id, text, history);
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

                const rpgData = parseRpgMessage(replyContent);
                if (rpgData?.isRpg) {
                    if (rpgData.worldState) updateWorldState(rpgData.worldState);
                    updateActionOptions(rpgData.actionOptions);
                } else {
                    updateActionOptions([]);
                }
            } else {
                const errorMsg = {
                    id: 'b_' + Date.now(),
                    role: 'bot',
                    name: currentCharacter.chatName || currentCharacter.title,
                    content: '(AI服务暂时不可用。错误：' + (res?.message || '未知错误') + ')',
                    timestamp: Date.now(),
                    verified: false
                };
                messages.push(errorMsg);
                updateActionOptions([]);
            }
        } catch (error) {
            console.error('[Chat] Guest send error:', error);
            removeTypingIndicator();
            const errorMsg = {
                id: 'b_' + Date.now(),
                role: 'bot',
                name: currentCharacter.chatName || currentCharacter.title,
                content: '(网络请求失败：' + (error.message || '未知错误') + ')',
                timestamp: Date.now(),
                verified: false
            };
            messages.push(errorMsg);
            updateActionOptions([]);
        }

        isSending = false;
        return;
    }

    // Call real API with session
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
        console.error('[Chat] Send error:', error);
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
