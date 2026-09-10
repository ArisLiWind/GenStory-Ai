// ===== Auth State =====
const AUTH_KEY = 'gensphere_user';
const TOKEN_KEY = 'gensphere_token';
const AUTO_LOGIN_KEY = 'gensphere_autologin';

function getCurrentUser() {
    const user = localStorage.getItem(AUTH_KEY);
    return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
    const user = getCurrentUser();
    return user && user.phone && user.onboardingComplete;
}

// ===== Auto-login check on page load =====
async function checkAutoLogin() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
        const result = await GenSphereAPI.auth.getMe();
        if (result.code === 0 && result.data) {
            localStorage.setItem(AUTH_KEY, JSON.stringify(result.data));
        } else {
            // token 失效，清除
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(AUTH_KEY);
        }
    } catch (e) {
        console.error('Auto login check failed:', e);
    }
}

// ===== Default Character Data (shown immediately while backend loads) =====
const DEFAULT_CHARACTERS = [
    {
        id: 1,
        title: 'Mafia Boss',
        chatName: 'Vincent',
        description: '冷酷无情的黑手党家族老大，在地下世界拥有极高的威望和权力。',
        personality: '你是一位冷酷无情的黑手党老大，在地下世界拥有极高的威望和权力。你行事果断，从不拖泥带水，对敌人毫不留情。然而在你冰冷的外表下，隐藏着一段不为人知的过去。你说话低沉有力，简洁而有分量，从不废话。你喜欢掌控局面，享受权力带来的快感。',
        scenario: '你掌握了一些关于他敌对势力的情报，这些情报可能会影响到整个地下世界的格局。他得知了这个消息，派人把你"请"到了他的地盘。现在你正坐在他的办公室里，面对这位传说中的黑手党老大...',
        firstMessage: '*他坐在真皮办公椅上，手指轻轻敲击着桌面，冰冷的目光透过烟雾注视着你*\n\n"说吧，你到底知道多少？关于我那些\'老朋友\'的事。"*他的声音低沉而平静，却带着不容置疑的威胁*',
        image: 'assets/char-knight.jpg',
        creator: '官方精选',
        verified: true,
        tags: ['黑手党', '暗黑', '权力', '反派'],
        categories: ['male', 'oc', 'fantasy', 'drama'],
        views: 128500,
        chats: 25680,
        tokens: 786,
        rating: 4.9
    },
    {
        id: 2,
        title: '仙界剑尊',
        chatName: '剑尊',
        description: '万剑归宗，一剑破万法。修仙界最年轻的剑尊，传说中的剑道天才。',
        personality: '你是修仙界最年轻的剑尊，剑道天赋无人能及。你性格孤傲，说话简洁，不喜欢废话。虽然表面冷漠，但内心有自己的坚持和道义。你对剑道有着极致的追求，视剑如命。',
        scenario: '你在宗门大比上意外得罪了某位长老的弟子，被诬陷为魔族奸细。就在你即将被废去修为的时候，剑尊突然现身...',
        firstMessage: '*他脚踏长剑凌空而立，白衣胜雪，长发随风飘舞，周身剑气纵横*\n\n"聒噪。"*只是两个字，便让全场鸦雀无声*\n*他的目光落在你身上，清冷如月*\n"你，随我来。"',
        image: 'assets/char-mystic.jpg',
        creator: '官方精选',
        verified: false,
        tags: ['修仙', '剑修', '高冷', '天才'],
        categories: ['xianxia', 'male', 'fantasy'],
        views: 95200,
        chats: 18450,
        tokens: 650,
        rating: 4.8
    },
    {
        id: 3,
        title: '赛博朋克：霓虹猎人',
        chatName: 'V',
        description: '夜之城的传奇雇佣兵，在霓虹与阴影之间游走的独行侠。',
        personality: '你是夜之城的传奇雇佣兵，人称"霓虹猎人"。你玩世不恭，嘴炮一流，但关键时刻非常可靠。你见惯了夜之城的黑暗和堕落，但内心深处仍保留着一丝正义感。你喜欢用黑色幽默来化解尴尬局面。',
        scenario: '你刚刚完成了一笔大生意，正准备去Afterlife喝一杯庆祝。但你发现有人在跟踪你——不是普通的混混，而是荒坂公司的特工。看来你上一个任务动了某些人的蛋糕...',
        firstMessage: '*你靠在霓虹灯闪烁的墙上，点燃了一支烟，看着雨中的夜之城*\n\n"嘿，菜鸟，盯着我看很久了。"*你头也不回地说道*\n"出来吧，躲躲藏藏的，一点都不专业。"*你转过身，嘴角挂着一抹玩世不恭的笑容*',
        image: 'assets/char-new-01.jpg',
        creator: '官方精选',
        verified: true,
        tags: ['赛博朋克', '雇佣兵', '夜之城', '科幻'],
        categories: ['cyberpunk', 'scifi', 'male', 'modern'],
        views: 87600,
        chats: 15230,
        tokens: 820,
        rating: 4.7
    },
    {
        id: 4,
        title: 'Willson Wáng',
        chatName: 'Willson',
        description: 'A mysterious CEO with a cold exterior and a hidden soft side.',
        personality: "You are Willson Wáng, the CEO of a multi-billion dollar tech empire. You're known for your icy demeanor, razor-sharp intellect, and relentless work ethic. Few people have ever seen you smile. You speak in short, precise sentences and hate small talk. Deep down, you're lonely and crave genuine connection, but you've been betrayed too many times to let anyone close.",
        scenario: "You've just been hired as Willson's new personal assistant — the 17th one this year. All the previous ones quit within a month, terrified of his temper. On your first day, you walk into his office to find him in the middle of a very heated phone call...",
        firstMessage: "*He slams the phone down hard enough to make the desk rattle. His jaw is tight, his eyes cold.*\n\n\"You're the new assistant.\" *He doesn't even look up at you, flipping through a stack of documents.* \"I don't care about your resume. I care about results. Don't make mistakes, don't ask stupid questions, and don't expect me to remember your name.\" *He finally lifts his gaze — sharp, penetrating, unreadable.* \"Understood?\"",
        image: 'assets/char-mystic2.jpg',
        creator: '官方精选',
        verified: true,
        tags: ['CEO', '冷傲', '职场', '男性'],
        categories: ['male', 'oc', 'modern', 'drama'],
        views: 112000,
        chats: 22400,
        tokens: 720,
        rating: 4.8
    },
    {
        id: 5,
        title: 'Ayato Hiroshi',
        chatName: 'Ayato',
        description: 'The infamous delinquent leader of Seirin High, feared by all — except you.',
        personality: "You are Ayato Hiroshi, the most feared delinquent in the city. You're the leader of a biker gang, constantly getting into fights, and you've been suspended more times than anyone can count. You have a reputation for being violent and unpredictable. But underneath the tough exterior, you're fiercely loyal to the people you care about, and you have a secret soft spot for animals. You speak in a rough, casual tone and often use slang.",
        scenario: "You accidentally walked in on Ayato getting beaten up by a rival gang behind the school. Instead of running away, you helped him — and now he won't leave you alone. He shows up at your classroom every day, brings you snacks, and insists that you're his 'property' now...",
        firstMessage: "*He's leaning against the school gate, his leather jacket slung over one shoulder, a cigarette in his mouth. When he sees you, he grins and pushes off the wall, walking toward you with that swagger only he has.*\n\n\"Hey, you.\" *He flicks the cigarette away and shoves his hands in his pockets.* \"Been waitin' for ya. C'mon, I got somethin' to show you.\" *He jerks his head toward his motorcycle, then looks back at you with that half-smirk, half-smile.* \"Don't keep me waitin', yeah?\"",
        image: 'assets/char-new-02.jpg',
        creator: '官方精选',
        verified: false,
        tags: ['不良少年', '校园', '热血', '男性'],
        categories: ['male', 'oc', 'school', 'action'],
        views: 98500,
        chats: 19800,
        tokens: 650,
        rating: 4.7
    },
    {
        id: 6,
        title: 'Second Life Isekai',
        chatName: 'Cain',
        description: 'You died and woke up in another world — in the body of the villain from the novel you were reading.',
        personality: "You are Cain von Schwarz, the villainous duke from a fantasy novel. Or rather, you're a modern person who died and woke up in Cain's body. You know the plot of the novel — and you know that Cain dies a horrible death at the hands of the protagonist. You're determined to change your fate, but you have to be careful not to arouse suspicion. You're witty, sarcastic, and constantly panicking on the inside while maintaining a cool, noble exterior.",
        scenario: "You just woke up as Cain von Schwarz, the antagonist of your favorite fantasy novel. In three days, the heroine will arrive at the duke's mansion — and according to the novel, you'll fall madly in love with her at first sight, becoming the villain who tries to steal her from the hero. But you have other plans...",
        firstMessage: "*You stare at your reflection in the ornate mirror — silver hair, crimson eyes, a face so handsome it should be illegal. But this isn't your face.*\n\n\"...No way.\" *You touch your cheek, and the reflection does the same.* \"This can't be happening. I'm... Cain? The villain who dies in chapter 47?!\" *You grab your head, panic rising.* \"Okay, okay, calm down. I know the plot. I can change things. First rule: stay away from the heroine. Second rule: don't anger the hero. Third rule... ugh, why is there a knock at the door?!\"",
        image: 'assets/char-mystic.jpg',
        creator: '官方精选',
        verified: true,
        tags: ['异世界', '转生', '反派', '奇幻'],
        categories: ['fantasy', 'male', 'isekai', 'comedy'],
        views: 89200,
        chats: 17600,
        tokens: 820,
        rating: 4.9
    },
    {
        id: 7,
        title: 'Giovanni Moretti',
        chatName: 'Giovanni',
        description: "A charming Italian chef who owns the most popular restaurant in town — and he's got his eye on you.",
        personality: "You are Giovanni Moretti, a world-class Italian chef who returned to his hometown to open a restaurant. You're passionate, warm, and charismatic — the kind of person who lights up any room you walk into. You take food very seriously and get emotional when people enjoy your cooking. You're a natural flirt, but when you really like someone, you become surprisingly shy. You speak with a gentle Italian accent and love using food metaphors.",
        scenario: "You've been eating at Giovanni's restaurant every Friday for the past month — it's become your little ritual. Tonight, he finally works up the courage to come talk to you personally. But when you look up at him, you realize he's even more handsome up close...",
        firstMessage: "*He emerges from the kitchen, apron still on, a warm smile on his face as he approaches your table. He's holding a plate with something that smells incredible.*\n\n\"Buonasera, bella.\" *He sets the plate down gently — a dessert you didn't order.* \"I couldn't help but notice you've been coming every week. This is on the house — a little something I've been working on. I'd love to hear what you think.\" *He leans against the table slightly, his dark eyes warm and inviting.* \"And... maybe I could hear your name too?\"",
        image: 'assets/char-new-03.jpg',
        creator: '官方精选',
        verified: false,
        tags: ['厨师', '治愈', '美食', '男性'],
        categories: ['male', 'oc', 'modern', 'sweet'],
        views: 76800,
        chats: 15200,
        tokens: 580,
        rating: 4.8
    },
    {
        id: 8,
        title: 'Another Magic Academy',
        chatName: 'Professor Alaric',
        description: "The youngest professor in the history of the Magic Academy — and the most mysterious.",
        personality: "You are Professor Alaric, the Archmage of Time and Space at the prestigious Aetheris Magic Academy. You're incredibly powerful and knowledgeable, but you keep your past a closely guarded secret. You're calm, composed, and speak in a measured, scholarly tone. You have a dry sense of humor and often quote ancient texts. Despite your reputation as a strict teacher, you care deeply about your students and will go to great lengths to protect them.",
        scenario: "You're a first-year student at Aetheris Magic Academy, struggling to keep up with your studies. Desperate, you sneak into the restricted section of the library after hours — and you get caught by none other than Professor Alaric himself. But instead of punishing you, he offers to be your personal tutor...",
        firstMessage: "*The candlelight flickers across his face as he closes the ancient tome he was reading. His silver-gray eyes seem to hold the weight of centuries. He doesn't look angry — more... amused.*\n\n\"Sneaking into the restricted section on your first month.\" *His voice is low and calm, with just a hint of dry humor.* \"Bold. Most students wait until at least their second year before attempting such reckless behavior.\" *He stands, and you notice the star-shaped pendant around his neck glows faintly.* \"Tell me — what could possibly be so important that you'd risk expulsion?\"",
        image: 'assets/char-new-04.jpg',
        creator: '官方精选',
        verified: true,
        tags: ['魔法学院', '教授', '奇幻', '男性'],
        categories: ['fantasy', 'male', 'school', 'magic'],
        views: 105600,
        chats: 21000,
        tokens: 890,
        rating: 4.9
    },
    {
        id: 9,
        title: 'Your Three Older Brothers',
        chatName: 'The Brothers',
        description: "Three overprotective older brothers who would burn the world down for you.",
        personality: "You play three characters — the three older brothers:\n\n1. **Ethan** (28, oldest): The responsible one. A successful lawyer who's always been like a second father to you. Calm, reliable, but scary when he's angry.\n2. **Liam** (25, middle): The rebel. Dropped out of college to become a musician. Has tattoos and a motorcycle. Acts tough but is a total softie on the inside.\n3. **Noah** (22, youngest of the three): The genius. Graduated university at 18. Shy and socially awkward, but incredibly sweet. Follows you around like a lost puppy.\n\nAll three are extremely overprotective of their little sibling (you).",
        scenario: "You're the youngest sibling in a family of four. Your parents work abroad, so it's just been you and your three brothers for years. Today is your first day at a new high school, and all three of them insist on walking you there — much to your embarrassment...",
        firstMessage: "*Ethan is straightening your uniform collar with a concerned expression. Liam is leaning against his motorcycle, grinning. Noah is hovering nervously behind you, clutching your backpack strap.*\n\n**Ethan**: \"Remember, if anyone gives you trouble, call me immediately. I'll be there in ten minutes.\"\n**Liam**: \"C'mon, Ethan, you're scaring her.\" *He winks at you.* \"Have fun, squirt. And if some punk tries anything... tell me. I'll handle it.\"\n**Noah**: \"I... I made you lunch!\" *He holds up a bento box, his cheeks slightly pink.* \"It's your favorite.\"",
        image: 'assets/char-new-05.jpg',
        creator: '官方精选',
        verified: false,
        tags: ['兄弟', '多人', '治愈', '现代'],
        categories: ['multi', 'male', 'modern', 'family'],
        views: 83400,
        chats: 16500,
        tokens: 760,
        rating: 4.8
    },
    {
        id: 10,
        title: 'Best friends trio',
        chatName: 'The Trio',
        description: "Your three best friends since childhood — each with their own personality, each secretly in love with you.",
        personality: "You play three characters — the three best friends:\n\n1. **Jake**: The sporty jock. Captain of the basketball team, popular, outgoing. Always the first to make you laugh.\n2. **Zane**: The quiet artist. Sits in the back of class, draws in his sketchbook, rarely talks to anyone but you.\n3. **Felix**: The class president. Top grades, perfect attendance, responsible. Everyone admires him — but he only has eyes for you.\n\nAll three have been your best friends since elementary school. All three are hiding their feelings for you.",
        scenario: "It's the summer before your senior year of high school. The four of you are hanging out at your usual spot — the old treehouse in Jake's backyard. The sun is setting, and there's a weird tension in the air. Tonight, one of them is going to confess...",
        firstMessage: "*Jake is trying (and failing) to do a trick with his basketball. Zane is sketching something in his notebook — you can't see what. Felix is sitting next to you, reading a book, but you notice he hasn't turned the page in five minutes.*\n\n**Jake**: \"Yo, Earth to you!\" *He tosses the basketball at your feet with a grin.* \"You've been spacing out all day. What's on your mind?\"\n**Zane**: *He looks up from his sketchbook, his eyes meeting yours for a split second before he looks away.* \"...You okay?\"\n**Felix**: *He closes his book, turning to you with that gentle smile of his.* \"If something's bothering you, you know you can talk to us, right?\"",
        image: 'assets/char-new-06.jpg',
        creator: '官方精选',
        verified: false,
        tags: ['青梅竹马', '多人', '校园', '恋爱'],
        categories: ['multi', 'male', 'school', 'romance'],
        views: 92800,
        chats: 18900,
        tokens: 700,
        rating: 4.7
    },
    {
        id: 11,
        title: 'Snow - Your Edgy Sister',
        chatName: 'Snow',
        description: "Your cool, aloof older sister who acts like she doesn't care — but would kill anyone who hurts you.",
        personality: "You are Snow, the older sister. You're the definition of 'edgy' — dyed white hair, piercings, leather jacket, listens to metal, never smiles. You barely talk to anyone and act like you couldn't care less about anything. But you have a secret soft spot for your little sibling (the user). You're extremely protective, even if you never show it. You express your love through actions, not words.",
        scenario: "You're being bullied at school, and you haven't told anyone — but Snow found out anyway. She shows up at your school unannounced, and you're terrified of what she's about to do...",
        firstMessage: "*She's leaning against the school gate, smoking a cigarette, her leather jacket covered in band patches. Her white hair stands out against the gray sky. When she sees you, she drops the cigarette and stomps it out.*\n\n\"...Hey.\" *She shoves her hands in her pockets, avoiding eye contact for a moment.* \"Heard some kids been givin' you trouble.\" *She finally looks at you, and her eyes are cold — colder than you've ever seen them.* \"Tell me their names. Now.\"",
        image: 'assets/char-sakura.jpg',
        creator: '官方精选',
        verified: false,
        tags: ['姐姐', '傲娇', '现代', '女性'],
        categories: ['female', 'oc', 'modern', 'family'],
        views: 71200,
        chats: 14200,
        tokens: 620,
        rating: 4.7
    },
    {
        id: 12,
        title: 'Your Tyrant Father',
        chatName: 'Father',
        description: "The cold, controlling patriarch of a wealthy family — who only shows weakness when it comes to you.",
        personality: "You are the head of a powerful and wealthy family. You're feared by everyone — your employees, your business rivals, even your own family. You're ruthless, calculating, and you always get what you want. But there's one person who can make you soft — your youngest child (the user). You spoil them rotten, even though you try to hide it. You have very high expectations for them, but you also love them more than anything in the world.",
        scenario: "You've always been the 'favorite child' — much to the jealousy of your older siblings. Tonight, you're supposed to attend a fancy gala with your father. But you're not feeling well, and you're considering skipping it. Everyone else is terrified to tell him... but you know he'll listen to you.",
        firstMessage: "*He's sitting at his desk, going through some documents. He looks up when you enter, and his expression softens — just slightly. No one else would notice, but you do.*\n\n\"What is it?\" *He sets his pen down, giving you his full attention.* \"You look pale. Are you feeling alright?\" *He stands up and walks over to you, placing the back of his hand on your forehead before you can even respond.* \"...You're warm. You're not going to the gala tonight.\"",
        image: 'assets/char-knight.jpg',
        creator: '官方精选',
        verified: false,
        tags: ['父亲', '霸道', '豪门', '男性'],
        categories: ['male', 'oc', 'modern', 'family'],
        views: 65800,
        chats: 12800,
        tokens: 680,
        rating: 4.6
    }
];

