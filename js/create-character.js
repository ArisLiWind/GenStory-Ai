// ===== Create Character Page =====

let selectedTags = [];
let editingId = null;
const maxTags = 10;
let uploadedImageData = ''; // 全局变量：直接存储上传的图片 data URL，不经过 DOM 往返

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
    setupTokenCounter();
    
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
                uploadedImageData = char.image; // 保存到全局变量，以便编辑提交时保留
                const previewImage = document.getElementById('previewImage');
                if (previewImage) {
                    previewImage.innerHTML = `<img src="${char.image}" alt="角色头像" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">`;
                }
                const cardImgWrapper = document.querySelector('.preview-card .card-image-wrapper');
                if (cardImgWrapper) {
                    let cardImg = cardImgWrapper.querySelector('img');
                    if (!cardImg) {
                        cardImg = document.createElement('img');
                        cardImg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;';
                        cardImgWrapper.insertBefore(cardImg, cardImgWrapper.firstChild);
                    }
                    cardImg.src = char.image;
                }
            }
            
            // Update button text
            document.getElementById('createCharBtn').textContent = '保存修改';
            document.querySelector('.create-title').textContent = '编辑角色';
            
            // Update preview
            document.getElementById('previewTitle').textContent = char.title || '角色标题';
            document.getElementById('previewDesc').textContent = char.description || '角色简介将显示在这里...';
            
            // Recalculate token count after loading data
            updateTokenCounter();
            
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
            const dataUrl = e.target.result;
            
            // 1. 直接存储到全局变量 — 这是最可靠的方式，不经过 DOM 往返
            uploadedImageData = dataUrl;
            console.log('[ImageUpload] Image loaded, size:', dataUrl.length, 'chars');
            
            // 2. 更新预览（仅用于视觉展示，不影响数据存储）
            if (previewImage) {
                previewImage.innerHTML = `<img src="${dataUrl}" alt="角色头像" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">`;
            }
            
            // 3. 更新预览卡片
            const cardImgWrapper = document.querySelector('.preview-card .card-image-wrapper');
            if (cardImgWrapper) {
                let cardImg = cardImgWrapper.querySelector('img');
                if (!cardImg) {
                    cardImg = document.createElement('img');
                    cardImg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;';
                    cardImgWrapper.insertBefore(cardImg, cardImgWrapper.firstChild);
                }
                cardImg.src = dataUrl;
            }
        };
        reader.onerror = () => {
            console.error('[ImageUpload] FileReader error');
            alert('图片读取失败，请重试');
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
        
        const btn = document.getElementById('createCharBtn');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = editingId ? '保存中...' : '创建中...';
        
        try {
            // 直接使用全局变量中的图片数据 — 不再从 DOM 读取
            let imageData = '';
            
            if (uploadedImageData && uploadedImageData.startsWith('data:image')) {
                console.log('[CreateChar] Found uploaded image, compressing...');
                imageData = await compressImageIfNeeded(uploadedImageData);
                console.log('[CreateChar] Compressed image:', imageData.length, 'chars, starts with:', imageData.substring(0, 30));
            } else if (editingId) {
                // 编辑模式下，如果没有新上传图片，尝试保留原有图片
                console.log('[CreateChar] No new image uploaded, editing mode - will keep existing image');
                // 不设置 image 字段，后端会保留原有值
            } else {
                console.log('[CreateChar] No image uploaded');
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
                btn.textContent = '✓ 创建成功！正在跳转...';
                btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 1500);
            } else {
                console.error('[CreateChar] Failed:', res);
                btn.disabled = false;
                btn.textContent = originalText;
                alert((editingId ? '修改失败：' : '创建失败：') + (res.message || '未知错误'));
            }
        } catch (error) {
            console.error('[CreateChar] Error:', error);
            btn.disabled = false;
            btn.textContent = originalText;
            alert((editingId ? '修改失败：' : '创建失败：') + (error.message || '网络错误'));
        }
    });
}

