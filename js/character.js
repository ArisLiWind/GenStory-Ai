// ============================================
// 角色详情页 - 修复版
// ============================================

let currentCharacter = null;
let currentCommentSort = 'likes';
let comments = [];
let allComments = [];
let isFavorited = false;
let hasExistingChat = false;

// ============================================
// 页面初始化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initCharacterPage();
});

function initCharacterPage() {
    const params = new URLSearchParams(window.location.search);
    const charId = params.get('id');

    if (!charId) {
        renderCharacterError('角色ID不存在');
        return;
    }

    // 显示加载状态
    showLoadingState();

    // 加载角色详情
    loadCharacterDetail(charId);

    // 检查是否有历史聊天（异步，不阻塞页面加载）
    checkExistingChat(charId);

    setupEventListeners();
}

// ============================================
// 加载状态
// ============================================
function showLoadingState() {
    // 标题显示加载中
    document.getElementById('charTitle').textContent = '加载中...';
    document.getElementById('charDescription').textContent = '正在加载角色信息...';
    document.getElementById('charCreator').textContent = '加载中';
    document.getElementById('charViews').textContent = '-';
    document.getElementById('charChats').textContent = '-';

    // 图片显示占位
    const charImg = document.getElementById('charImg');
    charImg.src = '';
    charImg.alt = '加载中...';
    charImg.style.opacity = '0.3';

    // 按钮禁用
    document.getElementById('startChatBtn').disabled = true;
    document.getElementById('favoriteBtn').disabled = true;

    // 手风琴内容显示加载中
    const accordionBodies = document.querySelectorAll('.char-accordion-body');
    accordionBodies.forEach(el => {
        el.textContent = '加载中...';
    });
}

function hideLoadingState() {
    const charImg = document.getElementById('charImg');
    charImg.style.opacity = '1';
    document.getElementById('startChatBtn').disabled = false;
    document.getElementById('favoriteBtn').disabled = false;
}

// ============================================
// 加载角色详情
// ============================================
async function loadCharacterDetail(id) {
    try {
        const result = await GenSphereAPI.characters.getDetail(id);

        if (result.code === 0 && result.data) {
            currentCharacter = normalizeCharacter(result.data);
            isFavorited = !!result.data.isFavorited;
            renderCharacter(currentCharacter);
            hideLoadingState();
            loadMockComments();
            return;
        }

        // API 返回错误
        renderCharacterError(result.message || '角色信息加载失败');
    } catch (err) {
        console.error('Load character error:', err);
        renderCharacterError('网络错误，请稍后重试');
    }
}

// ============================================
// 检查是否有历史聊天
// ============================================
async function checkExistingChat(characterId) {
    try {
        const result = await GenSphereAPI.chat.getSessions();
        if (result.code === 0 && result.data && Array.isArray(result.data)) {
            const sessions = result.data;
            hasExistingChat = sessions.some(s =>
                String(s.characterId) === String(characterId)
            );
            updateChatButton();
        }
    } catch (e) {
        // 忽略错误，默认显示"开始聊天"
        hasExistingChat = false;
        updateChatButton();
    }
}

