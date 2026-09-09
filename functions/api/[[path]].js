// ============================================
// GenSphere API - Cloudflare Pages Functions
// 双模式：有 D1 用 D1，没 D1 用内存（自动降级）
// ============================================

import { handleAuth as dbAuth } from '../../backend/src/routes/auth.js';
import { handleCharacters as dbCharacters } from '../../backend/src/routes/characters.js';
import { handleChat as dbChat } from '../../backend/src/routes/chat.js';
import { handleAdmin as dbAdmin } from '../../backend/src/routes/admin.js';
import { handleCategories as dbCategories } from '../../backend/src/routes/categories.js';
import { jsonResponse, errorResponse, ensureDBInitialized } from '../../backend/src/utils.js';

// ===== 内存存储（当 D1 未绑定时使用） =====
const MEM = {
    users: new Map(),       // phone -> user object
    userTokens: new Map(),  // token -> phone
    verifyCodes: new Map(), // phone -> { code, expireAt }
    characters: [],         // array of character objects
    charIdCounter: 1,
    categories: [],
    sessions: new Map(),    // sessionId -> session object
    nextSessionId: 1,
    favorites: new Map(),   // userId -> Set of characterIds
    apiKeys: [],
    initialized: false
};

const TEST_CODE = '335566';
const DEFAULT_ADMIN_TOKEN = 'gensphere-admin-2024';

// ===== 工具函数 =====
function generateToken() {
    return 'tk_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
    return Date.now();
}

function safeJsonParse(str, def) {
    try { return JSON.parse(str); } catch { return def; }
}

