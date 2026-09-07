// ===== Character Data =====
const characters = [
    {
        id: 1,
        title: "Mafia Boss",
        creator: "KLOOMSY",
        verified: true,
        description: "A mafia boss who thinks you have information regarding his enemy. Innocent or not, he's keeping a watchful eye on you.",
        views: "3807万",
        chats: 134,
        tokens: 462,
        rating: 4.9,
        tags: ["无限制", "男性", "OC", "虚构", "反派"],
        category: ["male", "oc", "fictional"],
        image: "https://picsum.photos/seed/mafia1/400/520"
    },
    {
        id: 2,
        title: "Willson Wáng",
        creator: "Shxou_Huang",
        verified: false,
        description: "Your Rich best friend that spoils you and showers you with love and affection. -- He was patiently waiting for you outside of the school gate while you end up getting out late due to club activities.",
        views: "1855万",
        chats: 25,
        tokens: 612,
        rating: 4.8,
        tags: ["男性", "OC", "虚构", "甜"],
        category: ["male", "oc", "fictional", "sweet"],
        image: "https://picsum.photos/seed/willson/400/520"
    },
    {
        id: 3,
        title: "Neglectful family",
        creator: "hornybite",
        verified: true,
        description: "It's Lisa's birthday, not yours. And so, do you ever feel sudden motivation to do something...",
        views: "2151万",
        chats: 100,
        tokens: 2754,
        rating: 4.7,
        tags: ["男性", "女性", "虚构", "多人"],
        category: ["male", "female", "fictional", "multi"],
        image: "https://picsum.photos/seed/family/400/520"
    },
    {
        id: 4,
        title: "Ayato Hiroshi | Cold Prince",
        creator: "Rowlemal",
        verified: true,
        description: "The popular 'Cold Prince' in your class. Art Credit: @2015x127",
        views: "1392万",
        chats: 25,
        tokens: 1096,
        rating: 4.9,
        tags: ["男性", "OC", "虚构"],
        category: ["male", "oc", "fictional"],
        image: "https://picsum.photos/seed/ayato/400/520"
    },
    {
        id: 5,
        title: "Second Life Isekai",
        creator: "Hurricanezer",
        verified: false,
        description: "Sadly, you've just died from vehicular manslaughter. But, in exchange, You've reincarnated in a Lit-RP...",
        views: "1277万",
        chats: 70,
        tokens: 3340,
        rating: 4.8,
        tags: ["无限制", "游戏", "动漫", "魔法", "剧情", "RPG", "isekai"],
        category: ["game", "anime", "magic", "drama", "rpg"],
        image: "https://picsum.photos/seed/isekai/400/520"
    },
    {
        id: 6,
        title: "Giovanni Moretti | Single Dad",
        creator: "Emi Yuu",
        verified: true,
        description: "You're a single mother to a five-year-old son. One afternoon, while at work, you receive a sudden call from his kindergarten teacher. She sounds tense—your son has hurt another child, and the girl's father is demanding ...",
        views: "723万",
        chats: 7,
        tokens: 2975,
        rating: 4.9,
        tags: ["无限制", "男性", "OC", "虚构", "甜"],
        category: ["male", "oc", "fictional", "sweet"],
        image: "https://picsum.photos/seed/giovanni/400/520"
    },
    {
        id: 7,
        title: "Your Three Older Brothers",
        creator: "Лик.",
        verified: true,
        description: "You are the fourth boy in a family of 5 children. Your only sister gets all the attention of the family. She's a girl, you have to understand. Be a support for her.",
        views: "926万",
        chats: 12,
        tokens: 2749,
        rating: 4.7,
        tags: ["男性", "多人"],
        category: ["male", "multi"],
        image: "https://picsum.photos/seed/brothers/400/520"
    },
    {
        id: 8,
        title: "Your tyrant father/Valerius",
        creator: "unknown",
        verified: false,
        description: "A cold and ruthless emperor who shows no mercy to anyone. But somehow, he has a soft spot for you.",
        views: "581万",
        chats: 20,
        tokens: 1500,
        rating: 4.8,
        tags: ["男性", "虚构", "剧情"],
        category: ["male", "fictional", "drama"],
        image: "https://picsum.photos/seed/tyrant/400/520"
    },
    {
        id: 9,
        title: "Leo, Brugo, Rei, Ashe and...",
        creator: "artist_chan",
        verified: true,
        description: "A group of friends who are always there for you. Each has their own unique personality and quirks.",
        views: "851万",
        chats: 10,
        tokens: 2200,
        rating: 4.9,
        tags: ["多人", "甜", "OC"],
        category: ["multi", "sweet", "oc"],
        image: "https://picsum.photos/seed/friends/400/520"
    },
    {
        id: 10,
        title: "Best friends trio",
        creator: "storyweaver",
        verified: false,
        description: "Three best friends who have been together since childhood. Adventures and mischief await!",
        views: "828万",
        chats: 14,
        tokens: 1800,
        rating: 4.7,
        tags: ["多人", "虚构", "甜"],
        category: ["multi", "fictional", "sweet"],
        image: "https://picsum.photos/seed/trio/400/520"
    },
    {
        id: 11,
        title: "Snow your edgy sister",
        creator: "edgyqueen",
        verified: true,
        description: "Your mysterious and edgy older sister who seems to have a soft side only for you.",
        views: "1185万",
        chats: 22,
        tokens: 950,
        rating: 4.8,
        tags: ["女性", "OC", "剧情"],
        category: ["female", "oc", "drama"],
        image: "https://picsum.photos/seed/snow/400/520"
    },
    {
        id: 12,
        title: "Another Magic Academy",
        creator: "wizardmaster",
        verified: false,
        description: "Welcome to the prestigious magic academy where you'll learn to wield incredible powers.",
        views: "717万",
        chats: 16,
        tokens: 3100,
        rating: 4.6,
        tags: ["魔法", "RPG", "动漫", "剧情"],
        category: ["magic", "rpg", "anime", "drama"],
        image: "https://picsum.photos/seed/magic/400/520"
    },
    {
        id: 13,
        title: "星际指挥官",
        creator: "scifiauthor",
        verified: true,
        description: "作为星际舰队的指挥官，你将带领船员探索未知星系，面对各种挑战与危机。",
        views: "639万",
        chats: 18,
        tokens: 2500,
        rating: 4.9,
        tags: ["科幻", "剧情", "RPG", "英雄"],
        category: ["scifi", "drama", "rpg", "hero"],
        image: "https://picsum.photos/seed/scifi1/400/520"
    },
    {
        id: 14,
        title: "古代剑客",
        creator: "wuxiamaster",
        verified: true,
        description: "江湖恩怨，儿女情长。你是一位身怀绝技的剑客，在乱世中寻找自己的道。",
        views: "512万",
        chats: 28,
        tokens: 1800,
        rating: 4.8,
        tags: ["古风", "剧情", "男性", "武侠"],
        category: ["ancient", "drama", "male"],
        image: "https://picsum.photos/seed/wuxia/400/520"
    }
];