// ============================================
// 更新聊天按钮文字
// ============================================
function updateChatButton() {
    const continueBtn = document.querySelector('.btn-continue-chat');
    if (!continueBtn) return;

    if (hasExistingChat) {
        continueBtn.style.display = 'flex';
        continueBtn.querySelector('span')?.remove();
        // 重建按钮内容
        continueBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>继续之前的聊天</span>
        `;
    } else {
        continueBtn.style.display = 'none';
    }
}

// ============================================
// 渲染角色信息
// ============================================
function renderCharacter(char) {
    // 标题
    document.getElementById('charTitle').textContent = char.title || '未命名角色';
    document.getElementById('chatBtnName').textContent = char.chatName || char.title || '角色';

    // 描述
    document.getElementById('charDescription').textContent = char.description || '暂无描述';

    // 创作者
    document.getElementById('charCreator').textContent = char.creator || '未知创作者';
    document.getElementById('creatorAvatar').textContent = (char.creator || 'U').charAt(0).toUpperCase();

    // 浏览和聊天数
    document.getElementById('charViews').textContent = formatNumber(char.views || 0);
    document.getElementById('charChats').textContent = formatNumber(char.chats || 0);

    // 日期
    if (char.createdAt) {
        document.getElementById('createdAt').textContent = char.createdAt;
    }
    if (char.updatedAt) {
        document.getElementById('updatedAt').textContent = char.updatedAt;
    }

    // 标签
    renderTags(char.tags || []);

    // 图片
    const charImg = document.getElementById('charImg');
    if (char.image) {
        charImg.src = char.image;
        charImg.alt = char.title;
        charImg.style.opacity = '1';
    } else {
        charImg.src = 'assets/char-knight.jpg';
        charImg.alt = char.title;
        charImg.style.opacity = '1';
    }

    // 认证徽章
    if (char.verified || char.creatorVerified) {
        document.getElementById('creatorVerified').style.display = 'inline';
    } else {
        document.getElementById('creatorVerified').style.display = 'none';
    }

    // 收藏按钮
    renderFavoriteButton();

    // 手风琴面板
    const accordions = document.querySelectorAll('.char-accordion');

    // Persona
    if (accordions[0]) {
        const body = accordions[0].querySelector('.char-accordion-body');
        if (body) {
            body.textContent = char.personality || char.persona || '暂无性格设定。';
        }
        // 更新 token 数
        const tokenEl = accordions[0].querySelector('.char-accordion-token');
        if (tokenEl && char.tokenCount) {
            tokenEl.textContent = char.tokenCount + ' Token';
        }
    }

    // Scenario
    if (accordions[1]) {
        const body = accordions[1].querySelector('.char-accordion-body');
        if (body) {
            body.textContent = char.scenario || '暂无场景设定。';
        }
    }

    // Example messages
    if (accordions[2]) {
        const body = accordions[2].querySelector('.char-accordion-body');
        if (body) {
            const dialog = char.exampleDialog || char.exampleDialogue || char.firstMessage || '';
            if (dialog) {
                body.innerHTML = formatDialogHtml(dialog);
            } else {
                body.textContent = '暂无示例对话。';
            }
        }
    }

    // Creator's note
    if (accordions[3]) {
        const body = accordions[3].querySelector('.char-accordion-body');
        if (body) {
            body.textContent = char.definition || char.creatorNote || '暂无创作者备注。';
        }
    }
}

// ============================================
// 格式化对话为 HTML
// ============================================
function formatDialogHtml(text) {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.map(line => {
        if (line.trim()) {
            return '<p style="margin-top:8px;">' + escapeHtml(line) + '</p>';
        }
        return '';
    }).join('');
}

// ============================================
// 渲染标签
// ============================================
function renderTags(tags) {
    const tagsContainer = document.getElementById('charTags');
    if (!tagsContainer) return;

    if (!tags || tags.length === 0) {
        tagsContainer.innerHTML = '<span class="char-tag" style="opacity:0.5;">暂无标签</span>';
        return;
    }

    tagsContainer.innerHTML = tags.map(tag => `
        <span class="char-tag">${escapeHtml(tag)}</span>
    `).join('');
}

// ============================================
// 事件监听
// ============================================
function setupEventListeners() {
    // 开始聊天按钮（左侧卡片）
    const startChatBtn = document.getElementById('startChatBtn');
    if (startChatBtn) {
        startChatBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openChat();
        });
    }

    // 继续聊天按钮（右侧内容区）
    const continueChatBtn = document.querySelector('.btn-continue-chat');
    if (continueChatBtn) {
        continueChatBtn.addEventListener('click', openChat);
    }

    // 收藏按钮
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', toggleFavorite);
    }

    // 评论排序
    document.querySelectorAll('.char-sort-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.char-sort-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCommentSort = tab.dataset.sort;
            sortComments();
        });
    });

    // 评论输入
    const commentInput = document.getElementById('commentInput');
    const submitBtn = document.getElementById('submitCommentBtn');

    if (commentInput && submitBtn) {
        commentInput.addEventListener('input', () => {
            submitBtn.disabled = commentInput.value.trim().length === 0;
        });
        submitBtn.addEventListener('click', submitComment);
    }

    // 加载更多评论
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreComments);
    }

    // 手风琴面板
    document.querySelectorAll('.char-accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const accordion = header.parentElement;
            accordion.classList.toggle('open');
        });
    });
}

// ============================================
// 打开聊天
// ============================================
function openChat() {
    if (currentCharacter && currentCharacter.id) {
        const basePath = window.location.pathname.replace(/[^/]*$/, '');
        window.location.href = basePath + 'chat.html?character=' + encodeURIComponent(currentCharacter.id);
    }
}

// ============================================
// 收藏切换
// ============================================
async function toggleFavorite() {
    if (!currentCharacter?.id) return;

    const btn = document.getElementById('favoriteBtn');
    btn.disabled = true;

    try {
        const result = await GenSphereAPI.characters.toggleFavorite(currentCharacter.id);
        if (result.code === 401) {
            window.location.href = 'login.html';
            return;
        }
        if (result.code === 0) {
            isFavorited = !!result.data.favorited;
            renderFavoriteButton();
        } else {
            alert(result.message || '收藏失败，请稍后重试');
        }
    } catch (e) {
        alert('网络错误，请稍后重试');
    }

    btn.disabled = false;
}

function renderFavoriteButton() {
    const btn = document.getElementById('favoriteBtn');
    if (!btn) return;
    const span = btn.querySelector('span');

    if (isFavorited) {
        btn.classList.add('active');
        if (span) span.textContent = '已收藏';
    } else {
        btn.classList.remove('active');
        if (span) span.textContent = '收藏角色';
    }
}

// ============================================
// 数据规范化
// ============================================
function normalizeCharacter(char) {
    return {
        ...char,
        id: char.id,
        title: char.title || '',
        chatName: char.chatName || char.chat_name || char.title || '',
        description: char.description || '',
        personality: char.personality || char.persona || '',
        scenario: char.scenario || '',
        firstMessage: char.firstMessage || char.first_message || '',
        exampleDialogue: char.exampleDialogue || char.example_dialogue || '',
        definition: char.definition || char.creatorNote || '',
        image: char.image || '',
        creator: char.creator || char.creatorName || char.creator_name || '未知创作者',
        creatorVerified: !!char.creatorVerified || !!char.verified,
        verified: !!char.verified,
        tags: char.tags || [],
        categories: char.categories || char.category || [],
        views: char.views ?? char.viewCount ?? char.view_count ?? 0,
        chats: char.chats ?? char.chatCount ?? char.chat_count ?? 0,
        tokenCount: char.tokenCount || char.token_count || 0,
        rating: char.rating || 0,
        createdAt: formatDate(char.createdAt || char.created_at),
        updatedAt: formatDate(char.updatedAt || char.updated_at || char.createdAt || char.created_at),
        isFavorited: !!char.isFavorited
    };
}

// ============================================
// 错误状态
// ============================================
function renderCharacterError(message) {
    const container = document.querySelector('.char-detail-container');
    if (!container) return;

    container.innerHTML = `
        <div style="width:100%;text-align:center;padding:80px 20px;color:rgba(255,255,255,0.72);">
            <h1 style="font-size:24px;margin-bottom:12px;color:#fff;">加载失败</h1>
            <p style="margin-bottom:24px;">${escapeHtml(message)}</p>
            <a href="index.html" class="btn-chat-primary" style="display:inline-flex;width:auto;padding:0 24px;">返回首页</a>
        </div>
    `;
}

// ============================================
// 工具函数
// ============================================
function formatDate(value) {
    if (!value) return '-';
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp)) return String(value);
    return new Date(timestamp).toLocaleDateString('zh-CN');
}

function formatNumber(num) {
    if (num >= 10000000) return (num / 10000).toFixed(0) + '万';
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// 评论区（使用 mock 数据）
// ============================================
const mockComments = [
    {
        id: 'c1',
        username: '星河入梦',
        avatarText: '星',
        content: '这个角色太有代入感了！第一次对话就被他的气场震慑住了，每一个回应都很符合人设，完全不会出戏。',
        likes: 498,
        liked: false,
        date: '3天前',
        replies: [
            {
                id: 'r1',
                username: '月光宝盒',
                avatarText: '月',
                content: '同意！我已经聊了快一个小时了，完全停不下来',
                date: '3天前'
            }
        ]
    },
    {
        id: 'c2',
        username: '咖啡不加糖',
        avatarText: '咖',
        content: '场景描写太有画面感了，第一次对话的氛围感真的绝了！',
        likes: 456,
        liked: false,
        date: '1周前',
        replies: []
    },
    {
        id: 'c3',
        username: '南风知我意',
        avatarText: '南',
        content: '本来以为是个冷酷无情的角色，没想到聊到后面发现还有温柔的一面... 这种反差感真的太戳我了！',
        likes: 369,
        liked: false,
        date: '2周前',
        replies: []
    },
    {
        id: 'c4',
        username: '云淡风轻',
        avatarText: '云',
        content: '人设写得真好，对话风格很独特，每一句都很有分量。',
        likes: 319,
        liked: false,
        date: '2周前',
        replies: []
    }
];

function loadMockComments() {
    allComments = JSON.parse(JSON.stringify(mockComments));
    sortComments();
}

function sortComments() {
    comments = [...allComments];
    if (currentCommentSort === 'likes') {
        comments.sort((a, b) => b.likes - a.likes);
    }
    renderComments();
}

function renderComments() {
    const list = document.getElementById('commentsList');
    const countEl = document.getElementById('commentCount');
    if (!list) return;

    if (countEl) countEl.textContent = allComments.length;

    if (comments.length === 0) {
        list.innerHTML = `
            <div style="text-align:center;padding:60px 0;color:rgba(255,255,255,0.3);">
                暂无评论，来分享你的第一条有趣对话吧
            </div>
        `;
        const loadMoreSection = document.getElementById('loadMoreSection');
        if (loadMoreSection) loadMoreSection.style.display = 'none';
        return;
    }

    const visibleComments = comments.slice(0, 6);
    list.innerHTML = visibleComments.map(comment => renderCommentItem(comment)).join('');

    const loadMoreSection = document.getElementById('loadMoreSection');
    if (loadMoreSection) {
        loadMoreSection.style.display = comments.length > 6 ? 'block' : 'none';
    }

    bindCommentEvents();
}

function renderCommentItem(comment) {
    const hasReplies = comment.replies && comment.replies.length > 0;

    return `
        <div class="char-comment-item" data-id="${comment.id}">
            <div class="char-comment-header">
                <div class="char-comment-avatar">${comment.avatarText}</div>
                <div class="char-comment-info">
                    <div class="char-comment-username">@${comment.username}</div>
                    <div class="char-comment-date">${comment.date}</div>
                </div>
            </div>
            <div class="char-comment-content">${escapeHtml(comment.content)}</div>
            <div class="char-comment-actions">
                <button class="char-comment-like-btn ${comment.liked ? 'liked' : ''}" data-id="${comment.id}">
                    <svg viewBox="0 0 24 24" fill="${comment.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                    </svg>
                    <span>${comment.likes}</span>
                </button>
                <button class="char-comment-reply-btn" data-id="${comment.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 17 4 12 9 7"/>
                        <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                    </svg>
                    <span>${hasReplies ? comment.replies.length + ' 条回复' : '回复'}</span>
                </button>
            </div>
            ${hasReplies ? `
                <div class="char-comment-replies" id="replies-${comment.id}">
                    ${comment.replies.map(reply => `
                        <div class="char-reply-item">
                            <div class="char-reply-header">
                                <div class="char-reply-avatar">${reply.avatarText}</div>
                                <div class="char-reply-username">@${reply.username}</div>
                                <div style="font-size:11px;color:rgba(255,255,255,0.25);margin-left:auto;">${reply.date}</div>
                            </div>
                            <div class="char-reply-content">${escapeHtml(reply.content)}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

function bindCommentEvents() {
    document.querySelectorAll('.char-comment-like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            toggleCommentLike(id);
        });
    });

    document.querySelectorAll('.char-comment-reply-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            toggleReplies(id);
        });
    });
}

