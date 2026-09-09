// ============================================
// 用户名设置页 - 稳健版（只前进不后退）
// ============================================

var TOKEN_KEY = 'gensphere_token';
var USER_KEY = 'gensphere_user';

window.onload = function() {
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    var usernameInput = document.getElementById('usernameInput');
    var nextBtn = document.getElementById('nextBtn');
    var usernameHint = document.getElementById('usernameHint');
    var usernameForm = document.getElementById('usernameForm');
    var btnText = nextBtn ? nextBtn.querySelector('.btn-text') : null;

    if (!usernameInput || !nextBtn || !usernameHint || !btnText) {
        console.error('用户名页元素缺失');
        return;
    }

    // 先拉取用户信息（但失败了不回跳，让用户至少能填）
    GenSphereAPI.auth.getMe().then(function(res) {
        if (res.code === 0 && res.data) {
            var user = res.data;
            localStorage.setItem(USER_KEY, JSON.stringify(user));

            // 已经完成 onboarding → 直接进主页
            if (user.onboardingComplete) {
                window.location.href = 'index.html';
                return;
            }

            // 已经有用户名 → 直接进兴趣选择页
            if (user.username && user.username.length > 0) {
                window.location.href = 'onboarding-topics.html';
                return;
            }
        }
        // getMe 失败或用户没用户名 → 正常显示页面
        initPage();
    }).catch(function() {
        // getMe 失败不回跳！可能是网络波动，让用户继续填
        initPage();
    });

    function initPage() {
        // 输入时启用按钮
        usernameInput.oninput = function() {
            usernameHint.textContent = '2-20个字符，支持中英文、数字和下划线';
            usernameHint.style.color = '';
            nextBtn.disabled = usernameInput.value.trim().length === 0;
        };

        // 下一步（保存失败也要去兴趣页）
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
            btnText.textContent = '保存中...';

            // 先乐观地把用户名存到本地
            var currentUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
            currentUser.username = username;
            localStorage.setItem(USER_KEY, JSON.stringify(currentUser));

            // 尝试保存到后端
            GenSphereAPI.auth.updateUser({ username: username }).then(function(res) {
                if (res.code === 0 && res.data) {
                    localStorage.setItem(USER_KEY, JSON.stringify(res.data));
                }
                // 不管成功失败，都继续去兴趣页
                goToTopics();
            }).catch(function() {
                // 网络失败也继续去兴趣页（用户名存在本地，后面再同步）
                goToTopics();
            });
        }

        function goToTopics() {
            window.location.href = 'onboarding-topics.html';
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

        usernameInput.focus();
    }
};

// 全局函数：跳过用户名设置
function skipOnboarding() {
    GenSphereAPI.auth.completeOnboarding({ topics: [] }).then(function(res) {
        if (res.code === 0 && res.data) {
            localStorage.setItem('gensphere_user', JSON.stringify(res.data));
        }
        // 不管成功失败都进主页
        window.location.href = 'index.html';
    }).catch(function() {
        window.location.href = 'index.html';
    });
}