function formatViews(num) {
    if (num >= 100000000) {
        return (num / 100000000).toFixed(1) + '亿';
    } else if (num >= 10000) {
        return (num / 10000).toFixed(0) + '万';
    }
    return num.toString();
}

// ===== State =====
let allCharacters = [];
let filteredCharacters = [];
let currentPage = 1;
const pageSize = 12;
let isLoading = false;
let hasMore = true;
let totalCharacters = 0;
let useBackendData = false;

let currentCategory = 'all';
let currentFilter = 'characters';
let currentSort = 'hot';
let currentSortBy = 'views';

// ===== DOM Elements =====
const guestView = document.getElementById('guestView');
const loggedView = document.getElementById('loggedView');
const authButtons = document.getElementById('authButtons');
const userMenu = document.getElementById('userMenu');
const userAvatar = document.getElementById('userAvatar');
const userAvatarText = document.getElementById('userAvatarText');
const userDropdown = document.getElementById('userDropdown');
const dropdownUsername = document.getElementById('dropdownUsername');
const dropdownPhone = document.getElementById('dropdownPhone');
const dropdownAvatarText = document.getElementById('dropdownAvatarText');
const logoutBtn = document.getElementById('logoutBtn');

const loginModal = document.getElementById('loginModal');
const modalClose = document.getElementById('modalClose');
const modalOverlay = document.querySelector('.login-modal-overlay');

