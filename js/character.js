// ===== Character Detail Page =====

let currentCharacter = null;
let currentSort = 'likes';
let comments = [];
let allComments = [];
let isFavorited = false;

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
        creatorVerified: true,
        verified: true,
        tags: ['黑手党', '暗黑', '权力', '反派'],
        categories: ['male', 'oc', 'fantasy', 'drama'],
        views: 128500,
        chats: 25680,
        tokens: 786,
        rating: 4.9,
        createdAt: Date.now() - 86400000 * 30,
        updatedAt: Date.now() - 86400000 * 7
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
        creatorVerified: false,
        verified: false,
        tags: ['修仙', '剑修', '高冷', '天才'],
        categories: ['xianxia', 'male', 'fantasy'],
        views: 95200,
        chats: 18450,
        tokens: 650,
        rating: 4.8,
        createdAt: Date.now() - 86400000 * 20,
        updatedAt: Date.now() - 86400000 * 3
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
        creatorVerified: true,
        verified: true,
        tags: ['赛博朋克', '雇佣兵', '夜之城', '科幻'],
        categories: ['cyberpunk', 'scifi', 'male', 'modern'],
        views: 87600,
        chats: 15230,
        tokens: 820,
        rating: 4.7,
        createdAt: Date.now() - 86400000 * 15,
        updatedAt: Date.now() - 86400000 * 2
    }
];

// Mock data for comments
const mockComments = [
    {
        id: 'c1',
        username: '星河入梦',
        avatarText: '星',
        content: '这个角色太有代入感了！第一次对话就被他的气场震慑住了，真的很有黑手党老大的感觉。每一个回应都很符合人设，完全不会出戏。',
        likes: 498,
        liked: false,
        date: '2024年8月8日',
        replies: [
            {
                id: 'r1',
                username: '月光宝盒',
                avatarText: '月',
                content: '同意！我已经聊了快一个小时了，完全停不下来',
                date: '2024年8月8日'
            },
            {
                id: 'r2',
                username: '夜行者',
                avatarText: '夜',
                content: '第一次对话的压迫感真的绝了',
                date: '2024年8月9日'
            }
        ]
    },
    {
        id: 'c2',
        username: '咖啡不加糖',
        avatarText: '咖',
        content: '我跟他说我知道他敌人的情报，结果他直接把我"请"到了他的办公室... 场面描写太有画面感了，我真的有被吓到哈哈哈',
        likes: 456,
        liked: false,
        date: '2024年6月17日',
        replies: [
            {
                id: 'r3',
                username: '深海鲸落',
                avatarText: '深',
                content: '办公室那段描写真的很绝，氛围感拉满',
                date: '2024年6月18日'
            }
        ]
    },
    {
        id: 'c3',
        username: '南风知我意',
        avatarText: '南',
        content: '本来以为是个冷酷无情的角色，没想到聊到后面发现他还有温柔的一面... 这种反差感真的太戳我了！作者人设写得真好。',
        likes: 369,
        liked: false,
        date: '2024年8月25日',
        replies: []
    },
    {
        id: 'c4',
        username: '云淡风轻',
        avatarText: '云',
        content: '我故意激怒他，结果他的反应太有意思了。不是那种无脑暴怒，而是那种冷静到让人害怕的威胁，真的很符合黑手党老大的设定。',
        likes: 319,
        liked: false,
        date: '2024年7月14日',
        replies: [
            {
                id: 'r4',
                username: '时光旅人',
                avatarText: '时',
                content: '那种冷静的威胁才是最可怕的',
                date: '2024年7月15日'
            }
        ]
    },
    {
        id: 'c5',
        username: '盛夏光年',
        avatarText: '盛',
        content: '他居然记得我随口说过的一个小细节！隔了好几天的对话还能呼应上，这个角色的记忆力太强了。',
        likes: 280,
        liked: false,
        date: '2024年5月5日',
        replies: []
    },
    {
        id: 'c6',
        username: '旧时光',
        avatarText: '旧',
        content: '聊了一个星期了，感觉这个角色越来越有深度了。从最初的对立到现在微妙的关系变化，真的像在看一部小说一样。',
        likes: 260,
        liked: false,
        date: '2024年8月4日',
        replies: [
            {
                id: 'r5',
                username: '青衫故人',
                avatarText: '青',
                content: '我也是！关系发展太自然了',
                date: '2024年8月5日'
            },
            {
                id: 'r6',
                username: '北巷南猫',
                avatarText: '北',
                content: '请问你是走什么路线的？我也想解锁这种剧情',
                date: '2024年8月6日'
            }
        ]
    },
    {
        id: 'c7',
        username: '素年锦时',
        avatarText: '素',
        content: '今天触发了一个隐藏剧情，他居然救了我... 虽然嘴上说着只是因为我还有用，但我才不信呢！！',
        likes: 199,
        liked: false,
        date: '2024年8月4日',
        replies: []
    },
    {
        id: 'c8',
        username: '清风徐来',
        avatarText: '清',
        content: '这个角色的对话风格太独特了，简短但每一句都很有分量。作者对人物性格的把控真的很到位。',
        likes: 186,
        liked: false,
        date: '2024年7月20日',
        replies: []
    }
];

