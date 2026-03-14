import { useState, useEffect, useMemo } from 'react';
import allWords, { islands, DIFFICULTY_LABELS, getIslandItems, getSimilarWords, islandMetadata } from '../data/words';
import { tts } from '../utils/tts';
import { sfx } from '../utils/sfx';
import confetti from 'canvas-confetti';

function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

export default function Cards({ store, go, level }) {
  const { data } = store;
  
  const isIslandMode = typeof level === 'object' && level !== null;
  const islandIdx = isIslandMode ? level.islandIdx : null;
  const difficulty = isIslandMode ? level.difficulty : null;

  const [cards, setCards] = useState([]); // Base card data
  const [queue, setQueue] = useState([]); // [{ cardIdx, step }]
  const [qIdx, setQIdx] = useState(0); // Current position in queue
  const [flipped, setFlipped] = useState(false);
  const [choiceState, setChoiceState] = useState(null);
  const [sessionResults, setSessionResults] = useState(null);
  const [shake, setShake] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    let baseCards = [];
    if (isIslandMode) {
      const island = islands[islandIdx];
      const items = island.items.filter(i => !difficulty || i.difficulty === difficulty);
      baseCards = items.map(item => {
        const globalIdx = allWords.findIndex(w => w.en === item.en && w.ru === item.ru);
        return { word: item, globalIdx };
      });
    } else {
      const WORDS_PER_LEVEL = 10;
      const base = level * WORDS_PER_LEVEL;
      const words = allWords.slice(base, base + WORDS_PER_LEVEL);
      baseCards = words.map((w, i) => ({ word: w, globalIdx: base + i }));
    }

    if (baseCards.length === 0) {
      go('levels');
      return;
    }
    
    setCards(baseCards);

    // Build Session Queue: Phase-based
    // Phase 1: Intro for ALL
    const phase1 = baseCards.map((_, i) => ({ cardIdx: i, step: 1 }));
    
    // Phase 2: Recall for Phrases (Shuffled)
    const phraseIndices = baseCards.map((c, i) => c.word.type === 'phrase' || c.word.type === 'glue' ? i : -1).filter(i => i !== -1);
    const phase2 = shuffle(phraseIndices).map(i => ({ cardIdx: i, step: 2 }));
    
    // Phase 3: Mastery for Phrases (Shuffled)
    const phase3 = shuffle(phraseIndices).map(i => ({ cardIdx: i, step: 3 }));

    setQueue([...phase1, ...phase2, ...phase3]);
    setQIdx(0);
    setFlipped(false);
    
    if (!isIslandMode) store.touchLevel(level);
  }, [level, islandIdx, difficulty]);

  const currentTask = queue[qIdx];
  const currentCard = currentTask ? cards[currentTask.cardIdx] : null;

  // --- STEP OPS ---
  const step2Options = useMemo(() => {
    if (!currentCard || currentTask?.step !== 2) return [];
    return shuffle([currentCard.word.en, ...getSimilarWords(currentCard.globalIdx, 3, currentCard.word.en, 'en')]);
  }, [qIdx, queue.length]);

  const step3Options = useMemo(() => {
    if (!currentCard || currentTask?.step !== 3) return [];
    const wrong = getSimilarWords(currentCard.globalIdx, 2, currentCard.word.en, 'en');
    return shuffle([{ text: currentCard.word.en, correct: true }, ...wrong.map(w => ({ text: w, correct: false }))]);
  }, [qIdx, queue.length]);

  if (!currentCard || !currentTask) return null;

  const { word, globalIdx } = currentCard;
  const { step } = currentTask;
  const meta = islandMetadata[word.island] || { creative: word.island, icon: word.islandIcon || '🏝️' };
  const isPhrase = word.type === 'phrase' || word.type === 'glue';

  const handleNext = (isCorrect = true) => {
    if (!isCorrect) {
      sfx.error();
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    sfx.success();
    // Mark global seen if it's the last step for this card or phase 1
    try {
      if (step === 3 || !isPhrase) {
        if (store && store.markSeen) store.markSeen(globalIdx);
        if (store && store.update) store.update(p => ({ ...p, xp: p.xp + (isPhrase ? 5 : 2) }));
      }
    } catch (err) {
      console.warn("Store update failed", err);
    }

    if (qIdx + 1 >= queue.length) {
      setSessionResults({ xp: cards.length * 15, count: cards.length }); 
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else {
      setQIdx(qIdx + 1);
      setFlipped(false);
      setChoiceState(null);
    }
  };

  const progressPct = (qIdx / queue.length) * 100;

  if (sessionResults) {
    return (
      <div style={S.page} className="anim-in">
        <div style={S.doneContainer}>
          <div style={{ fontSize: 64 }}>🎉</div>
          <h2 style={S.doneTitle}>Урок завершен!</h2>
          <p style={S.dim}>Ты прошел все фазы обучения для {sessionResults.count} фраз</p>
          <div style={S.xpBadge}>+{sessionResults.xp} XP</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 24 }}>
            {!isIslandMode ? (
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => go('quiz', { level, type: 'normal' })}>
                Пройти тест ⚡
              </button>
            ) : (
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => go('islandView', islandIdx)}>
                Назад к острову 🏝️
              </button>
            )}
            <button className="btn-ghost" style={{ width: '100%' }} onClick={() => go('home')}>
              На главную 🏠
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page} className="anim-in">
      <div className="app-header">
        <button className="back-btn-round" onClick={() => (islandIdx !== null ? go('islandView', islandIdx) : go('home'))}>✕</button>
        <div className="header-title" style={{ textAlign: 'center' }}>
          <span style={{ opacity: 0.6, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            {step === 1 ? 'Фаза 1: Знакомство' : step === 2 ? 'Фаза 2: Припоминание' : 'Фаза 3: Мастерство'}
          </span>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Шаг {qIdx + 1} из {queue.length}</div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={S.bar}>
        <div style={{ ...S.barIn, width: `${progressPct}%` }} />
      </div>

      <div style={S.content}>
        {!isPhrase ? (
          <StandardCard key={`word-${qIdx}`} word={word} flipped={flipped} onFlip={() => { setFlipped(!flipped); tts.speak(word.en); }} />
        ) : (
          <div className="phrase-step-container">
            {step === 1 && <Step1Intro key={`s1-${qIdx}`} word={word} meta={meta} flipped={flipped} onFlip={() => { setFlipped(!flipped); tts.speak(word.en); }} />}
            {step === 2 && <Step2Recall key={`s2-${qIdx}`} word={word} options={step2Options} onCorrect={handleNext} />}
            {step === 3 && <Step3Reaction key={`s3-${qIdx}`} word={word} options={step3Options} onComplete={handleNext} />}
          </div>
        )}
      </div>

      {(step === 1 || !isPhrase) && (
        <div className="btn-row" style={{ marginTop: 'auto', paddingBottom: 20 }}>
          <button className="btn-primary btn-flex" onClick={handleNext}>Понятно →</button>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StandardCard({ word, flipped, onFlip }) {
  return (
    <div style={S.cardArea} onClick={onFlip}>
      <div style={{ ...S.cardWrap, transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)' }}>
        <div className="glass-card" style={{ ...S.face, ...S.front }}>
          <div style={S.badge}>📝 СЛОВО</div>
          <div style={S.word}>{word.en}</div>
          {word.hint && <div style={S.hint}>{word.hint}</div>}
          <div style={S.tap}>нажми чтобы перевернуть</div>
        </div>
        <div className="glass-card" style={{ ...S.face, ...S.back }}>
          <div style={S.badge}>ЗНАЧЕНИЕ</div>
          <div style={{ color: 'var(--accent)', fontWeight: 800, marginBottom: 8 }}>{word.en}</div>
          <div style={S.translation}>{word.ru}</div>
          {word.hint && <div style={S.hint}>{word.hint}</div>}
        </div>
      </div>
    </div>
  );
}

function Step1Intro({ word, meta, flipped, onFlip }) {
  // Generate simple dialogue if example is missing
  const dialogue = word.example ? word.example.split('\n') : [
    `— How are you?`,
    `— ${word.en}`,
    `— Nice to hear that!`
  ];

  return (
    <div className="anim-in">
      <div style={S.cardArea} onClick={onFlip}>
        <div style={{ ...S.cardWrap, height: 260, transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)' }}>
          <div className="glass-card" style={{ ...S.face, ...S.front, padding: 24 }}>
            <div style={S.contextBadge}>{word.context || meta.creative}</div>
            <div style={{ fontSize: 13, opacity: 0.6, marginTop: 20 }}>Как сказать по-английски:</div>
            <div style={{ ...S.translation, fontSize: 24, margin: '10px 0' }}>{word.ru}</div>
            <div style={S.tap}>нажми чтобы узнать ответ</div>
          </div>
          <div className="glass-card" style={{ ...S.face, ...S.back, padding: 24 }}>
            <div style={S.badge}>ОТВЕТ</div>
            <div style={{ ...S.phraseText, color: 'var(--accent)', marginBottom: 8 }}>{word.en}</div>
            {word.hint && <div style={S.hintItalic}>{word.hint}</div>}
            <div style={{ marginTop: 'auto', fontSize: 11, opacity: 0.5 }}>🔊 Озвучено</div>
          </div>
        </div>
      </div>


      <div className="bubble-container">
        {dialogue.map((line, i) => {
          const isUser = line.includes(word.en) || i === 1;
          // Highlight the phrase in the dialogue
          const parts = line.split(word.en);
          return (
            <div key={i} className={`bubble ${isUser ? 'bubble-right' : 'bubble-left'}`}>
              {parts.length > 1 ? (
                <>
                  {parts[0]}<span className="highlight-text">{word.en}</span>{parts[1]}
                </>
              ) : line}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Step2Recall({ word, options, onCorrect }) {
  const [selected, setSelected] = useState(null);
  
  const handleSelect = (opt) => {
    setSelected(opt);
    tts.speak(opt);
    if (opt === word.en) {
      setTimeout(onCorrect, 1000);
    } else {
      sfx.error();
      setTimeout(() => setSelected(null), 800);
    }
  };

  return (
    <div className="anim-in">
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Как это по-английски?</h3>
        <p style={S.dim}>Вспомни перевод фразы:</p>
      </div>

      <div className="glass-card" style={S.substitutionCard}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
          {word.ru}
        </div>
      </div>

      <div className="choice-grid" style={{ marginTop: 24 }}>
        {options.map((opt, i) => (
          <button 
            key={i} 
            className={`glass-card choice-btn ${selected === opt ? (opt === word.en ? 'correct-flash' : 'shake wrong-flash') : ''}`}
            style={{ 
              fontWeight: 800,
              fontSize: '15px',
              color: 'var(--text)'
            }}
            onClick={() => handleSelect(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Step3Reaction({ word, options, onComplete }) {
  const [feedback, setFeedback] = useState(null);

  const prompt = useMemo(() => {
    const ctx = word.context?.toLowerCase() || '';
    const en = word.en?.toLowerCase() || '';
    
    if (ctx.includes('представит')) return 'Nice to meet you! Who are you?';
    if (ctx.includes('привет') || ctx.includes('начать')) return 'Hey! How are things?';
    if (ctx.includes('прощ')) return 'Great talking to you! See you!';
    if (ctx.includes('спасибо') || ctx.includes('поблагод') || en.includes('welcome')) return 'Thank you so much for your help!';
    if (ctx.includes('извин') || en.includes('sorry')) return 'Oh, I am so sorry about that!';
    if (ctx.includes('помощь') || en.includes('help')) return 'Can you help me with this?';
    if (ctx.includes('самочув') || en.includes('well') || en.includes('fine')) return 'How are you feeling today?';
    if (ctx.includes('поздрав')) return 'I have some great news! I got the job!';
    return '...';
  }, [word.context, word.en]);

  const handleChoice = (opt) => {
    if (feedback) return;
    if (opt.correct) {
      setFeedback({ id: opt.text, correct: true });
      setTimeout(onComplete, 1200);
    } else {
      setFeedback({ id: opt.text, correct: false });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  return (
    <div className="anim-in">
       <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Твоя реакция?</h3>
      </div>

      <div className="bubble-container">
        <div className="bubble bubble-left">
          <span style={{opacity: 0.6, fontSize: 12}}>Ситуация: {word.context || 'Разговор'}</span>
          <br/>
          <strong>— {prompt}</strong>
        </div>
      </div>

      <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((opt, i) => {
          const isSelected = feedback?.id === opt.text;
          const showCorrect = feedback && opt.correct;
          return (
            <button 
              key={i} 
              className={`glass-card reaction-btn ${isSelected && !opt.correct ? 'shake wrong-flash' : ''} ${showCorrect ? 'correct-flash' : ''}`}
              onClick={() => handleChoice(opt)}
              style={S.reactionBtn}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', padding: '0 20px', maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column' },
  bar: { height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, margin: '10px 0 20px', overflow: 'hidden' },
  barIn: { height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' },
  content: { flex: 1, display: 'flex', flexDirection: 'column' },
  
  // Standard Card
  cardArea: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1000, margin: '40px 0' },
  cardWrap: { width: '100%', height: 320, position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.6s' },
  face: { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  front: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' },
  back: { background: 'rgba(0, 240, 255, 0.05)', border: '1px solid var(--accent)', transform: 'rotateY(180deg)' },
  badge: { fontSize: 11, fontWeight: 900, opacity: 0.5, marginBottom: 20, letterSpacing: 1 },
  word: { fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 12 },
  translation: { fontSize: 28, fontWeight: 900, color: 'var(--green)', marginBottom: 12 },
  hint: { fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 },
  tap: { position: 'absolute', bottom: 24, fontSize: 11, opacity: 0.3 },

  // Phrase Flow
  introCard: { padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  contextBadge: { background: 'var(--accent)', color: 'black', fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase' },
  phraseText: { fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' },
  translationSmall: { fontSize: 18, fontWeight: 700, color: 'var(--green)' },
  hintItalic: { fontStyle: 'italic', fontSize: 14, opacity: 0.7 },
  substitutionCard: { padding: 40, textAlign: 'center', border: '2px dashed var(--accent)', background: 'rgba(0, 240, 255, 0.05)' },
  selectedChoice: { background: 'var(--accent)', color: '#000', borderColor: 'var(--accent)', fontWeight: 900 },
  reactionBtn: { padding: '16px 20px', textAlign: 'left', fontSize: 16, fontWeight: 700, color: 'var(--text)', transition: 'all 0.2s' },

  // Done Screen
  doneContainer: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 },
  doneTitle: { fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-display)' },
  dim: { color: 'var(--text-dim)', fontSize: 16 },
  xpBadge: { background: 'var(--accent-gradient)', padding: '10px 24px', borderRadius: 30, fontWeight: 900, fontSize: 20, marginTop: 10, boxShadow: '0 10px 30px var(--accent-glow)' },
};
