// ============================================================
// 趣味占卜 — 三国杀牌池 + 抽牌逻辑
// ============================================================

/** 花色 */
export type Suit = '♠' | '♥' | '♣' | '♦'

/** 游戏牌 */
export interface SGCard {
  name: string
  type: 'basic' | 'trick' | 'equipment'
  suit: Suit
  point: number       // 1-13 (A=1, J=11, Q=12, K=13)
  pointName: string   // A, 2-10, J, Q, K
}

/** 武将牌 */
export interface SGOfficer {
  name: string
  hp: number
  skills: string[]
}

/** 身份牌 */
export interface SGIdentity {
  name: string
}

/** 抽出的牌（带正逆位） */
export interface DrawnSGCard extends SGCard {
  position: '正位' | '逆位'
}

export interface DrawnSGThird {
  type: 'officer' | 'identity'
  officer?: SGOfficer
  identity?: SGIdentity
  position: '正位' | '逆位'
  displayName: string
}

/** 抽牌结果 */
export interface FunDrawResult {
  cards: DrawnSGCard[]
  third: DrawnSGThird
}

// ============================================================
// 点数映射
// ============================================================
const POINT_NAMES: Record<number, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
}

function pointName(p: number): string {
  return POINT_NAMES[p] ?? String(p)
}

// ============================================================
// 游戏牌池 — 按真实比例构建
// ============================================================