document.addEventListener('DOMContentLoaded', () => {
    initCharacterPage();
});

function initCharacterPage() {
    const params = new URLSearchParams(window.location.search);
    const charId = params.get('id');
    
    if (charId) {
        loadCharacterDetail(charId);
    } else {
        loadMockCharacter();
    }
    
    setupEventListeners();
}

async function loadCharacterDetail(id) {
    const result = await GenSphereAPI.characters.getDetail(id);

    if (result.code === 0 && result.data) {
        currentCharacter = normalizeCharacter(result.data);
        isFavorited = !!currentCharacter.isFavorited;
        renderCharacter(currentCharacter);
        loadMockComments();
        return;
    }

    // 后端加载失败时 fallback 到 mock 数据（与主页一致）
    const mockChar = MOCK_CHARACTERS.find(c => String(c.id) === String(id)) || MOCK_CHARACTERS[0];
    if (mockChar) {
        currentCharacter = normalizeCharacter(mockChar);
        isFavorited = false;
        renderCharacter(currentCharacter);
        loadMockComments();
        return;
    }

    renderCharacterError(result.message || '角色信息加载失败');
}

function loadMockCharacter(id = 1) {
    loadCharacterDetail(id);
}

function renderCharacter(char) {
    document.getElementById('charTitle').textContent = char.title;
    document.getElementById('chatBtnName').textContent = char.chatName || char.title;
    document.getElementById('charDescription').textContent = char.description;
    document.getElementById('charCreator').textContent = char.creator || '未知创作者';
    document.getElementById('creatorAvatar').textContent = (char.creator || 'U').charAt(0).toUpperCase();
    
    // Views and chats
    document.getElementById('charViews').textContent = formatNumber(char.views || 0);
    document.getElementById('charChats').textContent = formatNumber(char.chats || 0);
    
    // Dates
    if (char.createdAt) {
        document.getElementById('createdAt').textContent = char.createdAt;
    }
    if (char.updatedAt) {
        document.getElementById('updatedAt').textContent = char.updatedAt;
    }
    
    // Tags
    renderTags(char.tags || []);
    
    // Image - use local image path from generateCharacters
    const charImg = document.getElementById('charImg');
    if (char.image) {
        charImg.src = char.image;
        charImg.alt = char.title;
    } else {
        charImg.src = 'assets/char-knight.jpg';
        charImg.alt = char.title;
    }
    
    // Verified badge
    if (char.verified || char.creatorVerified) {
        document.getElementById('creatorVerified').style.display = 'inline';
    }
    
    // Agent badge
    if (char.allowAgent) {
        document.getElementById('agentBadge').style.display = 'block';
    }

    renderFavoriteButton();

    // ===== Accordion panels: use real character data =====
    // Persona accordion
    const personaBody = document.querySelector('.char-accordion.open .char-accordion-body');
    if (personaBody) {
        personaBody.textContent = char.personality || '暂无性格设定。';
    }

    // Scenario accordion
    const accordions = document.querySelectorAll('.char-accordion');
    if (accordions[1]) {
        const scenarioBody = accordions[1].querySelector('.char-accordion-body');
        if (scenarioBody) {
            scenarioBody.textContent = char.scenario || '暂无场景设定。';
        }
    }

    // Example messages accordion
    if (accordions[2]) {
        const exampleBody = accordions[2].querySelector('.char-accordion-body');
        if (exampleBody) {
            const dialog = char.exampleDialog || char.exampleDialogue || '';
            if (dialog) {
                exampleBody.innerHTML = formatDialogHtml(dialog);
            } else {
                exampleBody.textContent = '暂无示例对话。';
            }
        }
    }

    // Creator's note accordion (definition)
    if (accordions[3]) {
        const noteBody = accordions[3].querySelector('.char-accordion-body');
        if (noteBody) {
            noteBody.textContent = char.definition || '暂无创作者备注。';
        }
    }
}

// Format example dialog text into HTML paragraphs
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

function renderTags(tags) {
    const tagsContainer = document.getElementById('charTags');
    tagsContainer.innerHTML = tags.map(tag => `
        <span class="char-tag">${tag}</span>
    `).join('');
}

function setupEventListeners() {
    // Start chat button
    document.getElementById('startChatBtn').addEventListener('click', (e) => {
        e.preventDefault();
        openChat();
    });

    const continueChatBtn = document.querySelector('.btn-continue-chat');
    if (continueChatBtn) {
        continueChatBtn.addEventListener('click', openChat);
    }
    
    // Favorite button
    document.getElementById('favoriteBtn').addEventListener('click', toggleFavorite);
    
    // Sort tabs
    document.querySelectorAll('.char-sort-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.char-sort-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentSort = tab.dataset.sort;
            sortComments();
        });
    });
    
    // Comment input
    const commentInput = document.getElementById('commentInput');
    const submitBtn = document.getElementById('submitCommentBtn');
    
    commentInput.addEventListener('input', () => {
        submitBtn.disabled = commentInput.value.trim().length === 0;
    });
    
    submitBtn.addEventListener('click', submitComment);
    
    // Load more
    document.getElementById('loadMoreBtn').addEventListener('click', loadMoreComments);
    
    // Accordion panels
    document.querySelectorAll('.char-accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const accordion = header.parentElement;
            accordion.classList.toggle('open');
        });
    });
}