// ===== DOM Elements =====
const characterGrid = document.getElementById('characterGrid');
const categoryTags = document.querySelectorAll('.category-tag');
const filterTabs = document.querySelectorAll('.filter-tab');
const sortTabs = document.querySelectorAll('.sort-tab');
const sortOptions = document.querySelectorAll('.sort-option');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const themeToggle = document.getElementById('themeToggle');
const navbar = document.querySelector('.navbar');

// ===== State =====
let currentCategory = 'all';
let currentFilter = 'characters';
let currentSort = 'hot';
let currentSortBy = 'views';
let displayedCount = 8;

// ===== Render Characters =====
function renderCharacters() {
    let filtered = [...characters];
    
    // Filter by category
    if (currentCategory !== 'all') {
        filtered = filtered.filter(char => char.category.includes(currentCategory));
    }
    
    // Sort
    if (currentSortBy === 'views') {
        filtered.sort((a, b) => {
            const aViews = parseViews(a.views);
            const bViews = parseViews(b.views);
            return bViews - aViews;
        });
    } else if (currentSortBy === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
    }
    
    const toShow = filtered.slice(0, displayedCount);
    
    characterGrid.innerHTML = toShow.map(char => createCharacterCard(char)).join('');
    
    // Hide load more if all shown
    if (displayedCount >= filtered.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'inline-flex';
    }
}

function parseViews(viewsStr) {
    if (viewsStr.includes('万')) {
        return parseFloat(viewsStr) * 10000;
    }
    return parseFloat(viewsStr);
}

