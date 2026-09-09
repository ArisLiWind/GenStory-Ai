// ============================================
// 用户名设置页 - 重写版（修正ID匹配）
// ============================================

const TOKEN_KEY = 'gensphere_token';
const USER_KEY = 'gensphere_user';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 从服务端拉取最新用户信息
    const res = await GenSphereAPI.auth.getMe();
    if (res.code !== 0 || !res.data) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = 'login.html';
        return;
    }

    const user = res.data;
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    // 已经完成 onboarding → 直接进主页
    if (user.onboardingComplete) {
        window.location.href = 'index.html';
        return;
    }

    // 已经有用户名了 → 直接进兴趣选择页
    if (user.username && user.username.length > 0) {
        window.location.href = 'onboarding-topics.html';
        return;
    }

    // 正常流程：新用户填用户名
    initUsernamePage();
});

function initUsernamePage() {
    const usernameInput = document.getElementById('usernameInput');
    const nextBtn = document.getElementById('nextBtn');
    const usernameHint = document.getElementById('usernameHint');
    const usernameForm = document.getElementById('usernameForm');

    if (!usernameInput || !nextBtn || !usernameHint) {
        console.error('用户名页元素找不到，请检查HTML id');
        return;
    }

    // 字数统计（如果有字数显示元素的话）
    const usernameCount = document.getElementById('usernameCount');
    if (usernameCount) {
        usernameInput.addEventListener('input', () => {
            usernameCount.textContent = `${usernameInput.value.length}/20`;
        });
    }

    // 输入时启用按钮
    usernameInput.addEventListener('input', () => {
        usernameHint.textContent = '2-20个字符，支持中英文、数字和下划线';
        usernameHint.style.color = '';
        nextBtn.disabled = usernameInput.value.length === 0;
    });

    // 下一步
    async function doNext() {
        const username = usernameInput.value.trim();

        if (!username) {
            usernameHint.textContent = '请输入用户名';
            usernameHint.style.color = '#ef4444';
            return;
        }

        if (username.length < 2) {
            usernameHint.textContent = '用户名至少 2 个字符';
            usernameHint.style.color = '#ef4444';
            return;
        }

        if (username.length > 20) {
            usernameHint.textContent = '用户名不能超过 20 个字符';
            usernameHint.style.color = '#ef4444';
            return;
        }

        nextBtn.disabled = true;
        nextBtn.textContent = '保存中...';
        usernameHint.textContent = '';

        try {
            const res = await GenSphereAPI.auth.updateUser({ username });

            if (res.code === 0 && res.data) {
                localStorage.setItem(USER_KEY, JSON.stringify(res.data));
                window.location.href = 'onboarding-topics.html';
            } else {
                usernameHint.textContent = res.message || '保存失败，请重试';
                usernameHint.style.color = '#ef4444';
                nextBtn.disabled = false;
                nextBtn.textContent = '下一步';
            }
        } catch (e) {
            usernameHint.textContent = '网络错误，请稍后重试';
            usernameHint.style.color = '#ef4444';
            nextBtn.disabled = false;
            nextBtn.textContent = '下一步';
        }
    }

    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        doNext();
    });

    if (usernameForm) {
        usernameForm.addEventListener('submit', (e) => {
            e.preventDefault();
            doNext();
        });
    }

    usernameInput.focus();
}
