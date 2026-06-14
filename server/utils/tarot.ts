import type { TarotCard, DrawnCard } from '~/types/ai'

/** 22张大阿尔卡纳牌 */
export const majorArcana: TarotCard[] = [
  { id: 0, name: 'The Fool', nameCN: '愚者', arcana: 'major', upright: '新的开始、冒险、天真、自由', reversed: '鲁莽、无知、轻率', description: '一个年轻人站在悬崖边，带着行囊和白玫瑰，象征着纯真和新旅程的开始。' },
  { id: 1, name: 'The Magician', nameCN: '魔术师', arcana: 'major', upright: '创造力、技能、自信、意志力', reversed: '欺骗、能力滥用、缺乏方向', description: '魔术师站在桌前，手持魔杖指向天空，桌上摆放着四元素象征物。' },
  { id: 2, name: 'The High Priestess', nameCN: '女祭司', arcana: 'major', upright: '直觉、潜意识、神秘、内在智慧', reversed: '隐藏的秘密、肤浅、情感封闭', description: '女祭司坐在两根柱子之间，手持书卷，象征着知识和直觉的力量。' },
  { id: 3, name: 'The Empress', nameCN: '女皇', arcana: 'major', upright: '丰饶、母性、自然、创造力', reversed: '依赖、创造力受阻、情感匮乏', description: '女皇坐在丰收的田野中，头戴星冠，象征着丰饶和生命的力量。' },
  { id: 4, name: 'The Emperor', nameCN: '皇帝', arcana: 'major', upright: '权威、结构、稳定、领导力', reversed: '暴政、僵化、缺乏纪律', description: '皇帝端坐于宝座，手持权杖和宝珠，象征着秩序和统治力。' },
  { id: 5, name: 'The Hierophant', nameCN: '教皇', arcana: 'major', upright: '传统、信仰、教育、精神指引', reversed: '叛逆、非传统、僵化的教条', description: '教皇坐在信徒面前，象征着精神权威和传统智慧。' },
  { id: 6, name: 'The Lovers', nameCN: '恋人', arcana: 'major', upright: '爱情、和谐、选择、价值观', reversed: '分离、不和谐、错误的选择', description: '一对男女站在天使之下，象征着爱的结合和重要的选择。' },
  { id: 7, name: 'The Chariot', nameCN: '战车', arcana: 'major', upright: '胜利、决心、控制、前进', reversed: '失控、失败、侵略性', description: '战士驾驶着黑白双兽拉动的战车，象征着意志力和胜利。' },
  { id: 8, name: 'Strength', nameCN: '力量', arcana: 'major', upright: '勇气、耐心、内在力量、慈悲', reversed: '软弱、自我怀疑、失控', description: '女子温柔地抚摸着狮子，象征着内在的力量和勇气。' },
  { id: 9, name: 'The Hermit', nameCN: '隐者', arcana: 'major', upright: '内省、孤独、寻求真理、智慧', reversed: '孤立、逃避现实、恐惧', description: '老者提着灯笼站在山巅，象征着内在探索和精神寻求。' },
  { id: 10, name: 'Wheel of Fortune', nameCN: '命运之轮', arcana: 'major', upright: '转变、命运、机遇、循环', reversed: '厄运、阻力、失控的变化', description: '命运之轮不停转动，上有狮身人面像，象征着命运的起伏。' },
  { id: 11, name: 'Justice', nameCN: '正义', arcana: 'major', upright: '公正、真理、因果、平衡', reversed: '不公、偏见、逃避责任', description: '正义女神手持天平和宝剑，象征着公平和因果关系。' },
  { id: 12, name: 'The Hanged Man', nameCN: '倒吊人', arcana: 'major', upright: '牺牲、新视角、放手、等待', reversed: '停滞、无谓的牺牲、固执', description: '一个人倒挂在十字架上，表情平静，象征着换个角度看世界。' },
  { id: 13, name: 'Death', nameCN: '死神', arcana: 'major', upright: '结束、转变、重生、放下', reversed: '抗拒改变、停滞、恐惧转变', description: '死神骑着白马，象征着旧的结束和新的开始。' },
  { id: 14, name: 'Temperance', nameCN: '节制', arcana: 'major', upright: '平衡、和谐、耐心、融合', reversed: '失衡、过度、缺乏协调', description: '天使将两个杯中的水调和，象征着平衡和适度的智慧。' },
  { id: 15, name: 'The Devil', nameCN: '恶魔', arcana: 'major', upright: '束缚、物质主义、欲望、阴影', reversed: '解脱、觉醒、克服心魔', description: '恶魔站在被锁链束缚的两人之上，象征着物质的诱惑和束缚。' },
  { id: 16, name: 'The Tower', nameCN: '高塔', arcana: 'major', upright: '突变、崩塌、启示、觉醒', reversed: '逃避灾难、恐惧改变、维持假象', description: '闪电击中高塔，人们从塔中坠落，象征着突然的变故和觉醒。' },
  { id: 17, name: 'The Star', nameCN: '星星', arcana: 'major', upright: '希望、灵感、治愈、宁静', reversed: '绝望、失去信心、消极', description: '女子在水边倾倒星水，天空中闪耀着星星，象征着希望和新生。' },
  { id: 18, name: 'The Moon', nameCN: '月亮', arcana: 'major', upright: '直觉、梦境、潜意识、不确定性', reversed: '恐惧、迷惑、被揭开的真相', description: '月光下螃蟹从水中爬出，象征着潜意识的世界和不确定的未来。' },
  { id: 19, name: 'The Sun', nameCN: '太阳', arcana: 'major', upright: '快乐、成功、活力、真相', reversed: '暂时挫折、延迟的快乐、消极', description: '太阳照耀下孩童骑着白马，象征着光明、快乐和成功。' },
  { id: 20, name: 'Judgement', nameCN: '审判', arcana: 'major', upright: '觉醒、重生、召唤、评估', reversed: '自我怀疑、逃避召唤、后悔', description: '天使吹响号角，死者从坟墓中复活，象征着审判和重生的时刻。' },
  { id: 21, name: 'The World', nameCN: '世界', arcana: 'major', upright: '完成、圆满、成就、旅程终点', reversed: '未完成、停滞、缺少收尾', description: '舞者在花环中跳舞，四角有四种圣物，象征着圆满和完成。' },
]

