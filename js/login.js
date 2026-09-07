// ===== Login Page =====
// ===== Auth State Management =====

const AUTH_KEY = 'gensphere_user';
const AUTO_LOGIN_KEY = 'gensphere_autologin';

// ===== Auth API (Simulated Backend) =====
const AuthAPI = {
    // Mock user database
    _users: JSON.parse(localStorage.getItem('gensphere_users_db') || '{}'),
    
    _saveDB() {
        localStorage.setItem('gensphere_users_db', JSON.stringify(this._users));
    },
    
    // Check if phone is registered
    isUserExists(phone) {
        return !!this._users[phone];
    },
    
    // Send verification code
    sendCode(phone) {
        return new Promise((resolve) => {
            // Simulate API delay
            setTimeout(() => {
                // Generate random 6-digit code
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                // Store code for verification (expires in 5 min)
                sessionStorage.setItem('verify_code_' + phone, code);
                sessionStorage.setItem('verify_code_expire_' + phone, Date.now() + 5 * 60 * 1000);
                console.log('[Dev] 验证码:', code); // For development testing
                resolve({ success: true, code });
            }, 800);
        });
    },
    
    // Verify code
    verifyCode(phone, code) {
        const savedCode = sessionStorage.getItem('verify_code_' + phone);
        const expireTime = sessionStorage.getItem('verify_code_expire_' + phone);
        
        if (!savedCode || !expireTime) {
            return { success: false, error: '请先获取验证码' };
        }
        
        if (Date.now() > parseInt(expireTime)) {
            sessionStorage.removeItem('verify_code_' + phone);
            sessionStorage.removeItem('verify_code_expire_' + phone);
            return { success: false, error: '验证码已过期，请重新获取' };
        }
        
        if (savedCode !== code) {
            return { success: false, error: '验证码错误' };
        }
        
        // Code verified, consume it
        sessionStorage.removeItem('verify_code_' + phone);
        sessionStorage.removeItem('verify_code_expire_' + phone);
        
        return { success: true };
    },
    
    // Login or register
    login(phone) {
        const isNewUser = !this.isUserExists(phone);
        
        if (isNewUser) {
            // Auto create account
            this._users[phone] = {
                phone: phone,
                username: '',
                topics: [],
                createdAt: Date.now(),
                onboardingComplete: false
            };
            this._saveDB();
        }
        
        return {
            success: true,
            isNewUser: isNewUser,
            user: this._users[phone]
        };
    },
    
    // Get user info
    getUser(phone) {
        return this._users[phone] || null;
    },
    
    // Update user info
    updateUser(phone, data) {
        if (this._users[phone]) {
            this._users[phone] = { ...this._users[phone], ...data };
            this._saveDB();
            return true;
        }
        return false;
    }
};

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

// ===== Auto-login Check (on page load) =====
window.addEventListener('DOMContentLoaded', () => {
    const autoLogin = localStorage.getItem(AUTO_LOGIN_KEY);
    if (autoLogin === 'true') {
        const user = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
        if (user && user.phone) {
            // Validate user exists in DB
            const dbUser = AuthAPI.getUser(user.phone);
            if (dbUser) {
                // Redirect to home
                redirectAfterLogin(dbUser, user.phone);
                return;
            }
        }
    }
    
    // Remember last phone number
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
    
    const result = await AuthAPI.sendCode(phone);
    
    if (result.success) {
        // Start countdown
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
        
        const isNew = !AuthAPI.isUserExists(phone);
        showHint(isNew ? '验证码已发送，登录后将自动创建账号' : '验证码已发送，请注意查收', 'success');
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
    
    // Verify code
    const verifyResult = AuthAPI.verifyCode(phone, code);
    
    if (!verifyResult.success) {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = '登录';
        showHint(verifyResult.error, 'error');
        return;
    }
    
    // Login / Register
    const loginResult = AuthAPI.login(phone);
    
    if (loginResult.success) {
        // Save phone for quick fill
        localStorage.setItem('gensphere_last_phone', phone);
        
        // Save user session
        const userData = {
            phone: phone,
            username: loginResult.user.username,
            topics: loginResult.user.topics,
            onboardingComplete: loginResult.user.onboardingComplete
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
        
        // Auto login preference
        if (autoLoginCheck.checked) {
            localStorage.setItem(AUTO_LOGIN_KEY, 'true');
        } else {
            localStorage.setItem(AUTO_LOGIN_KEY, 'false');
        }
        
        // Redirect
        redirectAfterLogin(loginResult.user, phone);
    }
});

// ===== Redirect Logic =====
function redirectAfterLogin(user, phone) {
    if (user.onboardingComplete) {
        // Existing user -> home
        window.location.href = 'index.html';
    } else {
        // New user -> onboarding
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
