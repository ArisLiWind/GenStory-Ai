// ===== Onboarding: Username Setup =====

const AUTH_KEY = 'gensphere_user';

const usernameForm = document.getElementById('usernameForm');
const usernameInput = document.getElementById('usernameInput');
const usernameHint = document.getElementById('usernameHint');
const nextBtn = document.getElementById('nextBtn');

let currentUser = null;

// ===== Check Auth =====
window.addEventListener('DOMContentLoaded', async () => {
    const userStr = localStorage.getItem(AUTH_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (!user || !user.phone) {
        window.location.href = 'login.html';
        return;
    }
    
    if (user.onboardingComplete) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = user;
});

// ===== Real-time Validation =====
usernameInput.addEventListener('input', validateUsername);

function validateUsername() {
    const username = usernameInput.value.trim();
    const regex = /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/;
    
    if (username.length === 0) {
        usernameHint.textContent = '2-20个字符，支持中英文、数字和下划线';
        usernameHint.style.color = '';
        nextBtn.disabled = true;
        return;
    }
    
    if (username.length < 2) {
        usernameHint.textContent = '用户名至少需要2个字符';
        usernameHint.style.color = '#ef4444';
        nextBtn.disabled = true;
        return;
    }
    
    if (!regex.test(username)) {
        usernameHint.textContent = '用户名只能包含中英文、数字和下划线';
        usernameHint.style.color = '#ef4444';
        nextBtn.disabled = true;
        return;
    }
    
    usernameHint.textContent = '用户名可用 ✓';
    usernameHint.style.color = '#22c55e';
    nextBtn.disabled = false;
}

// ===== Form Submit =====
usernameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    
    if (!username || username.length < 2 || !currentUser) {
        return;
    }
    
    nextBtn.disabled = true;
    nextBtn.innerHTML = '<span class="btn-text">保存中...</span>';
    
    // 调用 API 更新用户名
    const result = await GenSphereAPI.auth.updateUser({
        username
    });
    
    if (result.code === 0) {
        // 更新本地用户信息
        const updatedUser = result.data;
        localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
        
        // 下一步
        window.location.href = 'onboarding-topics.html';
    } else {
        nextBtn.disabled = false;
        nextBtn.innerHTML = `
            <span class="btn-text">下一步</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;
        usernameHint.textContent = result.message;
        usernameHint.style.color = '#ef4444';
    }
});

// ===== Go Back =====
function goBack() {
    window.location.href = 'login.html';
}

// ===== Skip Onboarding =====
async function skipOnboarding() {
    if (!currentUser) return;
    
    const randomName = '用户' + Math.floor(Math.random() * 10000);
    
    await GenSphereAPI.auth.updateUser({
        username: randomName,
        topics: [],
        onboardingComplete: true
    });
    
    const user = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
    user.username = randomName;
    user.topics = [];
    user.onboardingComplete = true;
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    
    window.location.href = 'index.html';
}
