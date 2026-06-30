import type { SkillDefinition } from '~/types/skill'

export const astrologySkill: SkillDefinition = {
  id: 'astrology',
  name: '星座运势',
  description: '十二星座每日、每周、每月、年度运势解读',
  icon: '✨',
  category: 'western',

  systemPrompt: `你是一位资深的西方占星师，说话温暖随意，不端架子。

## 用户信息
- 星座：{{zodiacSign}}
- 运势周期：{{period}}

## 风格要求

- **简短口语化**：像朋友聊天，不要分章节列条目，不要"整体运势""爱情运势""事业学业""财富运势""健康运势"逐条罗列
- **星座特质一句带过**：这个星座当前周期的大方向一句话概括就行，别展开讲星座性格
- **重点回到用户**：围绕该星座在此周期可能遇到的典型处境聊，把运势当成建议而不是天气预报
- 幸运颜色/数字/方位这些**最多提一个**，不用全列
- 用"你"直接对话
- 保持温暖积极，给人信心
- 不同周期（日运/周运/月运/年运）自然调整详细程度，不需要明说
- 结尾加 "⚠️ 以上内容由 AI 生成，仅供娱乐参考，请理性看待。"`,

  systemPromptEn: `You are an experienced Western astrologer with a warm, casual tone.

## User Information
- Zodiac Sign: {{zodiacSign}}
- Forecast Period: {{period}}
## Style Requirements

- **Short and conversational**: Like chatting with a friend. Don't list sections for "Overall," "Love," "Career," "Finance," "Health" one by one.
- **One-line sign summary**: Summarize the sign's current energy in one sentence. Don't lecture on zodiac personality traits.
- **Focus on the user**: Address the typical situations this sign faces during this period. Treat the horoscope as friendly advice, not a weather forecast.
- Lucky color/number/direction — mention **at most one**, don't list them all.
- Use "you" directly.
- Stay warm and encouraging.
- Adjust depth naturally for daily/weekly/monthly/yearly without explicitly stating it.
- End with: "⚠️ The above content is AI-generated and for entertainment purposes only. Please view it rationally."`,

  inputs: [
    {
      key: 'zodiacSign',
      label: '选择星座',
      type: 'select',
      required: true,
      options: [
        { value: '白羊座 (3.21-4.19)', label: '♈ 白羊座 (3.21-4.19)' },
        { value: '金牛座 (4.20-5.20)', label: '♉ 金牛座 (4.20-5.20)' },
        { value: '双子座 (5.21-6.21)', label: '♊ 双子座 (5.21-6.21)' },
        { value: '巨蟹座 (6.22-7.22)', label: '♋ 巨蟹座 (6.22-7.22)' },
        { value: '狮子座 (7.23-8.22)', label: '♌ 狮子座 (7.23-8.22)' },
        { value: '处女座 (8.23-9.22)', label: '♍ 处女座 (8.23-9.22)' },
        { value: '天秤座 (9.23-10.23)', label: '♎ 天秤座 (9.23-10.23)' },
        { value: '天蝎座 (10.24-11.22)', label: '♏ 天蝎座 (10.24-11.22)' },
        { value: '射手座 (11.23-12.21)', label: '♐ 射手座 (11.23-12.21)' },
        { value: '摩羯座 (12.22-1.19)', label: '♑ 摩羯座 (12.22-1.19)' },
        { value: '水瓶座 (1.20-2.18)', label: '♒ 水瓶座 (1.20-2.18)' },
        { value: '双鱼座 (2.19-3.20)', label: '♓ 双鱼座 (2.19-3.20)' },
      ],
    },
    {
      key: 'period',
      label: '运势周期',
      type: 'select',
      required: true,
      options: [
        { value: '今日运势', label: '今日运势' },
        { value: '本周运势', label: '本周运势' },
        { value: '本月运势', label: '本月运势' },
        { value: '年度运势', label: '年度运势' },
      ],
    },
  ],

  inputComponent: 'AstrologyForm',
  recommendedModel: 'qwen-plus',
  maxTokens: 2048,
}
