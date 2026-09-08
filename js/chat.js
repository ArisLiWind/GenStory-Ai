// ===== Chat Page =====

let currentCharacter = null;
let currentChatId = null;
let messages = [];
let isSending = false;

// Mock chat list
const mockChats = [
    {
        id: 'chat1',
        characterId: 'demo_mafia_boss',
        characterName: 'Mafia Boss',
        characterAvatar: '',
        preview: '你好，我知道你在找什么...',
        time: '刚刚',
        unread: 0
    },
    {
        id: 'chat2',
        characterId: 'demo_mafia_boss',
        characterName: 'Mafia Boss',
        characterAvatar: '',
        preview: '这件事你最好不要插手...',
        time: '昨天',
        unread: 0
    },
    {
        id: 'chat3',
        characterId: 'demo_witch',
        characterName: '神秘女巫',
        characterAvatar: '',
        preview: '命运的齿轮已经开始转动了',
        time: '3天前',
        unread: 2
    }
];

document.addEventListener('DOMContentLoaded', () => {
    initChatPage();
});

function initChatPage() {
    const params = new URLSearchParams(window.location.search);
    const characterId = params.get('character');
    
    if (characterId) {
        loadCharacterAndStartChat(characterId);
    } else {
        // No character selected, show empty state
        renderChatList();
    }
    
    setupEventListeners();
}

function setupEventListeners() {
    // Send button
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    
    // Enter to send (Shift+Enter for new line)
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Input event to adjust height
    chatInput.addEventListener('input', autoResizeTextarea);
    
    // Sidebar toggle
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('chatSidebar');
        sidebar.classList.toggle('open');
    };
    
    // Go to character page
    window.goToCharacter = function() {
        if (currentCharacter) {
            window.location.href = 'character.html?id=' + currentCharacter.id;
        }
    };
}

function loadCharacterAndStartChat(characterId) {
    // Try to load from API, fallback to mock
    loadMockCharacter(characterId);
    renderChatList();
    startNewChat();
}

function loadMockCharacter(id) {
    if (id === 'demo_mafia_boss') {
        currentCharacter = {
            id: 'demo_mafia_boss',
            title: 'Mafia Boss',
            chatName: 'Mafia Boss',
            image: '',
            firstMessage: '他从阴影中缓缓走出，指尖的雪茄冒出袅袅烟雾。锐利的目光如同猎鹰般锁定着你，空气中弥漫着压迫感。\n\n"我听说...你有我想要的情报。"他的声音低沉而冰冷，"不要试图对我撒谎，我知道的可能比你想象的更多。"'
        };
    } else {
        currentCharacter = {
            id: id,
            title: '角色名称',
            chatName: '角色',
            image: '',
            firstMessage: '你好，很高兴见到你。'
        };
    }
    
    // Update header
    document.getElementById('headerName').textContent = currentCharacter.title;
    document.getElementById('headerStatus').textContent = '在线';
    const headerAvatar = document.getElementById('headerAvatar');
    if (currentCharacter.image) {
        headerAvatar.src = currentCharacter.image;
        headerAvatar.alt = currentCharacter.title;
    }
}

function renderChatList() {
    const chatList = document.getElementById('chatList');
    
    // Group by date
    const today = mockChats.slice(0, 1);
    const yesterday = mockChats.slice(1, 2);
    const earlier = mockChats.slice(2);
    
    let html = '';
    
    if (today.length > 0) {
        html += `
            <div class="chat-list-section">
                <div class="chat-list-section-title">今天</div>
                ${today.map(chat => renderChatItem(chat)).join('')}
            </div>
        `;
    }
    
    if (yesterday.length > 0) {
        html += `
            <div class="chat-list-section">
                <div class="chat-list-section-title">昨天</div>
                ${yesterday.map(chat => renderChatItem(chat)).join('')}
            </div>
        `;
    }
    
    if (earlier.length > 0) {
        html += `
            <div class="chat-list-section">
                <div class="chat-list-section-title">更早</div>
                ${earlier.map(chat => renderChatItem(chat)).join('')}
            </div>
        `;
    }
    
    chatList.innerHTML = html;
    
    // Bind click events
    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', () => {
            const chatId = item.dataset.id;
            selectChat(chatId);
        });
    });
}