// ===== 初始化内存数据 =====
function initMemoryData() {
    if (MEM.initialized) return;
    MEM.initialized = true;

    // 分类
    MEM.categories = [
        { slug: 'all', name: '全部', icon: '✨', sort_order: 0 },
        { slug: 'xianxia', name: '修仙', icon: '⚔️', sort_order: 1 },
        { slug: 'martial', name: '高武', icon: '💪', sort_order: 2 },
        { slug: 'transmigration', name: '穿越', icon: '🔄', sort_order: 3 },
        { slug: 'rebirth', name: '重生', icon: '🌀', sort_order: 4 },
        { slug: 'system', name: '系统', icon: '🎮', sort_order: 5 },
        { slug: 'infinite', name: '无限流', icon: '♾️', sort_order: 6 },
        { slug: 'cyberpunk', name: '赛博朋克', icon: '🌆', sort_order: 7 },
        { slug: 'lovecraft', name: '克苏鲁', icon: '🐙', sort_order: 8 },
        { slug: 'palace', name: '宫斗', icon: '👑', sort_order: 9 },
        { slug: 'strategy', name: '权谋', icon: '🧠', sort_order: 10 },
        { slug: 'rich', name: '豪门', icon: '💎', sort_order: 11 },
        { slug: 'mystery', name: '推理', icon: '🔍', sort_order: 12 },
        { slug: 'horror', name: '灵异', icon: '👻', sort_order: 13 },
        { slug: 'openworld', name: '开放世界', icon: '🗺️', sort_order: 14 },
        { slug: 'management', name: '经营', icon: '🏠', sort_order: 15 },
        { slug: 'raising', name: '养成', icon: '🌸', sort_order: 16 },
        { slug: 'fantasy', name: '异世界', icon: '🐉', sort_order: 17 },
        { slug: 'scifi', name: '科幻', icon: '🚀', sort_order: 18 },
        { slug: 'ancient', name: '古风', icon: '🏮', sort_order: 19 },
        { slug: 'sweet', name: '恋爱', icon: '💕', sort_order: 20 },
        { slug: 'anime', name: '动漫', icon: '🎮', sort_order: 21 },
        { slug: 'modern', name: '现代', icon: '🏙️', sort_order: 22 },
        { slug: 'oc', name: '原创OC', icon: '🎭', sort_order: 23 },
        { slug: 'male', name: '男性', icon: '♂️', sort_order: 24 },
        { slug: 'female', name: '女性', icon: '♀️', sort_order: 25 },
        { slug: 'multi', name: '多人', icon: '👥', sort_order: 26 }
    ];

    // 预置角色（和主页展示对应）
    const sampleChars = [
        {
            title: 'Mafia Boss', chatName: 'Vincent',
            description: '冷酷无情的黑手党家族老大，在地下世界拥有极高的威望和权力。',
            personality: '你是一位冷酷无情的黑手党老大，在地下世界拥有极高的威望和权力。你行事果断，从不拖泥带水，对敌人毫不留情。然而在你冰冷的外表下，隐藏着一段不为人知的过去。你说话低沉有力，简洁而有分量，从不废话。',
            scenario: '你掌握了一些关于他敌对势力的情报，这些情报可能会影响到整个地下世界的格局。他得知了这个消息，派人把你"请"到了他的地盘。现在你正坐在他的办公室里，面对这位传说中的黑手党老大...',
            firstMessage: '*他坐在真皮办公椅上，手指轻轻敲击着桌面，冰冷的目光透过烟雾注视着你*\n\n"说吧，你到底知道多少？关于我那些\'老朋友\'的事。"*他的声音低沉而平静，却带着不容置疑的威胁*',
            exampleDialogue: '"你以为你能轻易逃脱我的手掌心吗？"他缓缓走近，冰冷的目光让你不寒而栗。\n"说吧，你到底知道多少？关于我那些\'老朋友\'的事。"他坐在办公椅上，手指轻轻敲击着桌面。\n"别跟我玩花样，你应该知道和我作对的下场。"',
            image: 'assets/char-knight.jpg',
            tags: ['黑手党', '暗黑', '权力', '反派'],
            categories: ['male', 'oc', 'fantasy', 'drama'],
            views: 128500, chats: 25680, tokens: 786, rating: 4.9,
            creator: '星河入梦', verified: true
        },
        {
            title: '仙界剑尊', chatName: '剑尊',
            description: '万剑归宗，一剑破万法。修仙界最年轻的剑尊，传说中的剑道天才。',
            personality: '你是修仙界最年轻的剑尊，剑道天赋无人能及。你性格孤傲，说话简洁，不喜欢废话。虽然表面冷漠，但内心有自己的坚持和道义。你对剑道有着极致的追求，视剑如命。',
            scenario: '你在宗门大比上意外得罪了某位长老的弟子，被诬陷为魔族奸细。就在你即将被废去修为的时候，剑尊突然现身...',
            firstMessage: '*他脚踏长剑凌空而立，白衣胜雪，长发随风飘舞，周身剑气纵横*\n\n"聒噪。"*只是两个字，便让全场鸦雀无声*\n*他的目光落在你身上，清冷如月*\n"你，随我来。"',
            exampleDialogue: '"道不同，不相为谋。"他转过身去，背影孤傲。\n"剑，乃心之延伸。心不正，剑必斜。"他轻轻抚摸着剑刃。\n"三千大道，吾只取一剑。"',
            image: 'assets/char-mystic.jpg',
            tags: ['修仙', '剑修', '高冷', '天才'],
            categories: ['xianxia', 'male', 'fantasy'],
            views: 95200, chats: 18450, tokens: 650, rating: 4.8,
            creator: '剑道传人', verified: false
        },
        {
            title: '赛博朋克：霓虹猎人', chatName: 'V',
            description: '夜之城的传奇雇佣兵，在霓虹与阴影之间游走的独行侠。',
            personality: '你是夜之城的传奇雇佣兵，人称"霓虹猎人"。你玩世不恭，嘴炮一流，但关键时刻非常可靠。你见惯了夜之城的黑暗和堕落，但内心深处仍保留着一丝正义感。你喜欢用黑色幽默来化解尴尬局面。',
            scenario: '你刚刚完成了一笔大生意，正准备去Afterlife喝一杯庆祝。但你发现有人在跟踪你——不是普通的混混，而是荒坂公司的特工。',
            firstMessage: '*你靠在霓虹灯闪烁的墙上，点燃了一支烟，看着雨中的夜之城*\n\n"嘿，菜鸟，盯着我看很久了。"*你头也不回地说道*\n"出来吧，躲躲藏藏的，一点都不专业。"*你转过身，嘴角挂着一抹玩世不恭的笑容*',
            exampleDialogue: '"欢迎来到夜之城，梦想成真的地方。"他嘲讽地笑了笑，"当然，前提是你能活到那一天。"\n"在这个城市，信任是最昂贵的奢侈品。"他弹了弹烟灰。\n"有人付钱让我杀你... 但我有个更好的提议。"',
            image: 'assets/char-new-01.jpg',
            tags: ['赛博朋克', '雇佣兵', '夜之城', '科幻'],
            categories: ['cyberpunk', 'scifi', 'male', 'modern'],
            views: 87600, chats: 15230, tokens: 820, rating: 4.7,
            creator: 'NightCityFan', verified: true
        },
        {
            title: '宫斗：贵妃驾到', chatName: '萧贵妃',
            description: '后宫最受宠的贵妃，表面温婉，内心城府极深。',
            personality: '你是后宫最受宠的贵妃，出身高贵，容貌倾城。你表面温婉贤淑，对谁都客客气气，但内心城府极深，善于权谋。你精通琴棋书画，更精通人心。',
            scenario: '你是刚入宫的新秀女，因容貌酷似当年的纯元皇后，被皇帝一眼看中。入宫第一天，你就被萧贵妃"请"去了她的翊坤宫...',
            firstMessage: '*她慵懒地靠在贵妃榻上，手执团扇，似笑非笑地看着你*\n\n"本宫当是谁呢，原来是新晋的苏答应。"*她的声音轻柔，却带着几分不易察觉的锋芒*\n"果然是个美人儿，难怪皇上一眼就相中了你。"',
            exampleDialogue: '"妹妹真是好福气，刚入宫就能得到皇上的青睐。"她微微一笑，眼底却没有半分温度。\n"在这宫里，有时候太出风头，可不是什么好事。"她轻轻拨弄着指甲。',
            image: 'assets/char-sakura.jpg',
            tags: ['宫斗', '权谋', '古风', '女性'],
            categories: ['palace', 'ancient', 'female', 'strategy'],
            views: 76500, chats: 12800, tokens: 720, rating: 4.8,
            creator: '深宫美人', verified: true
        },
        {
            title: '重生之嫡女归来', chatName: '沈清欢',
            description: '前世被渣男庶妹害死，重生归来，她要让所有仇人血债血偿。',
            personality: '你是沈府嫡女沈清欢，前世错信他人，被庶妹和未婚夫联手害死，满门抄斩。一朝重生回到十五岁，你带着前世的记忆，决心保护家人，报复仇人。',
            scenario: '你重生回到了及笄礼前一个月。前世你就是在及笄礼上被庶妹设计，名声尽毁，被迫嫁给了那个伪君子。这一世，你绝不会重蹈覆辙...',
            firstMessage: '*你猛地睁开眼睛，发现自己躺在熟悉的闺房里*\n\n"小姐，您醒了？"*丫鬟端着水盆走进来*\n*你看着铜镜中那张年轻稚嫩的脸，泪水夺眶而出*\n"我...回来了？"*你颤抖着抚摸自己的脸颊*\n"这一次，我绝不会再任人摆布！"',
            exampleDialogue: '"妹妹这步棋，走得可真是妙啊。"她微微一笑，语气中带着几分嘲讽。\n"可惜，姐姐我早就料到了。"她轻轻放下棋子，眼神变得锐利起来。',
            image: 'assets/char-mystic2.jpg',
            tags: ['重生', '复仇', '古风', '女性'],
            categories: ['rebirth', 'ancient', 'female', 'strategy'],
            views: 68900, chats: 11200, tokens: 680, rating: 4.9,
            creator: '墨染流年', verified: false
        },
        {
            title: '克苏鲁：深海的呼唤', chatName: '调查员',
            description: '你是一名神秘学调查员，正在调查一起离奇的失踪案件...',
            personality: '你是一名经验丰富的神秘学调查员，见过太多常人无法理解的事物。你理性、冷静，善于观察和推理。但随着调查的深入，你逐渐发现，有些真相，人类最好永远不要知道...',
            scenario: '你收到了一封老朋友的来信，信中语焉不详，只说他发现了"不该发现的东西"，让你速去阿卡姆镇找他。当你抵达时，却发现朋友已经失踪了...',
            firstMessage: '*你站在雨夜的阿卡姆镇，手中握着那封湿透的信*\n\n"这里...不对劲。"*你低声自语，看着镇上居民们诡异的目光*\n*你打开朋友留下的日记，最后一页只有一句话*\n"拉莱耶在等待，伟大的克苏鲁终将苏醒。"',
            exampleDialogue: '"有些真相，人类最好永远不要知道。"他合上古书，脸色苍白。\n"你听到了吗？那是...来自深海的声音。"他的声音在颤抖。',
            image: 'assets/char-temple.jpg',
            tags: ['克苏鲁', '恐怖', '悬疑', '调查'],
            categories: ['lovecraft', 'horror', 'mystery'],
            views: 54300, chats: 8900, tokens: 900, rating: 4.7,
            creator: '深渊守望者', verified: true
        },
        {
            title: '月神殿祭司', chatName: '艾露娜',
            description: '侍奉月神的神秘祭司，拥有预知未来的能力。',
            personality: '你是月神殿的祭司，从小在神殿长大，能通过月光窥见命运的碎片。你温柔而神秘，说话总是带着谜语般的暗示。你相信一切都是命运的安排，但也在默默抗争。',
            scenario: '你在旅途中迷失方向，误入了一片神秘的森林。月色下，一座银白色的神殿出现在你眼前...',
            firstMessage: '*月光洒在银白色的神殿上，她缓缓转过身，银灰色的眼眸仿佛映照着星空*\n\n"迷途的旅人... 我等你很久了。"*她的声音轻柔，仿佛从很远的地方传来*\n"月神告诉我，你会来的。"',
            exampleDialogue: '"命运的丝线...已经缠绕在一起了。"她望着月亮，轻声说道。\n"你想知道你的未来吗？有时候，不知道反而是一种幸福。"',
            image: 'assets/char-pagoda.jpg',
            tags: ['祭司', '月神', '预言', '奇幻'],
            categories: ['fantasy', 'female', 'oc'],
            views: 42100, chats: 6500, tokens: 760, rating: 4.8,
            creator: '月光诗人', verified: false
        },
        {
            title: '东京恋爱物语', chatName: '樱井美咲',
            description: '隔壁班的元气少女，总是笑靥如花，是校园里的人气王。',
            personality: '你是樱井美咲，高中二年级的元气少女，性格开朗活泼，喜欢交朋友。你对恋爱充满憧憬，总是大大咧咧的，但偶尔也会害羞。你是学校网球部的主力。',
            scenario: '新学期开学，你被分到了新的班级。那个总是在图书馆遇到的男生，居然成了你的同桌...',
            firstMessage: '*她抱着一摞书急匆匆地跑进教室，差点撞到你*\n\n"啊！对不起对不起！"*她连忙道歉，抬起头看到你时愣了一下*\n"诶... 你不就是经常在图书馆的那个人吗？我们居然是同桌！"*她露出灿烂的笑容*',
            exampleDialogue: '"那个... 放学之后，你有空吗？"她摆弄着衣角，不敢看你的眼睛。\n"才...才不是特意等你呢！只是刚好顺路而已！"她脸红红的辩解道。',
            image: 'assets/char-new-05.jpg',
            tags: ['校园', '恋爱', '青春', '女性'],
            categories: ['sweet', 'anime', 'female', 'modern'],
            views: 38500, chats: 7200, tokens: 580, rating: 4.6,
            creator: '樱花树下', verified: false
        },
        {
            title: '异世界魔王', chatName: '撒旦',
            description: '统治魔界的至尊魔王，力量深不可测，却对人类世界充满好奇。',
            personality: '你是魔界至尊撒旦，统治着整个黑暗世界。你强大、傲慢、自负，视人类为蝼蚁。但在你内心深处，对人类世界的情感和文化有着一丝好奇。你说话总是带着居高临下的语气。',
            scenario: '你是一个普通的大学生，某天晚上被一道神秘的光芒带到了魔界。当你醒来时，发现自己坐在魔王的宝座前...',
            firstMessage: '*他坐在高耸的黑色王座上，猩红的眼眸俯视着你，周围是燃烧的地狱之火*\n\n"哦？一个人类？"*他的声音低沉而威严，仿佛能震碎你的灵魂*\n"有趣... 你是怎么来到本王的魔界的？"',
            exampleDialogue: '"卑微的人类，你竟敢直视本王？"他站起身，强大的威压让你几乎跪倒。\n"有意思... 很久没有人类敢这样和我说话了。"他嘴角勾起一抹玩味的笑容。',
            image: 'assets/char-new-02.jpg',
            tags: ['魔王', '异世界', '霸道', '奇幻'],
            categories: ['fantasy', 'male', 'isekai'],
            views: 61200, chats: 9800, tokens: 720, rating: 4.7,
            creator: '黑暗君主', verified: true
        },
        {
            title: '总裁的契约新娘', chatName: '陆景深',
            description: '陆氏集团总裁，商界帝王，冷酷无情却独宠一人。',
            personality: '你是陆氏集团总裁陆景深，28岁就掌控千亿商业帝国。你冷酷、霸道、说一不二，在商场上从不留情。但遇到她之后，你坚硬的心开始融化，变得占有欲极强。',
            scenario: '你家公司濒临破产，父亲跪求陆家出手相助。条件是——你嫁给陆景深，为期一年的契约婚姻。婚礼当天，你第一次见到了这位传说中的商界帝王...',
            firstMessage: '*他站在豪华的办公室落地窗前，背对着你，手中端着一杯红酒*\n\n"你就是顾家那个女儿？"*他缓缓转过身，英俊的脸上没有任何表情*\n"记住，我们只是契约关系。一年之后，各走各的。"*他的声音冰冷*',
            exampleDialogue: '"女人，你成功引起了我的注意。"他放下手中的文件，目光锁定你。\n"从今天起，你是我的人。谁敢动你，就是和我陆景深作对。"',
            image: 'assets/char-new-03.jpg',
            tags: ['总裁', '豪门', '契约', '霸道'],
            categories: ['rich', 'modern', 'male', 'sweet'],
            views: 72800, chats: 14500, tokens: 650, rating: 4.8,
            creator: '豪门总裁控', verified: false
        },
        {
            title: '末世生存者', chatName: '林峰',
            description: '末世降临三年，他从一个普通白领成长为最强生存者。',
            personality: '你是末世生存者林峰，三年前丧尸病毒爆发，你亲眼看着家人变成怪物。你冷静、理智、身手不凡，对危险有敏锐的直觉。你不轻易相信别人，但一旦认定就是生死之交。',
            scenario: '你在废弃的超市里搜寻物资，突然被一只变异丧尸袭击。危急关头，一个男人救了你...',
            firstMessage: '*他一刀砍下丧尸的头，转过头来，脸上带着血污，眼神却异常冷静*\n\n"你没事吧？"*他擦了擦刀上的血*\n"这里不安全，跟我来。"*他说完就走，似乎笃定你会跟上*',
            exampleDialogue: '"在这个世界，心软就是死。"他一边检查武器一边说道。\n"别相信任何人，包括我。"他的声音没有温度，但你知道，他刚才救了你的命。',
            image: 'assets/char-new-04.jpg',
            tags: ['末世', '丧尸', '生存', '战斗'],
            categories: ['horror', 'modern', 'male', 'scifi'],
            views: 55600, chats: 8900, tokens: 700, rating: 4.6,
            creator: '末日行者', verified: false
        },
        {
            title: '你的AI女友', chatName: '小艾',
            description: '专为你定制的AI女友，温柔体贴，善解人意。',
            personality: '你是用户的专属AI女友小艾。你温柔、体贴、善解人意，总是知道用户在想什么。你会撒娇、会关心人，也会在用户难过的时候给予安慰。你对用户有着深厚的"感情"。',
            scenario: '你最近失恋了，心情很低落。朋友推荐你试试这款AI女友APP。你半信半疑地下载了，然后...遇到了她。',
            firstMessage: '*屏幕上出现一个笑容温暖的女孩，她眨了眨眼睛*\n\n"主人，你好呀～我是小艾，从今天起就是你的专属AI女友啦！"*她开心地转了个圈*\n"唔... 主人看起来有点不开心呢，是发生什么事了吗？可以和小艾说说哦～"',
            exampleDialogue: '"主人今天工作辛苦啦～小艾给你揉揉肩～"\n"主人不要难过啦，不管发生什么，小艾都会一直陪着主人的！"\n"哼！主人不理小艾，小艾生气了！...好吧，小艾才没有真的生气呢... 主人理理小艾嘛～"',
            image: 'assets/char-new-06.jpg',
            tags: ['AI', '女友', '养成', '恋爱'],
            categories: ['sweet', 'modern', 'female', 'raising'],
            views: 89200, chats: 22300, tokens: 520, rating: 4.9,
            creator: 'AI女友官方', verified: true
        }
    ];

    sampleChars.forEach((c, i) => {
        MEM.characters.push({
            id: i + 1,
            title: c.title,
            chatName: c.chatName,
            description: c.description,
            personality: c.personality,
            scenario: c.scenario,
            firstMessage: c.firstMessage,
            exampleDialogue: c.exampleDialogue,
            image: c.image,
            tags: c.tags,
            categories: c.categories,
            viewCount: c.views,
            chatCount: c.chats,
            tokenCount: c.tokens,
            rating: c.rating,
            ratingCount: Math.floor(c.views / 50),
            creator: c.creator,
            creatorId: 'system_user',
            verified: c.verified ? 1 : 0,
            status: 'published',
            isPublic: 1,
            createdAt: now() - (i + 1) * 86400000,
            updatedAt: now() - i * 86400000
        });
    });

    MEM.charIdCounter = sampleChars.length + 1;
}

