// ===== Login Page =====

const AUTH_KEY = 'gensphere_user';
const TOKEN_KEY = 'gensphere_token';
const AUTO_LOGIN_KEY = 'gensphere_autologin';

// ===== DOM Elements =====
const loginForm = document.getElementById('loginForm');
const phoneInput = document.getElementById('phoneInput');
const codeInput = document.getElementById('codeInput');
const sendCodeBtn = document.getElementById('sendCodeBtn');
const submitBtn = document.getElementById('submitBtn');
const agreeCheck = document.getElementById('agreeCheck');
const autoLoginCheck = document.getElementById('autoLoginCheck');
const formHint = document.getElementById('formHint');

let countdown = 0;
let countdownTimer = null;

// ===== Auto-login Check =====
window.addEventListener('DOMContentLoaded', async () => {
    const autoLogin = localStorage.getItem(AUTO_LOGIN_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (autoLogin === 'true' && token) {
        const result = await GenSphereAPI.auth.autoLogin(token);
        if (result.code === 0) {
            // 自动登录成功
            saveUserSession(result.data.user, token);
            redirectAfterLogin(result.data.user);
            return;
        } else {
            // token 无效，清除
            localStorage.removeItem(TOKEN_KEY);
            localStorage.setItem(AUTO_LOGIN_KEY, 'false');
        }
    }
    
    // 记住上次手机号
    const lastPhone = localStorage.getItem('gensphere_last_phone');
    if (lastPhone) {
        phoneInput.value = lastPhone;
    }
});

// ===== Send Verification Code =====
sendCodeBtn.addEventListener('click', async () => {
    const phone = phoneInput.value.trim();
    
    if (!validatePhone(phone)) {
        showHint('请输入正确的手机号', 'error');
        phoneInput.focus();
        return;
    }
    
    sendCodeBtn.disabled = true;
    sendCodeBtn.textContent = '发送中...';
    
    const result = await GenSphereAPI.auth.sendCode(phone);
    
    if (result.code === 0) {
        // 开始倒计时
        countdown = 60;
        updateCountdown();
        
        countdownTimer = setInterval(() => {
            countdown--;
            updateCountdown();
            
            if (countdown <= 0) {
                clearInterval(countdownTimer);
                sendCodeBtn.disabled = false;
                sendCodeBtn.textContent = '重新发送';
            }
        }, 1000);
        
        showHint('验证码已发送，请注意查收', 'success');
    } else {
        sendCodeBtn.disabled = false;
        sendCodeBtn.textContent = '获取验证码';
        showHint(result.message, 'error');
    }
});

function updateCountdown() {
    sendCodeBtn.textContent = `${countdown}s 后重发`;
}

// ===== Phone Validation =====
function validatePhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
}

// ===== Phone Input Formatting =====
phoneInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
});

// ===== Code Input Formatting =====
codeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
});

// ===== Show Hint =====
function showHint(message, type = 'info') {
    formHint.textContent = message;
    formHint.style.color = type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '';
    
    if (type !== 'info') {
        setTimeout(() => {
            formHint.textContent = '未注册的手机号将自动创建账号';
            formHint.style.color = '';
        }, 4000);
    }
}

// ===== Form Submit =====
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const phone = phoneInput.value.trim();
    const code = codeInput.value.trim();
    
    if (!validatePhone(phone)) {
        showHint('请输入正确的手机号', 'error');
        phoneInput.focus();
        return;
    }
    
    if (code.length !== 6) {
        showHint('请输入6位验证码', 'error');
        codeInput.focus();
        return;
    }
    
    if (!agreeCheck.checked) {
        showHint('请先阅读并同意用户协议', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = '登录中...';
    
    // 调用登录 API
    const result = await GenSphereAPI.auth.login(phone, code);
    
    if (result.code === 0) {
        const { user, token, isNewUser } = result.data;
        
        // 保存手机号
        localStorage.setItem('gensphere_last_phone', phone);
        
        // 保存 token 和用户信息
        saveUserSession(user, token);
        
        // 自动登录设置
        localStorage.setItem(AUTO_LOGIN_KEY, autoLoginCheck.checked ? 'true' : 'false');
        
        // 跳转
        redirectAfterLogin(user);
    } else {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = '登录';
        showHint(result.message, 'error');
    }
});

// ===== Save User Session =====
function saveUserSession(user, token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

// ===== Redirect Logic =====
function redirectAfterLogin(user) {
    if (user.onboardingComplete) {
        // 老用户 → 首页
        window.location.href = 'index.html';
    } else {
        // 新用户 → 新手引导
        window.location.href = 'onboarding-username.html';
    }
}

// ===== Keyboard Navigation =====
phoneInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && validatePhone(phoneInput.value.trim())) {
        codeInput.focus();
    }
});

codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        loginForm.requestSubmit();
    }
});