function openChat() {
    if (currentCharacter && currentCharacter.id) {
        const basePath = window.location.pathname.replace(/[^/]*$/, '');
        window.location.href = basePath + 'chat.html?character=' + encodeURIComponent(currentCharacter.id);
    }
}

async function toggleFavorite() {
    if (!currentCharacter?.id) return;

    const btn = document.getElementById('favoriteBtn');
    btn.disabled = true;

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

    btn.disabled = false;
}

function renderFavoriteButton() {
    const btn = document.getElementById('favoriteBtn');
    const span = btn.querySelector('span');

    if (isFavorited) {
        btn.classList.add('active');
        span.textContent = '已收藏';
    } else {
        btn.classList.remove('active');
        span.textContent = '收藏角色';
    }
}

function normalizeCharacter(char) {
    return {
        ...char,
        chatName: char.chatName || char.chat_name || char.title,
        creator: char.creator || char.creatorName || char.creator_name || '未知创作者',
        views: char.views ?? char.viewCount ?? char.view_count ?? 0,
        chats: char.chats ?? char.chatCount ?? char.chat_count ?? 0,
        createdAt: formatDate(char.createdAt || char.created_at),
        updatedAt: formatDate(char.updatedAt || char.updated_at || char.createdAt || char.created_at),
        exampleDialogue: char.exampleDialogue || char.example_dialogue || ''
    };
}

function renderCharacterError(message) {
    document.querySelector('.char-detail-container').innerHTML = `
        <div style="width:100%;text-align:center;padding:80px 20px;color:rgba(255,255,255,0.72);">
            <h1 style="font-size:24px;margin-bottom:12px;color:#fff;">角色不存在或未发布</h1>
            <p style="margin-bottom:24px;">${escapeHtml(message)}</p>
            <a href="index.html" class="btn-chat-primary" style="display:inline-flex;width:auto;padding:0 24px;">返回首页</a>
        </div>
    `;
}

function formatDate(value) {
    if (!value) return '-';
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp)) return value;
    return new Date(timestamp).toLocaleDateString('zh-CN');
}

// ===== Comments =====
function loadComments(characterId) {
    // In a real app, this would call an API
    loadMockComments();
}

function loadMockComments() {
    allComments = JSON.parse(JSON.stringify(mockComments));
    sortComments();
}

function sortComments() {
    comments = [...allComments];
    
    if (currentSort === 'likes') {
        comments.sort((a, b) => b.likes - a.likes);
    } else {
        // newest - keep original order (already sorted by date desc in mock)
    }
    
    renderComments();
}

function renderComments() {
    const list = document.getElementById('commentsList');
    const count = allComments.length;
    
    document.getElementById('commentCount').textContent = count;
    
    if (comments.length === 0) {
        list.innerHTML = `
            <div style="text-align:center;padding:60px 0;color:rgba(255,255,255,0.3);">
                暂无评论，来分享你的第一条有趣对话吧
            </div>
        `;
        document.getElementById('loadMoreSection').style.display = 'none';
        return;
    }
    
    // Show first 6
    const visibleComments = comments.slice(0, 6);
    
    list.innerHTML = visibleComments.map(comment => renderCommentItem(comment)).join('');
    
    // Show/hide load more
    const loadMoreSection = document.getElementById('loadMoreSection');
    if (comments.length > 6) {
        loadMoreSection.style.display = 'block';
    } else {
        loadMoreSection.style.display = 'none';
    }
    
    // Bind event listeners
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
    // Like buttons
    document.querySelectorAll('.char-comment-like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            toggleCommentLike(id);
        });
    });
    
    // Reply buttons
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
    
    // Update current sort
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
    const content = input.value.trim();
    
    if (!content) return;
    
    // Get current user
    let username = '用户';
    let avatarText = 'U';
    const userData = localStorage.getItem('gensphere_user');
    if (userData) {
        const user = JSON.parse(userData);
        username = user.username || '用户';
        avatarText = username.charAt(0).toUpperCase();
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
    document.getElementById('submitCommentBtn').disabled = true;
    
    sortComments();
}

function loadMoreComments() {
    // Load 3 more
    const currentCount = document.querySelectorAll('.char-comment-item').length;
    const nextCount = Math.min(currentCount + 3, comments.length);
    const moreComments = comments.slice(0, nextCount);
    
    const list = document.getElementById('commentsList');
    list.innerHTML = moreComments.map(comment => renderCommentItem(comment)).join('');
    
    if (nextCount >= comments.length) {
        document.getElementById('loadMoreSection').style.display = 'none';
    }
    
    bindCommentEvents();
}

// ===== Helper functions =====
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