function renderChatItem(chat) {
    const avatarText = chat.characterName.charAt(0).toUpperCase();
    const avatarHtml = chat.characterAvatar 
        ? `<img src="${chat.characterAvatar}" alt="${chat.characterName}">`
        : avatarText;
    
    return `
        <div class="chat-item ${chat.id === currentChatId ? 'active' : ''}" data-id="${chat.id}">
            <div class="chat-item-avatar">${avatarHtml}</div>
            <div class="chat-item-info">
                <div class="chat-item-name">${chat.characterName}</div>
                <div class="chat-item-preview">${chat.preview}</div>
            </div>
            <div class="chat-item-time">${chat.time}</div>
        </div>
    `;
}

function selectChat(chatId) {
    currentChatId = chatId;
    renderChatList();
    
    // Load chat messages (mock)
    messages = [
        {
            id: 'm1',
            role: 'bot',
            name: currentCharacter?.title || '角色',
            content: currentCharacter?.firstMessage || '你好！',
            timestamp: Date.now() - 3600000
        }
    ];
    
    renderMessages();
    showInputArea();
}

function startNewChat() {
    currentChatId = 'new_' + Date.now();
    
    // Add first message from character
    messages = [
        {
            id: 'm1',
            role: 'bot',
            name: currentCharacter?.title || '角色',
            content: currentCharacter?.firstMessage || '你好！',
            timestamp: Date.now()
        }
    ];
    
    renderMessages();
    showInputArea();
}

function showInputArea() {
    const inputArea = document.getElementById('chatInputArea');
    inputArea.style.display = 'block';
}

function renderMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="chat-empty">
                <div class="chat-empty-icon">💬</div>
                <div>选择一个角色开始聊天</div>
            </div>
        `;
        return;
    }
    
    messagesContainer.innerHTML = messages.map(msg => renderMessage(msg)).join('');
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderMessage(msg) {
    const isUser = msg.role === 'user';
    const avatarText = isUser ? '我' : (msg.name || '角色').charAt(0).toUpperCase();
    
    return `
        <div class="message ${isUser ? 'user' : 'bot'}">
            <div class="message-avatar">${avatarText}</div>
            <div class="message-content">
                ${!isUser ? `<div class="message-name">${msg.name}</div>` : ''}
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
                        <button class="message-action-btn" title="分享对话" onclick="shareMessage('${msg.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"/>
                                <circle cx="6" cy="12" r="3"/>
                                <circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
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
                timestamp: Date.now()
            };
            messages.push(botMsg);
        } else {
            // Fallback mock response
            const botMsg = {
                id: 'b_' + Date.now(),
                role: 'bot',
                name: currentCharacter.title,
                content: generateMockResponse(text),
                timestamp: Date.now()
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
            timestamp: Date.now()
        };
        messages.push(botMsg);
    }
    
    renderMessages();
    isSending = false;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
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
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 150) + 'px';
}

// ===== Message Actions =====
function regenerateMessage(msgId) {
    // Mock regeneration
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.role !== 'bot') return;
    
    // Remove the message and show typing
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
            timestamp: Date.now()
        };
        messages.splice(index, 0, newMsg);
        renderMessages();
    }, 1500);
}

function copyMessage(msgId) {
    const msg = messages.find(m => m.id === msgId);
    if (msg) {
        navigator.clipboard.writeText(msg.content).then(() => {
            // Could show a toast
            console.log('Message copied');
        }).catch(() => {});
    }
}

function likeMessage(msgId) {
    // Mock like
    console.log('Liked message:', msgId);
}

function shareMessage(msgId) {
    // Mock share
    alert('分享功能开发中...');
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
