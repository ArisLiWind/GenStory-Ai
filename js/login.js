// ============================================
// 登录页 - 重写版
// ============================================

const TOKEN_KEY = 'gensphere_token';
const USER_KEY = 'gensphere_user';

document.addEventListener('DOMContentLoaded', () => {
    // 如果已经登录了，直接跳主页
    checkAlreadyLoggedIn();

    const phoneInput = document.getElementById('phoneInput');
    const codeInput = document.getElementById('codeInput');
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    const loginBtn = document.getElementById('loginBtn');
    const phoneError = document.getElementById('phoneError');
    const codeError = document.getElementById('codeError');

    let countdown = 0;
    let timer = null;

    // 发送验证码
    sendCodeBtn.addEventListener('click', async () => {
        const phone = phoneInput.value.trim();
        phoneError.textContent = '';

        if (!phone || phone.length < 6) {
            phoneError.textContent = '请输入有效的手机号';
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
                phoneError.textContent = res.message || '发送失败';
                sendCodeBtn.disabled = false;
                sendCodeBtn.textContent = '获取验证码';
            }
        } catch (e) {
            phoneError.textContent = '网络错误，请稍后重试';
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = '获取验证码';
        }
    });

    // 登录
    loginBtn.addEventListener('click', async () => {
        const phone = phoneInput.value.trim();
        const code = codeInput.value.trim();

        phoneError.textContent = '';
        codeError.textContent = '';

        if (!phone || phone.length < 6) {
            phoneError.textContent = '请输入有效的手机号';
            return;
        }
        if (!code || code.length < 4) {
            codeError.textContent = '请输入验证码';
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = '登录中...';

        try {
            const res = await GenSphereAPI.auth.login(phone, code);

            if (res.code === 0 && res.data && res.data.token) {
                const user = res.data.user;
                const isNewUser = res.data.isNewUser;

                // 保存用户信息
                localStorage.setItem(USER_KEY, JSON.stringify(user));

                // 根据用户状态跳转
                if (user.onboardingComplete) {
                    // 老用户：直接进主页
                    window.location.href = 'index.html';
                } else if (user.username && user.username.length > 0) {
                    // 有用户名但没完成 onboarding：进兴趣选择页
                    window.location.href = 'onboarding-topics.html';
                } else {
                    // 新用户：进用户名页
                    window.location.href = 'onboarding-username.html';
                }
            } else {
                codeError.textContent = res.message || '登录失败';
                loginBtn.disabled = false;
                loginBtn.textContent = '登录 / 注册';
            }
        } catch (e) {
            codeError.textContent = '网络错误，请稍后重试';
            loginBtn.disabled = false;
            loginBtn.textContent = '登录 / 注册';
        }
    });

    // 回车登录
    codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });
});

async function checkAlreadyLoggedIn() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    // 有 token，验证一下
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
        // token 无效，清掉
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
}
