// ============================================================
// 八卦五行 — 铜钱摇卦工具
// ============================================================

/** 爻类型 */
export type YaoType = '老阴' | '少阳' | '少阴' | '老阳'

/** 单次摇卦结果 */
export interface CoinShake {
  /** 第几摇（1-6，从下往上） */
  index: number
  /** 铜钱正面数 (0-3) */
  heads: number
  /** 爻的类型 */
  type: YaoType
  /** 爻的阴阳：true=阳，false=阴 */
  isYang: boolean
  /** 是否为动爻（老阴或老阳） */
  isChanging: boolean
}

/** 八卦定义 */
interface Trigram {
  name: string
  nameCN: string
  element: string
  nature: string
  direction: string
}

/** 六十四卦定义 */
export interface HexagramData {
  id: number
  name: string
  nameCN: string
  upperTrigram: string
  lowerTrigram: string
  description: string
  descriptionEn: string
  judgment: string
  judgmentEn: string
}

/** 摇卦完整结果 */
export interface BaguaShakeResult {
  shakes: CoinShake[]
  /** 本卦（6爻原始阴阳） */
  originalLines: boolean[]
  /** 本卦信息 */
  originalHexagram: HexagramData
  /** 变卦（动爻翻转后），无动爻时为 null */
  derivedHexagram: HexagramData | null
  /** 动爻位置 */
  changingLineIndices: number[]
  timestamp: number
}

// ============================================================
// 八卦基础
// ============================================================
export const TRIGRAMS: Record<string, Trigram> = {
  '111': { name: 'Qian', nameCN: '乾', element: '金', nature: '天', direction: '西北' },
  '110': { name: 'Dui', nameCN: '兑', element: '金', nature: '泽', direction: '西' },
  '101': { name: 'Li', nameCN: '离', element: '火', nature: '火', direction: '南' },
  '100': { name: 'Zhen', nameCN: '震', element: '木', nature: '雷', direction: '东' },
  '011': { name: 'Xun', nameCN: '巽', element: '木', nature: '风', direction: '东南' },
  '010': { name: 'Kan', nameCN: '坎', element: '水', nature: '水', direction: '北' },
  '001': { name: 'Gen', nameCN: '艮', element: '土', nature: '山', direction: '东北' },
  '000': { name: 'Kun', nameCN: '坤', element: '土', nature: '地', direction: '西南' },
}

/** 五行生克关系 */
export const FIVE_ELEMENTS = ['金', '木', '水', '火', '土'] as const
export type FiveElement = typeof FIVE_ELEMENTS[number]

/** 五行相生 */
export const ELEMENT_GENERATES: Record<string, string> = {
  '金': '水', '水': '木', '木': '火', '火': '土', '土': '金',
}

/** 五行相克 */
export const ELEMENT_CONTROLS: Record<string, string> = {
  '金': '木', '木': '土', '土': '水', '水': '火', '火': '金',
}

/** 六亲定义 */
export const SIX_RELATIONS = ['父母', '兄弟', '妻财', '官鬼', '子孙']

/** 六亲英文 */
export const SIX_RELATIONS_EN: Record<string, string> = {
  '父母': 'Parent',
  '兄弟': 'Sibling',
  '妻财': 'Wealth',
  '官鬼': 'Official',
  '子孙': 'Child',
}

/** 干支列表 */
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** 地支五行 */
const BRANCH_ELEMENT: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
}

/** 八卦五行 */
const TRIGRAM_ELEMENT: Record<string, string> = {
  '乾': '金', '兑': '金', '离': '火', '震': '木', '巽': '木', '坎': '水', '艮': '土', '坤': '土',
}

