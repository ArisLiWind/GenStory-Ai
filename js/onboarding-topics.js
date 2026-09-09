// ============================================
// 兴趣选择页 - 极简版
// ============================================

var TOKEN_KEY = 'gensphere_token';
var USER_KEY = 'gensphere_user';
var LOG_KEY = 'gensphere_debug_log';
var MAX_TOPICS = 5;
var selectedTopics = [];
var allTopics = [];

function addLog(msg) {
    try {
        var logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
        logs.push(new Date().toLocaleTimeString() + ' ' + msg);
        if (logs.length > 50) logs = logs.slice(-50);
        localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    } catch(e) {}
}

var FALLBACK_TOPICS = [
    '恋爱养成', '玄幻奇幻', '都市生活', '悬疑推理',
    '武侠江湖', '校园青春', '科幻未来', '历史穿越',
    '恐怖灵异', '职场逆袭', '治愈日常', '搞笑沙雕',
    '游戏世界', '二次元', '西幻魔法', '赛博朋克',
    '无限流', '蒸汽朋克', '军旅战争', '商战职场'
];

window.onload = function() {
    addLog('[topics] page loaded, token=' + !!localStorage.getItem(TOKEN_KEY));

    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        addLog('[topics] no token, go to /login');
        window.location.href = '/login';
        return;
    }

    var topicGrid = document.getElementById('topicGrid');
    var finishBtn = document.getElementById('finishBtn');
    var selectedCount = document.getElementById('selectedCount');

    if (!topicGrid || !finishBtn) {
        addLog('[topics] ERROR: elements missing');
        return;
    }

    // 先显示备用数据，让页面立刻能用
    allTopics = FALLBACK_TOPICS.slice();
    initPage();
    addLog('[topics] page initialized with fallback topics');

    // 然后异步拉取真实用户数据
    GenSphereAPI.auth.getMe().then(function(res) {
        addLog('[topics] getMe: code=' + res.code);

        if (res.code === 0 && res.data) {
            var user = res.data;
            localStorage.setItem(USER_KEY, JSON.stringify(user));

            if (user.onboardingComplete) {
                addLog('[topics] already complete, go to /');
                window.location.href = '/';
                return;
            }

            if (!user.username || user.username.length === 0) {
                addLog('[topics] no username, go to /onboarding-username');
                window.location.href = '/onboarding-username';
                return;
            }

            // 恢复已选的兴趣
            if (user.topics && user.topics.length > 0) {
                selectedTopics = user.topics.slice();
                addLog('[topics] restored ' + selectedTopics.length + ' topics from user');
            }
        }

        // 加载话题列表
        loadTopics();
    }).catch(function(err) {
        addLog('[topics] getMe catch: ' + err.message);
        // getMe 失败也继续，用备用数据
        loadTopics();
    });

    function loadTopics() {
        try {
            GenSphereAPI.categories.getAll().then(function(res) {
                if (res.code === 0 && res.data && Array.isArray(res.data) && res.data.length > 0) {
                    allTopics = res.data
                        .map(function(c) { return c.name || c; })
                        .filter(function(name) { return name !== '全部' && name !== 'all'; });
                    addLog('[topics] loaded ' + allTopics.length + ' topics from API');
                    renderTopics();
                }
            }).catch(function() {
                addLog('[topics] categories API failed, using fallback');
            });
        } catch(e) {
            addLog('[topics] loadTopics error: ' + e.message);
        }
    }

    function initPage() {
        renderTopics();

        finishBtn.onclick = function() {
            if (selectedTopics.length === 0) return;

            finishBtn.disabled = true;
            finishBtn.querySelector('.btn-text').textContent = '保存中...';
            addLog('[topics] finish, topics=' + selectedTopics.join(','));

            GenSphereAPI.auth.completeOnboarding({ topics: selectedTopics }).then(function(res) {
                addLog('[topics] completeOnboarding: code=' + res.code);

                if (res.code === 0 && res.data) {
                    localStorage.setItem(USER_KEY, JSON.stringify(res.data));
                }
                window.location.href = '/';
            }).catch(function(err) {
                addLog('[topics] completeOnboarding catch: ' + err.message);
                // 失败也进主页，不让用户卡住
                window.location.href = '/';
            });
        };
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

// 跳过
function skipOnboarding() {
    addLog('[topics] skipOnboarding');
    GenSphereAPI.auth.completeOnboarding({ topics: [] }).then(function(res) {
        if (res.code === 0 && res.data) {
            localStorage.setItem(USER_KEY, JSON.stringify(res.data));
        }
        window.location.href = '/';
    }).catch(function() {
        window.location.href = '/';
    });
}