function createCharacterCard(char) {
    const tagsHtml = char.tags.slice(0, 4).map(tag => `
        <span class="card-tag">${tag}</span>
    `).join('');
    
    return `
        <div class="character-card fade-in" data-id="${char.id}">
            <div class="card-image-wrapper">
                <img src="${char.image}" alt="${char.title}" class="card-image" loading="lazy">
                <div class="card-image-overlay"></div>
                <div class="card-badges">
                    <span class="badge-views">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        ${char.views}
                    </span>
                    <span class="badge-chats">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        ${char.chats}
                    </span>
                </div>
            </div>
            <div class="card-content">
                <div class="card-creator">
                    <span class="card-creator-name">@${char.creator}</span>
                    ${char.verified ? '<svg class="verified-badge" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>' : ''}
                </div>
                <h3 class="card-title">${char.title}</h3>
                <p class="card-description">${char.description}</p>
                <div class="card-tags">
                    ${tagsHtml}
                </div>
                <div class="card-footer">
                    <span class="card-tokens">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                        ${char.tokens} 个 Token
                    </span>
                    <span class="card-rating">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                        </svg>
                        ${char.rating}
                    </span>
                </div>
            </div>
        </div>
    `;
}

// ===== Event Listeners =====

// Category tags
categoryTags.forEach(tag => {
    tag.addEventListener('click', () => {
        categoryTags.forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        currentCategory = tag.dataset.category;
        displayedCount = 8;
        renderCharacters();
        observeFadeInElements();
    });
});

// Filter tabs (角色/创作者)
filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        // For demo purposes, we'll just re-render
        renderCharacters();
    });
});

// Sort tabs (热门/最新)
sortTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        sortTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentSort = tab.dataset.sort;
        if (currentSort === 'new') {
            // Reverse for "newest" simulation
            characters.reverse();
        }
        renderCharacters();
    });
});

// Sort options (热度/评分)
sortOptions.forEach(option => {
    option.addEventListener('click', () => {
        sortOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        currentSortBy = option.dataset.sortBy;
        renderCharacters();
    });
});

// Load more
loadMoreBtn.addEventListener('click', () => {
    displayedCount += 4;
    renderCharacters();
    observeFadeInElements();
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Theme toggle (demo - just toggles a class)
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    // For a real implementation, you'd update CSS variables
});

// ===== Scroll Animation =====
function observeFadeInElements() {
    const elements = document.querySelectorAll('.fade-in:not(.visible)');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(el => observer.observe(el));
}

// ===== Card Click Effect =====
characterGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.character-card');
    if (card) {
        // Add a subtle click effect
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);
        
        // In a real app, navigate to character page
        console.log('Character clicked:', card.dataset.id);
    }
});

// ===== Search Functionality (basic) =====
const searchInputs = document.querySelectorAll('.search-input');
searchInputs.forEach(input => {
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length > 0) {
            // Filter characters by search query
            const filtered = characters.filter(char => 
                char.title.toLowerCase().includes(query) ||
                char.creator.toLowerCase().includes(query) ||
                char.description.toLowerCase().includes(query)
            );
            characterGrid.innerHTML = filtered.map(char => createCharacterCard(char)).join('');
            observeFadeInElements();
        } else {
            renderCharacters();
            observeFadeInElements();
        }
    });
});

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    renderCharacters();
    observeFadeInElements();
    
    // Animate hero elements on load
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroCta = document.querySelector('.hero-cta');
    const heroStats = document.querySelector('.hero-stats');
    
    setTimeout(() => {
        heroTitle.style.opacity = '1';
        heroTitle.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
        heroSubtitle.style.opacity = '1';
        heroSubtitle.style.transform = 'translateY(0)';
    }, 300);
    
    setTimeout(() => {
        heroCta.style.opacity = '1';
        heroCta.style.transform = 'translateY(0)';
    }, 500);
    
    setTimeout(() => {
        heroStats.style.opacity = '1';
        heroStats.style.transform = 'translateY(0)';
    }, 700);
});

// Add initial styles for hero animation
const style = document.createElement('style');
style.textContent = `
    .hero-title, .hero-subtitle, .hero-cta, .hero-stats {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.8s ease, transform 0.8s ease;
    }
`;
document.head.appendChild(style);