const characterGrid = document.getElementById('characterGrid');
const guestCharacterGrid = document.getElementById('guestCharacterGrid');
const categoryTags = document.querySelectorAll('.category-tag');
const filterTabs = document.querySelectorAll('.filter-tab');
const sortTabs = document.querySelectorAll('.sort-tab');
const sortOptions = document.querySelectorAll('.sort-option');
const scrollIndicator = document.getElementById('scrollIndicator');
const endOfList = document.getElementById('endOfList');
const backToTopBtn = document.getElementById('backToTop');
const themeToggle = document.getElementById('themeToggle');
const themeToggleLogged = document.getElementById('themeToggleLogged');
const navbar = document.querySelector('.navbar');

// ===== Initialize View Based on Auth State =====
async function initView() {
    // 只在主页有角色网格时才初始化角色列表
    const hasCharacterGrid = !!characterGrid;
    const hasGuestGrid = !!guestCharacterGrid;

    const loggedIn = isLoggedIn();
    const user = getCurrentUser();

    if (loggedIn && user) {
        // Logged in view
        if (guestView) guestView.style.display = 'none';
        if (loggedView) loggedView.style.display = 'block';
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';

        // Update user info
        const firstChar = user.username ? user.username.charAt(0).toUpperCase() : 'U';
        if (userAvatarText) userAvatarText.textContent = firstChar;
        if (dropdownAvatarText) dropdownAvatarText.textContent = firstChar;
        if (dropdownUsername) dropdownUsername.textContent = user.username || '用户';
        if (dropdownPhone) dropdownPhone.textContent = user.phone ? maskPhone(user.phone) : '';

        // 只有主页才加载角色列表
        if (hasCharacterGrid) {
            // 先用默认数据渲染（立即显示，不等待后端）
            if (allCharacters.length === 0) {
                allCharacters = [...DEFAULT_CHARACTERS];
                filteredCharacters = [...allCharacters];
                totalCharacters = allCharacters.length;
                hasMore = false;
                useBackendData = false;
            }
            renderCharacters(1);
            setupInfiniteScroll();
            // 异步加载后端数据，加载完成后替换
            loadCharactersFromBackend().then(() => {
                if (useBackendData) {
                    renderCharacters(1);
                }
            });
        }
    } else {
        // Guest view
        if (guestView) guestView.style.display = 'block';
        if (loggedView) loggedView.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';

        // 只有主页才加载角色列表
        if (hasGuestGrid) {
            // 先用默认数据渲染（立即显示，不等待后端）
            if (allCharacters.length === 0) {
                allCharacters = [...DEFAULT_CHARACTERS];
                filteredCharacters = [...allCharacters];
                totalCharacters = allCharacters.length;
                hasMore = false;
                useBackendData = false;
            }
            renderGuestCharacters();
            // 异步加载后端数据，加载完成后替换
            loadCharactersFromBackend().then(() => {
                if (useBackendData) {
                    renderGuestCharacters();
                }
            });
        }
    }
}