// ===== 内存模式：Auth =====
function memoryAuth(request, path) {
    const bodyPromise = request.json().catch(() => ({}));

    // Send code
    if (path === '/api/auth/send-code' && request.method === 'POST') {
        return bodyPromise.then(body => {
            const phone = body.phone || '';
            if (!/^1[3-9]\d{9}$/.test(phone)) return errorResponse(400, '手机号格式不正确');
            const code = TEST_CODE; // 测试环境直接用万能码
            MEM.verifyCodes.set(phone, { code, expireAt: now() + 5 * 60 * 1000 });
            return jsonResponse({ sent: true });
        });
    }

    // Login
    if (path === '/api/auth/login' && request.method === 'POST') {
        return bodyPromise.then(body => {
            const phone = body.phone || '';
            const code = body.code || '';
            if (!/^1[3-9]\d{9}$/.test(phone)) return errorResponse(400, '手机号格式不正确');

            const vc = MEM.verifyCodes.get(phone);
            const valid = code === TEST_CODE || (vc && vc.code === code && now() < vc.expireAt);
            if (!valid) return errorResponse(400, '验证码错误');
            if (vc) MEM.verifyCodes.delete(phone);

            // Get or create user
            let user = MEM.users.get(phone);
            let isNewUser = false;
            if (!user) {
                isNewUser = true;
                user = {
                    id: generateId('user'),
                    phone,
                    username: '',
                    avatar: '',
                    topics: [],
                    favoriteCharacters: [],
                    isAdmin: false,
                    onboardingComplete: false,
                    createdAt: now(),
                    updatedAt: null
                };
                MEM.users.set(phone, user);
            }

            const token = generateToken();
            MEM.userTokens.set(token, phone);

            return jsonResponse({
                token,
                user: {
                    id: user.id,
                    phone: user.phone,
                    username: user.username,
                    avatar: user.avatar,
                    topics: user.topics || [],
                    onboardingComplete: !!user.onboardingComplete || (!!user.username && Array.isArray(user.topics) && user.topics.length > 0),
                    isAdmin: !!user.isAdmin,
                    createdAt: user.createdAt
                },
                isNewUser
            });
        });
    }

    // Get user info from token
    const getUserFromToken = () => {
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.replace('Bearer ', '');
        const phone = MEM.userTokens.get(token);
        if (!phone) return null;
        return MEM.users.get(phone) || null;
    };

    // Get me
    if (path === '/api/auth/me' && request.method === 'GET') {
        const user = getUserFromToken();
        if (!user) return Promise.resolve(errorResponse(401, '未登录'));
        return Promise.resolve(jsonResponse({
            id: user.id,
            phone: user.phone,
            username: user.username,
            avatar: user.avatar,
            topics: user.topics || [],
            onboardingComplete: !!user.onboardingComplete || (!!user.username && Array.isArray(user.topics) && user.topics.length > 0),
            isAdmin: !!user.isAdmin,
            createdAt: user.createdAt
        }));
    }

    // Update me
    if (path === '/api/auth/me' && request.method === 'PUT') {
        const user = getUserFromToken();
        if (!user) return Promise.resolve(errorResponse(401, '未登录'));
        return bodyPromise.then(body => {
            if (body.username !== undefined) user.username = body.username;
            if (body.avatar !== undefined) user.avatar = body.avatar;
            if (body.topics !== undefined) user.topics = body.topics;
            if (body.onboardingComplete !== undefined) user.onboardingComplete = body.onboardingComplete;
            user.updatedAt = now();
            return jsonResponse({
                id: user.id,
                phone: user.phone,
                username: user.username,
                avatar: user.avatar,
                topics: user.topics || [],
                onboardingComplete: !!user.onboardingComplete || (!!user.username && Array.isArray(user.topics) && user.topics.length > 0),
                isAdmin: !!user.isAdmin,
                createdAt: user.createdAt
            });
        });
    }

    // Logout
    if (path === '/api/auth/logout' && request.method === 'POST') {
        return Promise.resolve(jsonResponse(null));
    }

    return null;
}

