import { useState, useEffect } from 'react';
import { LEVELS, TOTAL_WORDS, LEVEL_NAMES } from '../data/words';
import { tts } from '../utils/tts';

export default function Home({ store, go }) {
  const { data, learned, untestedCount, level, rankTitle } = store;
  const [potd, setPotd] = useState(null);

  // Phrase of the Day logic
  useEffect(() => {
    const lastDate = localStorage.getItem('potd_date');
    const today = new Date().toISOString().slice(0, 10);
    const savedPotd = localStorage.getItem('potd_phrase');

    if (lastDate === today && savedPotd) {
      setPotd(JSON.parse(savedPotd));
    } else {
      const allPhrases = (LEVELS || []).flatMap((items, lvlIdx) => 
        (items || []).filter(p => p && p.type === 'phrase').map(p => ({ ...p, lvlIdx }))
      );
      const unmastered = allPhrases.filter(p => {
        const progress = data.wordProgress[p.en];
        return !progress || !progress.mastered;
      });
      const source = unmastered.length > 0 ? unmastered : allPhrases;
      const picked = source[Math.floor(Math.random() * source.length)];
      localStorage.setItem('potd_date', today);
      localStorage.setItem('potd_phrase', JSON.stringify(picked));
      setPotd(picked);
    }
  }, [data.wordProgress]);

  const learnedCount = Object.values(data.wordProgress).filter(w => w.seen || w.mastered).length;
  const masteredCount = Object.values(data.wordProgress).filter(w => w.mastered).length;
  const pct = Math.round((learnedCount / TOTAL_WORDS) * 100);

  const nextLevel = (() => {
    const unlocked = [...(data.unlockedLevels || [0])].sort((a, b) => a - b);
    const unpassed = unlocked.filter(l => !(data.passedLessons || []).includes(l));
    if (unpassed.length > 0) return data.lastActiveLevel !== undefined && unpassed.includes(data.lastActiveLevel) ? data.lastActiveLevel : unpassed[0];
    return unlocked.length > 0 ? unlocked[unlocked.length - 1] : 0;
  })();

  const now = Date.now();
  const dueCount = Object.values(data.wordProgress).filter(w => (w.seen || w.mastered) && (w.nextReview || 0) <= now).length;
  const showExamBanner = untestedCount >= 5;

  return (
    <div style={S.page} className="anim-in">
      <div style={S.header}>
        <div style={S.greeting}>
          <div style={S.brandSub}>VOCABFLAME</div>
          <div style={S.brandMain}>Говорю свободно 🗣️</div>
        </div>
        <div style={S.headerR}>
          <div style={S.coins}><span style={S.coinIcon}>💰</span> {data.coins}</div>
          <button style={S.settingsBtn} onClick={() => go('settings')}>⚙️</button>
        </div>
      </div>

      <div style={S.userRow} className="anim-up">
        <div style={S.avatar}>
          <div style={S.avatarInner}>{data.username?.[0]?.toUpperCase() || '👤'}</div>
          <div style={S.lvlBadge}>{level}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={S.userName}>{data.username}</div>
          <div style={S.rankTitle}>{rankTitle}</div>
        </div>
        <div style={S.streakBox}>
          <span style={{ filter: data.streak <= 1 ? 'grayscale(1)' : 'none' }}>🔥</span>
          <span>{data.streak}</span>
        </div>
      </div>

      {potd && (
        <div style={S.potdCard} className="glass-card anim-pop" onClick={() => tts(potd.en)}>
          <div style={S.potdLabel}>💡 ФРАЗА ДНЯ</div>
          <div style={S.potdEn}>{potd.en}</div>
          <div style={S.potdRu}>{potd.ru}</div>
          <div style={S.potdCtx}>"{potd.context}"</div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <button className="btn-primary btn-full shadow-lg" style={{ height: 64, fontSize: 16 }} onClick={() => go('cards', nextLevel)}>
          НАЧАТЬ УРОК 🚀
        </button>
        <div style={S.nextLvlHint}>Уровень {nextLevel + 1}: {LEVEL_NAMES[nextLevel]}</div>
      </div>

      <div style={S.actionGrid}>
        <button style={S.gridBox} className="glass-card" onClick={() => go('levels')}>
          <span style={S.gridEmoji}>🏝️</span>
          <span style={S.gridTitle}>Острова</span>
        </button>
        <button style={S.gridBox} className="glass-card" onClick={() => {
          const unlocked = (data.unlockedLevels || [0]).filter(l => l < LEVELS.length);
          const randomLvl = unlocked[Math.floor(Math.random() * unlocked.length)] || 0;
          go('quiz', { level: randomLvl, type: 'quick' });
        }}>
          <span style={S.gridEmoji}>⚡</span>
          <span style={S.gridTitle}>Тест</span>
        </button>
        <button style={S.gridBox} className="glass-card" onClick={() => go('review')}>
          <div style={{ position: 'relative' }}>
            <span style={S.gridEmoji}>🔄</span>
            {dueCount > 0 && <div style={S.gridBadge}>{dueCount}</div>}
          </div>
          <span style={S.gridTitle}>Повтор</span>
        </button>
        <button style={S.gridBox} className="glass-card" onClick={() => go('dialogue')}>
          <span style={S.gridEmoji}>💬</span>
          <span style={S.gridTitle}>Диалог</span>
        </button>
        <button style={S.gridBox} className="glass-card" onClick={() => go('glue')}>
          <span style={S.gridEmoji}>🧩</span>
          <span style={S.gridTitle}>Клей</span>
        </button>
        <button style={S.gridBox} className="glass-card" onClick={() => go('settings')}>
          <span style={S.gridEmoji}>⚙️</span>
          <span style={S.gridTitle}>Опции</span>
        </button>
      </div>

      {showExamBanner && (
        <button style={S.examBanner} className="anim-up" onClick={() => go('levelExam')}>
          <span style={{ fontSize: 24 }}>📝</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--yellow)' }}>ЭКЗАМЕН ДОСТУПЕН!</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Сдай тест чтобы открыть новые острова</div>
          </div>
        </button>
      )}

      <div style={{ ...S.card, marginTop: 20 }} className="glass-card">
        <div style={S.label}>ВАШ ПРОГРЕСС</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0' }}>
          <span style={S.bigNum}>{learnedCount}</span>
          <span style={S.dimText}>из {TOTAL_WORDS} фраз</span>
        </div>
        <div style={S.barOuter}><div style={{ ...S.barInner, width: `${Math.max(pct, 1)}%` }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <div style={S.dimText}>{pct}% освоено</div>
          <div style={S.dimText}>🌟 {masteredCount} мастер</div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', padding: '16px 20px 40px', maxWidth: 460, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { display: 'flex', flexDirection: 'column' },
  brandSub: { fontSize: 9, fontWeight: 900, color: 'var(--accent)', letterSpacing: 2, opacity: 0.7 },
  brandMain: { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, marginTop: -2 },
  headerR: { display: 'flex', gap: 10, alignItems: 'center' },
  coins: { display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: 13, fontWeight: 800, background: 'rgba(255,215,0,0.1)', borderRadius: 20, color: '#ffd700' },
  coinIcon: { fontSize: 14 },
  settingsBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer' },
  userRow: { display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 20 },
  avatar: { position: 'relative' },
  avatarInner: { width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: 'black' },
  lvlBadge: { position: 'absolute', bottom: -2, right: -2, background: 'var(--yellow)', color: 'black', width: 18, height: 18, borderRadius: '50%', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)' },
  userName: { fontSize: 16, fontWeight: 800 },
  rankTitle: { fontSize: 11, color: 'var(--yellow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 },
  streakBox: { padding: '6px 10px', background: 'rgba(255,107,53,0.1)', borderRadius: 12, display: 'flex', gap: 4, alignItems: 'center', fontSize: 14, fontWeight: 800, color: '#ff6b35' },
  potdCard: { padding: 20, marginBottom: 20, border: '1px solid rgba(0, 240, 255, 0.2)', cursor: 'pointer', transition: '0.2s' },
  potdLabel: { fontSize: 9, fontWeight: 900, color: 'var(--accent)', letterSpacing: 1.5, marginBottom: 8 },
  potdEn: { fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 },
  potdRu: { fontSize: 14, color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: 8 },
  potdCtx: { fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 },
  nextLvlHint: { textAlign: 'center', fontSize: 12, color: 'var(--text-dim)', marginTop: 8, fontWeight: 600 },
  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 },
  gridBox: { padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', transition: '0.2s' },
  gridEmoji: { fontSize: 24 },
  gridTitle: { fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 },
  gridBadge: { position: 'absolute', top: -8, right: -8, background: 'var(--red)', color: 'white', borderRadius: '50%', minWidth: 16, height: 16, fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  examBanner: { width: '100%', padding: '12px 16px', marginBottom: 20, border: '1px solid rgba(255, 51, 102, 0.3)', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text)', background: 'rgba(255, 51, 102, 0.05)', borderRadius: 16 },
  card: { padding: 20 },
  label: { fontSize: 10, color: 'var(--accent)', fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' },
  bigNum: { fontSize: 32, fontWeight: 900 },
  dimText: { color: 'var(--text-dim)', fontWeight: 600 },
  barOuter: { height: 6, background: 'rgba(0,0,0,0.3)', borderRadius: 3, overflow: 'hidden', margin: '4px 0' },
  barInner: { height: '100%', borderRadius: 3, background: 'var(--accent-gradient)' },
};
