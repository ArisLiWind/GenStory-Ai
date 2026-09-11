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
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
        const result = await GenSphereAPI.auth.getMe();
        if (result.code === 0 && result.data) {
            localStorage.setItem(AUTH_KEY, JSON.stringify(result.data));
        } else {
            // token 失效，清除
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(AUTH_KEY);
        }
    } catch (e) {
        console.error('Auto login check failed:', e);
    }
}

// ===== Default Character Data =====
// DEFAULT_CHARACTERS is now loaded from js/default-characters.js (included before main.js)
// Access via window.DEFAULT_CHARACTERS or the global DEFAULT_CHARACTERS variable

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
            // 先用默认数据渲染（立即显示，不等待后端）
            if (allCharacters.length === 0) {
                allCharacters = [...DEFAULT_CHARACTERS];
                filteredCharacters = [...allCharacters];
                totalCharacters = allCharacters.length;
                hasMore = false;
                useBackendData = false;
            }
            renderCharacters(1);
            setupInfiniteScroll();
            // 异步加载后端数据，加载完成后替换
            loadCharactersFromBackend().then(() => {
                if (useBackendData) {
                    renderCharacters(1);
                }
            });
        }
    } else {
        // Guest view
        if (guestView) guestView.style.display = 'block';
        if (loggedView) loggedView.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';

        // 只有主页才加载角色列表
        if (hasGuestGrid) {
            // 先用默认数据渲染（立即显示，不等待后端）
            if (allCharacters.length === 0) {
                allCharacters = [...DEFAULT_CHARACTERS];
                filteredCharacters = [...allCharacters];
                totalCharacters = allCharacters.length;
                hasMore = false;
                useBackendData = false;
            }
            renderGuestCharacters();
            // 异步加载后端数据，加载完成后替换
            loadCharactersFromBackend().then(() => {
                if (useBackendData) {
                    renderGuestCharacters();
                }
            });
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
            allCharacters = items.map(normalizeCharFromBackend);
            filteredCharacters = [...allCharacters];
            totalCharacters = result.data.total || items.length;
            hasMore = !!result.data.hasMore;
            useBackendData = true;
            isLoading = false;
            return;
        }
    } catch (e) {
        console.error('Failed to load characters from backend:', e);
    }

    // 后端加载失败时，保留已有的默认角色数据，不清空
    if (allCharacters.length === 0) {
        allCharacters = [...DEFAULT_CHARACTERS];
        filteredCharacters = [...allCharacters];
        totalCharacters = allCharacters.length;
    }
    hasMore = false;
    useBackendData = false;
    isLoading = false;
}

// ===== Normalize backend character data to match UI format =====
function normalizeCharFromBackend(char) {
    const viewCount = char.viewCount ?? char.view_count ?? 0;
    const chatCount = char.chatCount ?? char.chat_count ?? 0;
    const tokenCount = char.tokenCount ?? char.token_count ?? char.tokens ?? 0;

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
        tokens: formatNumber(tokenCount),
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
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            renderCharacters(currentPage - 1);
        }
    });
}
if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredCharacters.length / pageSize);
        if (currentPage < totalPages) {
            renderCharacters(currentPage + 1);
        }
    });
}

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
