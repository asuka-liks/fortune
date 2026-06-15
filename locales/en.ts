import type { TranslationMap } from './index'

const en: TranslationMap = {
  // ==================== App Level ====================
  'app.title': '🔮 AI Fortune Teller',
  'app.subtitle': 'AI Reading · Entertainment Only',
  'app.footer': 'AI Fortune Teller · For Entertainment Only · Be Rational',

  // ==================== Sidebar ====================
  'sidebar.menu': '🔮 Fortune Menu',
  'sidebar.history': 'Chat History',
  'sidebar.newChat': '+ New Chat',
  'sidebar.newChatDefault': 'New Chat',
  'sidebar.empty': 'No conversations',

  // ==================== Chat ====================
  'chat.currentMode': 'Current Mode: ',
  'chat.switch': 'Switch →',
  'chat.dismiss': 'Dismiss',
  'chat.inputPlaceholder': 'Type your question...',
  'chat.selectSkillFirst': 'Please select a fortune-telling mode first',
  'chat.quotaRemaining': '🔮 {n} free conversations remaining',
  'chat.quotaExhausted': '🚫 Free conversations used up. Paid features coming soon.',
  'chat.quotaExhaustedShort': 'No free conversations left',
  'chat.send': 'Send',
  'chat.stop': 'Stop',
  'chat.emptyTitle': 'Begin Your Fortune Journey',
  'chat.emptyDesc': 'Select a fortune-telling mode on the left, fill in your details, and start chatting with the AI master.',
  'chat.autoStartBazi': 'Start analysis',
  'chat.autoStartAstrology': 'View horoscope',
  'chat.autoStartTarot': 'Start reading',

  // ==================== Skill Selection ====================
  'skill.selectorTitle': 'Choose Fortune Type',
  'skill.bazi.name': 'BaZi (Eight Characters)',
  'skill.bazi.desc': 'Traditional Chinese destiny analysis based on birth date and time',
  'skill.astrology.name': 'Astrology',
  'skill.astrology.desc': 'Daily, weekly, monthly, and yearly horoscope readings',
  'skill.tarot.name': 'Tarot Reading',
  'skill.tarot.desc': 'Draw tarot cards and receive insightful guidance',

  // ==================== BaZi ====================
  'bazi.title': 'BaZi · Birth Info',
  'bazi.birthDate': 'Birth Date (Gregorian)',
  'bazi.birthTime': 'Birth Time (Chinese Hour)',
  'bazi.selectTime': 'Select time period',
  'bazi.gender': 'Gender',
  'bazi.male': '♂ Male',
  'bazi.female': '♀ Female',
  'bazi.submit': 'Start BaZi Analysis',

  // ==================== Astrology ====================
  'astrology.title': 'Astrology · Select Sign',
  'astrology.selectSign': 'Zodiac Sign',
  'astrology.period': 'Forecast Period',
  'astrology.periodDaily': 'Daily',
  'astrology.periodWeekly': 'Weekly',
  'astrology.periodMonthly': 'Monthly',
  'astrology.periodYearly': 'Yearly',
  'astrology.submit': 'View Horoscope',

  // ==================== Tarot ====================
  'tarot.title': 'Tarot · Draw Cards',
  'tarot.question': 'What do you want to ask? (Optional)',
  'tarot.questionPlaceholder': 'e.g. How is my career developing?',
  'tarot.selectSpread': 'Choose Spread',
  'tarot.single': 'Single',
  'tarot.singleDesc': 'Quick Guidance',
  'tarot.threeCard': 'Three Cards',
  'tarot.threeCardDesc': 'Past · Present · Future',
  'tarot.celticCross': 'Celtic Cross',
  'tarot.celticCrossDesc': 'Full 10-Card Reading',
  'tarot.drawing': 'Drawing...',
  'tarot.startDraw': '🃏 Draw Cards',
  'tarot.drawResult': 'Draw Results',
  'tarot.upright': 'Upright',
  'tarot.reversed': 'Reversed',
  'tarot.startReading': 'Start Reading',
  'tarot.noQuestion': 'No question specified',
  'tarot.cardPosition': 'Card {n}',
  'tarot.cardLabel': ': ',
  'tarot.cardName': 'Name: ',
  'tarot.orientation': 'Orientation: ',
  'tarot.meaning': 'Meaning: ',
  'tarot.descLabel': 'Description: ',
  'tarot.clickFlip': 'Click to Reveal',

  // ==================== Errors ====================
  'error.createSession': 'Please create a conversation first',
  'error.selectSkill': 'Please select a fortune-telling mode first',
  'error.quotaExhausted': 'Free conversations used up. Paid features coming soon.',
  'error.retry': 'Request failed. Please try again.',
}

export default en