// 覆盖所有 64 卦，按 King Wen 编号
const KING_WEN_HEXAGRAMS: HexagramData[] = [
  { id: 1, name: 'Qian', nameCN: '乾为天', upperTrigram: '乾', lowerTrigram: '乾', description: '乾卦六爻皆阳，象征天道刚健。得此卦者宜积极进取，自强不息。', descriptionEn: 'All six lines yang. Creative power of Heaven.', judgment: '元亨利贞。天行健，君子以自强不息。', judgmentEn: 'Sublime success. The superior man never ceases to strengthen himself.' },
  { id: 2, name: 'Kun', nameCN: '坤为地', upperTrigram: '坤', lowerTrigram: '坤', description: '坤卦六爻皆阴，象征大地柔顺包容，厚德载物。得此卦者宜以柔克刚。', descriptionEn: 'All six lines yin. Receptive power of Earth.', judgment: '元亨。地势坤，君子以厚德载物。', judgmentEn: 'Great success. The superior man carries all things with great virtue.' },
  { id: 3, name: 'Zhun', nameCN: '水雷屯', upperTrigram: '坎', lowerTrigram: '震', description: '屯卦象征万物初生之艰难。雷在水下欲出未出。得此卦者宜知难而进。', descriptionEn: 'Difficulty at the beginning. Thunder beneath water.', judgment: '屯，元亨利贞。勿用有攸往。', judgmentEn: 'Difficulty at beginning. Do not act rashly.' },
  { id: 4, name: 'Meng', nameCN: '山水蒙', upperTrigram: '艮', lowerTrigram: '坎', description: '蒙卦象征蒙昧未开，需要启蒙。山下有水雾气朦胧。得此卦者宜虚心求教。', descriptionEn: 'Youthful ignorance. Water at mountain foot.', judgment: '蒙，亨。匪我求童蒙，童蒙求我。', judgmentEn: 'Youthful ignorance brings success.' },
  { id: 5, name: 'Xu', nameCN: '水天需', upperTrigram: '坎', lowerTrigram: '乾', description: '需卦象征等待时机。云在天上等待降雨。得此卦者宜耐心等待。', descriptionEn: 'Waiting. Clouds in heaven.', judgment: '需，有孚，光亨，贞吉。利涉大川。', judgmentEn: 'Waiting with sincerity brings success.' },
  { id: 6, name: 'Song', nameCN: '天水讼', upperTrigram: '乾', lowerTrigram: '坎', description: '讼卦象征争讼冲突。天与水相违而行。得此卦者宜退让求和。', descriptionEn: 'Conflict. Heaven and water oppose.', judgment: '讼，有孚窒惕，中吉，终凶。', judgmentEn: 'Conflict. The middle course brings good fortune.' },
  { id: 7, name: 'Shi', nameCN: '地水师', upperTrigram: '坤', lowerTrigram: '坎', description: '师卦象征军队和战争。水在地下暗流涌动。得此卦者宜有组织地行动。', descriptionEn: 'The army. Water under the earth.', judgment: '师，贞，丈人吉，无咎。', judgmentEn: 'The army needs a strong leader. Good fortune.' },
  { id: 8, name: 'Bi', nameCN: '水地比', upperTrigram: '坎', lowerTrigram: '坤', description: '比卦象征亲近团结。水在地上相互依偎。得此卦者宜团结协作。', descriptionEn: 'Union. Water on the earth.', judgment: '比，吉。原筮，元永贞，无咎。', judgmentEn: 'Union brings good fortune.' },
  { id: 9, name: 'Xiao Xu', nameCN: '风天小畜', upperTrigram: '巽', lowerTrigram: '乾', description: '小畜卦象征小有积蓄。风行天上尚未普降。得此卦者宜积少成多。', descriptionEn: 'Small accumulation. Wind above heaven.', judgment: '小畜，亨。密云不雨。', judgmentEn: 'Small accumulation. Dense clouds but no rain.' },
  { id: 10, name: 'Lü', nameCN: '天泽履', upperTrigram: '乾', lowerTrigram: '兑', description: '履卦象征履行实践。天在上泽在下各安其位。得此卦者宜谨言慎行。', descriptionEn: 'Treading. Heaven above, lake below.', judgment: '履，履虎尾，不咥人，亨。', judgmentEn: 'Treading on the tiger\'s tail — it does not bite.' },
  { id: 11, name: 'Tai', nameCN: '地天泰', upperTrigram: '坤', lowerTrigram: '乾', description: '泰卦象征通达安泰。天地交合万物亨通。得此卦者万事顺利，大吉之卦。', descriptionEn: 'Peace. Heaven and earth in harmony.', judgment: '泰，小往大来，吉亨。', judgmentEn: 'Peace. Good fortune and success.' },
  { id: 12, name: 'Pi', nameCN: '天地否', upperTrigram: '乾', lowerTrigram: '坤', description: '否卦象征闭塞不通。天地不交万物难通。得此卦者宜韬光养晦。', descriptionEn: 'Obstruction. Heaven and earth apart.', judgment: '否之匪人，不利君子贞。', judgmentEn: 'Obstruction. Unfavorable for the superior person.' },
  { id: 13, name: 'Tong Ren', nameCN: '天火同人', upperTrigram: '乾', lowerTrigram: '离', description: '同人卦象征志同道合。天与火皆为光明。得此卦者宜团结一致。', descriptionEn: 'Fellowship. Heaven and fire, both bright.', judgment: '同人于野，亨。利涉大川。', judgmentEn: 'Fellowship in the open. Success.' },
  { id: 14, name: 'Da You', nameCN: '火天大有', upperTrigram: '离', lowerTrigram: '乾', description: '大有卦象征盛大丰有。火在天上照耀万物。得此卦者事业昌盛。', descriptionEn: 'Great abundance. Fire in heaven.', judgment: '大有，元亨。', judgmentEn: 'Great possession. Supreme success.' },
  { id: 15, name: 'Qian', nameCN: '地山谦', upperTrigram: '坤', lowerTrigram: '艮', description: '谦卦象征谦虚退让。山在地下高大不露。得此卦者宜谦虚待人。', descriptionEn: 'Modesty. Mountain beneath the earth.', judgment: '谦，亨，君子有终。', judgmentEn: 'Modesty brings success.' },
  { id: 16, name: 'Yu', nameCN: '雷地豫', upperTrigram: '震', lowerTrigram: '坤', description: '豫卦象征安乐愉悦。雷在大地之上万物振奋。得此卦者宜顺应时势。', descriptionEn: 'Enthusiasm. Thunder over the earth.', judgment: '豫，利建侯行师。', judgmentEn: 'Enthusiasm. Favorable to establish a state.' },
  { id: 17, name: 'Sui', nameCN: '泽雷随', upperTrigram: '兑', lowerTrigram: '震', description: '随卦象征随从顺应。泽中有雷因时而动。得此卦者宜顺势而为。', descriptionEn: 'Following. Thunder in the lake.', judgment: '随，元亨利贞，无咎。', judgmentEn: 'Following. Supreme success. No error.' },
  { id: 18, name: 'Gu', nameCN: '山风蛊', upperTrigram: '艮', lowerTrigram: '巽', description: '蛊卦象征蛊惑败坏。山下有风物腐生虫。得此卦者宜整治弊病。', descriptionEn: 'Decay. Wind beneath the mountain.', judgment: '蛊，元亨，利涉大川。', judgmentEn: 'Decay. Supreme success.' },
  { id: 19, name: 'Lin', nameCN: '地泽临', upperTrigram: '坤', lowerTrigram: '兑', description: '临卦象征临近监督。地高于泽居高临下。得此卦者宜亲力亲为。', descriptionEn: 'Approach. Earth above the lake.', judgment: '临，元亨利贞。', judgmentEn: 'Approach. Supreme success.' },
  { id: 20, name: 'Guan', nameCN: '风地观', upperTrigram: '巽', lowerTrigram: '坤', description: '观卦象征观察展示。风行大地无所不察。得此卦者宜仔细审视。', descriptionEn: 'Observation. Wind over the earth.', judgment: '观，盥而不荐，有孚颙若。', judgmentEn: 'Observation. Sincere and reverent.' },
  { id: 21, name: 'Shi He', nameCN: '火雷噬嗑', upperTrigram: '离', lowerTrigram: '震', description: '噬嗑卦象征咀嚼决断。雷电交加清除障碍。得此卦者宜果断处理。', descriptionEn: 'Biting through. Fire and thunder.', judgment: '噬嗑，亨。利用狱。', judgmentEn: 'Biting through. Favorable for legal matters.' },
  { id: 22, name: 'Bi', nameCN: '山火贲', upperTrigram: '艮', lowerTrigram: '离', description: '贲卦象征文饰美化。山下有火照亮山形。得此卦者宜重内涵非外表。', descriptionEn: 'Adornment. Fire at mountain foot.', judgment: '贲，亨。小利有攸往。', judgmentEn: 'Adornment. Small matters favorable.' },
  { id: 23, name: 'Bo', nameCN: '山地剥', upperTrigram: '艮', lowerTrigram: '坤', description: '剥卦象征剥落衰败。山在地上土石崩落。得此卦者宜固本守成。', descriptionEn: 'Peeling away. Mountain on earth.', judgment: '剥，不利有攸往。', judgmentEn: 'Not favorable to go anywhere.' },
  { id: 24, name: 'Fu', nameCN: '地雷复', upperTrigram: '坤', lowerTrigram: '震', description: '复卦象征回复复兴。雷在地下一阳初生。得此卦者宜重整旗鼓，转运之卦。', descriptionEn: 'Return. Thunder beneath the earth.', judgment: '复，亨。出入无疾，朋来无咎。', judgmentEn: 'Return. Success without illness.' },
  { id: 25, name: 'Wu Wang', nameCN: '天雷无妄', upperTrigram: '乾', lowerTrigram: '震', description: '无妄卦象征真实无妄。天下雷行真诚不欺。得此卦者宜保持纯真。', descriptionEn: 'Innocence. Thunder under heaven.', judgment: '无妄，元亨利贞。', judgmentEn: 'Innocence. Supreme success.' },
  { id: 26, name: 'Da Xu', nameCN: '山天大畜', upperTrigram: '艮', lowerTrigram: '乾', description: '大畜卦象征大积蓄。天在山中蓄积力量。得此卦者宜厚积薄发。', descriptionEn: 'Great accumulation. Heaven within mountain.', judgment: '大畜，利贞。不家食吉。', judgmentEn: 'Great accumulation. Good fortune.' },
  { id: 27, name: 'Yi', nameCN: '山雷颐', upperTrigram: '艮', lowerTrigram: '震', description: '颐卦象征颐养滋养。山下有雷万物生长。得此卦者宜修身养性。', descriptionEn: 'Nourishment. Thunder under mountain.', judgment: '颐，贞吉。观颐，自求口实。', judgmentEn: 'Nourishment. Observe how you nourish yourself.' },
  { id: 28, name: 'Da Guo', nameCN: '泽风大过', upperTrigram: '兑', lowerTrigram: '巽', description: '大过卦象征过度非常。泽水淹木超过限度。得此卦者宜适度收敛。', descriptionEn: 'Excess. Lake above trees.', judgment: '大过，栋桡。利有攸往，亨。', judgmentEn: 'Excess. The ridgepole sags.' },
  { id: 29, name: 'Kan', nameCN: '坎为水', upperTrigram: '坎', lowerTrigram: '坎', description: '坎卦双坎相重象征重重险阻。得此卦者宜谨慎行事不可掉以轻心。', descriptionEn: 'Danger. Water upon water.', judgment: '习坎，有孚，维心亨，行有尚。', judgmentEn: 'Repeated danger. Sincerity brings success.' },
  { id: 30, name: 'Li', nameCN: '离为火', upperTrigram: '离', lowerTrigram: '离', description: '离卦双离相重象征光明依附。火火相续光明不断。得此卦者宜借力行事。', descriptionEn: 'Brightness. Fire upon fire.', judgment: '离，利贞，亨。畜牝牛，吉。', judgmentEn: 'Brightness. Favorable to be steadfast.' },
  { id: 31, name: 'Xian', nameCN: '泽山咸', upperTrigram: '兑', lowerTrigram: '艮', description: '咸卦象征感应感情。泽在山上相互感应。得此卦者宜以诚感人。', descriptionEn: 'Influence. Lake on the mountain.', judgment: '咸，亨，利贞。取女吉。', judgmentEn: 'Influence. Taking a wife brings good fortune.' },
  { id: 32, name: 'Heng', nameCN: '雷风恒', upperTrigram: '震', lowerTrigram: '巽', description: '恒卦象征恒久稳定。雷风相随持久不变。得此卦者宜持之以恒。', descriptionEn: 'Duration. Thunder and wind.', judgment: '恒，亨，无咎，利贞。', judgmentEn: 'Duration. Success. No error.' },
  { id: 33, name: 'Dun', nameCN: '天山遁', upperTrigram: '乾', lowerTrigram: '艮', description: '遁卦象征退避隐退。天下有山退隐之所。得此卦者宜急流勇退。', descriptionEn: 'Retreat. Heaven above the mountain.', judgment: '遁，亨，小利贞。', judgmentEn: 'Retreat. Small matters favorable.' },
  { id: 34, name: 'Da Zhuang', nameCN: '雷天大壮', upperTrigram: '震', lowerTrigram: '乾', description: '大壮卦象征强壮盛大。雷在天上声势浩大。得此卦者力量强盛但防过刚则折。', descriptionEn: 'Great power. Thunder in heaven.', judgment: '大壮，利贞。', judgmentEn: 'Great power. Be steadfast.' },
  { id: 35, name: 'Jin', nameCN: '火地晋', upperTrigram: '离', lowerTrigram: '坤', description: '晋卦象征前进晋升。火在大地之上日出东方。得此卦者宜积极进取。', descriptionEn: 'Progress. Fire over the earth.', judgment: '晋，康侯用锡马蕃庶。', judgmentEn: 'Progress. The lord is rewarded.' },
  { id: 36, name: 'Ming Yi', nameCN: '地火明夷', upperTrigram: '坤', lowerTrigram: '离', description: '明夷卦象征光明受损。火在地下光明被掩。得此卦者宜韬光养晦。', descriptionEn: 'Hidden brightness. Fire beneath the earth.', judgment: '明夷，利艰贞。', judgmentEn: 'Darkening of the light. Persevere through hardship.' },
  { id: 37, name: 'Jia Ren', nameCN: '风火家人', upperTrigram: '巽', lowerTrigram: '离', description: '家人卦象征家庭和睦。风助火势家和万事兴。得此卦者宜注重家庭。', descriptionEn: 'Family. Wind feeds the fire.', judgment: '家人，利女贞。', judgmentEn: 'Family. Favorable for the woman.' },
  { id: 38, name: 'Kui', nameCN: '火泽睽', upperTrigram: '离', lowerTrigram: '兑', description: '睽卦象征乖离差异。火在上泽在下方向相反。得此卦者宜求同存异。', descriptionEn: 'Opposition. Fire above, lake below.', judgment: '睽，小事吉。', judgmentEn: 'Opposition. Small matters bring good fortune.' },
  { id: 39, name: 'Jian', nameCN: '水山蹇', upperTrigram: '坎', lowerTrigram: '艮', description: '蹇卦象征艰难险阻。山上有水道路难行。得此卦者宜另寻出路。', descriptionEn: 'Obstruction. Water on the mountain.', judgment: '蹇，利西南，不利东北。', judgmentEn: 'Obstruction. Favorable southwest.' },
  { id: 40, name: 'Xie', nameCN: '雷水解', upperTrigram: '震', lowerTrigram: '坎', description: '解卦象征解除解决。雷雨交加消解困难。得此卦者困难即将化解。', descriptionEn: 'Deliverance. Thunder and rain.', judgment: '解，利西南。无所往其来复吉。', judgmentEn: 'Deliverance. Coming back is good fortune.' },
  { id: 41, name: 'Sun', nameCN: '山泽损', upperTrigram: '艮', lowerTrigram: '兑', description: '损卦象征减损克制。山在上泽在下损下益上。得此卦者宜自我克制。', descriptionEn: 'Decrease. Mountain above lake.', judgment: '损，有孚，元吉，无咎。', judgmentEn: 'Decrease. Supreme good fortune.' },
  { id: 42, name: 'Yi', nameCN: '风雷益', upperTrigram: '巽', lowerTrigram: '震', description: '益卦象征增益获利。风雷互助相得益彰。得此卦者宜把握机会积极进取。', descriptionEn: 'Increase. Wind and thunder help each other.', judgment: '益，利有攸往，利涉大川。', judgmentEn: 'Increase. Favorable to go.' },
  { id: 43, name: 'Guai', nameCN: '泽天夬', upperTrigram: '兑', lowerTrigram: '乾', description: '夬卦象征决断。泽在天上决堤而下。得此卦者宜果断决策。', descriptionEn: 'Resolution. Lake in heaven.', judgment: '夬，扬于王庭。利有攸往。', judgmentEn: 'Resolution. Proclaimed in the court.' },
  { id: 44, name: 'Gou', nameCN: '天风姤', upperTrigram: '乾', lowerTrigram: '巽', description: '姤卦象征相遇邂逅。天下有风流转相遇。得此卦者宜注意不期而遇之事。', descriptionEn: 'Meeting. Wind under heaven.', judgment: '姤，女壮，勿用取女。', judgmentEn: 'Meeting. An unexpected encounter.' },
  { id: 45, name: 'Cui', nameCN: '泽地萃', upperTrigram: '兑', lowerTrigram: '坤', description: '萃卦象征聚集荟萃。泽在地上水聚成湖。得此卦者宜召集人才集中力量。', descriptionEn: 'Gathering. Lake on the earth.', judgment: '萃，亨。王假有庙。', judgmentEn: 'Gathering. The king approaches the temple.' },
  { id: 46, name: 'Sheng', nameCN: '地风升', upperTrigram: '坤', lowerTrigram: '巽', description: '升卦象征上升晋升。风从地下吹起逐渐升高。得此卦者宜顺势而上。', descriptionEn: 'Ascending. Wind from beneath earth.', judgment: '升，元亨。南征吉。', judgmentEn: 'Ascending. Supreme success.' },
  { id: 47, name: 'Kun', nameCN: '泽水困', upperTrigram: '兑', lowerTrigram: '坎', description: '困卦象征困顿窘迫。泽中无水干涸难熬。得此卦者宜坚守信念。', descriptionEn: 'Oppression. Lake without water.', judgment: '困，亨，贞，大人吉。', judgmentEn: 'Oppression. The great person finds good fortune.' },
  { id: 48, name: 'Jing', nameCN: '水风井', upperTrigram: '坎', lowerTrigram: '巽', description: '井卦象征水井资源。水在风下井水长流。得此卦者宜善用资源。', descriptionEn: 'The well. Water and wood.', judgment: '井，改邑不改井，无丧无得。', judgmentEn: 'The well. The town changes, not the well.' },
  { id: 49, name: 'Ge', nameCN: '泽火革', upperTrigram: '兑', lowerTrigram: '离', description: '革卦象征变革革新。泽中有火水火相息。得此卦者宜推陈出新。', descriptionEn: 'Revolution. Fire in the lake.', judgment: '革，巳日乃孚。元亨利贞，悔亡。', judgmentEn: 'Revolution. On the day of change.' },
  { id: 50, name: 'Ding', nameCN: '火风鼎', upperTrigram: '离', lowerTrigram: '巽', description: '鼎卦象征鼎器新立。火在风上以鼎烹饪。得此卦者宜建立新事物。', descriptionEn: 'The cauldron. Fire and wind.', judgment: '鼎，元吉，亨。', judgmentEn: 'The cauldron. Supreme good fortune.' },
  { id: 51, name: 'Zhen', nameCN: '震为雷', upperTrigram: '震', lowerTrigram: '震', description: '震卦双震相重象征震动惊雷。雷声阵阵令人警醒。得此卦者宜保持警觉。', descriptionEn: 'Shock. Thunder upon thunder.', judgment: '震，亨。震惊百里，不丧匕鬯。', judgmentEn: 'Shock. Thunder a hundred li.' },
  { id: 52, name: 'Gen', nameCN: '艮为山', upperTrigram: '艮', lowerTrigram: '艮', description: '艮卦双艮相重象征静止停止。山山相连稳如磐石。得此卦者宜知止不殆。', descriptionEn: 'Stillness. Mountain upon mountain.', judgment: '艮其背，不获其身。无咎。', judgmentEn: 'Stillness. Keep your back still.' },
  { id: 53, name: 'Jian', nameCN: '风山渐', upperTrigram: '巽', lowerTrigram: '艮', description: '渐卦象征渐进逐步。风在山上徐徐而行。得此卦者宜循序渐进。', descriptionEn: 'Gradual progress. Wind on the mountain.', judgment: '渐，女归吉，利贞。', judgmentEn: 'Gradual progress. Good fortune.' },
  { id: 54, name: 'Gui Mei', nameCN: '雷泽归妹', upperTrigram: '震', lowerTrigram: '兑', description: '归妹卦象征婚姻结合。雷在泽上阴阳相合。得此卦者宜注重关系。', descriptionEn: 'Marrying maiden. Thunder over lake.', judgment: '归妹，征凶，无攸利。', judgmentEn: 'Going forward brings misfortune.' },
  { id: 55, name: 'Feng', nameCN: '雷火丰', upperTrigram: '震', lowerTrigram: '离', description: '丰卦象征丰盛盛大。雷电火光交相辉映。得此卦者事业丰盛但防盛极而衰。', descriptionEn: 'Abundance. Thunder and fire.', judgment: '丰，亨。王假之，勿忧。', judgmentEn: 'Abundance. The king has reached it.' },
  { id: 56, name: 'Lü', nameCN: '火山旅', upperTrigram: '离', lowerTrigram: '艮', description: '旅卦象征旅行客居。山上有火行旅匆匆。得此卦者宜随遇而安。', descriptionEn: 'The traveler. Fire on the mountain.', judgment: '旅，小亨，旅贞吉。', judgmentEn: 'Traveler. Small success.' },
  { id: 57, name: 'Xun', nameCN: '巽为风', upperTrigram: '巽', lowerTrigram: '巽', description: '巽卦双巽相重象征顺从而深入。风行无孔不入。得此卦者宜顺势而为。', descriptionEn: 'Gentleness. Wind upon wind.', judgment: '巽，小亨。利有攸往。', judgmentEn: 'Gentleness. Favorable to go.' },
  { id: 58, name: 'Dui', nameCN: '兑为泽', upperTrigram: '兑', lowerTrigram: '兑', description: '兑卦双兑相重象征喜悦交流。两泽相连互相润泽。得此卦者宜与人分享。', descriptionEn: 'Joy. Lake upon lake.', judgment: '兑，亨，利贞。', judgmentEn: 'Joy. Favorable to be steadfast.' },
  { id: 59, name: 'Huan', nameCN: '风水涣', upperTrigram: '巽', lowerTrigram: '坎', description: '涣卦象征涣散分离。风行水上波浪分散。得此卦者宜重新凝聚。', descriptionEn: 'Dispersion. Wind over water.', judgment: '涣，亨。王假有庙。', judgmentEn: 'Dispersion. The king approaches.' },
  { id: 60, name: 'Jie', nameCN: '水泽节', upperTrigram: '坎', lowerTrigram: '兑', description: '节卦象征节制调节。水在泽上有所节制。得此卦者宜适度克制。', descriptionEn: 'Limitation. Water above lake.', judgment: '节，亨。苦节不可贞。', judgmentEn: 'Limitation. Bitter restraint cannot last.' },
  { id: 61, name: 'Zhong Fu', nameCN: '风泽中孚', upperTrigram: '巽', lowerTrigram: '兑', description: '中孚卦象征诚信中正。风行泽上感化万物。得此卦者宜以诚待人。', descriptionEn: 'Inner truth. Wind over lake.', judgment: '中孚，豚鱼吉。利涉大川。', judgmentEn: 'Inner truth. Good fortune.' },
  { id: 62, name: 'Xiao Guo', nameCN: '雷山小过', upperTrigram: '震', lowerTrigram: '艮', description: '小过卦象征小有过越。雷在山上声威稍过。小事可成大事不宜。', descriptionEn: 'Small excess. Thunder on mountain.', judgment: '小过，亨，利贞。可小事不可大事。', judgmentEn: 'Small excess. Small matters only.' },
  { id: 63, name: 'Ji Ji', nameCN: '水火既济', upperTrigram: '坎', lowerTrigram: '离', description: '既济卦象征已经成功。水在火上烹饪完成。但需防盛极而衰。', descriptionEn: 'Completion. Water over fire.', judgment: '既济，亨小，利贞。初吉终乱。', judgmentEn: 'Completion. Beginning good, ending chaotic.' },
  { id: 64, name: 'Wei Ji', nameCN: '火水未济', upperTrigram: '离', lowerTrigram: '坎', description: '未济卦象征尚未成功。火在水上各不相干。得此卦者尚需努力。', descriptionEn: 'Not yet complete. Fire above water.', judgment: '未济，亨。小狐汔济，濡其尾。', judgmentEn: 'Not yet complete. The young fox nearly crosses.' },
]

