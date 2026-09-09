// ============================================
// 登录页 - 极简版
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
    addLog('[login] page loaded');

    var phoneInput = document.getElementById('phoneInput');
    var codeInput = document.getElementById('codeInput');
    var sendCodeBtn = document.getElementById('sendCodeBtn');
    var submitBtn = document.getElementById('submitBtn');
    var formHint = document.getElementById('formHint');
    var loginForm = document.getElementById('loginForm');

    if (!phoneInput || !codeInput || !sendCodeBtn || !submitBtn || !formHint) {
        addLog('[login] ERROR: elements missing');
        return;
    }

    var countdown = 0;
    var timer = null;

    // 发送验证码
    sendCodeBtn.onclick = function() {
        var phone = phoneInput.value.trim();
        formHint.textContent = '';
        formHint.style.color = '';

        if (!phone || phone.length < 6) {
            formHint.textContent = '请输入有效的手机号';
            formHint.style.color = '#ef4444';
            return;
        }
        if (countdown > 0) return;

        sendCodeBtn.disabled = true;
        sendCodeBtn.textContent = '发送中...';

        GenSphereAPI.auth.sendCode(phone).then(function(res) {
            if (res.code === 0) {
                // 根据是否已注册显示提示
                if (res.data && res.data.isRegistered) {
                    formHint.textContent = '欢迎回来，即将登录';
                    formHint.style.color = '#22c55e';
                } else {
                    formHint.textContent = '新手机号将自动创建账号';
                    formHint.style.color = '';
                }
                countdown = 60;
                sendCodeBtn.textContent = countdown + 's 后重发';
                timer = setInterval(function() {
                    countdown--;
                    if (countdown <= 0) {
                        clearInterval(timer);
                        sendCodeBtn.disabled = false;
                        sendCodeBtn.textContent = '获取验证码';
                    } else {
                        sendCodeBtn.textContent = countdown + 's 后重发';
                    }
                }, 1000);
            } else {
                formHint.textContent = res.message || '发送失败';
                formHint.style.color = '#ef4444';
                sendCodeBtn.disabled = false;
                sendCodeBtn.textContent = '获取验证码';
            }
        }).catch(function() {
            formHint.textContent = '网络错误，请稍后重试';
            formHint.style.color = '#ef4444';
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = '获取验证码';
        });
    };

    // 登录
    function doLogin() {
        var phone = phoneInput.value.trim();
        var code = codeInput.value.trim();
        formHint.textContent = '';
        formHint.style.color = '';

        if (!phone || phone.length < 6) {
            formHint.textContent = '请输入有效的手机号';
            formHint.style.color = '#ef4444';
            return;
        }
        if (!code || code.length < 4) {
            formHint.textContent = '请输入验证码';
            formHint.style.color = '#ef4444';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').textContent = '登录中...';
        addLog('[login] doLogin: phone=' + phone);

        GenSphereAPI.auth.login(phone, code).then(function(res) {
            addLog('[login] login response: code=' + res.code);

            if (res.code === 0 && res.data && res.data.token) {
                var user = res.data.user;
                localStorage.setItem(USER_KEY, JSON.stringify(user));
                addLog('[login] token saved, user=' + JSON.stringify(user).substring(0, 100));

                if (user.onboardingComplete) {
                    addLog('[login] redirect to /');
                    window.location.href = '/';
                } else if (user.username && user.username.length > 0) {
                    addLog('[login] redirect to /onboarding-topics');
                    window.location.href = '/onboarding-topics';
                } else {
                    addLog('[login] redirect to /onboarding-username');
                    window.location.href = '/onboarding-username';
                }
            } else {
                formHint.textContent = res.message || '登录失败';
                formHint.style.color = '#ef4444';
                submitBtn.disabled = false;
                submitBtn.querySelector('.btn-text').textContent = '登录';
            }
        }).catch(function(err) {
            addLog('[login] login catch: ' + err.message);
            formHint.textContent = '网络错误，请稍后重试';
            formHint.style.color = '#ef4444';
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').textContent = '登录';
        });
    }

    submitBtn.onclick = function(e) {
        e.preventDefault();
        doLogin();
    };

    if (loginForm) {
        loginForm.onsubmit = function(e) {
            e.preventDefault();
            doLogin();
        };
    }

    // 如果已登录，直接跳转
    var token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        addLog('[login] has token, checking...');
        GenSphereAPI.auth.getMe().then(function(res) {
            if (res.code === 0 && res.data) {
                var user = res.data;
                localStorage.setItem(USER_KEY, JSON.stringify(user));
                addLog('[login] auto-login ok, onboarding=' + user.onboardingComplete + ' username=' + !!user.username);
                if (user.onboardingComplete) {
                    window.location.href = '/';
                } else if (user.username && user.username.length > 0) {
                    window.location.href = '/onboarding-topics';
                }
            }
        }).catch(function() {
            addLog('[login] auto-login catch, clear token');
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        });
    }
};
