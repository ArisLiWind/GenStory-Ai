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
    
    const chars = [];
    for (let i = 0; i < count; i++) {
        const idx = (startId + i - 1) % titles.length;
        const rand = Math.floor(Math.random() * 10);
        
        chars.push({
            id: startId + i,
            title: titles[idx] + (startId > 1 ? ` ${Math.ceil((startId + i) / titles.length)}` : ''),
            creator: creators[Math.floor(Math.random() * creators.length)],
            verified: Math.random() > 0.6,
            description: descriptions[rand],
            views: formatViews(Math.floor(Math.random() * 50000000) + 100000),
            chats: Math.floor(Math.random() * 500) + 5,
            tokens: Math.floor(Math.random() * 5000) + 200,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1),
            tags: tags[idx],
            category: categories[idx],
            image: `https://picsum.photos/seed/char${startId + i}/400/520`
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
let allCharacters = generateCharacters(200);
let filteredCharacters = [...allCharacters];
let currentPage = 1;
const pageSize = 12;
let isLoading = false;
let hasMore = true;

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
function initView() {
    const loggedIn = isLoggedIn();
    const user = getCurrentUser();
    
    if (loggedIn && user) {
        // Logged in view
        guestView.style.display = 'none';
        loggedView.style.display = 'block';
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        
        // Update user info
        const firstChar = user.username ? user.username.charAt(0).toUpperCase() : 'U';
        userAvatarText.textContent = firstChar;
        dropdownAvatarText.textContent = firstChar;
        dropdownUsername.textContent = user.username || '用户';
        dropdownPhone.textContent = user.phone ? maskPhone(user.phone) : '';
        
        // Render character grid
        if (characterGrid.children.length === 0) {
            renderCharacters(true);
            setupInfiniteScroll();
        }
    } else {
        // Guest view
        guestView.style.display = 'block';
        loggedView.style.display = 'none';
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
        
        // Render guest preview (8 cards)
        if (guestCharacterGrid.children.length === 0) {
            renderGuestCharacters();
        }
    }
}

function maskPhone(phone) {
    return phone.slice(0, 3) + '****' + phone.slice(7);
}

// ===== Render Guest Preview =====
function renderGuestCharacters() {
    const previewChars = allCharacters.slice(0, 8);
    const html = previewChars.map(char => createCharacterCard(char, true)).join('');
    guestCharacterGrid.innerHTML = html;
    observeFadeInElements();
}

// ===== Render Characters (Pagination) =====
function renderCharacters(page = 1) {
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
            <div class="card-image-wrapper">
                <img src="${char.image}" alt="${char.title}" class="card-image" loading="lazy">
                <div class="card-image-overlay"></div>
                <div class="card-badges">
                    <span class="badge-views">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        ${char.views}
                    </span>
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
                    ${char.verified ? '<svg class="verified-badge" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>' : ''}
                </div>
                <h3 class="card-title">${char.title}</h3>
                <p class="card-description">${char.description}</p>
                <div class="card-tags">
                    ${tagsHtml}
                </div>
                <div class="card-footer">
                    <span class="card-tokens">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                        ${char.tokens} 个 Token
                    </span>
                    <span class="card-rating">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                        </svg>
                        ${char.rating}
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
        filteredCharacters = filteredCharacters.filter(char => 
            char.category.includes(currentCategory)
        );
    }
    
    if (currentSortBy === 'views') {
        filteredCharacters.sort((a, b) => parseViews(b.views) - parseViews(a.views));
    } else if (currentSortBy === 'rating') {
        filteredCharacters.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    } else if (currentSortBy === 'newest') {
        filteredCharacters.sort((a, b) => b.id - a.id);
    }
    
    // 筛选后重置到第一页
    renderCharacters(1);
}

function parseViews(viewsStr) {
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
userAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('visible');
});

document.addEventListener('click', (e) => {
    if (!userDropdown.contains(e.target) && !userAvatar.contains(e.target)) {
        userDropdown.classList.remove('visible');
    }
});

// ===== Logout =====
logoutBtn.addEventListener('click', async () => {
    userDropdown.classList.remove('visible');
    
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

// ===== Card Click: Guest shows login modal =====
document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-require-login="true"]');
    if (card) {
        showLoginModal();
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
    const toggles = [themeToggle, themeToggleLogged].filter(Boolean);
    toggles.forEach(btn => {
        btn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
        });
    });
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
