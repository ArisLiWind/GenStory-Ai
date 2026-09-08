// ===== My Characters Page =====

document.addEventListener('DOMContentLoaded', () => {
    initMyCharactersPage();
});

function initMyCharactersPage() {
    loadMyCharacters();
    setupFilter();
    setupSearch();
}

async function loadMyCharacters() {
    const grid = document.getElementById('myCharsGrid');
    const emptyState = document.getElementById('emptyState');
    
    // Show loading state
    grid.style.display = 'none';
    emptyState.style.display = 'none';
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:rgba(255,255,255,0.4);">加载中...</div>';
    grid.style.display = 'grid';
    
    try {
        const res = await GenSphereAPI.characters.getMine();
        
        if (res.code === 0 && res.data && res.data.items && res.data.items.length > 0) {
            const chars = res.data.items.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                image: item.image,
                status: item.status === 'published' ? 'public' : (item.status === 'private' ? 'private' : 'draft'),
                views: item.viewCount || 0,
                chats: item.chatCount || 0,
                createdAt: item.createdAt,
                tags: item.tags || []
            }));
            
            renderCharacters(chars);
            grid.style.display = 'grid';
            emptyState.style.display = 'none';
        } else {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Failed to load characters:', error);
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        const emptyDesc = emptyState.querySelector('p');
        if (emptyDesc) {
            emptyDesc.textContent = '加载角色失败，请刷新重试';
        }
    }
}

function renderCharacters(chars) {
    const grid = document.getElementById('myCharsGrid');
    
    grid.innerHTML = chars.map(char => {
        const statusText = char.status === 'public' ? '公开' : char.status === 'private' ? '私密' : '草稿';
        const imgHtml = char.image 
            ? `<img src="${char.image}" alt="${char.title}" class="my-char-img">`
            : `<div class="my-char-img-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                </svg>
               </div>`;
        
        return `
            <div class="my-char-card" data-id="${char.id}" data-status="${char.status || 'public'}" onclick="goToCharacterDetail('${char.id}')">
                <div class="my-char-img-wrap">
                    ${imgHtml}
                    <div class="my-char-overlay"></div>
                    <span class="my-char-badge ${char.status || 'public'}">${statusText}</span>
                    <div class="my-char-actions">
                        <button class="my-char-action-btn" title="编辑" onclick="editCharacter('${char.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="my-char-action-btn" title="删除" onclick="deleteCharacter('${char.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="my-char-content">
                    <h3 class="my-char-title">${char.title || '未命名角色'}</h3>
                    <p class="my-char-desc">${char.description || '暂无描述'}</p>
                    <div class="my-char-stats">
                        <span class="my-char-stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            ${formatNumber(char.views || 0)}
                        </span>
                        <span class="my-char-stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            ${formatNumber(char.chats || 0)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setupFilter() {
    const pills = document.querySelectorAll('.filter-pill');
    
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            const filter = pill.dataset.filter;
            
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            
            const cards = document.querySelectorAll('.my-char-card');
            cards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = '';
                } else {
                    card.style.display = card.dataset.status === filter ? '' : 'none';
                }
            });
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('myCharSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const cards = document.querySelectorAll('.my-char-card');
        
        cards.forEach(card => {
            const title = card.querySelector('.my-char-title')?.textContent.toLowerCase() || '';
            const desc = card.querySelector('.my-char-desc')?.textContent.toLowerCase() || '';
            
            if (title.includes(query) || desc.includes(query)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

function goToCharacterDetail(id) {
    window.location.href = 'character.html?id=' + id;
}

function editCharacter(id) {
    event.stopPropagation();
    window.location.href = 'create-character.html?edit=' + id;
}

async function deleteCharacter(id) {
    event.stopPropagation();
    if (!confirm('确定要删除这个角色吗？此操作不可撤销。')) return;
    
    try {
        const res = await GenSphereAPI.characters.delete(id);
        if (res.code === 0) {
            loadMyCharacters();
        } else {
            alert('删除失败：' + (res.message || '未知错误'));
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('删除失败，请稍后重试');
    }
}

function formatNumber(num) {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}
