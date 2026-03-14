import { useState, useEffect } from 'react';
import allWords from '../data/words';
import { tts } from '../utils/tts';
import { sfx } from '../utils/sfx';

function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

export default function Review({ store, go }) {
  const [qs, setQs] = useState([]);
  const [cur, setCur] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const now = Date.now();
    const wp = store.data.wordProgress;
    
    const due = Object.entries(wp)
      .filter(([_, w]) => (w.seen || w.mastered) && (w.nextReview || 0) <= now)
      .map(([idx]) => parseInt(idx));

    if (due.length > 0) {
      const selectedIndices = shuffle(due).slice(0, 12);
      const toReview = selectedIndices.map(i => {
        const word = allWords[i];
        return word ? { word, wordIdx: i } : null;
      }).filter(Boolean);
      setQs(shuffle(toReview));
    }
    setInitialized(true);
  }, [store.data.wordProgress]);

  const isDone = initialized && cur >= qs.length;
  const q = qs[cur];

  const handleShowAnswer = () => {
    setShowAnswer(true);
    if (q?.word) tts(q.word.en);
  };

  const handleResult = (ok) => {
    if (ok) sfx.success();
    else sfx.error();
    store.recordResult(q.wordIdx, ok);
    setCur(c => c + 1);
    setShowAnswer(false);
  };

  if (!initialized) return null;

  if (qs.length === 0) {
    return (
      <div style={S.page}>
        <Hdr go={go} />
        <div style={S.center} className="anim-up">
          <div style={{ fontSize: 64 }}>🎉</div>
          <div style={S.t}>Всё повторено!</div>
          <div style={S.dim}>Возвращайся завтра за новыми фразами</div>
          <button className="btn-primary" style={{ marginTop: 24, minWidth: 200 }} onClick={() => go('home')}>🏠 На главную</button>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div style={S.page}>
        <Hdr go={go} />
        <div style={S.center} className="anim-up">
          <div style={{ fontSize: 64 }}>🏆</div>
          <div style={S.t}>Отлично сработано!</div>
          <div style={S.dim}>Ты повторил {qs.length} фраз</div>
          <button className="btn-primary" style={{ marginTop: 24, minWidth: 200 }} onClick={() => go('home')}>Ура! 🎉</button>
        </div>
      </div>
    );
  }

  const pct = (cur / qs.length) * 100;

  return (
    <div style={S.page} className="anim-in">
      <Hdr go={go} title={`${qs.length - cur} на повторение`} />
      <div style={S.bar}><div style={{ ...S.barIn, width: `${pct}%` }} /></div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 60 }}>
        <div key={cur} className="glass-card anim-pop" style={S.cardMain}>
          <div style={S.contextBadge}>{q.word.context || 'Ситуация'}</div>
          <div style={S.ruText}>{q.word.ru}</div>
          
          {showAnswer && (
            <div className="anim-up" style={S.answerBox}>
              <div style={S.enText}>{q.word.en}</div>
              <div style={S.hintText}>{q.word.hint}</div>
              <button style={S.speakerBtn} onClick={() => tts(q.word.en)}>🔊</button>
            </div>
          )}
        </div>

        {!showAnswer ? (
          <button className="btn-primary btn-full shadow-lg" style={{ height: 60, fontSize: 18 }} onClick={handleShowAnswer}>
            Показать ответ →
          </button>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <button className="btn-ghost" style={S.btnWrong} onClick={() => handleResult(false)}>
               Не помню ❌
            </button>
            <button className="btn-primary" style={S.btnOk} onClick={() => handleResult(true)}>
               Помню ✅
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Hdr({ go, title }) {
  return (
    <div className="app-header">
      <button className="back-btn-round" onClick={() => go('home')}>←</button>
      <div className="header-title">{title || '🔄 Повторение'}</div>
      <div className="header-right"></div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', padding: 20, maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column', zIndex: 1, position: 'relative' },
  bar: { height: 6, background: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden', marginBottom: 24, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' },
  barIn: { height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, var(--yellow), var(--accent))', transition: 'width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)', boxShadow: '0 0 10px rgba(255, 215, 0, 0.6)' },
  center: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 },
  t: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' },
  dim: { color: 'var(--text-dim)', fontSize: 16, fontWeight: 600 },
  cardMain: { padding: '40px 24px', textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, minHeight: 280, justifyContent: 'center' },
  contextBadge: { fontSize: 11, fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1.5, background: 'rgba(0, 240, 255, 0.1)', padding: '4px 12px', borderRadius: 20 },
  ruText: { fontSize: 24, fontWeight: 800, color: 'var(--text)' },
  answerBox: { width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  enText: { fontSize: 28, fontWeight: 900, color: 'var(--yellow)', fontFamily: 'var(--font-display)' },
  hintText: { fontSize: 16, color: 'var(--text-muted)', fontStyle: 'italic' },
  speakerBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 50, height: 50, fontSize: 20, cursor: 'pointer', transition: '0.2s' },
  btnOk: { height: 60, fontSize: 16, fontWeight: 800, background: 'var(--green)', color: 'black' },
  btnWrong: { height: 60, fontSize: 16, fontWeight: 800, background: 'rgba(255, 51, 102, 0.1)', border: '1px solid var(--red)', color: 'var(--red)' },
};
