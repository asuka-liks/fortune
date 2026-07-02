# Wiki 操作日志

## [2026-07-01] ingest | raw/易经系列7个文件 → wiki/ 易经知识体系

**新建页面（10个）**：

Sources（来源摘要）：
- `wiki/sources/易经基础知识.md` — 六十四卦 + 符号体系 + 易传十翼
- `wiki/sources/易经占卜方法.md` — 梅花易数 + 六爻 + 术数对比
- `wiki/sources/易经与荣格心理学.md` — 共时性的原生案例（荣格序言一手文献）

Entities（实体）：
- `wiki/entities/易经.md` — 易经系统全貌（2^6全排列、河图洛书、三层架构）
- `wiki/entities/梅花易数.md` — 万物类象 + 体用生克体系

Concepts（概念）：
- `wiki/concepts/概念_六十四卦.md` — 卦序的辩证叙事结构
- `wiki/concepts/概念_先天八卦与后天八卦.md` — 双坐标系设计
- `wiki/concepts/概念_体用生克与五行.md` — 可迁移的关系建模语言
- `wiki/concepts/概念_易经与共时性.md` — 荣格发生学 vs 塔罗附会

Comparisons（比较）：
- `wiki/comparisons/六爻_梅花易数_八字_奇门.md` — 四套体系的解耦证明

**更新已有页面**：
- `wiki/overview/占卜符号系统的可迁移性.md` — 新增"易经：占卜符号系统的原生原型"章节，更新 sources + 关联
- `wiki/concepts/数字起卦与梅花易数.md` — 更新 sources + 关联，链接易经新页面
- `wiki/index.md` — 补入所有新页面条目
- `wiki/log.md` — 本记录

**Ingest 策略**：从建构论元视角出发，将易经定位为"所有符号建构的原型"——与塔罗的"最成熟参照系"形成互补。关键发现：① 2^6=64全排列 → 符号自洽性来自数学 ② 同一符号层四种解释规则（梅花/六爻/八字/奇门）→ 第1层与第2层解耦 ③ 荣格共时性从易经生长出来（非附会）→ 比塔罗拥有更坚实的理论基础。

**交叉引用**：新建页面与已有知识网络（[[overview/占卜符号系统的可迁移性]]、[[concepts/卡牌占卜符号映射]]、[[concepts/数字起卦与梅花易数]]、[[entities/三国杀占卜]]、塔罗系列）建立了双向链接。

---

## [2026-07-01] ingest | raw/塔罗系列9个文件 → wiki/ 塔罗知识体系

**新建页面（10个）**：

Sources（来源摘要）：
- `wiki/sources/塔罗基础知识.md` — 牌义 + 入门 + 牌阵（覆盖 raw/塔罗牌78张牌义详解、入门教程、牌阵完全指南）
- `wiki/sources/塔罗深度理论.md` — 正逆位 + 符号学 + 三大体系（覆盖 raw/塔罗牌正逆位解读技巧、符号学-元素占星卡巴拉、三大体系）
- `wiki/sources/塔罗心理与象征.md` — 宫廷牌 + 荣格 + 英文参考（覆盖 raw/塔罗宫廷牌人物性格解读、塔罗牌与荣格心理学、英文资料）

Entities（实体）：
- `wiki/entities/塔罗.md` — 塔罗系统全貌
- `wiki/entities/韦特塔罗.md` — 最主流的入门体系

Concepts（概念）：
- `wiki/concepts/概念_大阿卡纳与愚人之旅.md` — 22张大牌的叙事结构
- `wiki/concepts/概念_塔罗正逆位.md` — 正逆位的解释模型与理论视角
- `wiki/concepts/概念_卡巴拉生命之树.md` — 符号编码的底层架构
- `wiki/concepts/概念_塔罗与共时性.md` — 荣格框架与建构论的对话

Comparisons（比较）：
- `wiki/comparisons/马赛_韦特_托特对比.md` — 三大体系的设计哲学差异

