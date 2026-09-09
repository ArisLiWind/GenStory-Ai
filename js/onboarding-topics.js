// ============================================
// 兴趣选择页 - 稳健版（只前进不后退）
// ============================================

var TOKEN_KEY = 'gensphere_token';
var USER_KEY = 'gensphere_user';
var MAX_TOPICS = 5;

var selectedTopics = [];
var allTopics = [];

// 备用话题数据（API 失败时用）
var FALLBACK_TOPICS = [
    '恋爱养成', '玄幻奇幻', '都市生活', '悬疑推理',
    '武侠江湖', '校园青春', '科幻未来', '历史穿越',
    '恐怖灵异', '职场逆袭', '治愈日常', '搞笑沙雕',
    '游戏世界', '二次元', '古风古韵', '西幻魔法',
    '末世生存', '无限流', '赛博朋克', '蒸汽朋克'
];

window.onload = function() {
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        // 没有 token 才回登录页
        window.location.href = 'login.html';
        return;
    }

    var topicGrid = document.getElementById('topicGrid');
    var finishBtn = document.getElementById('finishBtn');
    var selectedCount = document.getElementById('selectedCount');
    var btnText = finishBtn ? finishBtn.querySelector('.btn-text') : null;

    if (!topicGrid || !finishBtn || !btnText) {
        console.error('兴趣选择页元素缺失');
        return;
    }

    // 先从本地拿用户信息，立刻初始化页面（不依赖网络）
    try {
        var localUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
        if (localUser.topics && localUser.topics.length > 0) {
            selectedTopics = localUser.topics.slice();
        }
    } catch(e) {}

    // 先显示备用数据，让页面立刻能用
    allTopics = FALLBACK_TOPICS.slice();
    initPage();

    // 然后异步拉取真实数据，失败了也不影响
    GenSphereAPI.auth.getMe().then(function(res) {
        if (res.code === 0 && res.data) {
            var user = res.data;
            localStorage.setItem(USER_KEY, JSON.stringify(user));

            // 已经完成 onboarding → 直接进主页
            if (user.onboardingComplete) {
                window.location.href = 'index.html';
                return;
            }

            // 没有用户名 → 回用户名页（但只回一次，不强制）
            if (!user.username || user.username.length === 0) {
                // 只在本地也没有用户名时才回跳
                if (!localUser.username || localUser.username.length === 0) {
                    window.location.href = 'onboarding-username.html';
                    return;
                }
            }

            // 如果用户已经有选择的兴趣，恢复选中状态
            if (user.topics && user.topics.length > 0) {
                selectedTopics = user.topics.slice();
            }
        }
        // 不管 getMe 成功失败，都加载话题列表
        loadTopics();
    }).catch(function() {
        // getMe 失败绝对不回跳！继续加载话题
        loadTopics();
    });

    function loadTopics() {
        try {
            if (GenSphereAPI.categories && typeof GenSphereAPI.categories.getAll === 'function') {
                GenSphereAPI.categories.getAll().then(function(res) {
                    if (res.code === 0 && res.data && Array.isArray(res.data) && res.data.length > 0) {
                        allTopics = res.data.map(function(c) { return c.name || c; });
                        renderTopics();
                    }
                    // 失败就用备用数据（已经初始化了）
                }).catch(function() {
                    // 用备用数据，不处理
                });
            }
        } catch(e) {
            // 用备用数据
        }
    }

    function initPage() {
        renderTopics();
        finishBtn.onclick = doFinish;
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

    function doFinish() {
        if (selectedTopics.length === 0) return;

        finishBtn.disabled = true;
        btnText.textContent = '保存中...';

        // 乐观保存到本地
        try {
            var localUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
            localUser.topics = selectedTopics;
            localUser.onboardingComplete = true;
            localStorage.setItem(USER_KEY, JSON.stringify(localUser));
        } catch(e) {}

        // 尝试保存到后端
        GenSphereAPI.auth.completeOnboarding({ topics: selectedTopics }).then(function(res) {
            if (res.code === 0 && res.data) {
                localStorage.setItem(USER_KEY, JSON.stringify(res.data));
            }
            // 不管成功失败都进主页
            goHome();
        }).catch(function() {
            // 失败也进主页（本地已经存了，后面再同步）
            goHome();
        });
    }

    function goHome() {
        window.location.href = 'index.html';
    }
};

// 全局函数：跳过兴趣选择
function skipOnboarding() {
    // 乐观标记完成
    try {
        var localUser = JSON.parse(localStorage.getItem('gensphere_user') || '{}');
        localUser.onboardingComplete = true;
        localStorage.setItem('gensphere_user', JSON.stringify(localUser));
    } catch(e) {}

    GenSphereAPI.auth.completeOnboarding({ topics: [] }).then(function(res) {
        if (res.code === 0 && res.data) {
            localStorage.setItem('gensphere_user', JSON.stringify(res.data));
        }
        window.location.href = 'index.html';
    }).catch(function() {
        window.location.href = 'index.html';
    });
}
