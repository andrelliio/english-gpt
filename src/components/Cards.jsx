import { useState, useEffect, useMemo } from 'react';
import allWords, { islands, DIFFICULTY_LABELS, getIslandItems, getSimilarWords, islandMetadata } from '../data/words';
import { tts } from '../utils/tts';
import { sfx } from '../utils/sfx';
import confetti from 'canvas-confetti';

function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

export default function Cards({ store, go, level }) {
  const { data } = store;
  
  // Parse level: can be a number (global level) or an object { islandIdx, difficulty }
  const isIslandMode = typeof level === 'object' && level !== null;
  const islandIdx = isIslandMode ? level.islandIdx : null;
  const difficulty = isIslandMode ? level.difficulty : null;

  const [allCards, setAllCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(1); // 1, 2, or 3
  const [flipped, setFlipped] = useState(false); // only for type: "word"
  const [choiceState, setChoiceState] = useState(null); // { selectedId, correctId, isCorrect, showFeedback }
  const [sessionResults, setSessionResults] = useState(null);
  const [shake, setShake] = useState(false); // For incorrect answers

  // Initialize cards
  useEffect(() => {
    let filtered = [];
    if (isIslandMode) {
      const island = islands[islandIdx];
      const items = island.items.filter(i => !difficulty || i.difficulty === difficulty);
      // Find global indices for tracking
      filtered = items.map(item => {
        const globalIdx = allWords.findIndex(w => w.en === item.en && w.ru === item.ru);
        return { word: item, globalIdx };
      });
    } else {
      // Classic mode
      const WORDS_PER_LEVEL = 10;
      const base = level * WORDS_PER_LEVEL;
      const words = allWords.slice(base, base + WORDS_PER_LEVEL);
      filtered = words.map((w, i) => ({ word: w, globalIdx: base + i }));
    }

    if (filtered.length === 0) {
      go('levels');
      return;
    }
    
    setAllCards(filtered);
    setIdx(0);
    setStep(1);
  }, [level, islandIdx, difficulty]);

  const current = allCards[idx];
  const isPhrase = current ? (current.word.type === 'phrase' || current.word.type === 'glue') : false;

  // --- STEP GENERATORS (Memoized) ---
  // Hooks MUST be called before any early returns

  const step2Options = useMemo(() => {
    if (!current || !isPhrase || step !== 2) return [];
    const word = current.word;
    const islandItems = getIslandItems(word.island).filter(i => i.type === 'word');
    const pool = islandItems.length >= 3 ? islandItems : allWords.filter(w => w.type === 'word');
    const alternatives = shuffle(pool).slice(0, 3).map(i => i.en);
    return shuffle([word.en, ...alternatives]);
  }, [idx, step, allCards.length]);

  const step3Options = useMemo(() => {
    if (!current || !isPhrase || step !== 3) return [];
    const word = current.word;
    const wrong = getSimilarWords(current.globalIdx, 2, word.ru);
    return shuffle([{ text: word.ru, correct: true }, ...wrong.map(w => ({ text: w, correct: false }))]);
  }, [idx, step, allCards.length]);

  if (!current) return null;

  const word = current.word;
  const meta = islandMetadata[word.island] || { creative: word.island, icon: word.islandIcon || '🏝️' };

  // --- LOGIC FOR STEPS ---

  const handleNext = (isCorrect = true) => {
    if (!isPhrase) {
      store.markSeen(current.globalIdx);
      moveToNextCard();
    } else {
      if (isCorrect) {
        sfx.success();
        if (step < 3) {
          setStep(step + 1);
          setChoiceState(null);
        } else {
          store.markSeen(current.globalIdx);
          store.update(p => ({ ...p, xp: p.xp + 5 }));
          moveToNextCard();
        }
      } else {
        sfx.error();
        setShake(true);
        setTimeout(() => setShake(false), 500); // Reset shake after animation
      }
    }
  };

  const moveToNextCard = () => {
    if (idx + 1 >= allCards.length) {
      setSessionResults({ xp: allCards.length * 5, count: allCards.length });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      setIdx(idx + 1);
      setStep(1);
      setFlipped(false);
      setChoiceState(null);
    }
  };

  // --- RENDER HELPERS ---

  if (sessionResults) {
    return (
      <div style={S.page} className="anim-in">
        <div style={S.doneContainer}>
          <div style={{ fontSize: 64 }}>🎉</div>
          <h2 style={S.doneTitle}>Отлично!</h2>
          <p style={S.dim}>Вы изучили {sessionResults.count} элементов</p>
          <div style={S.xpBadge}>+{sessionResults.xp} XP</div>
          <button className="btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={() => go('levels')}>К островам</button>
        </div>
      </div>
    );
  }

  const progressPct = ((idx + (isPhrase ? (step - 1) / 3 : 0)) / allCards.length) * 100;

  return (
    <div style={S.page} className="anim-in">
      {/* Header */}
      <div className="app-header">
        <button className="back-btn-round" onClick={() => go('islandView', islandIdx)}>✕</button>
        <div className="header-title" style={{ textAlign: 'center' }}>
          <span style={{ opacity: 0.6, fontSize: 12 }}>{meta.creative}</span>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{idx + 1} из {allCards.length}</div>
        </div>
        <div style={{ width: 40 }} /> {/* Spacer */}
      </div>

      {/* Progress Bar */}
      <div style={S.bar}>
        <div style={{ ...S.barIn, width: `${progressPct}%` }} />
      </div>

      {/* Step Indicator (for phrases) */}
      {isPhrase && (
        <div className="step-indicator">
          {[1, 2, 3].map(s => (
            <div key={s} className={`step-dot ${s <= step ? 'active' : ''}`} />
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div style={S.content}>
        {!isPhrase ? (
          <StandardCard word={word} flipped={flipped} onFlip={() => { setFlipped(!flipped); tts.speak(word.en); }} />
        ) : (
          <div className="phrase-step-container">
            {step === 1 && <Step1Intro word={word} meta={meta} onNext={handleNext} />}
            {step === 2 && <Step2Substitution word={word} options={step2Options} onCorrect={handleNext} />}
            {step === 3 && <Step3Reaction word={word} options={step3Options} onComplete={handleNext} />}
          </div>
        )}
      </div>

      {/* Footer Controls (only for step 1 or words) */}
      {(step === 1 || !isPhrase) && (
        <div className="btn-row" style={{ marginTop: 'auto', paddingBottom: 20 }}>
          {!isPhrase ? (
            <button className="btn-primary btn-flex" onClick={handleNext}>Далее →</button>
          ) : (
            <button className="btn-primary btn-flex" onClick={handleNext}>Понятно →</button>
          )}
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

function Step1Intro({ word, meta, onNext }) {
  // Generate simple dialogue if example is missing
  const dialogue = word.example ? word.example.split('\n') : [
    `— How are you?`,
    `— ${word.en}`,
    `— Nice to hear that!`
  ];

  return (
    <div className="anim-in">
      <div className="glass-card" style={S.introCard}>
        <div style={S.contextBadge}>{word.context || meta.creative}</div>
        <div style={S.phraseText}>{word.en}</div>
        <div style={S.translationSmall}>{word.ru}</div>
        <div style={S.hintItalic}>{word.hint}</div>
        <button className="tts-btn" onClick={() => tts.speak(word.en)}>🔊 Слушать</button>
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

function Step2Substitution({ word, options, onCorrect }) {
  const [selected, setSelected] = useState(null);
  
  const handleSelect = (opt) => {
    setSelected(opt);
    tts.speak(opt);
    setTimeout(onCorrect, 1000);
  };

  return (
    <div className="anim-in">
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Как еще можно сказать?</h3>
        <p style={S.dim}>Фразы гибкие — попробуй другие варианты</p>
      </div>

      <div className="glass-card" style={S.substitutionCard}>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>
          {selected || '...'}
        </div>
      </div>

      <div className="choice-grid" style={{ marginTop: 24 }}>
        {options.map((opt, i) => (
          <button 
            key={i} 
            className="glass-card choice-btn" 
            style={{ 
              ...(selected === opt ? S.selectedChoice : {}),
              fontWeight: 800,
              fontSize: '15px',
              color: selected === opt ? '#000' : 'var(--text)'
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
    if (ctx.includes('представит')) return 'Nice to meet you! Who are you?';
    if (ctx.includes('привет') || ctx.includes('начать')) return 'Hey! How are things?';
    if (ctx.includes('прощ')) return 'Great talking to you! See you!';
    if (ctx.includes('ответить')) return 'How are you today?';
    if (ctx.includes('узнать')) return 'I have a question for you...';
    return '...';
  }, [word.context]);

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
          Ситуация: {word.context || 'Разговор'}
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
