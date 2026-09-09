// ============================================
// 用户名设置页 - 极简版
// ============================================

var TOKEN_KEY = 'gensphere_token';
var USER_KEY = 'gensphere_user';
var LOG_KEY = 'gensphere_debug_log';

function addLog(msg) {
    try {
        var logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
        logs.push(new Date().toLocaleTimeString() + ' ' + msg);
        if (logs.length > 50) logs = logs.slice(-50);
        localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    } catch(e) {}
}

window.onload = function() {
    addLog('[username] page loaded, token=' + !!localStorage.getItem(TOKEN_KEY));

    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        addLog('[username] no token, go to /login');
        window.location.href = '/login';
        return;
    }

    var usernameInput = document.getElementById('usernameInput');
    var nextBtn = document.getElementById('nextBtn');
    var usernameHint = document.getElementById('usernameHint');
    var usernameForm = document.getElementById('usernameForm');

    if (!usernameInput || !nextBtn || !usernameHint) {
        addLog('[username] ERROR: elements missing');
        return;
    }

    // 先检查用户状态
    GenSphereAPI.auth.getMe().then(function(res) {
        addLog('[username] getMe: code=' + res.code);

        if (res.code === 0 && res.data) {
            var user = res.data;
            localStorage.setItem(USER_KEY, JSON.stringify(user));

            if (user.onboardingComplete) {
                addLog('[username] already complete, go to /');
                window.location.href = '/';
                return;
            }

            if (user.username && user.username.length > 0) {
                addLog('[username] has username, go to /onboarding-topics');
                window.location.href = '/onboarding-topics';
                return;
            }
        }

        // 没完成也没用户名 → 正常显示页面
        initPage();
    }).catch(function(err) {
        addLog('[username] getMe catch: ' + err.message + ', but continue anyway');
        // 网络失败也继续显示页面，不让用户卡死
        initPage();
    });

    function initPage() {
        addLog('[username] initPage');
        usernameInput.focus();

        // 输入时启用按钮
        usernameInput.oninput = function() {
            usernameHint.textContent = '2-20个字符，支持中英文、数字和下划线';
            usernameHint.style.color = '';
            nextBtn.disabled = usernameInput.value.length === 0;
        };

        // 下一步
        function doNext() {
            var username = usernameInput.value.trim();

            if (!username) {
                usernameHint.textContent = '请输入用户名';
                usernameHint.style.color = '#ef4444';
                return;
            }
            if (username.length < 2) {
                usernameHint.textContent = '用户名至少 2 个字符';
                usernameHint.style.color = '#ef4444';
                return;
            }
            if (username.length > 20) {
                usernameHint.textContent = '用户名不能超过 20 个字符';
                usernameHint.style.color = '#ef4444';
                return;
            }

            nextBtn.disabled = true;
            nextBtn.querySelector('.btn-text').textContent = '保存中...';
            addLog('[username] doNext: username=' + username);

            GenSphereAPI.auth.updateUser({ username: username }).then(function(res) {
                addLog('[username] updateUser: code=' + res.code);

                if (res.code === 0 && res.data) {
                    localStorage.setItem(USER_KEY, JSON.stringify(res.data));
                    addLog('[username] saved, go to /onboarding-topics');
                    window.location.href = '/onboarding-topics';
                } else {
                    usernameHint.textContent = res.message || '保存失败，请重试';
                    usernameHint.style.color = '#ef4444';
                    nextBtn.disabled = false;
                    nextBtn.querySelector('.btn-text').textContent = '下一步';
                }
            }).catch(function(err) {
                addLog('[username] updateUser catch: ' + err.message);
                usernameHint.textContent = '网络错误，请稍后重试';
                usernameHint.style.color = '#ef4444';
                nextBtn.disabled = false;
                nextBtn.querySelector('.btn-text').textContent = '下一步';
            });
        }

        nextBtn.onclick = function(e) {
            e.preventDefault();
            doNext();
        };

        if (usernameForm) {
            usernameForm.onsubmit = function(e) {
                e.preventDefault();
                doNext();
            };
        }
    }
};

// 跳过
function skipOnboarding() {
    addLog('[username] skipOnboarding');
    GenSphereAPI.auth.completeOnboarding({ topics: [] }).then(function(res) {
        if (res.code === 0 && res.data) {
            localStorage.setItem(USER_KEY, JSON.stringify(res.data));
        }
        window.location.href = '/';
    }).catch(function() {
        window.location.href = '/';
    });
}
