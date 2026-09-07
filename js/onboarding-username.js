// ===== Onboarding: Username Setup =====

const usernameForm = document.getElementById('usernameForm');
const usernameInput = document.getElementById('usernameInput');
const nextBtn = document.getElementById('nextBtn');
const usernameHint = document.getElementById('usernameHint');
const suggestions = document.querySelectorAll('.username-suggestion');

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
    const user = JSON.parse(localStorage.getItem('gensphere_user') || '{}');
    user.username = username;
    localStorage.setItem('gensphere_user', JSON.stringify(user));
    
    // Go to next step
    window.location.href = 'onboarding-topics.html';
});

// ===== Go Back =====
function goBack() {
    window.location.href = 'login.html';
}

// ===== Skip Onboarding =====
function skipOnboarding() {
    const user = JSON.parse(localStorage.getItem('gensphere_user') || '{}');
    user.username = user.username || '用户' + Math.floor(Math.random() * 10000);
    user.topics = user.topics || [];
    user.onboardingComplete = true;
    localStorage.setItem('gensphere_user', JSON.stringify(user));
    
    window.location.href = 'index.html';
}
