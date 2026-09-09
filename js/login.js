// ============================================
// 登录页 - 极简稳定版
// ============================================

const TOKEN_KEY = 'gensphere_token';
const USER_KEY = 'gensphere_user';

window.onload = function() {
    var phoneInput = document.getElementById('phoneInput');
    var codeInput = document.getElementById('codeInput');
    var sendCodeBtn = document.getElementById('sendCodeBtn');
    var submitBtn = document.getElementById('submitBtn');
    var formHint = document.getElementById('formHint');
    var loginForm = document.getElementById('loginForm');
    var btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;

    if (!phoneInput || !codeInput || !sendCodeBtn || !submitBtn || !formHint || !btnText) {
        console.error('登录页元素缺失');
        return;
    }

    var countdown = 0;
    var timer = null;
    var phoneRegistered = null; // null=未知, true=已注册, false=未注册

    // 更新提示文字
    function updateHint() {
        if (phoneRegistered === true) {
            formHint.textContent = '欢迎回来，请输入验证码登录';
            formHint.style.color = '';
            btnText.textContent = '登录';
        } else if (phoneRegistered === false) {
            formHint.textContent = '新手机号将自动创建账号';
            formHint.style.color = '';
            btnText.textContent = '注册并登录';
        } else {
            formHint.textContent = '未注册的手机号将自动创建账号';
            formHint.style.color = '';
            btnText.textContent = '登录';
        }
    }

    // 手机号输入变化时重置状态
    phoneInput.oninput = function() {
        phoneRegistered = null;
        updateHint();
    };

    // 发送验证码
    sendCodeBtn.onclick = function() {
        var phone = phoneInput.value.trim();
        phoneRegistered = null;

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
                // 更新注册状态
                if (res.data && res.data.isRegistered !== undefined) {
                    phoneRegistered = res.data.isRegistered;
                }
                updateHint();

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
        btnText.textContent = '登录中...';

        GenSphereAPI.auth.login(phone, code).then(function(res) {
            if (res.code === 0 && res.data && res.data.token) {
                var user = res.data.user;
                localStorage.setItem(USER_KEY, JSON.stringify(user));

                if (user.onboardingComplete) {
                    window.location.assign('/');
                } else if (user.username && user.username.length > 0) {
                    window.location.assign('/onboarding-topics');
                } else {
                    window.location.assign('/onboarding-username');
                }
            } else {
                formHint.textContent = res.message || '登录失败';
                formHint.style.color = '#ef4444';
                submitBtn.disabled = false;
                btnText.textContent = phoneRegistered ? '登录' : '注册并登录';
            }
        }).catch(function() {
            formHint.textContent = '网络错误，请稍后重试';
            formHint.style.color = '#ef4444';
            submitBtn.disabled = false;
            btnText.textContent = '登录';
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

    // 检查是否已登录
    var token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        GenSphereAPI.auth.getMe().then(function(res) {
            if (res.code === 0 && res.data) {
                var user = res.data;
                localStorage.setItem(USER_KEY, JSON.stringify(user));
                if (user.onboardingComplete) {
                    window.location.assign('/');
                } else if (user.username && user.username.length > 0) {
                    window.location.assign('/onboarding-topics');
                } else {
                    // 停在当前页，用户可能想换号
                }
            }
        }).catch(function() {
            // token 无效就清掉
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        });
    }
};
