// ===== Chat Page - GenSphere RPG =====

let currentCharacter = null;
let currentSessionId = null;
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
        loadCharacterData(characterId);
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
function loadCharacterData(characterId) {
    // Generate character data from main.js's generateCharacters function
    const numericId = parseInt(characterId) || 1;
    
    // Use the same data generation as main.js
    if (typeof generateCharacters === 'function') {
        const chars = generateCharacters(Math.max(numericId, 8), 1);
        currentCharacter = chars.find(c => c.id === numericId) || chars[0];
    }
    
    if (!currentCharacter) {
        // Fallback: create basic character
        currentCharacter = {
            id: characterId,
            title: '未知角色',
            chatName: '未知角色',
            image: 'assets/char-knight.jpg',
            description: '角色信息加载中...',
            personality: '',
            scenario: '',
            firstMessage: '你好...',
            contentLevel: 'SFW'
        };
    }
    
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
    
    // Start chat session
    startChatSession();
}

async function startChatSession() {
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
    
    return `
        <div class="message ${isUser ? 'user' : 'bot'}" data-msg-id="${msg.id}">
            <div class="message-avatar">${avatarText}</div>
            <div class="message-content">
                ${!isUser ? `
                    <div class="message-header">
                        <span class="message-name">${escapeHtml(msg.name)}</span>
                    </div>
                ` : ''}
                <div class="message-bubble">${formatMessage(msg.content)}</div>
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
    
    // Check if backend is connected
    if (!currentSessionId) {
        // Show error toast
        showToast('AI服务未连接，请稍后再试');
        return;
    }
    
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
    
    // Call real API
    try {
        const res = await GenSphereAPI.chat.sendMessage(currentSessionId, text);
        
        removeTypingIndicator();
        
        if (res && res.code === 0 && res.data) {
            const botMsg = {
                id: 'b_' + Date.now(),
                role: 'bot',
                name: currentCharacter.chatName || currentCharacter.title,
                content: res.data.content || res.data.reply || '',
                timestamp: Date.now(),
                verified: false
            };
            messages.push(botMsg);
        } else {
            // API returned error
            const errorMsg = {
                id: 'b_' + Date.now(),
                role: 'bot',
                name: currentCharacter.chatName || currentCharacter.title,
                content: '(AI服务暂时不可用，请稍后再试。错误信息：' + (res.message || '未知错误') + ')',
                timestamp: Date.now(),
                verified: false
            };
            messages.push(errorMsg);
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
            const newMsg = {
                id: 'b_' + Date.now(),
                role: 'bot',
                name: currentCharacter.chatName || currentCharacter.title,
                content: res.data.content || res.data.reply || '',
                timestamp: Date.now(),
                verified: false
            };
            messages.splice(index, 0, newMsg);
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