/** 创建一副牌（~108张） */
function buildGameDeck(): SGCard[] {
  const deck: SGCard[] = []

  function add(name: string, type: 'basic' | 'trick' | 'equipment', suit: Suit, point: number) {
    deck.push({ name, type, suit, point, pointName: pointName(point) })
  }

  // ── 基本牌 (53张) ──

  // 杀 ×30
  const shaPoints: Array<[Suit, number]> = [
    ['♠', 7], ['♠', 8], ['♠', 8], ['♠', 9], ['♠', 9], ['♠', 10], ['♠', 10], ['♠', 11], ['♠', 11],
    ['♥', 10], ['♥', 10], ['♥', 11],
    ['♣', 2], ['♣', 3], ['♣', 4], ['♣', 5], ['♣', 6], ['♣', 7],
    ['♣', 8], ['♣', 8], ['♣', 9], ['♣', 9], ['♣', 10], ['♣', 10], ['♣', 11], ['♣', 11],
    ['♦', 6], ['♦', 7], ['♦', 8], ['♦', 9], ['♦', 10], ['♦', 13],
  ]
  for (const [s, p] of shaPoints) add('杀', 'basic', s, p)

  // 闪 ×15
  const shanPoints: Array<[Suit, number]> = [
    ['♥', 2], ['♥', 2], ['♥', 13], ['♥', 13],
    ['♦', 2], ['♦', 2], ['♦', 3], ['♦', 4], ['♦', 5], ['♦', 6],
    ['♦', 7], ['♦', 8], ['♦', 9], ['♦', 10], ['♦', 11],
  ]
  for (const [s, p] of shanPoints) add('闪', 'basic', s, p)

  // 桃 ×8
  const taoPoints: Array<[Suit, number]> = [
    ['♥', 3], ['♥', 4], ['♥', 5], ['♥', 6], ['♥', 6], ['♥', 7], ['♥', 8], ['♥', 9],  // 留 9 张补位，实际 8 张
  ]
  // 桃只有 8 张
  add('桃', 'basic', '♥', 3)
  add('桃', 'basic', '♥', 4)
  add('桃', 'basic', '♥', 5)
  add('桃', 'basic', '♥', 6)
  add('桃', 'basic', '♥', 7)
  add('桃', 'basic', '♥', 8)
  add('桃', 'basic', '♥', 9)
  add('桃', 'basic', '♦', 12)

  // ── 锦囊牌 (36张) ──

  // 过河拆桥 ×6
  add('过河拆桥', 'trick', '♠', 3); add('过河拆桥', 'trick', '♠', 4)
  add('过河拆桥', 'trick', '♠', 12); add('过河拆桥', 'trick', '♥', 12)
  add('过河拆桥', 'trick', '♣', 3); add('过河拆桥', 'trick', '♣', 4)

  // 顺手牵羊 ×5
  add('顺手牵羊', 'trick', '♠', 3); add('顺手牵羊', 'trick', '♠', 4); add('顺手牵羊', 'trick', '♠', 11)
  add('顺手牵羊', 'trick', '♦', 3); add('顺手牵羊', 'trick', '♦', 4)

  // 无中生有 ×4
  add('无中生有', 'trick', '♥', 7); add('无中生有', 'trick', '♥', 8)
  add('无中生有', 'trick', '♥', 9); add('无中生有', 'trick', '♥', 11)

  // 决斗 ×3
  add('决斗', 'trick', '♠', 1); add('决斗', 'trick', '♣', 1); add('决斗', 'trick', '♦', 1)

  // 无懈可击 ×3
  add('无懈可击', 'trick', '♠', 11); add('无懈可击', 'trick', '♣', 12); add('无懈可击', 'trick', '♦', 12)

  // 万箭齐发 ×1
  add('万箭齐发', 'trick', '♥', 1)

  // 南蛮入侵 ×3
  add('南蛮入侵', 'trick', '♠', 7); add('南蛮入侵', 'trick', '♠', 13); add('南蛮入侵', 'trick', '♣', 7)

  // 五谷丰登 ×2
  add('五谷丰登', 'trick', '♥', 3); add('五谷丰登', 'trick', '♥', 4)

  // 桃园结义 ×1
  add('桃园结义', 'trick', '♥', 1)

  // 借刀杀人 ×2
  add('借刀杀人', 'trick', '♣', 12); add('借刀杀人', 'trick', '♣', 13)

  // 闪电 ×2
  add('闪电', 'trick', '♠', 1); add('闪电', 'trick', '♥', 12)

  // 乐不思蜀 ×2
  add('乐不思蜀', 'trick', '♥', 6); add('乐不思蜀', 'trick', '♣', 6)

  // 兵粮寸断 ×2
  add('兵粮寸断', 'trick', '♠', 10); add('兵粮寸断', 'trick', '♣', 4)

  // ── 装备牌 (20张) ──

  // 武器
  add('诸葛连弩', 'equipment', '♠', 1); add('诸葛连弩', 'equipment', '♣', 1)
  add('青釭剑', 'equipment', '♠', 6)
  add('丈八蛇矛', 'equipment', '♠', 12)
  add('贯石斧', 'equipment', '♦', 5)
  add('麒麟弓', 'equipment', '♥', 5)
  add('方天画戟', 'equipment', '♦', 13)
  add('朱雀羽扇', 'equipment', '♦', 1)
  add('寒冰剑', 'equipment', '♠', 2)

  // 防具
  add('八卦阵', 'equipment', '♠', 2); add('八卦阵', 'equipment', '♣', 2)
  add('仁王盾', 'equipment', '♣', 2)

  // +1马
  add('爪黄飞电', 'equipment', '♥', 13)
  add('的卢', 'equipment', '♣', 5)
  add('绝影', 'equipment', '♠', 5)

  // -1马
  add('赤兔', 'equipment', '♥', 5)
  add('紫骍', 'equipment', '♦', 13)
  add('大宛', 'equipment', '♠', 13)

  // 宝物
  add('木牛流马', 'equipment', '♦', 5)

  return deck
}

