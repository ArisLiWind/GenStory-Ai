// ===== Onboarding: Topic Selection =====

const AUTH_KEY = 'gensphere_user';

const topicItems = document.querySelectorAll('.topic-item');
const selectedCountEl = document.getElementById('selectedCount');
const finishBtn = document.getElementById('finishBtn');

let selectedTopics = [];

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

// ===== Topic Click =====
topicItems.forEach(item => {
    item.addEventListener('click', () => {
        const topic = item.dataset.topic;
        
        if (selectedTopics.includes(topic)) {
            // Deselect
            selectedTopics = selectedTopics.filter(t => t !== topic);
            item.classList.remove('selected');
        } else {
            // Select
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
function finishOnboarding() {
    if (selectedTopics.length === 0) return;
    
    const user = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
    user.topics = selectedTopics;
    user.onboardingComplete = true;
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    
    // Update DB
    const usersDB = JSON.parse(localStorage.getItem('gensphere_users_db') || '{}');
    if (usersDB[user.phone]) {
        usersDB[user.phone].topics = selectedTopics;
        usersDB[user.phone].onboardingComplete = true;
        localStorage.setItem('gensphere_users_db', JSON.stringify(usersDB));
    }
    
    // Go to home page
    window.location.href = 'index.html';
}

// ===== Go Back =====
function goBack() {
    window.location.href = 'onboarding-username.html';
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
