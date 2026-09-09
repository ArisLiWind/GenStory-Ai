// ============================================
// 兴趣选择页 - 极简稳定版
// ============================================

var TOKEN_KEY = 'gensphere_token';
var USER_KEY = 'gensphere_user';
var MAX_TOPICS = 5;

var selectedTopics = [];
var allTopics = [];

window.onload = function() {
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    var topicGrid = document.getElementById('topicGrid');
    var finishBtn = document.getElementById('finishBtn');
    var selectedCount = document.getElementById('selectedCount');

    if (!topicGrid || !finishBtn) {
        console.error('兴趣选择页元素缺失');
        return;
    }

    // 先从服务端拉取用户信息，确认状态
    GenSphereAPI.auth.getMe().then(function(res) {
        if (res.code !== 0 || !res.data) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            window.location.href = 'login.html';
            return;
        }

        var user = res.data;
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
            selectedTopics = user.topics.slice();
        }

        // 加载兴趣标签并初始化
        loadTopics().then(function() {
            initPage();
        });
    }).catch(function() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = 'login.html';
    });

    function loadTopics() {
        return GenSphereAPI.categories.list().then(function(res) {
            if (res.code === 0 && res.data && Array.isArray(res.data)) {
                allTopics = res.data.map(function(c) { return c.name || c; });
            }
        }).catch(function() {
            // 备用数据
            allTopics = [
                '恋爱养成', '玄幻奇幻', '都市生活', '悬疑推理',
                '武侠江湖', '校园青春', '科幻未来', '历史穿越',
                '恐怖灵异', '职场逆袭', '治愈日常', '搞笑沙雕',
                '游戏世界', '二次元', '古风宫斗', '西幻魔法',
                '末世生存', '无限流', '赛博朋克', '蒸汽朋克'
            ];
        });
    }

    function initPage() {
        renderTopics();
        finishBtn.onclick = finishOnboarding;
    }

    function renderTopics() {
        topicGrid.innerHTML = '';

        for (var i = 0; i < allTopics.length; i++) {
            var topic = allTopics[i];
            var tag = document.createElement('div');
            tag.className = 'topic-tag' + (selectedTopics.indexOf(topic) > -1 ? ' active' : '');
            tag.textContent = topic;
            tag.setAttribute('data-topic', topic);
            tag.onclick = function() {
                var t = this.getAttribute('data-topic');
                toggleTopic(t);
            };
            topicGrid.appendChild(tag);
        }

        updateCount();
    }

    function toggleTopic(topic) {
        var idx = selectedTopics.indexOf(topic);
        if (idx > -1) {
            selectedTopics.splice(idx, 1);
        } else {
            if (selectedTopics.length >= MAX_TOPICS) {
                return;
            }
            selectedTopics.push(topic);
        }

        // 更新 UI
        var tags = topicGrid.querySelectorAll('.topic-tag');
        for (var i = 0; i < tags.length; i++) {
            if (tags[i].getAttribute('data-topic') === topic) {
                tags[i].classList.toggle('active');
            }
        }

        updateCount();
    }

    function updateCount() {
        if (selectedCount) {
            selectedCount.textContent = selectedTopics.length;
        }
        finishBtn.disabled = selectedTopics.length === 0;
    }
};

// 全局函数，供 HTML onclick 调用
function finishOnboarding() {
    var finishBtn = document.getElementById('finishBtn');
    if (!finishBtn) return;

    if (selectedTopics.length === 0) return;

    finishBtn.disabled = true;
    finishBtn.textContent = '保存中...';

    GenSphereAPI.auth.completeOnboarding({ topics: selectedTopics }).then(function(res) {
        if (res.code === 0 && res.data) {
            localStorage.setItem(USER_KEY, JSON.stringify(res.data));
            window.location.href = 'index.html';
        } else {
            alert(res.message || '保存失败，请重试');
            finishBtn.disabled = false;
            finishBtn.textContent = '完成';
        }
    }).catch(function() {
        alert('网络错误，请稍后重试');
        finishBtn.disabled = false;
        finishBtn.textContent = '完成';
    });
}
