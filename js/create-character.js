// ===== Create Character Page =====

let selectedTags = [];
let editingId = null;
const maxTags = 10;

document.addEventListener('DOMContentLoaded', () => {
    initCreatePage();
});

function initCreatePage() {
    // Check if editing
    const params = new URLSearchParams(window.location.search);
    editingId = params.get('edit');
    
    setupImageUpload();
    setupTags();
    setupPreviewSync();
    setupFormValidation();
    setupCreateButton();
    setupScrollSpy();
    setupSmoothScroll();
    
    // If editing, load character data
    if (editingId) {
        loadCharacterForEdit(editingId);
    }
}

// ===== 滚动高亮（目录跟随） =====
function setupScrollSpy() {
    const sections = [
        'section-image', 'section-title', 'section-desc',
        'section-tags', 'section-rating', 'section-personality',
        'section-scenario', 'section-firstmsg', 'section-example'
    ];
    const links = document.querySelectorAll('.toc-link');

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            updateActiveToc(sections, links);
            ticking = false;
        });
    });
}

function updateActiveToc(sections, links) {
    const scrollY = window.scrollY;
    const offset = 120; // 顶部偏移（导航栏高度）

    let currentId = sections[0];
    for (const id of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.offsetTop - offset <= scrollY) {
            currentId = id;
        }
    }

    links.forEach(link => {
        const target = link.getAttribute('data-target');
        if (target === currentId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function setupSmoothScroll() {
    const links = document.querySelectorAll('.toc-link');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (!targetEl) return;

            const top = targetEl.offsetTop - 16;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
}

// ===== Load Character for Edit =====
async function loadCharacterForEdit(id) {
    try {
        const res = await GenSphereAPI.characters.getDetail(id);
        if (res.code === 0 && res.data) {
            const char = res.data;
            
            // Fill form
            document.getElementById('charTitle').value = char.title || '';
            document.getElementById('charName').value = char.chatName || '';
            document.getElementById('charDesc').value = char.description || '';
            document.getElementById('charPersonality').value = char.personality || '';
            document.getElementById('charScene').value = char.scenario || '';
            document.getElementById('charFirstMsg').value = char.firstMessage || '';
            document.getElementById('charExample').value = char.exampleDialogue || '';
            
            // Set creator note
            const noteEl = document.getElementById('charCreatorNote');
            if (noteEl) noteEl.value = char.creatorNote || '';
            
            // Set tags
            if (char.tags && Array.isArray(char.tags)) {
                selectedTags = [...char.tags];
                renderTags();
                updatePreviewTags();
            }
            
            // Set rating
            const ratingVal = char.contentRating === 'mature' ? 'nsfw' : 'sfw';
            const radio = document.querySelector(`input[name="rating"][value="${ratingVal}"]`);
            if (radio) radio.checked = true;
            
            // Set image
            if (char.image) {
                const previewImage = document.getElementById('previewImage');
                previewImage.innerHTML = `<img src="${char.image}" alt="角色头像" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">`;
                const cardImgWrapper = document.querySelector('.preview-card .card-image-wrapper');
                if (cardImgWrapper) {
                    const existingImg = cardImgWrapper.querySelector('img');
                    if (existingImg) {
                        existingImg.src = char.image;
                    } else {
                        const img = document.createElement('img');
                        img.src = char.image;
                        img.className = 'card-image';
                        cardImgWrapper.insertBefore(img, cardImgWrapper.firstChild);
                    }
                }
            }
            
            // Update button text
            document.getElementById('createCharBtn').textContent = '保存修改';
            document.querySelector('.create-title').textContent = '编辑角色';
            
            // Update preview
            document.getElementById('previewTitle').textContent = char.title || '角色标题';
            document.getElementById('previewDesc').textContent = char.description || '角色简介将显示在这里...';
            
            validateForm();
        }
    } catch (error) {
        console.error('Failed to load character for edit:', error);
    }
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
    
    if (!tagInput || !selectedTagsContainer) return;
    
    // Click on suggestion chips
    const chips = tagSuggestions.querySelectorAll('.tag-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            addTag(chip.textContent.trim());
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
}

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
    const selectedTagsContainer = document.getElementById('selectedTags');
    if (!selectedTagsContainer) return;
    
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
    const previewTags = document.getElementById('previewTags');
    if (!previewTags) return;
    
    if (selectedTags.length === 0) {
        previewTags.innerHTML = '<span class="card-tag">标签</span>';
    } else {
        previewTags.innerHTML = selectedTags.slice(0, 3).map(tag => 
            `<span class="card-tag">${tag}</span>`
        ).join('');
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
    const userData = localStorage.getItem('gensphere_user');
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
    
    createBtn.addEventListener('click', async () => {
        if (!validateForm()) return;
        
        const createBtn = document.getElementById('createCharBtn');
        const originalText = createBtn.textContent;
        createBtn.disabled = true;
        createBtn.textContent = editingId ? '保存中...' : '创建中...';
        
        try {
            // Get image data — 限制大小，压缩过大的图片
            const previewImg = document.querySelector('.preview-card .card-image');
            let imageData = '';
            if (previewImg && previewImg.src) {
                // 如果是 base64 图片，检查大小并压缩
                if (previewImg.src.startsWith('data:image')) {
                    imageData = await compressImageIfNeeded(previewImg.src, 800, 0.85);
                } else {
                    imageData = previewImg.src;
                }
            }
            
            // Get content rating
            const ratingValue = document.querySelector('input[name="rating"]:checked')?.value || 'nsfw';
            const contentRating = ratingValue === 'nsfw' ? 'mature' : 'general';
            
            const characterData = {
                title: document.getElementById('charTitle').value.trim(),
                chatName: document.getElementById('charName').value.trim(),
                description: document.getElementById('charDesc').value.trim(),
                personality: document.getElementById('charPersonality').value.trim(),
                scenario: document.getElementById('charScene').value.trim(),
                firstMessage: document.getElementById('charFirstMsg').value.trim(),
                exampleDialogue: document.getElementById('charExample').value.trim(),
                creatorNote: document.getElementById('charCreatorNote')?.value.trim() || '',
                image: imageData,
                tags: selectedTags,
                categories: [],
                contentRating: contentRating,
                status: 'published',
                isPublic: 1
            };
            
            let res;
            if (editingId) {
                // Update existing character
                res = await GenSphereAPI.characters.update(editingId, characterData);
            } else {
                // Create new character
                res = await GenSphereAPI.characters.create(characterData);
            }
            
            if (res.code === 0) {
                const characterId = editingId || res.data?.id;
                console.log('[CreateChar] Success! characterId:', characterId, 'response:', res);
                
                // 直接跳转，不用 alert 阻塞
                const targetUrl = characterId
                    ? 'character.html?id=' + encodeURIComponent(characterId)
                    : 'my-characters.html';
                
                // 显示成功提示后跳转
                const btn = document.getElementById('createCharBtn');
                if (btn) {
                    btn.textContent = '✓ 创建成功！正在跳转...';
                    btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                }
                
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 1500);
            } else {
                console.error('[CreateChar] Failed:', res);
                const btn = document.getElementById('createCharBtn');
                btn.disabled = false;
                btn.textContent = originalText;
                alert((editingId ? '修改失败：' : '创建失败：') + (res.message || '未知错误'));
            }
        } catch (error) {
            console.error('[CreateChar] Error:', error);
            const btn = document.getElementById('createCharBtn');
            btn.disabled = false;
            btn.textContent = originalText;
            alert((editingId ? '修改失败：' : '创建失败：') + (error.message || '网络错误'));
        }
    });
}

// ===== 图片压缩 =====
async function compressImageIfNeeded(dataUrl, maxSize, quality) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            // 如果图片小于 100KB，直接返回
            if (dataUrl.length < 100000) {
                resolve(dataUrl);
                return;
            }

            // 限制最大尺寸到 600px（角色头像不需要太大）
            const maxDimension = 600;
            let { width, height } = img;
            if (width > maxDimension || height > maxDimension) {
                const ratio = maxDimension / Math.max(width, height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // 先尝试 JPEG 0.7
            let compressed = canvas.toDataURL('image/jpeg', 0.7);

            // 如果仍大于 300KB，进一步压缩
            if (compressed.length > 300000) {
                compressed = canvas.toDataURL('image/jpeg', 0.5);
            }
            // 如果还是太大，缩小尺寸再压缩
            if (compressed.length > 300000) {
                const ratio2 = 400 / Math.max(width, height);
                canvas.width = Math.round(width * ratio2);
                canvas.height = Math.round(height * ratio2);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                compressed = canvas.toDataURL('image/jpeg', 0.4);
            }

            console.log(`[CreateChar] Image compressed: ${dataUrl.length} -> ${compressed.length} bytes`);
            resolve(compressed);
        };
        img.onerror = () => {
            console.warn('[CreateChar] Image compression failed, using original');
            resolve(dataUrl);
        };
        img.src = dataUrl;
    });
}