function toggleCommentLike(commentId) {
    const comment = allComments.find(c => c.id === commentId);
    if (!comment) return;
    comment.liked = !comment.liked;
    comment.likes += comment.liked ? 1 : -1;
    sortComments();
}

function toggleReplies(commentId) {
    const repliesEl = document.getElementById('replies-' + commentId);
    if (repliesEl) {
        repliesEl.classList.toggle('show');
    }
}

function submitComment() {
    const input = document.getElementById('commentInput');
    const submitBtn = document.getElementById('submitCommentBtn');
    if (!input || !submitBtn) return;

    const content = input.value.trim();
    if (!content) return;

    let username = '用户';
    let avatarText = 'U';
    const userData = localStorage.getItem('gensphere_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            username = user.username || '用户';
            avatarText = username.charAt(0).toUpperCase();
        } catch (e) {}
    }

    const newComment = {
        id: 'c_new_' + Date.now(),
        username: username,
        avatarText: avatarText,
        content: content,
        likes: 0,
        liked: false,
        date: '刚刚',
        replies: []
    };

    allComments.unshift(newComment);
    input.value = '';
    submitBtn.disabled = true;
    sortComments();
}

function loadMoreComments() {
    const currentCount = document.querySelectorAll('.char-comment-item').length;
    const nextCount = Math.min(currentCount + 3, comments.length);
    const moreComments = comments.slice(0, nextCount);

    const list = document.getElementById('commentsList');
    if (!list) return;

    list.innerHTML = moreComments.map(comment => renderCommentItem(comment)).join('');

    if (nextCount >= comments.length) {
        const loadMoreSection = document.getElementById('loadMoreSection');
        if (loadMoreSection) loadMoreSection.style.display = 'none';
    }

    bindCommentEvents();
}
