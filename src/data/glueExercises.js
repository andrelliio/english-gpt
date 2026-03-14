export const glueExercises = [
  // Format 1: Gap Fill
  {
    type: 'gap',
    text: "I'd like to order the salmon. [gap] could I also get some water?",
    options: ["Actually", "However", "Because", "Although"],
    answer: "Actually",
    explanation: "Actually используется, когда хочешь добавить что-то к сказанному или уточнить информацию."
  },
  {
    type: 'gap',
    text: "It's a beautiful place. [gap] the service is a bit slow.",
    options: ["However", "So", "Because", "And"],
    answer: "However",
    explanation: "However используется для противопоставления (как 'но' или 'однако')."
  },
  {
    type: 'gap',
    text: "I'm not hungry [gap] I just had lunch.",
    options: ["because", "although", "but", "so"],
    answer: "because",
    explanation: "Because объясняет причину чего-либо."
  },
  {
    type: 'gap',
    text: "I love sports. [gap] I don't have much time for it.",
    options: ["Unfortunately", "Luckily", "Definitely", "Actually"],
    answer: "Unfortunately",
    explanation: "Unfortunately выражает сожаление ('к сожалению')."
  },
  {
    type: 'gap',
    text: "I forgot my wallet. [gap] I can't pay right now.",
    options: ["So", "But", "Although", "Maybe"],
    answer: "So",
    explanation: "So связывает причину с результатом ('поэтому')."
  },
  {
    type: 'gap',
    text: "The weather is bad. [gap] let's stay at home.",
    options: ["Probably", "Definitely", "Actually", "Suddenly"],
    answer: "Probably",
    explanation: "Probably выражает вероятность ('вероятно')."
  },
  {
    type: 'gap',
    text: "I'll be there on time. [gap] if the traffic is not too bad.",
    options: ["At least", "Anyway", "Moreover", "Instead"],
    answer: "At least",
    explanation: "At least ('по крайней мере') используется для уточнения условий."
  },
  {
    type: 'gap',
    text: "I don't like coffee. [gap] I'll have some tea.",
    options: ["Instead", "Besides", "Therefore", "Moreover"],
    answer: "Instead",
    explanation: "Instead означает 'вместо этого'."
  },
  {
    type: 'gap',
    text: "He is rich. [gap] he is not happy.",
    options: ["Yet", "So", "Then", "Thus"],
    answer: "Yet",
    explanation: "Yet используется для резкого противопоставления ('но при этом')."
  },
  {
    type: 'gap',
    text: "It was raining. [gap] we went for a walk.",
    options: ["Nevertheless", "Consequently", "Otherwise", "Hence"],
    answer: "Nevertheless",
    explanation: "Nevertheless означает 'тем не менее'."
  },

  // Format 2: Start Phrase
  {
    type: 'start',
    ru: "Ну, на самом деле, я думаю что...",
    options: ["Well, actually, I think...", "However, I think...", "By the way, I think..."],
    answer: "Well, actually, I think..."
  },
  {
    type: 'start',
    ru: "Определённо, это лучший выбор.",
    options: ["Definitely, it's the best choice.", "Maybe, it's the best choice.", "Unfortunately, it's the best choice."],
    answer: "Definitely, it's the best choice."
  },
  {
    type: 'start',
    ru: "Кстати, ты видел это?",
    options: ["By the way, have you seen this?", "Actually, have you seen this?", "So, have you seen this?"],
    answer: "By the way, have you seen this?"
  },
  {
    type: 'start',
    ru: "В любом случае, пора идти.",
    options: ["Anyway, it's time to go.", "Therefore, it's time to go.", "Moreover, it's time to go."],
    answer: "Anyway, it's time to go."
  },
  {
    type: 'start',
    ru: "По крайней мере, мы попытались.",
    options: ["At least we tried.", "Otherwise we tried.", "Instead we tried."],
    answer: "At least we tried."
  },
  {
    type: 'start',
    ru: "С другой стороны, это дорого.",
    options: ["On the other hand, it's expensive.", "In addition, it's expensive.", "Actually, it's expensive."],
    answer: "On the other hand, it's expensive."
  },
  {
    type: 'start',
    ru: "Короче говоря, всё прошло хорошо.",
    options: ["In short, everything went well.", "Moreover, everything went well.", "However, everything went well."],
    answer: "In short, everything went well."
  },
  {
    type: 'start',
    ru: "Прежде всего, нам нужно меню.",
    options: ["First of all, we need the menu.", "Actually, we need the menu.", "Finally, we need the menu."],
    answer: "First of all, we need the menu."
  },
  {
    type: 'start',
    ru: "На самом деле, это не так.",
    options: ["In fact, it's not like that.", "Suddenly, it's not like that.", "Lucklily, it's not like that."],
    answer: "In fact, it's not like that."
  },
  {
    type: 'start',
    ru: "В конце концов, это наша работа.",
    options: ["After all, it's our job.", "At first, it's our job.", "Anyway, it's our job."],
    answer: "After all, it's our job."
  },

  // More Gap Fills
  {
    type: 'gap',
    text: "I can't go to the party. [gap] I have too much homework.",
    options: ["Besides", "However", "So", "Yet"],
    answer: "Besides",
    explanation: "Besides ('кроме того') добавляет ещё одну причину."
  },
  {
    type: 'gap',
    text: "You should study hard. [gap] you might fail the test.",
    options: ["Otherwise", "Moreover", "Therefore", "Instead"],
    answer: "Otherwise",
    explanation: "Otherwise ('иначе') описывает последствия невыполнения условия."
  },
  {
    type: 'gap',
    text: "I was sleeping. [gap] I heard a loud noise.",
    options: ["Suddenly", "Usually", "Actually", "Luckily"],
    answer: "Suddenly",
    explanation: "Suddenly ('внезапно') описывает неожиданное действие."
  },
  {
    type: 'gap',
    text: "I lost my key. [gap] I found it later in my pocket.",
    options: ["Luckily", "Unfortunately", "Probably", "Definitely"],
    answer: "Luckily",
    explanation: "Luckily ('к счастью') выражает радость по поводу удачного события."
  },

  // More Starts
  {
    type: 'start',
    ru: "Более того, это очень полезно.",
    options: ["Moreover, it's very useful.", "However, it's very useful.", "Instead, it's very useful."],
    answer: "Moreover, it's very useful."
  },
  {
    type: 'start',
    ru: "Следовательно, мы согласны.",
    options: ["Therefore, we agree.", "Actually, we agree.", "Maybe, we agree."],
    answer: "Therefore, we agree."
  },
  {
    type: 'start',
    ru: "Между прочим, я тоже там был.",
    options: ["Incidentally, I was there too.", "Suddenly, I was there too.", "Unfortunately, I was there too."],
    answer: "Incidentally, I was there too."
  },
  {
    type: 'start',
    ru: "В дополнение ко всему, это бесплатно.",
    options: ["In addition, it's free.", "Anyway, it's free.", "Nevertheless, it's free."],
    answer: "In addition, it's free."
  },
  {
    type: 'start',
    ru: "По правде говоря, я не знаю.",
    options: ["To be honest, I don't know.", "Maybe, I don't know.", "Actually, I don't know."],
    answer: "To be honest, I don't know."
  }
];
