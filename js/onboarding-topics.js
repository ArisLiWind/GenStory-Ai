// ===== Onboarding: Topic Selection =====

const AUTH_KEY = 'gensphere_user';

const topicGrid = document.getElementById('topicGrid');
const selectedCountEl = document.getElementById('selectedCount');
const finishBtn = document.getElementById('finishBtn');

let selectedTopics = [];
let currentUser = null;
let topicItems = [];
const FALLBACK_CATEGORIES = [
    { slug: 'xianxia', name: '修仙', icon: '⚔️' },
    { slug: 'martial', name: '高武', icon: '💪' },
    { slug: 'transmigration', name: '穿越', icon: '🔄' },
    { slug: 'rebirth', name: '重生', icon: '🌀' },
    { slug: 'system', name: '系统', icon: '🎮' },
    { slug: 'infinite', name: '无限流', icon: '♾️' },
    { slug: 'cyberpunk', name: '赛博朋克', icon: '🌆' },
    { slug: 'lovecraft', name: '克苏鲁', icon: '🐙' },
    { slug: 'palace', name: '宫斗', icon: '👑' },
    { slug: 'strategy', name: '权谋', icon: '🧠' },
    { slug: 'rich', name: '豪门', icon: '💎' },
    { slug: 'mystery', name: '推理', icon: '🔍' },
    { slug: 'horror', name: '灵异', icon: '👻' },
    { slug: 'openworld', name: '开放世界', icon: '🗺️' },
    { slug: 'management', name: '经营', icon: '🏠' },
    { slug: 'raising', name: '养成', icon: '🌸' },
    { slug: 'fantasy', name: '异世界', icon: '🐉' },
    { slug: 'scifi', name: '科幻', icon: '🚀' },
    { slug: 'ancient', name: '古风', icon: '🏮' },
    { slug: 'sweet', name: '恋爱', icon: '💕' },
    { slug: 'anime', name: '动漫', icon: '🎮' },
    { slug: 'modern', name: '现代', icon: '🏙️' },
    { slug: 'oc', name: '原创OC', icon: '🎭' },
    { slug: 'male', name: '男性', icon: '♂️' },
    { slug: 'female', name: '女性', icon: '♀️' },
    { slug: 'multi', name: '多人', icon: '👥' }
];

// ===== Check Auth =====
window.addEventListener('DOMContentLoaded', async () => {
    const userStr = localStorage.getItem(AUTH_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (!user || !user.phone) {
        window.location.href = 'login.html';
        return;
    }
    
    const me = await GenSphereAPI.auth.getMe();
    currentUser = me.code === 0 && me.data ? me.data : user;
    localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));

    if (hasCompletedOnboarding(currentUser)) {
        window.location.href = 'index.html';
        return;
    }

    selectedTopics = Array.isArray(currentUser.topics) ? [...currentUser.topics] : [];
    await loadTopics();
    updateCount();
});

async function loadTopics() {
    const result = await GenSphereAPI.categories.getAll();
    const categories = result.code === 0 && Array.isArray(result.data)
        ? result.data.filter(category => category.slug !== 'all')
        : FALLBACK_CATEGORIES;

    topicGrid.innerHTML = categories.map(category => `
        <button type="button" class="topic-item ${selectedTopics.includes(category.slug) ? 'active' : ''}" data-topic="${category.slug}">
            <span class="topic-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </span>
            <span class="topic-icon">${escapeHtml(category.icon || '')}</span>
            <span class="topic-name">${escapeHtml(category.name)}</span>
        </button>
    `).join('');

    topicItems = Array.from(document.querySelectorAll('.topic-item'));
    topicItems.forEach(item => {
        item.addEventListener('click', () => toggleTopic(item));
    });
}

function toggleTopic(item) {
    const topic = item.dataset.topic;

    if (selectedTopics.includes(topic)) {
        selectedTopics = selectedTopics.filter(t => t !== topic);
        item.classList.remove('active');
    } else {
        selectedTopics.push(topic);
        item.classList.add('active');
    }

    updateCount();
}

function updateCount() {
    selectedCountEl.textContent = selectedTopics.length;
    finishBtn.disabled = selectedTopics.length === 0;
}

// ===== Finish Onboarding =====
async function finishOnboarding() {
    if (selectedTopics.length === 0 || !currentUser) return;
    
    finishBtn.disabled = true;
    finishBtn.innerHTML = '<span class="btn-text">设置中...</span>';
    
    // 调用 API 更新用户信息
    const result = await GenSphereAPI.auth.updateUser({
        topics: selectedTopics,
        onboardingComplete: true
    });
    
    if (result.code === 0) {
        // 更新本地用户信息
        localStorage.setItem(AUTH_KEY, JSON.stringify(result.data));
        
        // 进入首页
        window.location.href = 'index.html';
    } else {
        finishBtn.disabled = false;
        finishBtn.innerHTML = `
            <span class="btn-text">开始探索</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;
        alert(result.message);
    }
}

// ===== Go Back =====
function goBack() {
    window.location.href = 'onboarding-username.html';
}

// ===== Skip Onboarding =====
async function skipOnboarding() {
    if (!currentUser) return;
    
    await GenSphereAPI.auth.updateUser({
        topics: [],
        onboardingComplete: true
    });
    
    const user = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
    user.topics = [];
    user.onboardingComplete = true;
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    
    window.location.href = 'index.html';
}

function hasCompletedOnboarding(user) {
    return !!user?.onboardingComplete || (!!user?.username && Array.isArray(user?.topics) && user.topics.length > 0);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
