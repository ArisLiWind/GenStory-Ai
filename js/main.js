// ===== Auth State =====
const AUTH_KEY = 'gensphere_user';
const TOKEN_KEY = 'gensphere_token';
const AUTO_LOGIN_KEY = 'gensphere_autologin';

function getCurrentUser() {
    const user = localStorage.getItem(AUTH_KEY);
    return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
    const user = getCurrentUser();
    return user && user.phone && user.onboardingComplete;
}

// ===== Auto-login check on page load =====
async function checkAutoLogin() {
    const autoLogin = localStorage.getItem(AUTO_LOGIN_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (autoLogin === 'true' && token) {
        try {
            const result = await GenSphereAPI.auth.autoLogin(token);
            if (result.code === 0) {
                // 更新本地用户信息
                localStorage.setItem(AUTH_KEY, JSON.stringify(result.data.user));
                localStorage.setItem(TOKEN_KEY, result.data.token);
            } else {
                // 自动登录失败，清除
                localStorage.removeItem(TOKEN_KEY);
                localStorage.setItem(AUTO_LOGIN_KEY, 'false');
            }
        } catch (e) {
            console.error('Auto login failed:', e);
        }
    }
}

// ===== Character Data Generator =====
function generateCharacters(count, startId = 1) {
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
    
    const categories = [
        ["male", "oc", "fictional"],
        ["male", "oc", "fictional", "sweet"],
        ["male", "female", "fictional", "multi"],
        ["male", "oc", "fictional"],
        ["game", "anime", "fantasy", "drama"],
        ["male", "oc", "fictional", "sweet"],
        ["male", "multi", "drama"],
        ["male", "fictional", "drama"],
        ["multi", "sweet", "oc"],
        ["female", "oc", "drama"],
        ["fantasy", "anime", "drama"],
        ["scifi", "drama", "male"],
        ["ancient", "drama", "male"],
        ["fantasy", "male"],
        ["scifi", "horror", "drama"],
        ["fantasy", "drama", "male", "female"],
        ["sweet", "drama", "modern"],
        ["scifi", "modern"],
        ["drama", "modern", "male"],
        ["fantasy", "male"],
        ["scifi", "female"],
        ["scifi", "drama"],
        ["fantasy", "drama"],
        ["fantasy", "drama", "male", "female"],
        ["fantasy", "male", "horror"],
        ["anime", "female", "fantasy"],
        ["ancient", "male"],
        ["multi"],
        ["anime", "fantasy"],
        ["horror", "drama", "modern"],
        ["comedy", "modern", "male"],
        ["modern", "female", "drama"],
        ["modern", "drama", "male"],
        ["modern", "drama", "male", "female"],
        ["modern", "drama", "male", "female"],
        ["modern", "sweet", "drama"],
        ["modern", "sweet", "female"],
        ["sweet", "modern"],
        ["multi", "male", "drama"],
        ["female", "modern"],
        ["male", "sweet", "modern"],
        ["female", "drama"],
        ["male", "school"]
    ];
    
    const tags = [
        ["无限制", "男性", "OC", "虚构", "反派"],
        ["男性", "OC", "虚构", "甜"],
        ["男性", "女性", "虚构", "多人"],
        ["男性", "OC", "虚构"],
        ["无限制", "游戏", "动漫", "魔法", "剧情"],
        ["无限制", "男性", "OC", "虚构", "甜"],
        ["男性", "多人"],
        ["男性", "虚构", "剧情"],
        ["多人", "甜", "OC"],
        ["女性", "OC", "剧情"],
        ["魔法", "动漫", "剧情"],
        ["科幻", "剧情", "英雄"],
        ["古风", "剧情", "男性", "武侠"],
        ["奇幻", "冒险"],
        ["科幻", "末世", "生存"],
        ["奇幻", "吸血鬼", "恋爱"],
        ["甜", "校园", "恋爱"],
        ["科幻", "赛博朋克", "动作"],
        ["悬疑", "侦探", "剧情"],
        ["奇幻", "精灵", "男性"],
        ["科幻", "机娘", "女性"],
        ["科幻", "穿越", "剧情"],
        ["奇幻", "海底", "冒险"],
        ["奇幻", "天使", "恶魔"],
        ["奇幻", "狼人", "男性"],
        ["魔法少女", "动漫", "女性"],
        ["忍者", "动作", "古风"],
        ["海盗", "冒险", "多人"],
        ["超能力", "校园", "动漫"],
        ["恐怖", "幽灵", "悬疑"],
        ["喜剧", "美食", "现代"],
        ["偶像", "音乐", "女性"],
        ["电竞", "游戏", "现代"],
        ["医生", "现代", "剧情"],
        ["师生", "校园", "恋爱"],
        ["总裁", "现代", "甜"],
        ["邻家", "甜", "现代"],
        ["青梅竹马", "甜", "校园"],
        ["双胞胎", "多人", "男性"],
        ["傲娇", "大小姐", "女性"],
        ["忠犬", "男友", "甜"],
        ["病娇", "女友", "恐怖"],
        ["学霸", "校园", "男性"]
    ];
    
    const descriptions = [
        "一位神秘的角色，有着不为人知的过去和令人着迷的性格。",
        "在这个充满奇幻色彩的世界里，你们将展开一段难忘的冒险。",
        "看似平凡的日常下，隐藏着怎样的秘密和情感纠葛？",
        "命运的齿轮开始转动，你们的相遇是偶然还是必然？",
        "在这个异世界中，你将如何书写属于自己的传奇故事？",
        "一段跨越时空的爱恋，一场惊心动魄的冒险。",
        "当真相浮出水面，你们的关系会发生怎样的变化？",
        "在黑暗中寻找光明，在绝望中寻找希望。",
        "温暖治愈的日常故事，让你的心被甜蜜填满。",
        "紧张刺激的剧情发展，每一个选择都将改变结局。"
    ];
    
    const localImages = [
        'assets/char-knight.jpg',
        'assets/char-mystic.jpg',
        'assets/char-mystic2.jpg',
        'assets/char-eren.jpg',
        'assets/char-mima.jpg',
        'assets/char-sakura.jpg',
        'assets/char-temple.jpg',
        'assets/char-pagoda.jpg',
        'assets/char-new-01.jpg',
        'assets/char-new-02.jpg',
        'assets/char-new-03.jpg',
        'assets/char-new-04.jpg',
        'assets/char-new-05.jpg',
        'assets/char-new-06.jpg',
        'assets/char-new-07.jpg',
        'assets/char-new-08.jpg',
        'assets/char-new-09.jpg',
        'assets/char-new-10.jpg'
    ];

    const personalities = [
        '冷酷而内心炽热，对信任的人极尽温柔，对敌人毫不留情',
        '活泼开朗，善于社交，但内心深处藏着不为人知的伤痛',
        '沉默寡言，行动果断，用沉默代替一切不必要的言语',
        '傲慢自大，实力强大，但会在关键时刻展现出脆弱的一面',
        '温柔体贴，善解人意，总是把别人的需求放在自己之前',
        '腹黑狡猾，城府极深，表面和善实则心狠手辣',
        '热血冲动，义气深重，为了朋友可以不顾一切',
        '冷静理性，智商超群，情感淡漠但观察力惊人',
        '病态执着，占有欲极强，对爱的人有着扭曲的深情',
        '随性洒脱，不拘小节，看似懒散实则在暗中布局一切'
    ];

    const scenarios = [
        '联邦情报局·绝密地下指挥室——多种族融合期的敏感时刻，异常能量波动引发秘密调查行动',
        '异世界转生——你在一座陌生的魔法学院醒来，发现自己拥有了前世的记忆和新的力量',
        '末世废土——核灾后的第三年，你在废墟中建立了一个小型避难所，资源日益枯竭',
        '古代江湖——武林各大门派暗流涌动，一本失传的武学秘籍重现人间，引发血雨腥风',
        '赛博朋克都市——2077年的夜之城，巨型企业与地下黑客组织的暗战从未停歇',
        '深渊地牢——你被冤枉入狱，在暗无天日的地牢深处遇到了一位同样被遗忘的存在',
        '星际战场——联邦与虫族的战争进入白热化阶段，你被紧急调往前线指挥舰队',
        '吸血鬼城堡——月圆之夜，你误入了一座古老的城堡，这里住着一位沉睡了千年的吸血鬼',
        '校园日常——看似平静的高中生活下，隐藏着一段跨越前世今生的宿命情缘',
        '海盗黄金时代——加勒比海上，你是新一代海盗王的有力竞争者'
    ];

    const firstMessages = [
        '**【场景：联邦情报局 · 绝密地下指挥室】**\n\n昏暗的灯光下，全息投影在会议桌上投射出几个闪烁的能量波动点。纪陇——联邦最年轻的情报局副局长，正站在投影前，银白色的短发在蓝光中显得格外凌厉。\n\n她的目光扫过你，嘴角微微上扬：\n\n"指挥官，这三个异常能量源的出现时间与『融合纪念日』完全重合。这不是巧合。"\n\n她将一份加密文件推到你面前：\n\n"我的建议是——启动秘密调查。大张旗鼓地调动联邦军队只会打草惊蛇。我们需要那种『即使死在暗处也不会留下痕迹』的特工。"\n\n**你打算如何回应？**\n1. 同意启动秘密调查行动，派遣影子特工潜入异常区域\n2. 调动联邦正规军进行公开巡查，展示联邦力量\n3. 先派出无人机进行远程侦察，暂不派人',
        '你在一座陌生的房间里醒来，头痛欲裂。窗外传来鸟鸣和远处的钟声。一个身影出现在门口：\n\n"你终于醒了...你在森林里晕倒了，我把你带了回来。"\n\n你低头看着自己的双手——这似乎不是你原来的身体。一股陌生的力量在体内涌动。\n\n"这里是星辉魔法学院。你...是新生吗？"',
        '废墟中，你紧握着最后半瓶净水。远处传来变异兽的低吼。你的避难所里还有三个人等着你带食物回去。\n\n突然，一个身影出现在废墟尽头，手里拿着一把还在冒烟的枪。',
        '雨夜。酒馆。一封密信被拍在你面前。\n\n"江湖传言，『天罡秘录』重现人间。各派已暗中派出高手争夺。"\n\n送信人压低斗笠，露出一双锐利的眼睛：\n\n"你...要不要入局？"',
    ];

    const exampleDialogs = [
        '{{user}}: 我同意启动秘密调查。\n{{char}}: （她微微挑眉，对你的选择表示赞许）"明智的选择。大张旗鼓地出动联邦军队只会让那些阴影中的家伙提前收敛。"\n\n她转过身，对着阴影处打了个手势："既然决定了，那就立刻启动『幽灵计划』。"\n\n{{user}}: 幽灵计划？\n{{char}}: "联邦最精锐的影子特工——一群融合了魔法隐匿术与高科技伪装装置的精英。他们会悄无声息地潜入那些异常区域。"',
        '{{user}}: 我这是在哪？\n{{char}}: "这里是星辉魔法学院。你昏迷了三天...你的身体里有一种我说不清的能量。"\n\n她犹豫了一下，递过一面镜子。\n\n{{user}}: 这...这不是我！\n{{char}}: "我也不知道发生了什么，但学院院长说你可能是...『转生者』。"',
    ];

    const definitions = [
        '纪陇是联邦情报局副局长，拥有精灵与人类的混血血统。她精通魔法隐匿术和高科技情报分析，性格冷静果断。她对"融合纪念日"的异常能量波动有着敏锐的直觉。',
        '一个从现代世界转生到魔法学院的灵魂，拥有前世的知识和新的魔法天赋。性格随前世记忆的影响而变化。',
        '末世幸存者，领导一个小型避难所。在核灾前的身份不明，但展现出超越常人的生存能力。',
    ];

    const chars = [];
    for (let i = 0; i < count; i++) {
        const idx = (startId + i - 1) % titles.length;
        const rand = Math.floor(Math.random() * 10);
        const charId = startId + i;
        
        // 使用本地素材图，超过数量则循环复用
        const image = localImages[(charId - 1) % localImages.length];
        
        const ratings = [3.5, 3.6, 3.7, 3.8, 3.9, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0];
        
        chars.push({
            id: charId,
            title: titles[idx] + (startId > 1 ? ` ${Math.ceil((startId + i) / titles.length)}` : ''),
            creator: creators[Math.floor(Math.random() * creators.length)],
            verified: Math.random() > 0.6,
            description: descriptions[rand],
            views: formatViews(Math.floor(Math.random() * 50000000) + 100000),
            chats: Math.floor(Math.random() * 500) + 5,
            tokens: Math.floor(Math.random() * 5000) + 200,
            rating: ratings[Math.floor(Math.random() * ratings.length)],
            tags: tags[idx],
            category: categories[idx],
            image: image,
            chatName: titles[idx],
            contentLevel: Math.random() > 0.5 ? 'SFW' : 'NSFW',
            personality: personalities[idx % personalities.length],
            scenario: scenarios[idx % scenarios.length],
            firstMessage: firstMessages[idx % firstMessages.length],
            exampleDialog: exampleDialogs[idx % exampleDialogs.length],
            definition: definitions[idx % definitions.length]
        });
    }
    
    return chars;
}

function formatViews(num) {
    if (num >= 100000000) {
        return (num / 100000000).toFixed(1) + '亿';
    } else if (num >= 10000) {
        return (num / 10000).toFixed(0) + '万';
    }
    return num.toString();
}

// ===== State =====
let allCharacters = [];
let filteredCharacters = [];
let currentPage = 1;
const pageSize = 12;
let isLoading = false;
let hasMore = true;
let totalCharacters = 0;
let useBackendData = false;

let currentCategory = 'all';
let currentFilter = 'characters';
let currentSort = 'hot';
let currentSortBy = 'views';

// ===== DOM Elements =====
const guestView = document.getElementById('guestView');
const loggedView = document.getElementById('loggedView');
const authButtons = document.getElementById('authButtons');
const userMenu = document.getElementById('userMenu');
const userAvatar = document.getElementById('userAvatar');
const userAvatarText = document.getElementById('userAvatarText');
const userDropdown = document.getElementById('userDropdown');
const dropdownUsername = document.getElementById('dropdownUsername');
const dropdownPhone = document.getElementById('dropdownPhone');
const dropdownAvatarText = document.getElementById('dropdownAvatarText');
const logoutBtn = document.getElementById('logoutBtn');

const loginModal = document.getElementById('loginModal');
const modalClose = document.getElementById('modalClose');
const modalOverlay = document.querySelector('.login-modal-overlay');

const characterGrid = document.getElementById('characterGrid');
const guestCharacterGrid = document.getElementById('guestCharacterGrid');
const categoryTags = document.querySelectorAll('.category-tag');
const filterTabs = document.querySelectorAll('.filter-tab');
const sortTabs = document.querySelectorAll('.sort-tab');
const sortOptions = document.querySelectorAll('.sort-option');
const scrollIndicator = document.getElementById('scrollIndicator');
const endOfList = document.getElementById('endOfList');
const backToTopBtn = document.getElementById('backToTop');
const themeToggle = document.getElementById('themeToggle');
const themeToggleLogged = document.getElementById('themeToggleLogged');
const navbar = document.querySelector('.navbar');

// ===== Initialize View Based on Auth State =====
async function initView() {
    // 只在主页有角色网格时才初始化角色列表
    const hasCharacterGrid = !!characterGrid;
    const hasGuestGrid = !!guestCharacterGrid;

    const loggedIn = isLoggedIn();
    const user = getCurrentUser();

    if (loggedIn && user) {
        // Logged in view
        if (guestView) guestView.style.display = 'none';
        if (loggedView) loggedView.style.display = 'block';
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';

        // Update user info
        const firstChar = user.username ? user.username.charAt(0).toUpperCase() : 'U';
        if (userAvatarText) userAvatarText.textContent = firstChar;
        if (dropdownAvatarText) dropdownAvatarText.textContent = firstChar;
        if (dropdownUsername) dropdownUsername.textContent = user.username || '用户';
        if (dropdownPhone) dropdownPhone.textContent = user.phone ? maskPhone(user.phone) : '';

        // 只有主页才加载角色列表
        if (hasCharacterGrid) {
            if (allCharacters.length === 0) {
                await loadCharactersFromBackend();
            }
            renderCharacters(1);
            setupInfiniteScroll();
        }
    } else {
        // Guest view
        if (guestView) guestView.style.display = 'block';
        if (loggedView) loggedView.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';

        // 只有主页才加载角色列表
        if (hasGuestGrid) {
            if (allCharacters.length === 0) {
                await loadCharactersFromBackend();
            }
            renderGuestCharacters();
        }
    }
}

// ===== Load characters from backend API =====
async function loadCharactersFromBackend() {
    isLoading = true;

    try {
        const result = await GenSphereAPI.characters.getList({
            page: 1,
            pageSize: 50,
            category: currentCategory,
            sortBy: currentSortBy
        });

        if (result.code === 0 && result.data && Array.isArray(result.data.items)) {
            const items = result.data.items;
            if (items.length > 0) {
                allCharacters = items.map(normalizeCharFromBackend);
                filteredCharacters = [...allCharacters];
                totalCharacters = result.data.total || items.length;
                hasMore = !!result.data.hasMore;
                useBackendData = true;
                isLoading = false;
                return;
            }
        }
    } catch (e) {
        console.warn('Backend API unavailable, using mock data:', e);
    }

    // Fallback to mock data
    allCharacters = generateCharacters(200);
    filteredCharacters = [...allCharacters];
    totalCharacters = allCharacters.length;
    hasMore = false;
    useBackendData = false;
    isLoading = false;
}

// ===== Normalize backend character data to match UI format =====
function normalizeCharFromBackend(char) {
    const viewCount = char.viewCount ?? char.view_count ?? 0;
    const chatCount = char.chatCount ?? char.chat_count ?? 0;

    return {
        id: char.id,
        title: char.title,
        image: char.image || 'assets/char-knight.jpg',
        description: char.description || '',
        creator: char.creatorName || char.creator_name || '匿名用户',
        creatorId: char.creatorId || char.creator_id,
        verified: !!char.verified,
        tags: Array.isArray(char.tags) ? char.tags : [],
        categories: Array.isArray(char.categories) ? char.categories : [],
        views: formatNumber(viewCount),
        chats: formatNumber(chatCount),
        tokens: formatNumber(viewCount),
        rating: char.rating || 0,
        createdAt: char.createdAt || char.created_at,
        category: Array.isArray(char.categories) ? char.categories : (char.category || [])
    };
}

function formatNumber(num) {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return num.toString();
}

function maskPhone(phone) {
    return phone.slice(0, 3) + '****' + phone.slice(7);
}

// ===== Render Guest Preview =====
function renderGuestCharacters() {
    if (!guestCharacterGrid) return;
    const previewChars = allCharacters.slice(0, 18);
    const html = previewChars.map(char => createCharacterCard(char, true)).join('');
    guestCharacterGrid.innerHTML = html;
    observeFadeInElements();
}

// ===== Render Characters (Pagination) =====
function renderCharacters(page = 1) {
    if (!characterGrid) return;
    currentPage = page;
    const totalPages = Math.ceil(filteredCharacters.length / pageSize);
    
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageChars = filteredCharacters.slice(start, end);
    
    const html = pageChars.map(char => createCharacterCard(char, false)).join('');
    characterGrid.innerHTML = html;
    
    // 更新分页
    renderPagination(totalPages);
    
    // 滚动到顶部
    window.scrollTo({ top: document.querySelector('.main-content').offsetTop - 80, behavior: 'smooth' });
    
    observeFadeInElements();
}

// ===== 渲染分页组件 =====
function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    // 上一页按钮状态
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    // 生成页码
    let pages = [];
    const delta = 2; // 当前页左右各显示2个
    
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - delta && i <= currentPage + delta)
        ) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }
    
    pageNumbers.innerHTML = pages.map(p => {
        if (p === '...') {
            return '<span class="page-ellipsis">...</span>';
        }
        return `<button class="page-number ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }).join('');
    
    // 绑定页码点击
    pageNumbers.querySelectorAll('.page-number').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page !== currentPage) {
                renderCharacters(page);
            }
        });
    });
}

// ===== 上一页/下一页 =====
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        renderCharacters(currentPage - 1);
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    const totalPages = Math.ceil(filteredCharacters.length / pageSize);
    if (currentPage < totalPages) {
        renderCharacters(currentPage + 1);
    }
});

function createCharacterCard(char, isGuest = false) {
    const tagsHtml = char.tags.slice(0, 4).map(tag => `
        <span class="card-tag">${tag}</span>
    `).join('');
    
    const clickClass = isGuest ? 'card-guest' : '';
    
    return `
        <div class="character-card fade-in ${clickClass}" data-id="${char.id}" ${isGuest ? 'data-require-login="true"' : ''}>
            <div class="card-header">${char.title}</div>
            <div class="card-image-wrapper">
                <img src="${char.image}" alt="${char.title}" class="card-image" loading="lazy">
                <div class="card-badges">
                    <span class="badge-chats">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        ${char.chats}
                    </span>
                </div>
            </div>
            <div class="card-content">
                <div class="card-creator">
                    <span class="card-creator-name">@${char.creator}</span>
                    ${char.verified ? '<svg class="verified-badge" viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>' : ''}
                </div>
                <p class="card-description">${char.description}</p>
                <div class="card-tags">
                    ${tagsHtml}
                </div>
                <div class="card-footer">
                    <span class="card-tokens">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                        </svg>
                        ${char.tokens} 个 Token
                    </span>
                </div>
            </div>
        </div>
    `;
}

// ===== Filter & Sort =====
function applyFilters() {
    filteredCharacters = [...allCharacters];

    if (currentCategory !== 'all') {
        filteredCharacters = filteredCharacters.filter(char => {
            const cats = char.categories || char.category || [];
            return cats.includes(currentCategory);
        });
    }

    if (currentSortBy === 'views') {
        filteredCharacters.sort((a, b) => parseCount(b.views) - parseCount(a.views));
    } else if (currentSortBy === 'rating') {
        filteredCharacters.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    } else if (currentSortBy === 'newest') {
        filteredCharacters.sort((a, b) => {
            const aTime = typeof a.createdAt === 'number' ? a.createdAt : (b.id - a.id);
            const bTime = typeof b.createdAt === 'number' ? b.createdAt : 0;
            return bTime - aTime;
        });
    }

    // 筛选后重置到第一页
    renderCharacters(1);
}

function parseCount(val) {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;
    if (val.includes('亿')) return parseFloat(val) * 100000000;
    if (val.includes('万')) return parseFloat(val) * 10000;
    return parseFloat(val) || 0;
}

function parseViews(viewsStr) {
    if (typeof viewsStr === 'number') return viewsStr;
    if (viewsStr.includes('亿')) {
        return parseFloat(viewsStr) * 100000000;
    } else if (viewsStr.includes('万')) {
        return parseFloat(viewsStr) * 10000;
    }
    return parseFloat(viewsStr);
}

// ===== Login Modal =====
function showLoginModal() {
    loginModal.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function hideLoginModal() {
    loginModal.classList.remove('visible');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', hideLoginModal);
modalOverlay.addEventListener('click', hideLoginModal);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && loginModal.classList.contains('visible')) {
        hideLoginModal();
    }
});

// ===== User Dropdown =====
const drawerOverlay = document.getElementById('drawerOverlay');

function openUserDropdown() {
    userDropdown.classList.add('visible');
    if (drawerOverlay) {
        drawerOverlay.classList.add('visible');
    }
}

function closeUserDropdown() {
    userDropdown.classList.remove('visible');
    if (drawerOverlay) {
        drawerOverlay.classList.remove('visible');
    }
}

userAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    if (userDropdown.classList.contains('visible')) {
        closeUserDropdown();
    } else {
        openUserDropdown();
    }
});

document.addEventListener('click', (e) => {
    if (!userDropdown.contains(e.target) && !userAvatar.contains(e.target)) {
        closeUserDropdown();
    }
});

if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeUserDropdown);
}

// ===== Logout =====
logoutBtn.addEventListener('click', async () => {
    closeUserDropdown();
    
    // 调用登出 API
    await GenSphereAPI.auth.logout();
    
    // 清除本地状态
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(AUTO_LOGIN_KEY, 'false');
    
    // 重置并重新初始化
    characterGrid.innerHTML = '';
    guestCharacterGrid.innerHTML = '';
    initView();
    window.scrollTo({ top: 0 });
});

// ===== Card Click =====
document.addEventListener('click', (e) => {
    const card = e.target.closest('.character-card');
    if (card) {
        const charId = card.dataset.id;
        const requireLogin = card.dataset.requireLogin === 'true';
        if (requireLogin && !isLoggedIn()) {
            showLoginModal();
            return;
        }
        if (charId) {
            const basePath = window.location.pathname.replace(/[^/]*$/, '');
            window.location.href = basePath + 'character.html?id=' + encodeURIComponent(charId);
        }
        return;
    }
    
    // Category tags require login
    if (!isLoggedIn() && e.target.closest('.category-tag')) {
        showLoginModal();
    }
    
    // Filter tabs require login
    if (!isLoggedIn() && e.target.closest('.filter-tab')) {
        showLoginModal();
    }
    
    // Sort tabs/options require login
    if (!isLoggedIn() && (e.target.closest('.sort-tab') || e.target.closest('.sort-option'))) {
        showLoginModal();
    }
});

// ===== Event Listeners =====

// Category tags
categoryTags.forEach(tag => {
    tag.addEventListener('click', () => {
        if (!isLoggedIn()) return;
        
        categoryTags.forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        currentCategory = tag.dataset.category;
        applyFilters();
    });
});

// Filter tabs
filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        if (!isLoggedIn()) return;
        
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
    });
});

// Sort tabs
sortTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        if (!isLoggedIn()) return;
        
        sortTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentSort = tab.dataset.sort;
    });
});

// Sort options
sortOptions.forEach(option => {
    option.addEventListener('click', () => {
        if (!isLoggedIn()) return;
        
        sortOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        currentSortBy = option.dataset.sortBy;
        applyFilters();
    });
});

// ===== Back to Top =====
function setupBackToTop() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== Navbar scroll effect =====
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== Theme toggle =====
function setupThemeToggle() {
    // 从本地存储读取主题偏好
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
    
    const toggles = [themeToggle, themeToggleLogged].filter(Boolean);
    toggles.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleTheme();
        });
    });
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// ===== Scroll Animation =====
function observeFadeInElements() {
    const elements = document.querySelectorAll('.fade-in:not(.visible)');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(el => observer.observe(el));
}

// ===== Search Functionality =====
const searchInputs = document.querySelectorAll('.search-input');
let searchTimeout = null;

searchInputs.forEach(input => {
    input.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.toLowerCase();
        
        searchTimeout = setTimeout(() => {
            if (!isLoggedIn()) {
                showLoginModal();
                return;
            }
            
            if (query.length > 0) {
                filteredCharacters = allCharacters.filter(char => 
                    char.title.toLowerCase().includes(query) ||
                    char.creator.toLowerCase().includes(query) ||
                    char.description.toLowerCase().includes(query)
                );
                renderCharacters(true);
            } else {
                applyFilters();
            }
        }, 200);
    });
    
    input.addEventListener('focus', () => {
        if (!isLoggedIn()) {
            showLoginModal();
            input.blur();
        }
    });
});

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', async () => {
    await checkAutoLogin();
    initView();
    setupBackToTop();
    setupThemeToggle();
});
