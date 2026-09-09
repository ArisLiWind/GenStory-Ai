// ===== Onboarding: Topics - 重写 =====

const TOKEN_KEY = 'gensphere_token';
const USER_KEY = 'gensphere_user';
const MAX_TOPICS = 5;

// DOM
const topicGrid = document.getElementById('topicGrid');
const selectedCountEl = document.getElementById('selectedCount');
const finishBtn = document.getElementById('finishBtn');

let selectedTopics = [];
let allCategories = [];

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 从服务端拉取最新用户信息
    const res = await GenSphereAPI.auth.getMe();
    if (res.code !== 0 || !res.data) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = 'login.html';
        return;
    }

    const user = res.data;
    saveUser(user);

    // 如果已经完成 onboarding，直接跳主页
    if (isOnboardingComplete(user)) {
        window.location.href = 'index.html';
        return;
    }

    // 如果还没填用户名，跳回用户名页
    if (!user.username || user.username.length === 0) {
        window.location.href = 'onboarding-username.html';
        return;
    }

    // 恢复已有选择
    if (Array.isArray(user.topics)) {
        selectedTopics = [...user.topics];
    }

    // 加载分类
    await loadCategories();
    updateCount();
});

// ===== 加载分类 =====
async function loadCategories() {
    const res = await GenSphereAPI.categories.getAll();

    if (res.code === 0 && Array.isArray(res.data)) {
        allCategories = res.data.filter(c => c.slug !== 'all');
    } else {
        // 备用数据
        allCategories = [
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
    }

    renderTopics();
}

function renderTopics() {
    topicGrid.innerHTML = allCategories.map(cat => {
        const isActive = selectedTopics.includes(cat.slug);
        return `
            <button type="button" class="topic-tag ${isActive ? 'active' : ''}" data-topic="${cat.slug}">
                <span class="topic-tag-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </span>
                <span class="topic-tag-icon">${escapeHtml(cat.icon || '')}</span>
                <span class="topic-tag-name">${escapeHtml(cat.name)}</span>
            </button>
        `;
    }).join('');

    topicGrid.querySelectorAll('.topic-tag').forEach(btn => {
        btn.addEventListener('click', () => toggleTopic(btn));
    });
}

function toggleTopic(btn) {
    const topic = btn.dataset.topic;
    const idx = selectedTopics.indexOf(topic);

    if (idx > -1) {
        selectedTopics.splice(idx, 1);
        btn.classList.remove('active');
    } else {
        if (selectedTopics.length >= MAX_TOPICS) return;
        selectedTopics.push(topic);
        btn.classList.add('active');
    }

    updateCount();
}

function updateCount() {
    selectedCountEl.textContent = selectedTopics.length;
    finishBtn.disabled = selectedTopics.length === 0;
}

// ===== 完成 =====
async function finishOnboarding() {
    if (selectedTopics.length === 0) return;

    finishBtn.disabled = true;
    finishBtn.innerHTML = '<span class="btn-text">设置中...</span>';

    const res = await GenSphereAPI.auth.updateUser({
        topics: selectedTopics,
        onboardingComplete: true
    });

    if (res.code === 0 && res.data) {
        saveUser(res.data);
        window.location.href = 'index.html';
    } else {
        finishBtn.disabled = false;
        finishBtn.innerHTML = '<span class="btn-text">继续</span>';
        alert(res.message || '保存失败');
    }
}

// ===== 跳过 =====
async function skipOnboarding() {
    const res = await GenSphereAPI.auth.updateUser({
        topics: [],
        onboardingComplete: true
    });
    if (res.code === 0 && res.data) {
        saveUser(res.data);
    }
    window.location.href = 'index.html';
}

// ===== 工具函数 =====
function saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function isOnboardingComplete(user) {
    if (!user) return false;
    if (user.onboardingComplete) return true;
    if (user.username && Array.isArray(user.topics) && user.topics.length > 0) return true;
    return false;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
