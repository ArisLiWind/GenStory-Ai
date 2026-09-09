// ============================================
// 兴趣选择页 - 重写版
// 职责：新用户选兴趣，选完调用 completeOnboarding 完成注册
// ============================================

const TOKEN_KEY = 'gensphere_token';
const USER_KEY = 'gensphere_user';
const MAX_TOPICS = 5;

let selectedTopics = [];
let username = '';

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
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    username = user.username || '';

    // 已经完成 onboarding → 直接进主页
    if (user.onboardingComplete) {
        window.location.href = 'index.html';
        return;
    }

    // 没有用户名 → 回用户名页
    if (!username || username.length === 0) {
        window.location.href = 'onboarding-username.html';
        return;
    }

    // 正常流程：加载分类标签，让用户选兴趣
    await loadTopics();
    initTopicsPage();
});

async function loadTopics() {
    const topicsGrid = document.getElementById('topicsGrid');
    if (!topicsGrid) return;

    topicsGrid.innerHTML = '<div style="text-align:center;color:#9ca3af;padding:40px;">加载中...</div>';

    try {
        const res = await GenSphereAPI.categories.getAll();

        let topics = [];
        if (res.code === 0 && res.data && res.data.length > 0) {
            topics = res.data.map(cat => ({
                id: cat.slug || cat.id,
                name: cat.name,
                icon: cat.icon || '🎭'
            }));
        } else {
            // 备用数据（和主页一致）
            topics = [
                { id: 'all', name: '全部', icon: '✨' },
                { id: 'xianxia', name: '仙侠', icon: '⚔️' },
                { id: 'xuanhuan', name: '玄幻', icon: '🐉' },
                { id: 'dushi', name: '都市', icon: '🏙️' },
                { id: 'yanqing', name: '言情', icon: '💕' },
                { id: 'lishi', name: '历史', icon: '📜' },
                { id: 'keh', name: '科幻', icon: '🚀' },
                { id: 'xuanyi', name: '悬疑', icon: '🔍' },
                { id: 'tongren', name: '同人', icon: '🎭' },
                { id: 'youxi', name: '游戏', icon: '🎮' },
                { id: 'dongman', name: '动漫', icon: '🎬' },
                { id: 'junshi', name: '军事', icon: '🎖️' },
                { id: 'tiyu', name: '体育', icon: '⚽' },
            ];
        }

        renderTopics(topics);
    } catch (e) {
        topicsGrid.innerHTML = '<div style="text-align:center;color:#ef4444;padding:40px;">加载失败，请刷新重试</div>';
    }
}

function renderTopics(topics) {
    const topicsGrid = document.getElementById('topicsGrid');
    if (!topicsGrid) return;

    topicsGrid.innerHTML = '';

    topics.forEach(topic => {
        const tag = document.createElement('div');
        tag.className = 'topic-tag';
        tag.dataset.id = topic.id;
        tag.innerHTML = `
            <span class="topic-check">✓</span>
            <span class="topic-icon">${topic.icon || '🎭'}</span>
            <span class="topic-name">${topic.name}</span>
        `;

        tag.addEventListener('click', () => toggleTopic(topic.id, topic.name, tag));
        topicsGrid.appendChild(tag);
    });

    updateNextButton();
}

function toggleTopic(id, name, tagEl) {
    const idx = selectedTopics.findIndex(t => t.id === id);

    if (idx > -1) {
        // 取消选中
        selectedTopics.splice(idx, 1);
        tagEl.classList.remove('selected');
    } else {
        // 选中
        if (selectedTopics.length >= MAX_TOPICS) {
            // 超过最大数量，提示
            const countText = document.getElementById('selectedCount');
            if (countText) {
                countText.style.color = '#ef4444';
                countText.textContent = `最多选 ${MAX_TOPICS} 个`;
                setTimeout(() => {
                    countText.style.color = '';
                    updateNextButton();
                }, 1500);
            }
            return;
        }
        selectedTopics.push({ id, name });
        tagEl.classList.add('selected');
    }

    updateNextButton();
}

function updateNextButton() {
    const nextBtn = document.getElementById('nextBtn');
    const countText = document.getElementById('selectedCount');

    if (countText) {
        countText.textContent = `已选 ${selectedTopics.length}/${MAX_TOPICS} 个`;
    }

    if (nextBtn) {
        nextBtn.disabled = selectedTopics.length === 0;
    }
}

function initTopicsPage() {
    const nextBtn = document.getElementById('nextBtn');
    const skipLink = document.getElementById('skipLink');

    // 完成 onboarding
    nextBtn.addEventListener('click', async () => {
        if (selectedTopics.length === 0) return;

        nextBtn.disabled = true;
        nextBtn.textContent = '保存中...';

        try {
            const topicIds = selectedTopics.map(t => t.id);
            const res = await GenSphereAPI.auth.completeOnboarding(username, topicIds);

            if (res.code === 0 && res.data) {
                localStorage.setItem(USER_KEY, JSON.stringify(res.data));
                // 进主页
                window.location.href = 'index.html';
            } else {
                alert(res.message || '保存失败，请重试');
                nextBtn.disabled = false;
                nextBtn.textContent = '完成';
            }
        } catch (e) {
            alert('网络错误，请稍后重试');
            nextBtn.disabled = false;
            nextBtn.textContent = '完成';
        }
    });

    // 跳过（不推荐，但保留）
    if (skipLink) {
        skipLink.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!confirm('跳过兴趣选择可能会影响内容推荐质量，确定跳过吗？')) return;

            // 跳过的话，用默认分类完成 onboarding
            try {
                const res = await GenSphereAPI.auth.completeOnboarding(username, ['all']);
                if (res.code === 0 && res.data) {
                    localStorage.setItem(USER_KEY, JSON.stringify(res.data));
                    window.location.href = 'index.html';
                }
            } catch (e) {
                alert('网络错误，请稍后重试');
            }
        });
    }
}
