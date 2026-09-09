// ===== Login Page - 重写 =====

const TOKEN_KEY = 'gensphere_token';
const USER_KEY = 'gensphere_user';

// DOM
const phoneInput = document.getElementById('phoneInput');
const codeInput = document.getElementById('codeInput');
const sendCodeBtn = document.getElementById('sendCodeBtn');
const loginBtn = document.getElementById('loginBtn');
const phoneError = document.getElementById('phoneError');
const codeError = document.getElementById('codeError');
const loginForm = document.getElementById('loginForm');

let countdown = 0;
let countdownTimer = null;

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    // 如果已经登录且完成 onboarding，直接跳主页
    checkAndRedirect();
});

async function checkAndRedirect() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
        const res = await GenSphereAPI.auth.getMe();
        if (res.code === 0 && res.data) {
            saveUser(res.data);
            if (isOnboardingComplete(res.data)) {
                window.location.href = 'index.html';
            }
        }
    } catch (e) {
        // token 无效就清掉
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
}

// ===== 发送验证码 =====
sendCodeBtn.addEventListener('click', async () => {
    if (countdown > 0) return;

    const phone = phoneInput.value.trim();
    if (!validatePhone(phone)) {
        showError(phoneError, '请输入正确的手机号');
        return;
    }
    clearError(phoneError);

    sendCodeBtn.disabled = true;
    sendCodeBtn.textContent = '发送中...';

    const res = await GenSphereAPI.auth.sendCode(phone);

    if (res.code === 0) {
        startCountdown();
    } else {
        sendCodeBtn.disabled = false;
        sendCodeBtn.textContent = '获取验证码';
        showError(phoneError, res.message || '发送失败');
    }
});

function startCountdown() {
    countdown = 60;
    sendCodeBtn.disabled = true;
    sendCodeBtn.textContent = `${countdown}s 后重发`;

    countdownTimer = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
            clearInterval(countdownTimer);
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = '获取验证码';
        } else {
            sendCodeBtn.textContent = `${countdown}s 后重发`;
        }
    }, 1000);
}

// ===== 登录 =====
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = phoneInput.value.trim();
    const code = codeInput.value.trim();

    // 校验
    if (!validatePhone(phone)) {
        showError(phoneError, '请输入正确的手机号');
        return;
    }
    if (!code || code.length < 4) {
        showError(codeError, '请输入验证码');
        return;
    }
    clearError(phoneError);
    clearError(codeError);

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="btn-text">登录中...</span>';

    const res = await GenSphereAPI.auth.login(phone, code);

    if (res.code === 0 && res.data) {
        const { user, isNewUser } = res.data;
        saveUser(user);

        if (isNewUser) {
            // 新用户 → 填用户名
            window.location.href = 'onboarding-username.html';
        } else if (isOnboardingComplete(user)) {
            // 老用户且完成 onboarding → 主页
            window.location.href = 'index.html';
        } else {
            // 老用户但没完成 onboarding → 补填用户名
            window.location.href = 'onboarding-username.html';
        }
    } else {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span class="btn-text">登录 / 注册</span>';
        showError(codeError, res.message || '登录失败');
    }
});

// ===== 工具函数 =====
function validatePhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
}

function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}

function clearError(el) {
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
}

function saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function isOnboardingComplete(user) {
    if (!user) return false;
    if (user.onboardingComplete) return true;
    if (user.username && Array.isArray(user.topics) && user.topics.length > 0) return true;
    return false;
}
