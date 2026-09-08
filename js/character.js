// ===== Character Detail Page =====

let currentCharacter = null;
let currentSort = 'likes';
let comments = [];
let allComments = [];
let isFavorited = false;

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
    try {
        const res = await GenSphereAPI.characters.getDetail(id);
        if (res.code === 0 && res.data) {
            currentCharacter = res.data;
            // 确保有图片
            if (!currentCharacter.image) {
                currentCharacter.image = `https://picsum.photos/seed/char${id}/400/520`;
            }
            renderCharacter(res.data);
            loadComments(id);
        } else {
            loadMockCharacter(id);
        }
    } catch (error) {
        console.error('Failed to load character:', error);
        loadMockCharacter(id);
    }
}

function loadMockCharacter(id = 1) {
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
    const creators = [
        "KLOOMSY", "Shxou_Huang", "hornybite", "Rowlemal", "Hurricanezer",
        "Emi Yuu", "Лик.", "scifiauthor", "wuxiamaster", "storyweaver",
        "edgyqueen", "wizardmaster", "digitalartist", "fantasywriter",
        "romanceking", "darklord", "cutemaker", "sama_senpai"
    ];
    const tagsList = [
        ['男性', 'OC', '虚构', '反派', '无限制'],
        ['男性', 'OC', '虚构', '甜'],
        ['男性', '女性', '虚构', '多人'],
        ['男性', 'OC', '虚构'],
        ['无限制', '游戏', '动漫', '魔法', '剧情'],
        ['无限制', '男性', 'OC', '虚构', '甜'],
        ['男性', '多人', '剧情'],
        ['男性', '虚构', '剧情'],
        ['多人', '甜', 'OC'],
        ['女性', 'OC', '剧情']
    ];
    
    const numericId = parseInt(id) || 1;
    const idx = (numericId - 1) % titles.length;
    
    currentCharacter = {
        id: id,
        title: titles[idx],
        chatName: titles[idx],
        description: '一位神秘的角色，有着不为人知的过去和令人着迷的性格。在这个充满奇幻色彩的世界里，你们将展开一段难忘的冒险。',
        image: `https://picsum.photos/seed/char${numericId}/400/520`,
        tags: tagsList[idx % tagsList.length],
        creator: creators[idx % creators.length],
        creatorVerified: Math.random() > 0.6,
        views: Math.floor(Math.random() * 5000000) + 100000,
        chats: Math.floor(Math.random() * 500000) + 5000,
        createdAt: '2023年6月4日',
        updatedAt: '2024年10月24日',
        allowAgent: true
    };
    renderCharacter(currentCharacter);
    loadMockComments();
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
    
    // Image
    const charImg = document.getElementById('charImg');
    if (char.image) {
        charImg.src = char.image;
        charImg.alt = char.title;
    } else {
        charImg.style.display = 'none';
    }
    
    // Verified badge
    if (char.creatorVerified) {
        document.getElementById('creatorVerified').style.display = 'inline';
    }
    
    // Agent badge
    if (char.allowAgent) {
        document.getElementById('agentBadge').style.display = 'block';
    }
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
        if (currentCharacter && currentCharacter.id) {
            const basePath = window.location.pathname.replace(/[^/]*$/, '');
            window.location.href = basePath + 'chat.html?character=' + encodeURIComponent(currentCharacter.id);
        }
    });
    
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

function toggleFavorite() {
    isFavorited = !isFavorited;
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
