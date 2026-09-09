// ===== Onboarding: Username - 重写 =====

const TOKEN_KEY = 'gensphere_token';
const USER_KEY = 'gensphere_user';

// DOM
const usernameForm = document.getElementById('usernameForm');
const usernameInput = document.getElementById('usernameInput');
const usernameHint = document.getElementById('usernameHint');
const nextBtn = document.getElementById('nextBtn');

// ===== 初始化：检查登录状态 =====
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 从服务端拉取最新用户信息
    const res = await GenSphereAPI.auth.getMe();
    if (res.code !== 0 || !res.data) {
        // token 无效，回登录页
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = 'login.html';
        return;
    }

    const user = res.data;
    saveUser(user);

    // 如果已经完成 onboarding，直接跳主页
    if (isOnboardingComplete(user)) {
        window.location.href = 'index.html';
        return;
    }

    // 如果已经有用户名了，跳到兴趣选择页（说明之前填过但没走完）
    if (user.username && user.username.length > 0) {
        window.location.href = 'onboarding-topics.html';
        return;
    }

    // 正常流程：新用户填用户名
    usernameInput.focus();
});

// ===== 实时校验 =====
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

// ===== 提交用户名 =====
usernameForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    if (!username || username.length < 2) return;

    nextBtn.disabled = true;
    nextBtn.innerHTML = '<span class="btn-text">保存中...</span>';

    const res = await GenSphereAPI.auth.updateUser({ username });

    if (res.code === 0 && res.data) {
        saveUser(res.data);
        // 下一步：选兴趣
        window.location.href = 'onboarding-topics.html';
    } else {
        nextBtn.disabled = false;
        nextBtn.innerHTML = `
            <span class="btn-text">下一步</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;
        usernameHint.textContent = res.message || '保存失败';
        usernameHint.style.color = '#ef4444';
    }
});

// ===== 返回 =====
function goBack() {
    window.location.href = 'login.html';
}

// ===== 跳过 =====
async function skipOnboarding() {
    const randomName = '用户' + Math.floor(Math.random() * 10000);
    const res = await GenSphereAPI.auth.updateUser({
        username: randomName,
        topics: [],
        onboardingComplete: true
    });
    if (res.code === 0 && res.data) {
        saveUser(res.data);
    }
    window.location.href = 'index.html';
}

// ===== 工具函数 =====
function saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function isOnboardingComplete(user) {
    if (!user) return false;
    if (user.onboardingComplete) return true;
    if (user.username && Array.isArray(user.topics) && user.topics.length > 0) return true;
    return false;
}