// ============================================================
// 武将池（25位著名武将）
// ============================================================
const OFFICER_POOL: SGOfficer[] = [
  { name: '曹操', hp: 4, skills: ['奸雄', '护驾'] },
  { name: '刘备', hp: 4, skills: ['仁德', '激将'] },
  { name: '孙权', hp: 4, skills: ['制衡', '救援'] },
  { name: '诸葛亮', hp: 3, skills: ['观星', '空城'] },
  { name: '司马懿', hp: 3, skills: ['反馈', '鬼才'] },
  { name: '周瑜', hp: 3, skills: ['英姿', '反间'] },
  { name: '关羽', hp: 4, skills: ['武圣'] },
  { name: '张飞', hp: 4, skills: ['咆哮'] },
  { name: '赵云', hp: 4, skills: ['龙胆'] },
  { name: '马超', hp: 4, skills: ['马术', '铁骑'] },
  { name: '黄忠', hp: 4, skills: ['烈弓'] },
  { name: '吕布', hp: 4, skills: ['无双'] },
  { name: '貂蝉', hp: 3, skills: ['离间', '闭月'] },
  { name: '郭嘉', hp: 3, skills: ['天妒', '遗计'] },
  { name: '甄宓', hp: 3, skills: ['倾国', '洛神'] },
  { name: '黄月英', hp: 3, skills: ['集智', '奇才'] },
  { name: '孙尚香', hp: 3, skills: ['枭姬', '结姻'] },
  { name: '大乔', hp: 3, skills: ['国色', '流离'] },
  { name: '小乔', hp: 3, skills: ['天香', '红颜'] },
  { name: '张辽', hp: 4, skills: ['突袭'] },
  { name: '许褚', hp: 4, skills: ['裸衣'] },
  { name: '甘宁', hp: 4, skills: ['奇袭'] },
  { name: '陆逊', hp: 3, skills: ['谦逊', '连营'] },
  { name: '华佗', hp: 3, skills: ['急救', '青囊'] },
  { name: '吕蒙', hp: 4, skills: ['克己'] },
]

// ============================================================
// 身份池（10张，按标准比例）
// ============================================================
const IDENTITY_POOL: SGIdentity[] = [
  { name: '主公' },
  { name: '忠臣' }, { name: '忠臣' }, { name: '忠臣' },
  { name: '反贼' }, { name: '反贼' }, { name: '反贼' }, { name: '反贼' },
  { name: '内奸' }, { name: '内奸' },
]

// ============================================================
// 抽牌函数
// ============================================================

/** Fisher-Yates 洗牌 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 随机正位/逆位 */
function randomPosition(): '正位' | '逆位' {
  return Math.random() < 0.5 ? '正位' : '逆位'
}

/** 抽牌 */
export function drawFunCards(): FunDrawResult {
  // 1. 从游戏牌堆抽 2 张
  const gameDeck = shuffle(buildGameDeck())
  const cards: DrawnSGCard[] = [
    { ...gameDeck[0], position: randomPosition() },
    { ...gameDeck[1], position: randomPosition() },
  ]

  // 2. 从身份+武将混合池抽 1 张
  const thirdPool = shuffle([...OFFICER_POOL, ...IDENTITY_POOL])
  const picked = thirdPool[0] as SGOfficer | SGIdentity

  let third: DrawnSGThird
  if ('skills' in picked && Array.isArray((picked as SGOfficer).skills)) {
    // 武将
    const officer = picked as SGOfficer
    third = {
      type: 'officer',
      officer,
      position: randomPosition(),
      displayName: officer.name,
    }
  } else {
    // 身份
    const identity = picked as SGIdentity
    third = {
      type: 'identity',
      identity,
      position: randomPosition(),
      displayName: identity.name,
    }
  }

  return { cards, third }
}

/** 获取单张牌的显示文本 */
export function formatSGCard(card: DrawnSGCard, locale: string = 'zh-CN'): string {
  if (locale === 'en') {
    return `${card.position === '逆位' ? 'Reversed' : 'Upright'} · ${card.suit}${card.pointName} · ${card.name}`
  }
  // 中文：定位 · 花色点数 · 牌名
  return `${card.position} · ${card.suit}${card.pointName} · ${card.name}`
}

/** 获取身份/武将牌的显示文本 */
export function formatSGThird(third: DrawnSGThird, locale: string = 'zh-CN'): string {
  if (locale === 'en') {
    const pos = third.position === '逆位' ? 'Reversed' : 'Upright'
    if (third.type === 'identity') {
      return `${pos} · Identity: ${third.identity!.name}`
    }
    const o = third.officer!
    return `${pos} · Officer: ${o.name} (${o.hp}HP, Skills: ${o.skills.join(', ')})`
  }

  const pos = third.position
  if (third.type === 'identity') {
    return `${pos} · 身份：${third.identity!.name}`
  }
  const o = third.officer!
  return `${pos} · 武将：${o.name}（${o.hp}血，技能：${o.skills.join('、')}）`
}