// ============================================================
// 查找函数
// ============================================================

/** 根据上下卦名查找卦 */
function findHexagramData(lowerName: string, upperName: string): HexagramData {
  const h = KING_WEN_HEXAGRAMS.find(
    h => h.lowerTrigram === lowerName && h.upperTrigram === upperName,
  )
  if (!h) throw new Error(`找不到卦：下${lowerName}上${upperName}`)
  return h
}

// 构建快速查找 Map
const hexagramByTrigrams = new Map<string, HexagramData>()
for (const h of KING_WEN_HEXAGRAMS) {
  hexagramByTrigrams.set(`${h.lowerTrigram}_${h.upperTrigram}`, h)
}

// ============================================================
// 铜钱摇卦核心逻辑
// ============================================================

/**
 * 模拟一次铜钱抛掷（三枚铜钱）
 * 正面（阳，值3）+ 背面（阴，值2）
 */
function tossCoins(): { heads: number; type: YaoType; isYang: boolean; isChanging: boolean } {
  // 模拟三枚铜钱：>0.5 = 正面（阳=3），<=0.5 = 背面（阴=2）
  const coins = [
    Math.random() > 0.5 ? 3 : 2,
    Math.random() > 0.5 ? 3 : 2,
    Math.random() > 0.5 ? 3 : 2,
  ]
  const sum = coins[0] + coins[1] + coins[2]
  const heads = coins.filter(c => c === 3).length

  switch (sum) {
    case 6: // 2+2+2：老阴
      return { heads: 0, type: '老阴', isYang: false, isChanging: true }
    case 7: // 3+2+2：少阳
      return { heads: 1, type: '少阳', isYang: true, isChanging: false }
    case 8: // 3+3+2：少阴
      return { heads: 2, type: '少阴', isYang: false, isChanging: false }
    case 9: // 3+3+3：老阳
      return { heads: 3, type: '老阳', isYang: true, isChanging: true }
    default:
      return { heads: 1, type: '少阳', isYang: true, isChanging: false }
  }
}

