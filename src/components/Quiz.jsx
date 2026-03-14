import { useState, useEffect } from 'react';
import { LEVELS, LEVEL_NAMES, WORDS_PER_LEVEL, getSimilarWords } from '../data/words';
import confetti from 'canvas-confetti';
import { sfx } from '../utils/sfx';

function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

export default function Quiz({ store, go, level, type = 'normal' }) {
  const words = LEVELS[level] || [];
  const base = level * WORDS_PER_LEVEL;
  const [qs, setQs] = useState([]);
  const [cur, setCur] = useState(0);
  const [sel, setSel] = useState(null);
  const [ok, setOk] = useState(0);
  const [bad, setBad] = useState(0);
  const [done, setDone] = useState(false);
  const [xp, setXp] = useState(0);
  const [mode, setMode] = useState(type === 'quick' ? 'mixed' : 'words'); // 'words', 'situations', 'mixed'

  useEffect(() => {
    store.touchLevel(level);
    
    // Reset state
    setCur(0); setSel(null); setOk(0); setBad(0); setDone(false); setXp(0);

    // 1. Gather pool
    const levelItems = words.map((w, i) => ({ word: w, globalIdx: base + i }));
    
    // Mix in reviews
    const reviewPool = [];
    Object.entries(store.data.wordProgress).forEach(([idx, wp]) => {
      const gIdx = parseInt(idx);
      if (wp.seen && (gIdx < base || gIdx >= base + WORDS_PER_LEVEL)) {
        reviewPool.push(gIdx);
      }
    });
    
    const selectedReviews = shuffle(reviewPool).slice(0, 5).map(gIdx => {
      const lvl = Math.floor(gIdx / WORDS_PER_LEVEL);
      const lIdx = gIdx % WORDS_PER_LEVEL;
      const word = LEVELS[lvl] ? LEVELS[lvl][lIdx] : null;
      return word ? { word, globalIdx: gIdx } : null;
    }).filter(Boolean);

    let pool = [...levelItems, ...selectedReviews];

    // 2. Filter by mode
    if (mode === 'situations') {
      pool = pool.filter(item => item.word.type === 'phrase' || item.word.type === 'glue');
      // If pool too small, fallback to some phrases from other levels
      if (pool.length < 5) {
        const anyPhrases = LEVELS.flat().filter(w => w.type === 'phrase').slice(0, 10);
        pool = [...pool, ...anyPhrases.map(w => ({ word: w, globalIdx: -1 }))];
      }
    } else if (mode === 'words') {
      pool = pool.filter(item => item.word.type === 'word');
    }

    const questions = shuffle(pool).slice(0, 12).map(item => {
      const { word, globalIdx } = item;
      const isSit = mode === 'situations' || (mode === 'mixed' && (word.type === 'phrase' || word.type === 'glue'));
      
      const qText = isSit ? (word.context || word.ru) : word.en;
      const correctAns = isSit ? word.en : word.ru;
      
      // Get similar words in the correct language
      const wrongs = getSimilarWords(globalIdx, 3, correctAns, isSit ? 'en' : 'ru');

      return { 
        word, 
        globalIdx, 
        isSit,
        qText,
        options: shuffle([...wrongs, correctAns]), 
        answer: correctAns 
      };
    });
    setQs(questions);
  }, [level, mode]);

  // Find next uncompleted level (among unlocked)
  const getNextLevel = () => {
    const unlocked = [...store.data.unlockedLevels].sort((a, b) => a - b);
    for (const l of unlocked) {
      if (l >= LEVELS.length) continue;
      if (!store.data.passedLessons.includes(l)) return l;
    }
    return null;
  };

  const handleNextTask = () => {
    const nextLvl = getNextLevel();
    if (nextLvl !== null) {
      go('cards', nextLvl);
    } else {
      sfx.error();
      go('home');
    }
  };

  // Completion logic moved to useEffect to avoid stale closures
  useEffect(() => {
    if (done) {
      const acc = Math.round((ok / qs.length) * 100);
      if (acc >= 50) store.completeLevel(level);
      if (acc >= 70) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00F0FF', '#00FF87', '#FFD700'] });
      }
    }
  }, [done]);

  const next = (force = false) => {
    if (!force && sel === null) return; 
    setCur(prev => {
      if (prev + 1 >= qs.length) {
        setDone(true);
        return prev;
      }
      setSel(null); // This is fine here, it will trigger after render
      return prev + 1;
    });
  };

  if (!qs.length) return null;

  if (done) {
    const total = ok + bad;
    const acc = total ? Math.round((ok / total) * 100) : 0;
    const emoji = acc >= 90 ? '🏆' : acc >= 70 ? '🎉' : acc >= 50 ? '💪' : '📚';
    return (
      <div style={S.page}>
        <Hdr go={go} title="Результат" />
        <div style={S.center} className="anim-up">
          <div style={{ fontSize: 56 }}>{emoji}</div>
          <div style={S.doneTitle}>{acc >= 90 ? 'Превосходно!' : acc >= 70 ? 'Отлично!' : acc >= 50 ? 'Хорошо!' : 'Нужна практика'}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 900, color: acc >= 70 ? 'var(--green)' : acc >= 50 ? 'var(--yellow)' : 'var(--red)', filter: `drop-shadow(0 0 15px ${acc >= 70 ? 'var(--green-glow)' : acc >= 50 ? 'var(--yellow-glow)' : 'var(--pink-glow)'})` }}>{acc}%</div>
          <div style={S.dim}>✅ {ok}  ❌ {bad}</div>
          <div style={{ color: 'var(--yellow)', fontWeight: 700, marginBottom: 16 }}>+{xp} XP</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
            <button className="btn-primary btn-full" onClick={handleNextTask}>Следующее задание ➡️</button>
            <div className="btn-row">
              <button className="btn-ghost btn-flex" onClick={() => go('home')}>🏠 Домой</button>
              <button className="btn-ghost btn-flex" onClick={() => { setCur(0); setSel(null); setOk(0); setBad(0); setDone(false); setXp(0); setQs(shuffle(qs)); }}>🔄 Ещё раз</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = qs[cur];
  const pct = ((cur + 1) / qs.length) * 100;
  const answered = sel !== null;

  const pick = (opt) => {
    if (answered) return;
    setSel(opt);
    const correct = opt === q.answer;

    if (navigator.vibrate) {
      navigator.vibrate(correct ? 20 : 100);
    }

    store.recordResult(q.globalIdx, correct);
    if (correct) { 
      sfx.success();
      setOk(o => o + 1); 
      setXp(x => x + 10);
      // Auto-next on correct - lightning fast
      setTimeout(() => next(true), 50);
    }
    else { setBad(b => b + 1); setXp(x => x + 2); }
  };

  return (
    <div style={S.page} className="anim-in">
      <div className="app-header">
        <button className="back-btn-round" onClick={() => go('home')}>←</button>
        <div style={S.toggleBox}>
          <button 
            style={{ ...S.toggleBtn, ...(mode === 'words' ? S.toggleActive : {}) }}
            onClick={() => setMode('words')}
          >
            Слова
          </button>
          <button 
            style={{ ...S.toggleBtn, ...(mode === 'situations' ? S.toggleActive : {}) }}
            onClick={() => setMode('situations')}
          >
            Ситуации
          </button>
        </div>
        <div className="header-right">{cur + 1}/{qs.length}</div>
      </div>

      <div style={S.bar}><div style={{ ...S.barIn, width: `${pct}%`, background: bad > ok ? 'linear-gradient(90deg, var(--red), #fb923c)' : 'linear-gradient(90deg, var(--green), #2dd4bf)' }} /></div>

      <div style={S.score}>
        <span style={{ color: 'var(--green)' }}>✅ {ok}</span>
        <span style={{ color: 'var(--red)' }}>❌ {bad}</span>
      </div>

      {q.isSit ? (
        <div style={{ ...S.questionBox, flexDirection: 'column', gap: 14, minHeight: 160 }} key={cur} className="anim-pop">
           <div style={S.sitContext}>Ситуация: {q.word.context}</div>
           <div className="bubble-container" style={{ width: '100%' }}>
              <div className="bubble bubble-left" style={{ margin: 0, maxWidth: '100%', fontSize: 18, fontWeight: 700, padding: '12px 20px' }}>
                — {q.word.ru}
              </div>
           </div>
        </div>
      ) : (
        <div style={S.questionBox} key={cur} className="glass-card anim-pop">
          <div style={S.enWord}>{q.qText}</div>
        </div>
      )}
      
      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 14 }}>
        {q.isSit ? 'Как ты это скажешь?' : 'Выбери правильный перевод'}
      </div>

      <div style={S.opts}>
        {q.options.map((opt, i) => {
          let style = { ...S.opt };
          if (answered) {
            if (opt === q.answer) style = { ...style, ...S.optOk };
            else if (opt === sel) style = { ...style, ...S.optBad };
            else style = { ...style, opacity: 0.35 };
          }
          return (
            <button key={i} style={{ ...style, fontSize: opt.length > 25 ? 14 : 16 }} onClick={() => pick(opt)}
              className={answered && opt === sel && opt !== q.answer ? 'anim-shake' : ''}
              onMouseEnter={e => { if (!answered) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
              onMouseLeave={e => { if (!answered) { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; } }}>
              {opt}
            </button>
          );
        })}
      </div>

      {answered && sel !== q.answer && (
        <button className="btn-primary btn-full anim-in" style={{ marginTop: 14 }} onClick={next}>
          {cur + 1 >= qs.length ? 'Результаты →' : 'Далее →'}
        </button>
      )}
    </div>
  );
}

