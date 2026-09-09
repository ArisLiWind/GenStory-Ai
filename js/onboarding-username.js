// ============================================
// 用户名设置页 - 极简稳定版
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

        // 已经有用户名了 → 直接进兴趣选择页
        if (user.username && user.username.length > 0) {
            window.location.href = 'onboarding-topics.html';
            return;
        }

        // 正常：初始化页面
        initPage();
    }).catch(function() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = 'login.html';
    });

    function initPage() {
        // 输入时启用按钮
        usernameInput.oninput = function() {
            usernameHint.textContent = '2-20个字符，支持中英文、数字和下划线';
            usernameHint.style.color = '';
            nextBtn.disabled = usernameInput.value.trim().length === 0;
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
            btnText.textContent = '保存中...';
            usernameHint.textContent = '';

            GenSphereAPI.auth.updateUser({ username: username }).then(function(res) {
                if (res.code === 0 && res.data) {
                    localStorage.setItem(USER_KEY, JSON.stringify(res.data));
                    window.location.href = 'onboarding-topics.html';
                } else {
                    usernameHint.textContent = res.message || '保存失败，请重试';
                    usernameHint.style.color = '#ef4444';
                    nextBtn.disabled = false;
                    btnText.textContent = '下一步';
                }
            }).catch(function() {
                usernameHint.textContent = '网络错误，请稍后重试';
                usernameHint.style.color = '#ef4444';
                nextBtn.disabled = false;
                btnText.textContent = '下一步';
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

        usernameInput.focus();
    }
};

// 全局函数：跳过用户名设置
function skipOnboarding() {
    GenSphereAPI.auth.completeOnboarding({ topics: [] }).then(function(res) {
        if (res.code === 0 && res.data) {
            localStorage.setItem('gensphere_user', JSON.stringify(res.data));
            window.location.href = 'index.html';
        } else {
            alert(res.message || '操作失败，请重试');
        }
    }).catch(function() {
        alert('网络错误，请稍后重试');
    });
}