/**
 * 摇六次卦
 * 返回完整摇卦结果
 */
export function shakeCoins(): BaguaShakeResult {
  const shakes: CoinShake[] = []

  // 摇六次，从第一爻（最下）到第六爻（最上）
  for (let i = 1; i <= 6; i++) {
    const result = tossCoins()
    shakes.push({
      index: i,
      heads: result.heads,
      type: result.type,
      isYang: result.isYang,
      isChanging: result.isChanging,
    })
  }

  // 本卦（原始阴阳）
  const originalLines = shakes.map(s => s.isYang) // [0..5] = 爻1..6

  // 变卦（动爻翻转）
  const derivedLines = shakes.map(s => s.isChanging ? !s.isYang : s.isYang)

  // 确定上下卦
  const origLowerLines = originalLines.slice(0, 3) // 下卦 = 爻123
  const origUpperLines = originalLines.slice(3, 6) // 上卦 = 爻456
  const origLowerName = getTrigramName(origLowerLines)
  const origUpperName = getTrigramName(origUpperLines)

  const dLowerLines = derivedLines.slice(0, 3)
  const dUpperLines = derivedLines.slice(3, 6)
  const dLowerName = getTrigramName(dLowerLines)
  const dUpperName = getTrigramName(dUpperLines)

  const origKey = `${origLowerName}_${origUpperName}`
  const dKey = `${dLowerName}_${dUpperName}`

  const originalHexagram = hexagramByTrigrams.get(origKey)
  if (!originalHexagram) {
    throw new Error(`找不到本卦：下${origLowerName}上${origUpperName}`)
  }

  const derivedHexagram = hexagramByTrigrams.get(dKey) ?? null

  // 动爻位置
  const changingLineIndices = shakes
    .filter(s => s.isChanging)
    .map(s => s.index)

  return {
    shakes,
    originalLines,
    originalHexagram,
    derivedHexagram,
    changingLineIndices,
    timestamp: Date.now(),
  }
}