function Hdr({ go, title, right }) {
  return (
    <div className="app-header">
      <button className="back-btn-round" onClick={() => go('home')}>←</button>
      <div className="header-title">{title}</div>
      {right && <div className="header-right">{right}</div>}
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', padding: 20, maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column', zIndex: 1, position: 'relative' },
  backBtn: { color: 'var(--text-dim)', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  bar: { height: 6, background: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden', marginBottom: 20, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' },
  barIn: { height: '100%', borderRadius: 4, transition: 'width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)', boxShadow: '0 0 10px var(--accent-glow)' },
  score: { display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20, fontSize: 16, fontWeight: 800 },
  questionBox: { padding: '32px 20px', textAlign: 'center', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  enWord: { fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.5)' },
  opts: { display: 'flex', flexDirection: 'column', gap: 12, flex: 1 },
  opt: { padding: '16px 20px', borderRadius: 'var(--radius)', fontSize: 16, fontWeight: 700, background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', backdropFilter: 'blur(10px)' },
  optOk: { background: 'rgba(0, 255, 135, 0.15)', border: '1px solid var(--green)', color: 'var(--green)', boxShadow: '0 0 15px rgba(0, 255, 135, 0.2)' },
  optBad: { background: 'rgba(255, 51, 102, 0.15)', border: '1px solid var(--red)', color: 'var(--red)', boxShadow: '0 0 15px rgba(255, 51, 102, 0.2)' },
  center: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 },
  doneTitle: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' },
  toggleBox: { display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 2, border: '1px solid rgba(255,255,255,0.1)' },
  toggleBtn: { padding: '4px 12px', borderRadius: 18, border: 'none', background: 'transparent', color: 'var(--text-dim)', fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: '0.2s' },
  toggleActive: { background: 'var(--accent)', color: 'black', boxShadow: '0 0 10px var(--accent-glow)' },
  sitContext: { fontSize: 11, fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 },
};
