// ============================================
// 登录页 - 重写版（修正ID匹配）
// ============================================

const TOKEN_KEY = 'gensphere_token';
const USER_KEY = 'gensphere_user';

document.addEventListener('DOMContentLoaded', () => {
    // 如果已经登录了，直接跳主页
    checkAlreadyLoggedIn();

    const phoneInput = document.getElementById('phoneInput');
    const codeInput = document.getElementById('codeInput');
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    const submitBtn = document.getElementById('submitBtn');
    const formHint = document.getElementById('formHint');
    const loginForm = document.getElementById('loginForm');

    if (!phoneInput || !codeInput || !sendCodeBtn || !submitBtn) {
        console.error('登录页元素找不到，请检查HTML id');
        return;
    }

    let countdown = 0;
    let timer = null;

    // 发送验证码
    sendCodeBtn.addEventListener('click', async () => {
        const phone = phoneInput.value.trim();
        formHint.textContent = '未注册的手机号将自动创建账号';
        formHint.style.color = '';

        if (!phone || phone.length < 6) {
            formHint.textContent = '请输入有效的手机号';
            formHint.style.color = '#ef4444';
            return;
        }

        if (countdown > 0) return;

        sendCodeBtn.disabled = true;
        sendCodeBtn.textContent = '发送中...';

        try {
            const res = await GenSphereAPI.auth.sendCode(phone);
            if (res.code === 0) {
                // 开始倒计时
                countdown = 60;
                sendCodeBtn.textContent = `${countdown}s 后重发`;
                timer = setInterval(() => {
                    countdown--;
                    if (countdown <= 0) {
                        clearInterval(timer);
                        sendCodeBtn.disabled = false;
                        sendCodeBtn.textContent = '获取验证码';
                    } else {
                        sendCodeBtn.textContent = `${countdown}s 后重发`;
                    }
                }, 1000);
            } else {
                formHint.textContent = res.message || '发送失败';
                formHint.style.color = '#ef4444';
                sendCodeBtn.disabled = false;
                sendCodeBtn.textContent = '获取验证码';
            }
        } catch (e) {
            formHint.textContent = '网络错误，请稍后重试';
            formHint.style.color = '#ef4444';
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = '获取验证码';
        }
    });

    // 登录
    async function doLogin() {
        const phone = phoneInput.value.trim();
        const code = codeInput.value.trim();

        formHint.textContent = '未注册的手机号将自动创建账号';
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

        try {
            const res = await GenSphereAPI.auth.login(phone, code);

            if (res.code === 0 && res.data && res.data.token) {
                const user = res.data.user;
                localStorage.setItem(USER_KEY, JSON.stringify(user));

                // 根据用户状态跳转
                if (user.onboardingComplete) {
                    window.location.href = 'index.html';
                } else if (user.username && user.username.length > 0) {
                    window.location.href = 'onboarding-topics.html';
                } else {
                    window.location.href = 'onboarding-username.html';
                }
            } else {
                formHint.textContent = res.message || '登录失败';
                formHint.style.color = '#ef4444';
                submitBtn.disabled = false;
                submitBtn.querySelector('.btn-text').textContent = '登录';
            }
        } catch (e) {
            formHint.textContent = '网络错误，请稍后重试';
            formHint.style.color = '#ef4444';
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').textContent = '登录';
        }
    }

    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        doLogin();
    });

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            doLogin();
        });
    }
});

async function checkAlreadyLoggedIn() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
        const res = await GenSphereAPI.auth.getMe();
        if (res.code === 0 && res.data) {
            const user = res.data;
            localStorage.setItem(USER_KEY, JSON.stringify(user));

            if (user.onboardingComplete) {
                window.location.href = 'index.html';
            } else if (user.username && user.username.length > 0) {
                window.location.href = 'onboarding-topics.html';
            } else {
                window.location.href = 'onboarding-username.html';
            }
        }
    } catch (e) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
}