/**
 * 根据三爻确定卦名
 */
function getTrigramName(lines: boolean[]): string {
  // lines[0]=最下爻, lines[2]=最上爻
  const bin = (lines[0] ? 1 : 0) | ((lines[1] ? 1 : 0) << 1) | ((lines[2] ? 1 : 0) << 2)
  const map: Record<number, string> = {
    0: '坤', // 000
    1: '艮', // 001 → 山（艮 = 一阳在上，即 line2=1 → 100? 不对...）
    // 等等，需要仔细处理
    // 下卦：lines[0]=最下, lines[1]=中, lines[2]=最上
    // 二进制 = bit0(lines[0]) + bit1(lines[1]) + bit2(lines[2])
    //
    // 乾 ☰ = 111 → 1+2+4=7
    // 兑 ☱ = 110 → 1+2+0=3
    // 离 ☲ = 101 → 1+0+4=5
    // 震 ☳ = 100 → 1+0+0=1
    // 巽 ☴ = 011 → 0+2+4=6
    // 坎 ☵ = 010 → 0+2+0=2
    // 艮 ☶ = 001 → 0+0+4=4
    // 坤 ☷ = 000 → 0
  }
  // 重新修正：
  const correct: Record<number, string> = {
    7: '乾', // 111 ☰
    3: '兑', // 110 ☱
    5: '离', // 101 ☲
    1: '震', // 100 ☳
    6: '巽', // 011 ☴
    2: '坎', // 010 ☵
    4: '艮', // 001 ☶
    0: '坤', // 000 ☷
  }
  return correct[bin] ?? '坤'
}

