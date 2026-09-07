// ===== Onboarding: Topic Selection =====

const topicItems = document.querySelectorAll('.topic-item');
const selectedCountEl = document.getElementById('selectedCount');
const finishBtn = document.getElementById('finishBtn');

let selectedTopics = [];

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
    
    const user = JSON.parse(localStorage.getItem('gensphere_user') || '{}');
    user.topics = selectedTopics;
    user.onboardingComplete = true;
    localStorage.setItem('gensphere_user', JSON.stringify(user));
    
    // Go to home page
    window.location.href = 'index.html';
}

// ===== Go Back =====
function goBack() {
    window.location.href = 'onboarding-username.html';
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
