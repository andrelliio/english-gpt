import { useState, useEffect } from 'react';
import { glueExercises } from '../data/glueExercises';
import confetti from 'canvas-confetti';

function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

export default function GlueTrainer({ store, go }) {
  const [qs, setQs] = useState([]);
  const [cur, setCur] = useState(0);
  const [sel, setSel] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [wrongId, setWrongId] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = () => {
    const selected = shuffle(glueExercises).slice(0, 10);
    setQs(selected);
    setCur(0);
    setSel(null);
    setAnswered(false);
    setDone(false);
  };

  const q = qs[cur];

  useEffect(() => {
    if (qs.length > 0 && cur === qs.length && !done) {
      setDone(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      store.update(prev => ({ xp: prev.xp + 15 }));
    }
  }, [cur, qs.length, done]);

  const handlePick = (opt) => {
    if (answered) return;
    setSel(opt);
    setAnswered(true);

    if (opt !== q.answer) {
      setWrongId(opt);
      if (navigator.vibrate) navigator.vibrate(100);
    }
  };

  const next = () => {
    setCur(prev => prev + 1);
    setSel(null);
    setAnswered(false);
    setWrongId(null);
  };

  if (!q && !done) return null;

  if (done) {
    return (
      <div style={S.page} className="anim-in">
        <div style={S.center}>
          <div style={{ fontSize: 64 }}>🧩</div>
          <div style={S.t}>Клей языка: Уровень пройден!</div>
          <div style={S.dim}>Ты освоил {qs.length} связок (+15 XP)</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn-ghost" onClick={() => go('home')}>🏠 Домой</button>
            <button className="btn-primary" onClick={init}>🔄 Ещё раз</button>
          </div>
        </div>
      </div>
    );
  }

  const isGap = q.type === 'gap';
  const progress = (cur / qs.length) * 100;

  return (
    <div style={S.page} className="anim-in">
      <div className="app-header">
        <button className="back-btn-round" onClick={() => go('home')}>←</button>
        <div className="header-title">🧩 Клей языка</div>
        <div className="header-right">{cur + 1}/{qs.length}</div>
      </div>

      <div style={S.bar}><div style={{ ...S.barIn, width: `${progress}%` }} /></div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
        <div className="glass-card anim-pop" style={S.qBox}>
          <div style={S.qType}>{isGap ? 'ВСТАВЬ СВЯЗКУ' : 'НАЧНИ ФРАЗУ'}</div>
          {isGap ? (
            <div style={S.qText}>
              {q.text.split('[gap]').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span style={{ 
                      color: answered ? (sel === q.answer ? 'var(--green)' : 'var(--red)') : 'var(--accent)',
                      borderBottom: '2px dashed',
                      margin: '0 8px',
                      padding: '0 4px',
                      minWidth: 60,
                      display: 'inline-block',
                      textAlign: 'center'
                    }}>
                      {answered ? q.answer : '...'}
                    </span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <div style={S.qTextRu}>{q.ru}</div>
          )}
        </div>

        {answered && isGap && sel === q.answer && (
          <div className="anim-up" style={S.explBox}>
            <div style={S.explTitle}>💡 Подсказка</div>
            <div style={S.explText}>{q.explanation}</div>
          </div>
        )}

        {answered && (sel !== q.answer) && (
          <div className="anim-up" style={S.wrongExpl}>
            Правильный ответ: <span style={{ color: 'var(--green)', fontWeight: 800 }}>{q.answer}</span>
          </div>
        )}

        <div style={S.opts}>
          {q.options.map((opt, i) => {
            const isCorrect = opt === q.answer;
            const isSelected = opt === sel;
            let style = { ...S.opt };
            if (answered) {
              if (isCorrect) style = { ...style, ...S.optOk };
              else if (isSelected) style = { ...style, ...S.optBad };
              else style = { ...style, opacity: 0.4 };
            }

            return (
              <button 
                key={i} 
                style={style} 
                onClick={() => handlePick(opt)}
                className={isSelected && !isCorrect ? 'anim-shake' : ''}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <button className="btn-primary btn-full shadow-lg anim-up" style={{ height: 60, marginTop: 12 }} onClick={next}>
            {cur + 1 < qs.length ? 'Далее →' : 'Завершить 🎉'}
          </button>
        )}
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', padding: 20, maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  bar: { height: 6, background: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden', marginBottom: 24 },
  barIn: { height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--green))', transition: 'width 0.4s' },
  center: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 },
  t: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900 },
  dim: { color: 'var(--text-dim)', fontSize: 16 },
  qBox: { padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid rgba(255,255,255,0.1)' },
  qType: { fontSize: 10, fontWeight: 900, color: 'var(--accent)', letterSpacing: 1.5 },
  qText: { fontSize: 20, fontWeight: 700, lineHeight: 1.4 },
  qTextRu: { fontSize: 22, fontWeight: 800, color: 'var(--text)' },
  opts: { display: 'flex', flexDirection: 'column', gap: 10 },
  opt: { padding: '16px 20px', borderRadius: 'var(--radius)', fontSize: 16, fontWeight: 700, background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', cursor: 'pointer', transition: '0.2s' },
  optOk: { border: '1px solid var(--green)', background: 'rgba(0,255,135,0.1)', color: 'var(--green)' },
  optBad: { border: '1px solid var(--red)', background: 'rgba(255,51,102,0.1)', color: 'var(--red)' },
  explBox: { background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 4 },
  explTitle: { fontSize: 11, fontWeight: 900, color: 'var(--yellow)', textTransform: 'uppercase' },
  explText: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.4 },
  wrongExpl: { textAlign: 'center', fontSize: 14, color: 'var(--text-dim)' }
};