// ===== Load characters from backend API =====
async function loadCharactersFromBackend() {
    isLoading = true;

    try {
        const result = await GenSphereAPI.characters.getList({
            page: 1,
            pageSize: 50,
            category: currentCategory,
            sortBy: currentSortBy
        });

        if (result.code === 0 && result.data && Array.isArray(result.data.items)) {
            const items = result.data.items;
            allCharacters = items.map(normalizeCharFromBackend);
            filteredCharacters = [...allCharacters];
            totalCharacters = result.data.total || items.length;
            hasMore = !!result.data.hasMore;
            useBackendData = true;
            isLoading = false;
            return;
        }
    } catch (e) {
        console.error('Failed to load characters from backend:', e);
    }

    // 后端加载失败时，保留已有的默认角色数据，不清空
    if (allCharacters.length === 0) {
        allCharacters = [...DEFAULT_CHARACTERS];
        filteredCharacters = [...allCharacters];
        totalCharacters = allCharacters.length;
    }
    hasMore = false;
    useBackendData = false;
    isLoading = false;
}

// ===== Normalize backend character data to match UI format =====
function normalizeCharFromBackend(char) {
    const viewCount = char.viewCount ?? char.view_count ?? 0;
    const chatCount = char.chatCount ?? char.chat_count ?? 0;

    return {
        id: char.id,
        title: char.title,
        image: char.image || 'assets/char-knight.jpg',
        description: char.description || '',
        creator: char.creatorName || char.creator_name || '匿名用户',
        creatorId: char.creatorId || char.creator_id,
        verified: !!char.verified,
        tags: Array.isArray(char.tags) ? char.tags : [],
        categories: Array.isArray(char.categories) ? char.categories : [],
        views: formatNumber(viewCount),
        chats: formatNumber(chatCount),
        tokens: formatNumber(viewCount),
        rating: char.rating || 0,
        createdAt: char.createdAt || char.created_at,
        category: Array.isArray(char.categories) ? char.categories : (char.category || [])
    };
}