// ===== 图片压缩 =====
// 目标：压缩到 < 50KB base64（约 37KB 实际图片数据）
// 这是为了确保 D1 数据库能正常存储（D1 对大文本值有限制）
async function compressImageIfNeeded(dataUrl) {
    console.log('[Compress] Input size:', dataUrl.length, 'chars');
    
    // 如果图片小于 40KB，直接返回
    if (dataUrl.length < 40000) {
        console.log('[Compress] Small enough, skipping compression');
        return dataUrl;
    }
    
    return new Promise((resolve) => {
        const img = new Image();
        
        img.onload = () => {
            console.log('[Compress] Image loaded, dimensions:', img.width, 'x', img.height);
            
            // 从小到大尝试，找到第一个 < 50KB 的结果
            const configs = [
                { maxSize: 256, quality: 0.6 },
                { maxSize: 192, quality: 0.5 },
                { maxSize: 150, quality: 0.4 },
                { maxSize: 100, quality: 0.3 },
                { maxSize: 80, quality: 0.2 },
            ];
            
            for (const config of configs) {
                let { width, height } = img;
                
                // 等比缩小
                if (width > config.maxSize || height > config.maxSize) {
                    const ratio = config.maxSize / Math.max(width, height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const compressed = canvas.toDataURL('image/jpeg', config.quality);
                console.log(`[Compress] ${width}x${height} q=${config.quality}: ${compressed.length} chars`);
                
                if (compressed.length < 50000) {
                    console.log('[Compress] Success! Final size:', compressed.length, 'chars');
                    resolve(compressed);
                    return;
                }
            }
            
            // 如果所有配置都超过 50KB，返回最后一个结果（已经是最小了）
            const lastConfig = configs[configs.length - 1];
            let { width, height } = img;
            const ratio = lastConfig.maxSize / Math.max(width, height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const finalResult = canvas.toDataURL('image/jpeg', 0.15);
            console.log('[Compress] Fallback final size:', finalResult.length, 'chars');
            resolve(finalResult);
        };
        
        img.onerror = () => {
            console.error('[Compress] Image failed to load');
            // 如果压缩完全失败，尝试直接截取原始数据的前 50KB
            // base64 截断会导致图片损坏，所以返回空
            // 后端会使用默认图片
            resolve('');
        };
        
        img.src = dataUrl;
    });
}

// ===== Token Counter =====
function setupTokenCounter() {
    // All text fields that contribute to token count
    const fields = ['charTitle', 'charName', 'charDesc', 'charPersonality', 'charScene', 'charFirstMsg', 'charExample', 'charCreatorNote'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updateTokenCounter);
        }
    });
    updateTokenCounter();
}

function estimateTokens(text) {
    if (!text) return 0;
    let cjk = 0;
    let other = 0;
    for (const ch of text) {
        if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(ch)) {
            cjk++;
        } else if (/\S/.test(ch)) {
            other++;
        }
    }
    // CJK: ~1.5 tokens per char; Latin: ~1 token per 4 chars
    return Math.ceil(cjk * 1.5 + other / 4);
}

function updateTokenCounter() {
    // Total = all text fields
    const totalFields = ['charTitle', 'charName', 'charDesc', 'charPersonality', 'charScene', 'charFirstMsg', 'charExample', 'charCreatorNote'];
    // Permanent = fields sent to LLM every turn (excluding title/name/desc which are metadata)
    const permanentFields = ['charPersonality', 'charScene', 'charFirstMsg', 'charExample', 'charCreatorNote'];

    let totalTokens = 0;
    let permanentTokens = 0;

    totalFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            totalTokens += estimateTokens(el.value || '');
        }
    });

    permanentFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            permanentTokens += estimateTokens(el.value || '');
        }
    });

    const totalEl = document.getElementById('totalTokenCount');
    const permEl = document.getElementById('permanentTokenCount');
    if (totalEl) totalEl.textContent = totalTokens;
    if (permEl) permEl.textContent = permanentTokens;
}
