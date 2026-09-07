// ===== Onboarding: Username Setup =====

const AUTH_KEY = 'gensphere_user';

const usernameForm = document.getElementById('usernameForm');
const usernameInput = document.getElementById('usernameInput');
const nextBtn = document.getElementById('nextBtn');
const usernameHint = document.getElementById('usernameHint');
const suggestions = document.querySelectorAll('.username-suggestion');

// ===== Check Auth =====
window.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    if (!user || !user.phone) {
        window.location.href = 'login.html';
        return;
    }
    
    if (user.onboardingComplete) {
        window.location.href = 'index.html';
    }
});

// ===== Suggestion Click =====
suggestions.forEach(suggestion => {
    suggestion.addEventListener('click', () => {
        usernameInput.value = suggestion.dataset.name;
        validateUsername();
        usernameInput.focus();
    });
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
usernameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    
    if (!username || username.length < 2) {
        return;
    }
    
    // Save username
    const user = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
    user.username = username;
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    
    // Also update in users DB
    const usersDB = JSON.parse(localStorage.getItem('gensphere_users_db') || '{}');
    if (usersDB[user.phone]) {
        usersDB[user.phone].username = username;
        localStorage.setItem('gensphere_users_db', JSON.stringify(usersDB));
    }
    
    // Go to next step
    window.location.href = 'onboarding-topics.html';
});

// ===== Go Back =====
function goBack() {
    window.location.href = 'login.html';
}

// ===== Skip Onboarding =====
function skipOnboarding() {
    const user = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
    user.username = user.username || '用户' + Math.floor(Math.random() * 10000);
    user.topics = user.topics || [];
    user.onboardingComplete = true;
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    
    // Update DB
    const usersDB = JSON.parse(localStorage.getItem('gensphere_users_db') || '{}');
    if (usersDB[user.phone]) {
        usersDB[user.phone].username = user.username;
        usersDB[user.phone].onboardingComplete = true;
        usersDB[user.phone].topics = user.topics;
        localStorage.setItem('gensphere_users_db', JSON.stringify(usersDB));
    }
    
    window.location.href = 'index.html';
}