function formatNumber(num) {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return num.toString();
}

function maskPhone(phone) {
    return phone.slice(0, 3) + '****' + phone.slice(7);
}

// ===== Render Guest Preview =====
function renderGuestCharacters() {
    if (!guestCharacterGrid) return;
    const previewChars = allCharacters.slice(0, 18);
    const html = previewChars.map(char => createCharacterCard(char, true)).join('');
    guestCharacterGrid.innerHTML = html;
    observeFadeInElements();
}

// ===== Render Characters (Pagination) =====
function renderCharacters(page = 1) {
    if (!characterGrid) return;
    currentPage = page;
    const totalPages = Math.ceil(filteredCharacters.length / pageSize);
    
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageChars = filteredCharacters.slice(start, end);
    
    const html = pageChars.map(char => createCharacterCard(char, false)).join('');
    characterGrid.innerHTML = html;
    
    // 更新分页
    renderPagination(totalPages);
    
    // 滚动到顶部
    window.scrollTo({ top: document.querySelector('.main-content').offsetTop - 80, behavior: 'smooth' });
    
    observeFadeInElements();
}

// ===== 渲染分页组件 =====
function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    // 上一页按钮状态
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    // 生成页码
    let pages = [];
    const delta = 2; // 当前页左右各显示2个
    
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - delta && i <= currentPage + delta)
        ) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }
    
    pageNumbers.innerHTML = pages.map(p => {
        if (p === '...') {
            return '<span class="page-ellipsis">...</span>';
        }
        return `<button class="page-number ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }).join('');
    
    // 绑定页码点击
    pageNumbers.querySelectorAll('.page-number').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page !== currentPage) {
                renderCharacters(page);
            }
        });
    });
}

// ===== 上一页/下一页 =====
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            renderCharacters(currentPage - 1);
        }
    });
}
if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredCharacters.length / pageSize);
        if (currentPage < totalPages) {
            renderCharacters(currentPage + 1);
        }
    });
}

function createCharacterCard(char, isGuest = false) {
    const tagsHtml = char.tags.slice(0, 4).map(tag => `
        <span class="card-tag">${tag}</span>
    `).join('');
    
    const clickClass = isGuest ? 'card-guest' : '';
    
    return `
        <div class="character-card fade-in ${clickClass}" data-id="${char.id}" ${isGuest ? 'data-require-login="true"' : ''}>
            <div class="card-header">${char.title}</div>
            <div class="card-image-wrapper">
                <img src="${char.image}" alt="${char.title}" class="card-image" loading="lazy">
                <div class="card-badges">
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
                    ${char.verified ? '<svg class="verified-badge" viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>' : ''}
                </div>
                <p class="card-description">${char.description}</p>
                <div class="card-tags">
                    ${tagsHtml}
                </div>
                <div class="card-footer">
                    <span class="card-tokens">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                        </svg>
                        ${char.tokens} 个 Token
                    </span>
                </div>
            </div>
        </div>
    `;
}

// ===== Filter & Sort =====
function applyFilters() {
    filteredCharacters = [...allCharacters];

    if (currentCategory !== 'all') {
        filteredCharacters = filteredCharacters.filter(char => {
            const cats = char.categories || char.category || [];
            return cats.includes(currentCategory);
        });
    }

    if (currentSortBy === 'views') {
        filteredCharacters.sort((a, b) => parseCount(b.views) - parseCount(a.views));
    } else if (currentSortBy === 'rating') {
        filteredCharacters.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    } else if (currentSortBy === 'newest') {
        filteredCharacters.sort((a, b) => {
            const aTime = typeof a.createdAt === 'number' ? a.createdAt : (b.id - a.id);
            const bTime = typeof b.createdAt === 'number' ? b.createdAt : 0;
            return bTime - aTime;
        });
    }

    // 筛选后重置到第一页
    renderCharacters(1);
}

function parseCount(val) {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;
    if (val.includes('亿')) return parseFloat(val) * 100000000;
    if (val.includes('万')) return parseFloat(val) * 10000;
    return parseFloat(val) || 0;
}

function parseViews(viewsStr) {
    if (typeof viewsStr === 'number') return viewsStr;
    if (viewsStr.includes('亿')) {
        return parseFloat(viewsStr) * 100000000;
    } else if (viewsStr.includes('万')) {
        return parseFloat(viewsStr) * 10000;
    }
    return parseFloat(viewsStr);
}

// ===== Login Modal =====
function showLoginModal() {
    loginModal.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function hideLoginModal() {
    loginModal.classList.remove('visible');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', hideLoginModal);
modalOverlay.addEventListener('click', hideLoginModal);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && loginModal.classList.contains('visible')) {
        hideLoginModal();
    }
});

// ===== User Dropdown =====
const drawerOverlay = document.getElementById('drawerOverlay');

function openUserDropdown() {
    userDropdown.classList.add('visible');
    if (drawerOverlay) {
        drawerOverlay.classList.add('visible');
    }
}

function closeUserDropdown() {
    userDropdown.classList.remove('visible');
    if (drawerOverlay) {
        drawerOverlay.classList.remove('visible');
    }
}

userAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    if (userDropdown.classList.contains('visible')) {
        closeUserDropdown();
    } else {
        openUserDropdown();
    }
});

document.addEventListener('click', (e) => {
    if (!userDropdown.contains(e.target) && !userAvatar.contains(e.target)) {
        closeUserDropdown();
    }
});

if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeUserDropdown);
}

// ===== Logout =====
logoutBtn.addEventListener('click', async () => {
    closeUserDropdown();
    
    // 调用登出 API
    await GenSphereAPI.auth.logout();
    
    // 清除本地状态
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(AUTO_LOGIN_KEY, 'false');
    
    // 重置并重新初始化
    characterGrid.innerHTML = '';
    guestCharacterGrid.innerHTML = '';
    initView();
    window.scrollTo({ top: 0 });
});

// ===== Card Click =====
document.addEventListener('click', (e) => {
    const card = e.target.closest('.character-card');
    if (card) {
        const charId = card.dataset.id;
        const requireLogin = card.dataset.requireLogin === 'true';
        if (requireLogin && !isLoggedIn()) {
            showLoginModal();
            return;
        }
        if (charId) {
            const basePath = window.location.pathname.replace(/[^/]*$/, '');
            window.location.href = basePath + 'character.html?id=' + encodeURIComponent(charId);
        }
        return;
    }
    
    // Category tags require login
    if (!isLoggedIn() && e.target.closest('.category-tag')) {
        showLoginModal();
    }
    
    // Filter tabs require login
    if (!isLoggedIn() && e.target.closest('.filter-tab')) {
        showLoginModal();
    }
    
    // Sort tabs/options require login
    if (!isLoggedIn() && (e.target.closest('.sort-tab') || e.target.closest('.sort-option'))) {
        showLoginModal();
    }
});

// ===== Event Listeners =====

// Category tags
categoryTags.forEach(tag => {
    tag.addEventListener('click', () => {
        if (!isLoggedIn()) return;
        
        categoryTags.forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        currentCategory = tag.dataset.category;
        applyFilters();
    });
});

// Filter tabs
filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        if (!isLoggedIn()) return;
        
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
    });
});

// Sort tabs
sortTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        if (!isLoggedIn()) return;
        
        sortTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentSort = tab.dataset.sort;
    });
});

// Sort options
sortOptions.forEach(option => {
    option.addEventListener('click', () => {
        if (!isLoggedIn()) return;
        
        sortOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        currentSortBy = option.dataset.sortBy;
        applyFilters();
    });
});

// ===== Back to Top =====
function setupBackToTop() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== Navbar scroll effect =====
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== Theme toggle =====
function setupThemeToggle() {
    // 从本地存储读取主题偏好
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
    
    const toggles = [themeToggle, themeToggleLogged].filter(Boolean);
    toggles.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleTheme();
        });
    });
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

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

// ===== Search Functionality =====
const searchInputs = document.querySelectorAll('.search-input');
let searchTimeout = null;

searchInputs.forEach(input => {
    input.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.toLowerCase();
        
        searchTimeout = setTimeout(() => {
            if (!isLoggedIn()) {
                showLoginModal();
                return;
            }
            
            if (query.length > 0) {
                filteredCharacters = allCharacters.filter(char => 
                    char.title.toLowerCase().includes(query) ||
                    char.creator.toLowerCase().includes(query) ||
                    char.description.toLowerCase().includes(query)
                );
                renderCharacters(true);
            } else {
                applyFilters();
            }
        }, 200);
    });
    
    input.addEventListener('focus', () => {
        if (!isLoggedIn()) {
            showLoginModal();
            input.blur();
        }
    });
});

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', async () => {
    await checkAutoLogin();
    initView();
    setupBackToTop();
    setupThemeToggle();
});