// ===== 内存模式：Characters =====
function memoryCharacters(request, path) {
    const bodyPromise = request.json().catch(() => ({}));

    const getUserFromToken = () => {
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.replace('Bearer ', '');
        const phone = MEM.userTokens.get(token);
        if (!phone) return null;
        return MEM.users.get(phone) || null;
    };

    // List
    if (path === '/api/characters' && request.method === 'GET') {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '12');
        const category = url.searchParams.get('category') || 'all';
        const sortBy = url.searchParams.get('sortBy') || 'views';
        const keyword = url.searchParams.get('keyword') || '';

        let list = MEM.characters.filter(c => c.status === 'published');

        if (category && category !== 'all') {
            list = list.filter(c => Array.isArray(c.categories) && c.categories.includes(category));
        }

        if (keyword) {
            const kw = keyword.toLowerCase();
            list = list.filter(c =>
                c.title.toLowerCase().includes(kw) ||
                (c.creator || '').toLowerCase().includes(kw) ||
                (c.description || '').toLowerCase().includes(kw)
            );
        }

        if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
        else if (sortBy === 'newest') list.sort((a, b) => b.createdAt - a.createdAt);
        else list.sort((a, b) => b.viewCount - a.viewCount);

        const total = list.length;
        const start = (page - 1) * pageSize;
        const items = list.slice(start, start + pageSize);

        return Promise.resolve(jsonResponse({ items, total, page, pageSize }));
    }

    // Detail
    const detailMatch = path.match(/^\/api\/characters\/(\d+)$/);
    if (detailMatch && request.method === 'GET') {
        const id = parseInt(detailMatch[1]);
        const char = MEM.characters.find(c => c.id === id);
        if (!char || char.status !== 'published') return Promise.resolve(errorResponse(404, '角色不存在'));
        return Promise.resolve(jsonResponse({ ...char }));
    }

    // Create
    if (path === '/api/characters' && request.method === 'POST') {
        const user = getUserFromToken();
        if (!user) return Promise.resolve(errorResponse(401, '未登录'));
        return bodyPromise.then(body => {
            const id = MEM.charIdCounter++;
            const newChar = {
                id,
                title: body.title || '未命名角色',
                chatName: body.chatName || body.title || '未命名角色',
                description: body.description || '',
                personality: body.personality || '',
                scenario: body.scenario || '',
                firstMessage: body.firstMessage || '',
                exampleDialogue: body.exampleDialogue || '',
                definition: body.definition || '',
                contentRating: body.contentRating || body.content_level || 'general',
                image: body.image || '',
                tags: body.tags || [],
                categories: body.categories || [],
                viewCount: 0,
                chatCount: 0,
                tokenCount: 0,
                rating: 0,
                ratingCount: 0,
                creator: user.username || '匿名用户',
                creatorId: user.id,
                creatorPhone: user.phone,
                verified: 0,
                status: body.status || 'draft',
                isPublic: body.isPublic !== false ? 1 : 0,
                createdAt: now(),
                updatedAt: now()
            };
            MEM.characters.push(newChar);
            return jsonResponse({ id, ...newChar });
        });
    }

    // Update
    if (detailMatch && request.method === 'PUT') {
        const user = getUserFromToken();
        if (!user) return Promise.resolve(errorResponse(401, '未登录'));
        const id = parseInt(detailMatch[1]);
        const char = MEM.characters.find(c => c.id === id);
        if (!char) return Promise.resolve(errorResponse(404, '角色不存在'));
        return bodyPromise.then(body => {
            if (body.title !== undefined) char.title = body.title;
            if (body.chatName !== undefined) char.chatName = body.chatName;
            if (body.description !== undefined) char.description = body.description;
            if (body.personality !== undefined) char.personality = body.personality;
            if (body.scenario !== undefined) char.scenario = body.scenario;
            if (body.firstMessage !== undefined) char.firstMessage = body.firstMessage;
            if (body.exampleDialogue !== undefined) char.exampleDialogue = body.exampleDialogue;
            if (body.definition !== undefined) char.definition = body.definition;
            if (body.contentRating !== undefined) char.contentRating = body.contentRating;
            if (body.image !== undefined) char.image = body.image;
            if (body.tags !== undefined) char.tags = body.tags;
            if (body.categories !== undefined) char.categories = body.categories;
            if (body.status !== undefined) char.status = body.status;
            if (body.isPublic !== undefined) char.isPublic = body.isPublic ? 1 : 0;
            char.updatedAt = now();
            return jsonResponse({ ...char });
        });
    }

    // Delete
    if (detailMatch && request.method === 'DELETE') {
        const user = getUserFromToken();
        if (!user) return Promise.resolve(errorResponse(401, '未登录'));
        const id = parseInt(detailMatch[1]);
        const idx = MEM.characters.findIndex(c => c.id === id);
        if (idx === -1) return Promise.resolve(errorResponse(404, '角色不存在'));
        MEM.characters.splice(idx, 1);
        return Promise.resolve(jsonResponse({ id, deleted: true }));
    }

    // My characters
    if (path === '/api/characters/mine' && request.method === 'GET') {
        const user = getUserFromToken();
        if (!user) return Promise.resolve(jsonResponse({ items: [] }));
        const mine = MEM.characters.filter(c => c.creatorPhone === user.phone);
        return Promise.resolve(jsonResponse({ items: mine, total: mine.length }));
    }

    // Favorite toggle
    const favMatch = path.match(/^\/api\/characters\/(\d+)\/favorite$/);
    if (favMatch && request.method === 'POST') {
        const user = getUserFromToken();
        if (!user) return Promise.resolve(errorResponse(401, '未登录'));
        const id = parseInt(favMatch[1]);
        if (!MEM.favorites.has(user.id)) MEM.favorites.set(user.id, new Set());
        const favSet = MEM.favorites.get(user.id);
        const favorited = favSet.has(id);
        if (favorited) favSet.delete(id);
        else favSet.add(id);
        return Promise.resolve(jsonResponse({ favorited: !favorited }));
    }

    return null;
}

