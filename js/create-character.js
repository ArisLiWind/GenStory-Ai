// ===== Create Character Page =====

document.addEventListener('DOMContentLoaded', () => {
    initCreatePage();
});

function initCreatePage() {
    setupTabNavigation();
    setupImageUpload();
    setupTags();
    setupPreviewSync();
    setupFormValidation();
    setupCreateButton();
}

// ===== Tab Navigation =====
function setupTabNavigation() {
    const navItems = document.querySelectorAll('.side-nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;
            
            // Update nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Update content
            tabContents.forEach(content => content.classList.remove('active'));
            const targetTab = document.getElementById('tab-' + tabId);
            if (targetTab) targetTab.classList.add('active');
        });
    });
}

// ===== Image Upload =====
function setupImageUpload() {
    const uploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('imageInput');
    const previewImage = document.getElementById('previewImage');
    
    if (!uploadArea || !imageInput) return;
    
    uploadArea.addEventListener('click', () => imageInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    });
    
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageUpload(file);
    });
    
    function handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Update preview
            previewImage.innerHTML = `<img src="${e.target.result}" alt="角色头像" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">`;
            // Also update the card image in preview
            const cardImgWrapper = document.querySelector('.preview-card .card-image-wrapper');
            if (cardImgWrapper) {
                const existingImg = cardImgWrapper.querySelector('img');
                if (existingImg) {
                    existingImg.src = e.target.result;
                } else {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'card-image';
                    cardImgWrapper.insertBefore(img, cardImgWrapper.firstChild);
                }
            }
        };
        reader.readAsDataURL(file);
    }
}

// ===== Tags =====
function setupTags() {
    const tagInput = document.getElementById('tagInput');
    const tagSuggestions = document.getElementById('tagSuggestions');
    const selectedTagsContainer = document.getElementById('selectedTags');
    const previewTags = document.getElementById('previewTags');
    
    if (!tagInput || !selectedTagsContainer) return;
    
    let selectedTags = [];
    const maxTags = 10;
    
    // Click on suggestion chips
    const chips = tagSuggestions.querySelectorAll('.tag-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            addTag(chip.textContent);
        });
    });
    
    // Enter key to add custom tag
    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = tagInput.value.trim();
            if (tag && isValidTag(tag)) {
                addTag(tag);
                tagInput.value = '';
            }
        }
    });
    
    function isValidTag(tag) {
        const regex = /^[a-zA-Z0-9\u4e00-\u9fa5]{2,21}$/;
        return regex.test(tag) && !selectedTags.includes(tag) && selectedTags.length < maxTags;
    }
    
    function addTag(tag) {
        if (selectedTags.length >= maxTags) return;
        if (selectedTags.includes(tag)) return;
        
        selectedTags.push(tag);
        renderTags();
        updatePreviewTags();
    }
    
    function removeTag(tag) {
        selectedTags = selectedTags.filter(t => t !== tag);
        renderTags();
        updatePreviewTags();
    }
    
    function renderTags() {
        selectedTagsContainer.innerHTML = selectedTags.map(tag => `
            <span class="selected-tag">
                ${tag}
                <button class="remove-tag" data-tag="${tag}">&times;</button>
            </span>
        `).join('');
        
        selectedTagsContainer.querySelectorAll('.remove-tag').forEach(btn => {
            btn.addEventListener('click', () => removeTag(btn.dataset.tag));
        });
    }
    
    function updatePreviewTags() {
        if (selectedTags.length === 0) {
            previewTags.innerHTML = '<span class="card-tag">标签</span>';
        } else {
            previewTags.innerHTML = selectedTags.slice(0, 3).map(tag => 
                `<span class="card-tag">${tag}</span>`
            ).join('');
        }
    }
}

// ===== Preview Sync =====
function setupPreviewSync() {
    const titleInput = document.getElementById('charTitle');
    const nameInput = document.getElementById('charName');
    const descInput = document.getElementById('charDesc');
    const previewTitle = document.getElementById('previewTitle');
    const previewDesc = document.getElementById('previewDesc');
    const previewCreator = document.getElementById('previewCreator');
    
    // Get username
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        const user = JSON.parse(userData);
        if (previewCreator && user.username) {
            previewCreator.textContent = '@' + user.username;
        }
    }
    
    // Title
    titleInput.addEventListener('input', () => {
        const val = titleInput.value.trim();
        previewTitle.textContent = val || '角色标题';
        validateForm();
    });
    
    // Name (falls back to title)
    nameInput.addEventListener('input', () => {
        const val = nameInput.value.trim();
        if (val) {
            previewTitle.textContent = val;
        } else {
            previewTitle.textContent = titleInput.value.trim() || '角色标题';
        }
    });
    
    // Description
    descInput.addEventListener('input', () => {
        const val = descInput.value.trim();
        previewDesc.textContent = val || '角色简介将显示在这里...';
        validateForm();
    });
}

// ===== Form Validation =====
function validateForm() {
    const title = document.getElementById('charTitle').value.trim();
    const desc = document.getElementById('charDesc').value.trim();
    const personality = document.getElementById('charPersonality').value.trim();
    const firstMsg = document.getElementById('charFirstMsg').value.trim();
    const createBtn = document.getElementById('createCharBtn');
    
    const isValid = title.length > 0 && desc.length > 0 && personality.length > 0 && firstMsg.length > 0;
    createBtn.disabled = !isValid;
    
    return isValid;
}

function setupFormValidation() {
    const inputs = ['charTitle', 'charDesc', 'charPersonality', 'charFirstMsg'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', validateForm);
        }
    });
}

// ===== Create Button =====
function setupCreateButton() {
    const createBtn = document.getElementById('createCharBtn');
    if (!createBtn) return;
    
    createBtn.addEventListener('click', () => {
        if (!validateForm()) return;
        
        const character = {
            id: 'char_' + Date.now(),
            title: document.getElementById('charTitle').value.trim(),
            name: document.getElementById('charName').value.trim(),
            description: document.getElementById('charDesc').value.trim(),
            personality: document.getElementById('charPersonality').value.trim(),
            scene: document.getElementById('charScene').value.trim(),
            firstMessage: document.getElementById('charFirstMsg').value.trim(),
            exampleDialogue: document.getElementById('charExample').value.trim(),
            rating: document.querySelector('input[name="rating"]:checked')?.value || 'nsfw',
            tags: Array.from(document.querySelectorAll('.selected-tag')).map(t => t.textContent.trim().replace('×', '').trim()),
            image: document.querySelector('.preview-card .card-image')?.src || '',
            creator: JSON.parse(localStorage.getItem('currentUser') || '{}').username || '匿名',
            createdAt: new Date().toISOString(),
            views: 0,
            chats: 0,
            rating: 0
        };
        
        // Save to my characters
        const myChars = JSON.parse(localStorage.getItem('myCharacters') || '[]');
        myChars.unshift(character);
        localStorage.setItem('myCharacters', JSON.stringify(myChars));
        
        // Also add to allCharacters for global display
        const allChars = JSON.parse(localStorage.getItem('allCharacters') || '[]');
        allChars.unshift(character);
        localStorage.setItem('allCharacters', JSON.stringify(allChars));
        
        // Show success
        alert('角色创建成功！');
        window.location.href = 'my-characters.html';
    });
}