/** 完整的塔罗牌组 */
export const fullDeck: TarotCard[] = [...majorArcana]

/** 随机抽取塔罗牌 */
export function drawCards(count: number): DrawnCard[] {
  const shuffled = [...fullDeck].sort(() => Math.random() - 0.5)
  const drawn = shuffled.slice(0, count)

  const positions: Record<number, string[]> = {
    1: ['核心启示'],
    3: ['过去', '现在', '未来'],
    10: ['现状', '挑战', '过去', '未来', '意识', '潜意识', '建议', '外部影响', '希望与恐惧', '最终结果'],
  }

  const posLabels = positions[count] ?? Array.from({ length: count }, (_, i) => `第${i + 1}张`)

  return drawn.map((card, i) => ({
    card,
    orientation: Math.random() > 0.5 ? 'upright' : 'reversed',
    position: posLabels[i] ?? `位置 ${i + 1}`,
  }))
}

/** 格式化抽牌结果为文本 */
export function formatDrawnCards(drawnCards: DrawnCard[]): string {
  return drawnCards
    .map(
      (d, i) =>
        `### 第${i + 1}张：${d.position}
- 牌名：${d.card.nameCN} (${d.card.name})
- 方向：${d.orientation === 'upright' ? '正位' : '逆位'}
- 含义：${d.orientation === 'upright' ? d.card.upright : d.card.reversed}
- 描述：${d.card.description}`,
    )
    .join('\n\n')
}