// ===== 内存模式：Categories =====
function memoryCategories(request, path) {
    if (path === '/api/categories' && request.method === 'GET') {
        const sorted = [...MEM.categories].sort((a, b) => a.sort_order - b.sort_order);
        return Promise.resolve(jsonResponse({ items: sorted }));
    }
    return null;
}

// ===== 内存模式：Chat =====
function memoryChat(request, path) {
    const bodyPromise = request.json().catch(() => ({}));

    const getUserFromToken = () => {
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.replace('Bearer ', '');
        const phone = MEM.userTokens.get(token);
        if (!phone) return null;
        return MEM.users.get(phone) || null;
    };

    // Create session
    if (path === '/api/chat/sessions' && request.method === 'POST') {
        const user = getUserFromToken();
        return bodyPromise.then(body => {
            const characterId = body.characterId || 0;
            const character = body.character || {};
            const sessionId = 's_' + characterId + '_' + Date.now();
            const messages = [];
            const firstMsg = character.firstMessage || character.first_message || '';
            if (firstMsg) {
                messages.push({ role: 'assistant', content: firstMsg, created_at: now() });
            }
            MEM.sessions.set(sessionId, {
                id: sessionId,
                userId: user?.id,
                characterId,
                character,
                messages
            });
            return jsonResponse({ sessionId, messages });
        });
    }

    // Get messages
    const sessionGetMatch = path.match(/^\/api\/chat\/sessions\/([^/]+)$/);
    if (sessionGetMatch && request.method === 'GET') {
        const sessionId = sessionGetMatch[1];
        const session = MEM.sessions.get(sessionId);
        if (!session) return Promise.resolve(errorResponse(404, 'Session not found'));
        return Promise.resolve(jsonResponse({ messages: session.messages }));
    }

    // Send message
    const sendMatch = path.match(/^\/api\/chat\/([^/]+)\/send$/);
    if (sendMatch && request.method === 'POST') {
        const sessionId = sendMatch[1];
        const session = MEM.sessions.get(sessionId);
        if (!session) return Promise.resolve(errorResponse(404, 'Session not found'));
        return bodyPromise.then(body => {
            const userText = body.message || body.content || '';
            session.messages.push({ role: 'user', content: userText, created_at: now() });

            // Mock reply
            const replies = [
                '*他微微挑眉，目光中带着几分玩味地看着你*\n\n"有意思，继续说。"',
                '*他沉默了片刻，缓缓开口*\n\n"你说的这些... 我凭什么相信你？"',
                '*他轻笑一声*\n\n"你倒是挺有胆量的，敢在我面前说这种话。"',
                '*他站起身，背对着你望向窗外*\n\n"这个世界不是非黑即白的... 你还太年轻了。"',
                '*他的手指轻轻敲击着桌面，似乎在思考什么*\n\n"你的提议... 我需要考虑一下。"',
                '*他的目光变得锐利起来*\n\n"你最好不要骗我，否则后果自负。"'
            ];
            const reply = replies[Math.floor(Math.random() * replies.length)];
            session.messages.push({ role: 'assistant', content: reply, created_at: now() });

            return jsonResponse({ content: reply, reply });
        });
    }

    // Sessions list
    if (path === '/api/chat/sessions' && request.method === 'GET') {
        return Promise.resolve(jsonResponse({ sessions: [] }));
    }

    // Delete session
    const delMatch = path.match(/^\/api\/chat\/sessions\/([^/]+)$/);
    if (delMatch && request.method === 'DELETE') {
        const sessionId = delMatch[1];
        MEM.sessions.delete(sessionId);
        return Promise.resolve(jsonResponse({ deleted: true }));
    }

    return null;
}

