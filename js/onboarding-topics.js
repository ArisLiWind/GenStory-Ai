// ============================================
// 兴趣选择页 - 重写版（修正ID匹配）
// ============================================

const TOKEN_KEY = 'gensphere_token';
const USER_KEY = 'gensphere_user';
const MAX_TOPICS = 5;

let selectedTopics = [];
let allTopics = [];

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

    // 已经完成 onboarding → 直接进主页
    if (user.onboardingComplete) {
        window.location.href = 'index.html';
        return;
    }

    // 没有用户名 → 回用户名页
    if (!user.username || user.username.length === 0) {
        window.location.href = 'onboarding-username.html';
        return;
    }

    // 如果用户已经有选择的兴趣，恢复选中状态
    if (user.topics && user.topics.length > 0) {
        selectedTopics = [...user.topics];
    }

    // 加载兴趣标签
    await loadTopics();

    // 初始化页面
    initTopicsPage();
});

async function loadTopics() {
    try {
        const res = await GenSphereAPI.categories.list();
        if (res.code === 0 && res.data && Array.isArray(res.data)) {
            allTopics = res.data.map(c => c.name || c);
        }
    } catch (e) {
        console.warn('加载分类失败，使用备用数据');
    }

    // 备用数据（与主页一致）
    if (!allTopics || allTopics.length === 0) {
        allTopics = [
            '恋爱养成', '玄幻奇幻', '都市生活', '悬疑推理',
            '武侠江湖', '校园青春', '科幻未来', '历史穿越',
            '恐怖灵异', '职场逆袭', '治愈日常', '搞笑沙雕',
            '游戏世界', '二次元', '古风宫斗', '西幻魔法',
            '末世生存', '无限流', '赛博朋克', '蒸汽朋克'
        ];
    }
}

function initTopicsPage() {
    const topicGrid = document.getElementById('topicGrid');
    const finishBtn = document.getElementById('finishBtn');
    const selectedCount = document.getElementById('selectedCount');

    if (!topicGrid || !finishBtn) {
        console.error('兴趣选择页元素找不到，请检查HTML id');
        return;
    }

    // 渲染标签
    renderTopics();

    // 完成按钮
    finishBtn.addEventListener('click', finishOnboarding);

    function renderTopics() {
        topicGrid.innerHTML = '';

        allTopics.forEach(topic => {
            const tag = document.createElement('div');
            tag.className = 'topic-tag' + (selectedTopics.includes(topic) ? ' active' : '');
            tag.textContent = topic;
            tag.addEventListener('click', () => toggleTopic(topic));
            topicGrid.appendChild(tag);
        });

        updateCount();
    }

    function toggleTopic(topic) {
        const idx = selectedTopics.indexOf(topic);
        if (idx > -1) {
            selectedTopics.splice(idx, 1);
        } else {
            if (selectedTopics.length >= MAX_TOPICS) {
                return; // 最多选5个
            }
            selectedTopics.push(topic);
        }

        // 更新 UI
        const tags = topicGrid.querySelectorAll('.topic-tag');
        tags.forEach(tag => {
            if (tag.textContent === topic) {
                tag.classList.toggle('active');
            }
        });

        updateCount();
    }

    function updateCount() {
        if (selectedCount) {
            selectedCount.textContent = selectedTopics.length;
        }
        finishBtn.disabled = selectedTopics.length === 0;
    }
}

// 全局函数，供 HTML onclick 调用
async function finishOnboarding() {
    const finishBtn = document.getElementById('finishBtn');
    if (!finishBtn) return;

    if (selectedTopics.length === 0) return;

    finishBtn.disabled = true;
    finishBtn.textContent = '保存中...';

    try {
        const res = await GenSphereAPI.auth.completeOnboarding({ topics: selectedTopics });

        if (res.code === 0 && res.data) {
            localStorage.setItem(USER_KEY, JSON.stringify(res.data));
            window.location.href = 'index.html';
        } else {
            alert(res.message || '保存失败，请重试');
            finishBtn.disabled = false;
            finishBtn.textContent = '完成';
        }
    } catch (e) {
        alert('网络错误，请稍后重试');
        finishBtn.disabled = false;
        finishBtn.textContent = '完成';
    }
}
