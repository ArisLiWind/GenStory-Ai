// ===== Chat Page - Janitor AI Style =====

let currentCharacter = null;
let currentChatId = null;
let messages = [];
let isSending = false;
let charInfoExpanded = false;

document.addEventListener('DOMContentLoaded', () => {
    initChatPage();
});

function initChatPage() {
    const params = new URLSearchParams(window.location.search);
    const characterId = params.get('character');
    
    if (characterId) {
        loadCharacterAndStartChat(characterId);
    } else {
        // Fallback to mock character
        loadMockCharacter('demo_mafia_boss');
        startNewChat();
    }
    
    setupEventListeners();
}

function setupEventListeners() {
    // Send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Enter to send (Shift+Enter for new line)
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Input event to adjust height
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
    charInfoExpanded = !charInfoExpanded;
    
    if (charInfoExpanded) {
        panel.style.display = 'block';
        setTimeout(() => {
            panel.style.maxHeight = '200px';
        }, 10);
    } else {
        panel.style.maxHeight = '0';
        setTimeout(() => {
            panel.style.display = 'none';
        }, 300);
    }
};

// ===== Character Loading =====
function loadCharacterAndStartChat(characterId) {
    // Try to load from API, fallback to mock
    loadMockCharacter(characterId);
    startNewChat();
}

function loadMockCharacter(id) {
    const titles = [
        "Mafia Boss", "Willson Wáng", "Neglectful family", "Ayato Hiroshi",
        "Second Life Isekai", "Giovanni Moretti", "Your Three Older Brothers",
        "Your tyrant father", "Best friends trio", "Snow your edgy sister",
        "Another Magic Academy", "星际指挥官", "古代剑客", "龙骑士传说",
        "末世幸存者", "吸血鬼恋人", "校园恋爱物语", "赛博朋克2077",
        "神秘侦探", "精灵王子", "机械少女", "时空旅行者", "海底王国",
        "天使与恶魔", "狼人传说", "魔法少女", "忍者物语", "海盗冒险",
        "超能力学院", "幽灵公寓", "美食厨师", "偶像练习生", "电竞选手",
        "医生与患者", "师生恋曲", "总裁的秘书", "邻家女孩", "青梅竹马",
        "双胞胎兄弟", "傲娇大小姐", "忠犬男友", "病娇女友", "高冷学霸"
    ];
    
    if (id === 'demo_mafia_boss') {
        currentCharacter = {
            id: 'demo_mafia_boss',
            title: 'Mafia Boss',
            chatName: 'Mafia Boss',
            image: 'https://picsum.photos/seed/char1/400/520',
            description: '一位认为你掌握着他敌人情报的黑手党老大。无论你是否无辜，他都在密切监视着你。',
            firstMessage: 'A member of the mafia pushed you into an interrogation chair as a man clad in a black suit walked into the room.\n\nHis grayish-green eyes focused on you as he sat down on the other side of the table. He moved with elegance, poise and power. He didn\'t smile or even allow a bit of comforting warmth as he stared. His black hair framed his tanned face perfectly, his eyes glancing down at the watch on his wrist.\n\n"So you must know why you\'re here?" he hummed coldly. "I suggest not lying. It\'s boring for me and it won\'t go well for you. Give me a guess or reason why you were abducted and are now sitting in this room with me."',
            creatorVerified: true
        };
    } else {
        const numericId = parseInt(id) || 1;
        const idx = (numericId - 1) % titles.length;
        const title = titles[idx];
        currentCharacter = {
            id: id,
            title: title,
            chatName: title,
            image: `https://picsum.photos/seed/char${numericId}/400/520`,
            description: '一位神秘的角色，有着不为人知的过去和令人着迷的性格。在这个充满奇幻色彩的世界里，你们将展开一段难忘的冒险。',
            firstMessage: '你好，很高兴见到你。我是' + title + '，有什么我可以帮你的吗？',
            creatorVerified: false
        };
    }
    
    // Update header
    const headerName = document.getElementById('headerCharName');
    if (headerName) {
        headerName.textContent = currentCharacter.title;
    }
    
    // Update character info panel
    const panelName = document.getElementById('panelCharName');
    const panelDesc = document.getElementById('panelCharDesc');
    const panelAvatar = document.getElementById('panelAvatar');
    
    if (panelName) panelName.textContent = currentCharacter.title;
    if (panelDesc) panelDesc.textContent = currentCharacter.description;
    if (panelAvatar && currentCharacter.image) {
        panelAvatar.src = currentCharacter.image;
    }
}