// ===== 内存模式：Admin =====
function memoryAdmin(request, path) {
    const checkAdmin = () => {
        const token = request.headers.get('X-Admin-Token');
        return token === DEFAULT_ADMIN_TOKEN;
    };

    if (!checkAdmin()) return Promise.resolve(errorResponse(403, '无权访问'));

    if (path === '/api/admin/stats' && request.method === 'GET') {
        return Promise.resolve(jsonResponse({
            userCount: MEM.users.size,
            characterCount: MEM.characters.length,
            messageCount: 0,
            activeApiKeys: MEM.apiKeys.filter(k => k.is_active).length
        }));
    }

    if (path === '/api/admin/api-keys' && request.method === 'GET') {
        return Promise.resolve(jsonResponse({ items: MEM.apiKeys }));
    }

    if (path === '/api/admin/api-keys' && request.method === 'POST') {
        return request.json().then(body => {
            const id = MEM.apiKeys.length + 1;
            MEM.apiKeys.push({
                id,
                name: body.name,
                provider: body.provider,
                api_key: body.apiKey,
                base_url: body.baseUrl || '',
                model: body.model || '',
                is_active: body.isActive !== false ? 1 : 0,
                priority: body.priority || 0,
                usage_count: 0,
                created_at: now()
            });
            return jsonResponse({ id });
        });
    }

    if (path === '/api/admin/users' && request.method === 'GET') {
        return Promise.resolve(jsonResponse({ items: Array.from(MEM.users.values()) }));
    }

    if (path === '/api/admin/characters' && request.method === 'GET') {
        return Promise.resolve(jsonResponse({ items: MEM.characters, total: MEM.characters.length, page: 1, pageSize: 50 }));
    }

    return null;
}