// ============================================================
// 格式化输出
// ============================================================

/**
 * 格式化摇卦结果为文本（供 AI prompt 使用）
 */
export function formatShakeResult(result: BaguaShakeResult, locale: string = 'zh-CN'): string {
  const isEn = locale === 'en'

  if (isEn) {
    return formatShakeResultEn(result)
  }

  const { shakes, originalHexagram, derivedHexagram, changingLineIndices } = result

  // 摇卦过程
  const shakeLines = shakes.map(s => {
    const yaoSymbol = s.isYang ? '⚊' : '⚋'
    const changeMark = s.isChanging ? '  ← 动爻' : ''
    const headsStr = '⚪'.repeat(s.heads) + '⚫'.repeat(3 - s.heads)
    return `第${s.index}摇（从下往上）：${headsStr} → ${s.type} ${yaoSymbol}${changeMark}`
  }).join('\n')

  // 本卦
  const origElem = TRIGRAM_ELEMENT[originalHexagram.upperTrigram] ?? ''
  const derivInfo = derivedHexagram
    ? `\n\n## 变卦（之卦）\n**${derivedHexagram.nameCN}**（${derivedHexagram.name}）\n上卦${derivedHexagram.upperTrigram}下卦${derivedHexagram.lowerTrigram}\n${derivedHexagram.description}\n卦辞：${derivedHexagram.judgment}`
    : '\n\n## 变卦\n无动爻，无变卦（六静卦）'

  const changingInfo = changingLineIndices.length > 0
    ? `\n\n## 动爻\n第${changingLineIndices.join('、')}爻为动爻（共${changingLineIndices.length}个动爻）`
    : '\n\n## 动爻\n无动爻'

  return `## 铜钱摇卦过程
${shakeLines}

## 本卦
**${originalHexagram.nameCN}**（${originalHexagram.name}）
上卦${originalHexagram.upperTrigram}（${TRIGRAMS[getTrigramCode(originalHexagram.upperTrigram)]?.nature ?? ''}）· 下卦${originalHexagram.lowerTrigram}（${TRIGRAMS[getTrigramCode(originalHexagram.lowerTrigram)]?.nature ?? ''}）
五行：上卦属${origElem}，下卦属${TRIGRAM_ELEMENT[originalHexagram.lowerTrigram] ?? ''}
${originalHexagram.description}
卦辞：${originalHexagram.judgment}${derivInfo}${changingInfo}`
}

