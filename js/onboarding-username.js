// ============================================
// 用户名设置页 - 重写版
// 职责：新用户填用户名，填完跳兴趣选择页
// ============================================

const TOKEN_KEY = 'gensphere_token';
const USER_KEY = 'gensphere_user';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        // 没登录，回登录页
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
    const usernameCount = document.getElementById('usernameCount');

    // 字数统计
    usernameInput.addEventListener('input', () => {
        const len = usernameInput.value.length;
        usernameCount.textContent = `${len}/20`;
        usernameHint.textContent = '';
        usernameHint.style.color = '';

        if (len > 0) {
            nextBtn.disabled = false;
        } else {
            nextBtn.disabled = true;
        }
    });

    // 下一步
    nextBtn.addEventListener('click', async () => {
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
                // 保存成功，更新本地用户信息
                localStorage.setItem(USER_KEY, JSON.stringify(res.data));
                // 跳兴趣选择页
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
    });

    // 回车提交
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            nextBtn.click();
        }
    });

    usernameInput.focus();
}