**更新已有页面**：
- `wiki/overview/占卜符号系统的可迁移性.md` — 新增"塔罗：最成熟的符号映射参照系"章节，更新 sources 和关联
- `wiki/index.md` — 补入所有新页面条目
- `wiki/log.md` — 本记录

**Ingest 策略**：从建构论的元视角出发，将塔罗定位为"最成熟的符号映射体系"来消化——所有新页面保持与已有知识体系（符号可迁移性、符号映射方法论）的对话关系，而非孤立的塔罗百科。

**交叉引用**：新建页面与已有页面（[[concepts/卡牌占卜符号映射]]、[[entities/三国杀占卜]]、[[overview/占卜符号系统的可迁移性]]）之间建立了双向链接。

---

## [2026-07-01] ingest | Fortune项目代码库 → wiki/ Fortune占卜体系

**新建页面（8个）**：

Sources（来源摘要）：
- `wiki/sources/Fortune项目占卜实现.md` — 五种技能代码架构 + AI 集成 + 安全设计

Entities（实体）：
- `wiki/entities/Fortune项目.md` — Fortune 作为占卜系统的实体页（建构论的工程验证）

Concepts（概念）：
- `wiki/concepts/概念_八字命理排盘.md` — 四柱八字/天干地支/十神/大运（wiki首次覆盖八字）
- `wiki/concepts/概念_铜钱摇卦算法.md` — bagua.ts 的完整算法——铜钱模拟→64卦→动爻→变卦→格式化输出
- `wiki/concepts/概念_AI占卜Prompt设计模式.md` — 五种技能的 prompt 设计规律（人设句/反教科书/焦点控制/密度控制/非宿命化/免责声明）
- `wiki/concepts/概念_星座运势白盒化.md` — 如何通过 prompt 设计去除星座内容的神秘化语调

Comparisons（比较）：
- `wiki/comparisons/Fortune五种技能对比.md` — 六维对比：符号来源/随机性/AI角色/用户输入/解释规则层/建构诚实度

Overview（综述）：
- `wiki/overview/AI算命应用的设计哲学.md` — 三个核心命题 + 四层伦理设计 + 同类产品差异

**更新已有页面**：
- `wiki/index.md` — 补入所有新页面条目
- `wiki/log.md` — 本记录

**Ingest 策略**：将 Fortune 项目自身作为"知识源"——不仅 Ingest 外部原料，也 Ingest 自己写的代码。5 个 skill.ts + 3 个 server/utils/*.ts + types 构成了一个"AI 算命系统如何设计"的完整知识体。关键发现：① 五种技能是"三层架构"（符号/规则/叙事）的五个实例化验证 ② Prompt 设计有 6 条可跨技能复用的规律 ③ 趣味模式的"暴露建构过程"是伦理设计的顶峰——证明了占卜不需要神秘感来维持价值。

**交叉引用**：新建页面与已有知识网络（[[overview/占卜符号系统的可迁移性]]、[[entities/三国杀占卜]]、[[entities/塔罗]]、[[entities/易经]]、[[entities/梅花易数]]、[[concepts/卡牌占卜符号映射]]、[[concepts/概念_六十四卦]]、[[concepts/概念_体用生克与五行]]）之间建立了双向链接。

---

## [2026-07-01] ingest | raw/塔罗tv系列3个字幕 → wiki/ 首次填充

**新建页面**：
- `wiki/sources/三国杀占卜系列.md` — 来源摘要（3 个视频合并）
- `wiki/concepts/卡牌占卜符号映射.md` — 符号赋予方法论
- `wiki/concepts/数字起卦与梅花易数.md` — ÷8÷6 起卦技法
- `wiki/entities/三国杀占卜.md` — 占卜流派实体
- `wiki/overview/占卜符号系统的可迁移性.md` — 元理论综述

**影响范围**：首次 Ingest，wiki/ 从空仓启动

**操作者**：Claude Code（Askoutsider 确认后执行）
