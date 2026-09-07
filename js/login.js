// ===== Login Page =====

const loginForm = document.getElementById('loginForm');
const phoneInput = document.getElementById('phoneInput');
const codeInput = document.getElementById('codeInput');
const sendCodeBtn = document.getElementById('sendCodeBtn');
const submitBtn = document.getElementById('submitBtn');
const agreeCheck = document.getElementById('agreeCheck');
const formHint = document.getElementById('formHint');

let countdown = 0;
let countdownTimer = null;

// ===== Send Verification Code =====
sendCodeBtn.addEventListener('click', () => {
    const phone = phoneInput.value.trim();
    
    if (!validatePhone(phone)) {
        showHint('请输入正确的手机号', 'error');
        phoneInput.focus();
        return;
    }
    
    // Start countdown
    countdown = 60;
    sendCodeBtn.disabled = true;
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
    // Only allow digits
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
        }, 3000);
    }
}

// ===== Form Submit =====
loginForm.addEventListener('submit', (e) => {
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
    
    // Simulate login
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = '登录中...';
    
    setTimeout(() => {
        // Check if user exists (simulated)
        const isNewUser = !localStorage.getItem('gensphere_user');
        
        // Save user info
        localStorage.setItem('gensphere_user', JSON.stringify({
            phone: phone,
            isNew: isNewUser
        }));
        
        // Redirect based on user status
        if (isNewUser) {
            // New user -> onboarding
            window.location.href = 'onboarding-username.html';
        } else {
            // Existing user -> home
            window.location.href = 'index.html';
        }
    }, 1500);
});

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