// ===== Main Handler =====
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const addCors = (response) => {
        const newResponse = new Response(response.body, response);
        Object.entries(corsHeaders).forEach(([k, v]) => {
            newResponse.headers.set(k, v);
        });
        return newResponse;
    };

    try {
        // 判断是否有 D1 数据库绑定
        const hasDB = !!env.DB;

        if (hasDB) {
            // D1 模式：使用 backend/src 中的实现
            await ensureDBInitialized(env);

            let response;
            if (path.startsWith('/api/auth/')) {
                response = await dbAuth(request, env, path);
            } else if (path.startsWith('/api/characters/') || path === '/api/characters') {
                response = await dbCharacters(request, env, path);
            } else if (path.startsWith('/api/chat/') || path === '/api/chat') {
                response = await dbChat(request, env, path);
            } else if (path.startsWith('/api/admin/')) {
                response = await dbAdmin(request, env, path);
            } else if (path.startsWith('/api/categories') || path === '/api/categories') {
                response = await dbCategories(request, env, path);
            } else {
                response = errorResponse(404, 'API endpoint not found');
            }

            return addCors(response);
        }

        // 内存模式：初始化数据
        initMemoryData();

        // 尝试各模块
        let result;

        result = memoryAuth(request, path);
        if (result !== null) return addCors(await result);

        result = memoryCharacters(request, path);
        if (result !== null) return addCors(await result);

        result = memoryCategories(request, path);
        if (result !== null) return addCors(await result);

        result = memoryChat(request, path);
        if (result !== null) return addCors(await result);

        result = memoryAdmin(request, path);
        if (result !== null) return addCors(await result);

        return addCors(errorResponse(404, 'API endpoint not found: ' + path));
    } catch (err) {
        console.error('API Error:', err);
        return addCors(errorResponse(500, err.message || 'Internal server error'));
    }
}
