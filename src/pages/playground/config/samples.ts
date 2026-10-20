export const embeddingSamples: Record<string, string[]> = {
  'zh-CN': [
    '最近哪家咖啡店评价最好？',
    '附近有没有推荐的咖啡厅？',
    '明天天气预报说会下雨。',
    '北京是中国的首都。',
    '我想找一个适合学习的地方。'
  ],
  'en-US': [
    'What are the best cafes nearby?',
    'Can you recommend a quiet coffee shop?',
    'I’m planning a trip to Japan next month.',
    'The capital of France is Paris.',
    "I'm looking for a place to study."
  ],
  'ja-JP': [
    '近くにおすすめのカフェはありますか？',
    '静かな喫茶店を探しています。',
    '明日の天気はどうですか？',
    '富士山は日本で一番高い山です。',
    '勉強に集中できる場所を知っていますか？'
  ],
  'ru-RU': [
    'Где находится ближайшая аптека?',
    'Можете подсказать, где купить лекарства?',
    'Погода сегодня очень хорошая.',
    'Я ищу кафе рядом с вокзалом.',
    'Как добраться до аэропорта?'
  ]
};

export const rerankerSamples: Record<
  string,
  {
    query: string;
    documents: string[];
  }
> = {
  'zh-CN': {
    query: '如何提高睡眠质量？',
    documents: [
      '保持规律的作息时间，晚上避免使用电子产品。',
      '参加更多社交活动有助于提高情绪。',
      '多喝咖啡可以让你更有精神。'
    ]
  },
  'en-US': {
    query: 'What are the benefits of regular exercise?',
    documents: [
      'Regular physical activity helps improve cardiovascular health and mental well-being.',
      'Eating too much sugar can lead to health issues.',
      'Exercise is often done in gyms or outdoors.'
    ]
  },
  'ja-JP': {
    query: '効果的な英語の勉強法は？',
    documents: [
      '毎日少しずつでも英語に触れることが大切です。',
      '睡眠時間を削ると集中力が低下します。',
      '文法よりも単語を先に覚えましょう。'
    ]
  },
  'ru-RU': {
    query: 'Как улучшить концентрацию во время учёбы?',
    documents: [
      'Регулярные перерывы помогают поддерживать концентрацию.',
      'Учёба ночью может быть неэффективной.',
      'Прогулка на свежем воздухе улучшает работу мозга.'
    ]
  }
};

// Playground decision samples: the structured `state` (chat-messages shape,
// mirroring the schema's own example and TypeSafe's default) plus the
// options of the seeded `route` choice question (System One / Jev shape).
export const decisionSamples: Record<
  string,
  {
    state: Record<string, any>;
    criteria: { name: string; description: string }[];
  }
> = {
  'zh-CN': {
    state: {
      messages: [{ role: 'user', content: '用匈牙利语写一首 200 词的诗。' }]
    },
    criteria: [
      { name: 'qwen3-8b', description: '多语言生成能力强。' },
      { name: 'llama3-8b', description: '速度更快，多语言能力较弱。' }
    ]
  },
  'en-US': {
    state: {
      messages: [
        { role: 'user', content: 'Write a 200-word poem in Hungarian.' }
      ]
    },
    criteria: [
      { name: 'qwen3-8b', description: 'Strong multilingual generation.' },
      { name: 'llama3-8b', description: 'Faster, weaker multilingual.' }
    ]
  },
  'ja-JP': {
    state: {
      messages: [
        { role: 'user', content: 'ハンガリー語で200語の詩を書いてください。' }
      ]
    },
    criteria: [
      { name: 'qwen3-8b', description: '多言語生成に強い。' },
      { name: 'llama3-8b', description: '高速だが多言語は弱い。' }
    ]
  },
  'ru-RU': {
    state: {
      messages: [
        {
          role: 'user',
          content: 'Напишите стихотворение на 200 слов на венгерском языке.'
        }
      ]
    },
    criteria: [
      { name: 'qwen3-8b', description: 'Сильная многоязычная генерация.' },
      { name: 'llama3-8b', description: 'Быстрее, слабее в многоязычности.' }
    ]
  }
};
