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

// ===== Character Data Generator (legacy, not used for default display) =====
function generateCharacters(count, startId = 1) {
    const titles = [
        "深空探险家", "Willson Wáng", "星际指挥官", "Ayato Hiroshi",
        "Second Life Isekai", "Giovanni Moretti", "Your Three Older Brothers",
        "Best friends trio", "Snow your edgy sister",
        "Another Magic Academy", "古代剑客", "龙骑士传说",
        "末世幸存者", "吸血鬼恋人", "校园恋爱物语", "赛博朋克2077",
        "神秘侦探", "精灵王子", "机械少女", "时空旅行者", "海底王国",
        "天使与恶魔", "狼人传说", "魔法少女", "忍者物语", "海盗冒险",
        "超能力学院", "幽灵公寓", "美食厨师", "偶像练习生", "电竞选手",
        "医生与患者", "师生恋曲", "总裁的秘书", "邻家女孩", "青梅竹马",
        "双胞胎兄弟", "傲娇大小姐", "忠犬男友", "病娇女友", "高冷学霸"
    ];
    
    const creators = [
        "KLOOMSY", "Shxou_Huang", "hornybite", "Rowlemal", "Hurricanezer",
        "Emi Yuu", "Лик.", "scifiauthor", "wuxiamaster", "storyweaver",
        "edgyqueen", "wizardmaster", "digitalartist", "fantasywriter",
        "romanceking", "darklord", "cutemaker", "sama_senpai"
    ];
    
    const categories = [
        ["male", "oc", "fictional"],
        ["male", "oc", "fictional", "sweet"],
        ["male", "female", "fictional", "multi"],
        ["male", "oc", "fictional"],
        ["game", "anime", "fantasy", "drama"],
        ["male", "oc", "fictional", "sweet"],
        ["male", "multi", "drama"],
        ["male", "fictional", "drama"],
        ["multi", "sweet", "oc"],
        ["female", "oc", "drama"],
        ["fantasy", "anime", "drama"],
        ["scifi", "drama", "male"],
        ["ancient", "drama", "male"],
        ["fantasy", "male"],
        ["scifi", "horror", "drama"],
        ["fantasy", "drama", "male", "female"],
        ["sweet", "drama", "modern"],
        ["scifi", "modern"],
        ["drama", "modern", "male"],
        ["fantasy", "male"],
        ["scifi", "female"],
        ["scifi", "drama"],
        ["fantasy", "drama"],
        ["fantasy", "drama", "male", "female"],
        ["fantasy", "male", "horror"],
        ["anime", "female", "fantasy"],
        ["ancient", "male"],
        ["multi"],
        ["anime", "fantasy"],
        ["horror", "drama", "modern"],
        ["comedy", "modern", "male"],
        ["modern", "female", "drama"],
        ["modern", "drama", "male"],
        ["modern", "drama", "male", "female"],
        ["modern", "drama", "male", "female"],
        ["modern", "sweet", "drama"],
        ["modern", "sweet", "female"],
        ["sweet", "modern"],
        ["multi", "male", "drama"],
        ["female", "modern"],
        ["male", "sweet", "modern"],
        ["female", "drama"],
        ["male", "school"]
    ];
    
    const tags = [
        ["无限制", "男性", "OC", "虚构", "反派"],
        ["男性", "OC", "虚构", "甜"],
        ["男性", "女性", "虚构", "多人"],
        ["男性", "OC", "虚构"],
        ["无限制", "游戏", "动漫", "魔法", "剧情"],
        ["无限制", "男性", "OC", "虚构", "甜"],
        ["男性", "多人"],
        ["男性", "虚构", "剧情"],
        ["多人", "甜", "OC"],
        ["女性", "OC", "剧情"],
        ["魔法", "动漫", "剧情"],
        ["科幻", "剧情", "英雄"],
        ["古风", "剧情", "男性", "武侠"],
        ["奇幻", "冒险"],
        ["科幻", "末世", "生存"],
        ["奇幻", "吸血鬼", "恋爱"],
        ["甜", "校园", "恋爱"],
        ["科幻", "赛博朋克", "动作"],
        ["悬疑", "侦探", "剧情"],
        ["奇幻", "精灵", "男性"],
        ["科幻", "机娘", "女性"],
        ["科幻", "穿越", "剧情"],
        ["奇幻", "海底", "冒险"],
        ["奇幻", "天使", "恶魔"],
        ["奇幻", "狼人", "男性"],
        ["魔法少女", "动漫", "女性"],
        ["忍者", "动作", "古风"],
        ["海盗", "冒险", "多人"],
        ["超能力", "校园", "动漫"],
        ["恐怖", "幽灵", "悬疑"],
        ["喜剧", "美食", "现代"],
        ["偶像", "音乐", "女性"],
        ["电竞", "游戏", "现代"],
        ["医生", "现代", "剧情"],
        ["师生", "校园", "恋爱"],
        ["总裁", "现代", "甜"],
        ["邻家", "甜", "现代"],
        ["青梅竹马", "甜", "校园"],
        ["双胞胎", "多人", "男性"],
        ["傲娇", "大小姐", "女性"],
        ["忠犬", "男友", "甜"],
        ["病娇", "女友", "恐怖"],
        ["学霸", "校园", "男性"]
    ];
    
    const descriptions = [
        "一位神秘的角色，有着不为人知的过去和令人着迷的性格。",
        "在这个充满奇幻色彩的世界里，你们将展开一段难忘的冒险。",
        "看似平凡的日常下，隐藏着怎样的秘密和情感纠葛？",
        "命运的齿轮开始转动，你们的相遇是偶然还是必然？",
        "在这个异世界中，你将如何书写属于自己的传奇故事？",
        "一段跨越时空的爱恋，一场惊心动魄的冒险。",
        "当真相浮出水面，你们的关系会发生怎样的变化？",
        "在黑暗中寻找光明，在绝望中寻找希望。",
        "温暖治愈的日常故事，让你的心被甜蜜填满。",
        "紧张刺激的剧情发展，每一个选择都将改变结局。"
    ];
    
    const localImages = [
        'assets/char-knight.jpg',
        'assets/char-mystic.jpg',
        'assets/char-mystic2.jpg',
        'assets/char-eren.jpg',
        'assets/char-mima.jpg',
        'assets/char-sakura.jpg',
        'assets/char-temple.jpg',
        'assets/char-pagoda.jpg',
        'assets/char-new-01.jpg',
        'assets/char-new-02.jpg',
        'assets/char-new-03.jpg',
        'assets/char-new-04.jpg',
        'assets/char-new-05.jpg',
        'assets/char-new-06.jpg',
        'assets/char-new-07.jpg',
        'assets/char-new-08.jpg',
        'assets/char-new-09.jpg',
        'assets/char-new-10.jpg'
    ];

    const personalities = [
        '冷酷而内心炽热，对信任的人极尽温柔，对敌人毫不留情',
        '活泼开朗，善于社交，但内心深处藏着不为人知的伤痛',
        '沉默寡言，行动果断，用沉默代替一切不必要的言语',
        '傲慢自大，实力强大，但会在关键时刻展现出脆弱的一面',
        '温柔体贴，善解人意，总是把别人的需求放在自己之前',
        '腹黑狡猾，城府极深，表面和善实则心狠手辣',
        '热血冲动，义气深重，为了朋友可以不顾一切',
        '冷静理性，智商超群，情感淡漠但观察力惊人',
        '病态执着，占有欲极强，对爱的人有着扭曲的深情',
        '随性洒脱，不拘小节，看似懒散实则在暗中布局一切'
    ];

    const scenarios = [
        '联邦情报局·绝密地下指挥室——多种族融合期的敏感时刻，异常能量波动引发秘密调查行动',
        '异世界转生——你在一座陌生的魔法学院醒来，发现自己拥有了前世的记忆和新的力量',
        '末世废土——核灾后的第三年，你在废墟中建立了一个小型避难所，资源日益枯竭',
        '古代江湖——武林各大门派暗流涌动，一本失传的武学秘籍重现人间，引发血雨腥风',
        '赛博朋克都市——2077年的夜之城，巨型企业与地下黑客组织的暗战从未停歇',
        '深渊地牢——你被冤枉入狱，在暗无天日的地牢深处遇到了一位同样被遗忘的存在',
        '星际战场——联邦与虫族的战争进入白热化阶段，你被紧急调往前线指挥舰队',
        '吸血鬼城堡——月圆之夜，你误入了一座古老的城堡，这里住着一位沉睡了千年的吸血鬼',
        '校园日常——看似平静的高中生活下，隐藏着一段跨越前世今生的宿命情缘',
        '海盗黄金时代——加勒比海上，你是新一代海盗王的有力竞争者'
    ];

    const firstMessages = [
        '**【场景：联邦情报局 · 绝密地下指挥室】**\n\n昏暗的灯光下，全息投影在会议桌上投射出几个闪烁的能量波动点。纪陇——联邦最年轻的情报局副局长，正站在投影前，银白色的短发在蓝光中显得格外凌厉。\n\n她的目光扫过你，嘴角微微上扬：\n\n"指挥官，这三个异常能量源的出现时间与『融合纪念日』完全重合。这不是巧合。"\n\n她将一份加密文件推到你面前：\n\n"我的建议是——启动秘密调查。大张旗鼓地调动联邦军队只会打草惊蛇。我们需要那种『即使死在暗处也不会留下痕迹』的特工。"\n\n**你打算如何回应？**\n1. 同意启动秘密调查行动，派遣影子特工潜入异常区域\n2. 调动联邦正规军进行公开巡查，展示联邦力量\n3. 先派出无人机进行远程侦察，暂不派人',
        '你在一座陌生的房间里醒来，头痛欲裂。窗外传来鸟鸣和远处的钟声。一个身影出现在门口：\n\n"你终于醒了...你在森林里晕倒了，我把你带了回来。"\n\n你低头看着自己的双手——这似乎不是你原来的身体。一股陌生的力量在体内涌动。\n\n"这里是星辉魔法学院。你...是新生吗？"',
        '废墟中，你紧握着最后半瓶净水。远处传来变异兽的低吼。你的避难所里还有三个人等着你带食物回去。\n\n突然，一个身影出现在废墟尽头，手里拿着一把还在冒烟的枪。',
        '雨夜。酒馆。一封密信被拍在你面前。\n\n"江湖传言，『天罡秘录』重现人间。各派已暗中派出高手争夺。"\n\n送信人压低斗笠，露出一双锐利的眼睛：\n\n"你...要不要入局？"',
    ];

    const exampleDialogs = [
        '{{user}}: 我同意启动秘密调查。\n{{char}}: （她微微挑眉，对你的选择表示赞许）"明智的选择。大张旗鼓地出动联邦军队只会让那些阴影中的家伙提前收敛。"\n\n她转过身，对着阴影处打了个手势："既然决定了，那就立刻启动『幽灵计划』。"\n\n{{user}}: 幽灵计划？\n{{char}}: "联邦最精锐的影子特工——一群融合了魔法隐匿术与高科技伪装装置的精英。他们会悄无声息地潜入那些异常区域。"',
        '{{user}}: 我这是在哪？\n{{char}}: "这里是星辉魔法学院。你昏迷了三天...你的身体里有一种我说不清的能量。"\n\n她犹豫了一下，递过一面镜子。\n\n{{user}}: 这...这不是我！\n{{char}}: "我也不知道发生了什么，但学院院长说你可能是...『转生者』。"',
    ];

    const definitions = [
        '纪陇是联邦情报局副局长，拥有精灵与人类的混血血统。她精通魔法隐匿术和高科技情报分析，性格冷静果断。她对"融合纪念日"的异常能量波动有着敏锐的直觉。',
        '一个从现代世界转生到魔法学院的灵魂，拥有前世的知识和新的魔法天赋。性格随前世记忆的影响而变化。',
        '末世幸存者，领导一个小型避难所。在核灾前的身份不明，但展现出超越常人的生存能力。',
    ];

    const chars = [];
    for (let i = 0; i < count; i++) {
        const idx = (startId + i - 1) % titles.length;
        const rand = Math.floor(Math.random() * 10);
        const charId = startId + i;
        
        // 使用本地素材图，超过数量则循环复用
        const image = localImages[(charId - 1) % localImages.length];
        
        const ratings = [3.5, 3.6, 3.7, 3.8, 3.9, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0];
        
        chars.push({
            id: charId,
            title: titles[idx] + (startId > 1 ? ` ${Math.ceil((startId + i) / titles.length)}` : ''),
            creator: creators[Math.floor(Math.random() * creators.length)],
            verified: Math.random() > 0.6,
            description: descriptions[rand],
            views: formatViews(Math.floor(Math.random() * 50000000) + 100000),
            chats: Math.floor(Math.random() * 500) + 5,
            tokens: Math.floor(Math.random() * 5000) + 200,
            rating: ratings[Math.floor(Math.random() * ratings.length)],
            tags: tags[idx],
            category: categories[idx],
            image: image,
            chatName: titles[idx],
            contentLevel: Math.random() > 0.5 ? 'SFW' : 'NSFW',
            personality: personalities[idx % personalities.length],
            scenario: scenarios[idx % scenarios.length],
            firstMessage: firstMessages[idx % firstMessages.length],
            exampleDialog: exampleDialogs[idx % exampleDialogs.length],
            definition: definitions[idx % definitions.length]
        });
    }
    
    return chars;
}

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

    // 后端加载失败
    allCharacters = [];
    filteredCharacters = [];
    totalCharacters = 0;
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