function formatShakeResultEn(result: BaguaShakeResult): string {
  const { shakes, originalHexagram, derivedHexagram, changingLineIndices } = result

  const shakeLines = shakes.map(s => {
    const yaoSymbol = s.isYang ? '⚊' : '⚋'
    const changeMark = s.isChanging ? '  ← Changing Line' : ''
    const headsStr = '●'.repeat(s.heads) + '○'.repeat(3 - s.heads)
    return `Shake ${s.index} (bottom to top): ${headsStr} → ${s.type} ${yaoSymbol}${changeMark}`
  }).join('\n')

  const derivInfo = derivedHexagram
    ? `\n\n## Derived Hexagram\n**${derivedHexagram.nameCN} (${derivedHexagram.name})**\nUpper: ${derivedHexagram.upperTrigram}, Lower: ${derivedHexagram.lowerTrigram}\n${derivedHexagram.descriptionEn}\nJudgment: ${derivedHexagram.judgmentEn}`
    : '\n\n## Derived Hexagram\nNo changing lines (all lines stable)'

  const changingInfo = changingLineIndices.length > 0
    ? `\n\n## Changing Lines\nLine(s) ${changingLineIndices.join(', ')} (${changingLineIndices.length} changing)`
    : '\n\n## Changing Lines\nNone'

  return `## Coin Shake Process
${shakeLines}

## Original Hexagram
**${originalHexagram.nameCN} (${originalHexagram.name})**
Upper Trigram: ${originalHexagram.upperTrigram} · Lower Trigram: ${originalHexagram.lowerTrigram}
${originalHexagram.descriptionEn}
Judgment: ${originalHexagram.judgmentEn}${derivInfo}${changingInfo}`
}

/** 获取八卦的编码字符串（用于查找 TRIGRAMS） */
function getTrigramCode(name: string): string {
  const map: Record<string, string> = {
    '乾': '111', '兑': '110', '离': '101', '震': '100',
    '巽': '011', '坎': '010', '艮': '001', '坤': '000',
  }
  return map[name] ?? '000'
}
