// ===== Onboarding: Topic Selection =====

const AUTH_KEY = 'gensphere_user';

const topicItems = document.querySelectorAll('.topic-item');
const selectedCountEl = document.getElementById('selectedCount');
const finishBtn = document.getElementById('finishBtn');

let selectedTopics = [];
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

// ===== Topic Click =====
topicItems.forEach(item => {
    item.addEventListener('click', () => {
        const topic = item.dataset.topic;
        
        if (selectedTopics.includes(topic)) {
            selectedTopics = selectedTopics.filter(t => t !== topic);
            item.classList.remove('selected');
        } else {
            selectedTopics.push(topic);
            item.classList.add('selected');
        }
        
        updateCount();
    });
});

function updateCount() {
    selectedCountEl.textContent = selectedTopics.length;
    finishBtn.disabled = selectedTopics.length === 0;
}

// ===== Finish Onboarding =====
async function finishOnboarding() {
    if (selectedTopics.length === 0 || !currentUser) return;
    
    finishBtn.disabled = true;
    finishBtn.innerHTML = '<span class="btn-text">设置中...</span>';
    
    // 调用 API 更新用户信息
    const result = await GenSphereAPI.auth.updateUser(currentUser.phone, {
        topics: selectedTopics,
        onboardingComplete: true
    });
    
    if (result.code === 0) {
        // 更新本地用户信息
        localStorage.setItem(AUTH_KEY, JSON.stringify(result.data));
        
        // 进入首页
        window.location.href = 'index.html';
    } else {
        finishBtn.disabled = false;
        finishBtn.innerHTML = `
            <span class="btn-text">开始探索</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;
        alert(result.message);
    }
}

// ===== Go Back =====
function goBack() {
    window.location.href = 'onboarding-username.html';
}

// ===== Skip Onboarding =====
async function skipOnboarding() {
    if (!currentUser) return;
    
    await GenSphereAPI.auth.updateUser(currentUser.phone, {
        topics: [],
        onboardingComplete: true
    });
    
    const user = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
    user.topics = [];
    user.onboardingComplete = true;
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    
    window.location.href = 'index.html';
}