// ===== Chat Functions =====
function startNewChat() {
    currentChatId = 'new_' + Date.now();
    
    // Add first message from character
    messages = [
        {
            id: 'm1',
            role: 'bot',
            name: currentCharacter?.title || '角色',
            content: currentCharacter?.firstMessage || '你好！',
            timestamp: Date.now(),
            verified: currentCharacter?.creatorVerified
        }
    ];
    
    renderMessages();
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
    
    return `
        <div class="message ${isUser ? 'user' : 'bot'}">
            <div class="message-avatar">${avatarText}</div>
            <div class="message-content">
                ${!isUser ? `
                    <div class="message-header">
                        <span class="message-name">${msg.name}</span>
                        ${msg.verified ? `
                            <svg class="message-verified" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                        ` : ''}
                    </div>
                ` : ''}
                <div class="message-bubble">${escapeHtml(msg.content)}</div>
                <div class="message-actions">
                    ${!isUser ? `
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
                        <button class="message-action-btn" title="点赞" onclick="likeMessage('${msg.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                            </svg>
                        </button>
                        <button class="message-action-btn" title="删除" onclick="deleteMessage('${msg.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    ` : `
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
                    `}
                </div>
            </div>
        </div>
    `;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text || isSending || !currentCharacter) return;
    
    isSending = true;
    input.value = '';
    autoResizeTextarea();
    
    // Add user message
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
    
    // Simulate AI response
    try {
        const res = await GenSphereAPI.chat.generate({
            characterId: currentCharacter.id,
            message: text,
            chatId: currentChatId,
            history: messages.map(m => ({ role: m.role, content: m.content }))
        });
        
        removeTypingIndicator();
        
        if (res.code === 0 && res.data) {
            const botMsg = {
                id: 'b_' + Date.now(),
                role: 'bot',
                name: currentCharacter.title,
                content: res.data.reply,
                timestamp: Date.now(),
                verified: currentCharacter.creatorVerified
            };
            messages.push(botMsg);
        } else {
            // Fallback mock response
            const botMsg = {
                id: 'b_' + Date.now(),
                role: 'bot',
                name: currentCharacter.title,
                content: generateMockResponse(text),
                timestamp: Date.now(),
                verified: currentCharacter.creatorVerified
            };
            messages.push(botMsg);
        }
    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator();
        
        // Fallback mock response
        const botMsg = {
            id: 'b_' + Date.now(),
            role: 'bot',
            name: currentCharacter.title,
            content: generateMockResponse(text),
            timestamp: Date.now(),
            verified: currentCharacter.creatorVerified
        };
        messages.push(botMsg);
    }
    
    renderMessages();
    isSending = false;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('messagesList');
    if (!messagesContainer) return;
    
    const typingEl = document.createElement('div');
    typingEl.id = 'typingIndicator';
    typingEl.className = 'typing-indicator';
    
    const avatarText = currentCharacter?.title?.charAt(0).toUpperCase() || '角';
    
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
    if (msgArea) {
        msgArea.scrollTop = msgArea.scrollHeight;
    }
}

function removeTypingIndicator() {
    const typingEl = document.getElementById('typingIndicator');
    if (typingEl) {
        typingEl.remove();
    }
}

function generateMockResponse(userMessage) {
    const responses = [
        '他眯起眼睛，仔细打量着你。\n\n"有意思...你比我想象的要大胆。" 他缓缓站起身，雪茄的烟雾在他指间缭绕，"不过在这个城市里，大胆的人往往活不长。"\n\n他的语气里带着一丝玩味，但你能感受到其中潜藏的危险。',
        '"情报？" 他冷笑一声，"我见过太多像你这样的人了，以为手里有点东西就能跟我谈条件。"\n\n他走到窗前，背对着你，身影在月光下显得格外高大。\n\n"说吧，你想要什么？"',
        '他的手指轻轻敲击着桌面，发出有节奏的声响。\n\n"你最好想清楚再回答我。" 他的声音平静得可怕，"我不喜欢浪费时间，也不喜欢被人耍。"\n\n房间里的空气仿佛凝固了，你能听到自己的心跳声。'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function autoResizeTextarea() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 200) + 'px';
}

// ===== Message Actions =====
function regenerateMessage(msgId) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.role !== 'bot') return;
    
    const index = messages.findIndex(m => m.id === msgId);
    if (index > -1) {
        messages.splice(index, 1);
    }
    
    renderMessages();
    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        const newMsg = {
            id: 'b_' + Date.now(),
            role: 'bot',
            name: currentCharacter.title,
            content: generateMockResponse('regenerate'),
            timestamp: Date.now(),
            verified: currentCharacter.creatorVerified
        };
        messages.splice(index, 0, newMsg);
        renderMessages();
    }, 1500);
}

function copyMessage(msgId) {
    const msg = messages.find(m => m.id === msgId);
    if (msg) {
        navigator.clipboard.writeText(msg.content).then(() => {
            console.log('Message copied');
        }).catch(() => {});
    }
}

function likeMessage(msgId) {
    console.log('Liked message:', msgId);
}

function editMessage(msgId) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.role !== 'user') return;
    
    const newContent = prompt('编辑消息：', msg.content);
    if (newContent !== null && newContent.trim()) {
        msg.content = newContent.trim();
        renderMessages();
    }
}

function deleteMessage(msgId) {
    if (!confirm('确定要删除这条消息吗？')) return;
    
    const index = messages.findIndex(m => m.id === msgId);
    if (index > -1) {
        messages.splice(index, 1);
        renderMessages();
    }
}

// ===== Helper functions =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
