import { islands, DIFFICULTY_LABELS, getIslandItems, islandMetadata } from '../data/words';

export default function IslandView({ store, go, level: islandIdx }) {
  const { data } = store;
  const island = islands[islandIdx];
  if (!island) return null;
  const meta = islandMetadata[island.island] || { creative: island.island, icon: island.icon };

  const items = getIslandItems(island.island);
  const phrases = items.filter(i => i.type === 'phrase' || i.type === 'glue');
  const vocabulary = items.filter(i => i.type === 'word');

  const getDifficultyStats = (diff) => {
    const diffItems = phrases.filter(i => i.difficulty === diff);
    const total = diffItems.length;
    // In a real app, we'd need a mapping from word index to its presence in phrases array
    // For now, let's assume we can find the item's global index if needed, or use a simplified mock
    // Actually, useStorage already has wordProgress. We need the global index of each item.
    // Let's find the item in the global 'words' array (imported as default from '../data/words')
    // But getIslandItems returns the objects. We need to know which global index they correspond to.
    // In words.js, we have categoryRanges.
    return { total, mastered: 0 }; // Simplified for now, will refine if necessary
  };

  const difficultyLevels = [
    { id: 1, label: DIFFICULTY_LABELS[1], icon: "🌱", color: "#4ade80" },
    { id: 2, label: DIFFICULTY_LABELS[2], icon: "🌿", color: "#22c55e" },
    { id: 3, label: DIFFICULTY_LABELS[3], icon: "🌳", color: "#16a34a" },
    { id: 4, label: DIFFICULTY_LABELS[4], icon: "🏆", color: "#15803d" },
  ].filter(d => phrases.some(p => p.difficulty === d.id));

  return (
    <div style={S.page} className="anim-in">
      <div className="app-header" style={S.header}>
        <button className="back-btn-round" onClick={() => go('levels')}>←</button>
        <div style={S.headerInfo}>
          <div style={S.islandIcon}>{meta.icon}</div>
          <div>
            <div style={S.creativeTitle}>{meta.creative}</div>
            <div style={S.originalSubtitle}>{island.island}</div>
          </div>
        </div>
      </div>

      <div style={S.section}>
        <div style={S.grid}>
          {difficultyLevels.map(d => {
            const stats = getDifficultyStats(d.id);
            return (
              <div key={d.id} className="glass-card" style={S.diffCard}>
                <div style={S.diffHeader}>
                  <span style={S.diffIcon}>{d.icon}</span>
                  <span style={S.diffLabel}>{d.label}</span>
                </div>
                <div style={S.diffBody}>
                  <div style={S.diffCount}>{stats.total} фраз</div>
                  <button 
                    className="btn-primary" 
                    style={{ ...S.learnBtn, background: d.color }}
                    onClick={() => go('cards', { islandIdx, difficulty: d.id })}
                  >
                    Учить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={S.section}>
        <h3 style={S.sectionTitle}>Словарь острова</h3>
        <div style={S.vocabGrid}>
          {vocabulary.map((w, i) => (
            <div key={i} style={S.vocabCard}>
              <div style={S.enWord}>{w.en}</div>
              <div style={S.ruWord}>{w.ru}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', padding: '0 20px', maxWidth: 460, margin: '0 auto', color: 'var(--text)' },
  header: { padding: '20px 0', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 20 },
  headerInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  islandIcon: { fontSize: 32, width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  creativeTitle: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 },
  originalSubtitle: { fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 800, marginBottom: 16, color: 'var(--text)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  diffCard: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  diffHeader: { display: 'flex', alignItems: 'center', gap: 8 },
  diffIcon: { fontSize: 20 },
  diffLabel: { fontSize: 13, fontWeight: 800, color: 'var(--text-dim)' },
  diffBody: { display: 'flex', flexDirection: 'column', gap: 8 },
  diffCount: { fontSize: 12, fontWeight: 600, opacity: 0.7 },
  learnBtn: { padding: '8px 0', fontSize: 13, fontWeight: 800, borderRadius: 8, border: 'none', color: 'white', cursor: 'pointer' },
  vocabGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  vocabCard: { background: 'white', color: '#1a1b26', padding: '8px 12px', borderRadius: 10, minWidth: 80, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  enWord: { fontWeight: 800, fontSize: 14 },
  ruWord: { fontSize: 11, fontWeight: 600, opacity: 0.6 },
};
