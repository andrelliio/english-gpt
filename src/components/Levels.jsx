import { islands, categoryRanges, TOTAL_WORDS, islandMetadata } from '../data/words';

export default function Levels({ store, go }) {
  const { data } = store;

  const getIslandStats = (idx) => {
    const range = categoryRanges[idx];
    let mastered = 0;
    for (let i = range.start; i < range.start + range.count; i++) {
      if (data.wordProgress[i]?.mastered) mastered++;
    }
    return { mastered, total: range.count };
  };

  const masteredTotal = Object.values(data.wordProgress || {}).filter(w => w.mastered).length;
  const totalOverallPct = Math.round((masteredTotal / TOTAL_WORDS) * 100);

  const islandsWithStats = islands.map((is, idx) => ({
    ...is,
    idx,
    ...getIslandStats(idx)
  }));

  const firstIncompleteIdx = islandsWithStats.findIndex(is => is.mastered < is.total);

  return (
    <div style={S.page} className="anim-in">
      <style>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(0, 240, 255, 0.4); transform: scale(1); }
          70% { box-shadow: 0 0 0 15px rgba(0, 240, 255, 0); transform: scale(1.05); }
          100% { box-shadow: 0 0 0 0 rgba(0, 240, 255, 0); transform: scale(1); }
        }
        .pulsing { animation: pulse-glow 2s infinite; }
      `}</style>

      <div className="app-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(10, 11, 20, 0.8)', backdropFilter: 'blur(20px)' }}>
        <button className="back-btn-round" onClick={() => go('home')}>←</button>
        <div className="header-title">Острова</div>
      </div>

      <div style={S.pathContainer}>
        {islandsWithStats.map((is, idx) => {
          const meta = islandMetadata[is.island] || { creative: is.island, icon: is.icon };
          const isMastered = is.mastered >= is.total && is.total > 0;
          const isCurrent = idx === firstIncompleteIdx;
          const isLocked = idx > firstIncompleteIdx;
          
          // Zigzag logic: oscillation between -80 and 80 pixels
          const offset = Math.sin(idx * 0.8) * 80;
          const nextOffset = Math.sin((idx + 1) * 0.8) * 80;
          const VERTICAL_STEP = 160;

          return (
            <div key={idx} style={{ ...S.nodeWrapper, height: VERTICAL_STEP, transform: `translateX(${offset}px)` }}>
              <div style={S.centerColumn}>
                <button 
                  style={{ 
                    ...S.node, 
                    ...(isMastered ? S.nodeMastered : isLocked ? S.nodeLocked : S.nodeCurrent)
                  }}
                  className={`glass-card ${isCurrent ? 'pulsing' : ''}`}
                  onClick={() => go('islandView', idx)}
                >
                  <span style={{ fontSize: 28 }}>{meta.icon}</span>
                  {isMastered && <div style={S.checkBadge}>✓</div>}
                </button>

                <div style={S.labelGroup}>
                  <div style={S.creativeName}>{meta.creative}</div>
                  <div style={S.originalDesc}>{is.island}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ height: 100 }} /> {/* Padding at bottom */}
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', padding: '0 20px', maxWidth: 460, margin: '0 auto', zIndex: 1, position: 'relative' },
  pathContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', overflowX: 'hidden', position: 'relative' },
  nodeWrapper: { position: 'relative', width: 280, display: 'flex', justifyContent: 'center' },
  centerColumn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' },
  node: { width: 72, height: 72, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', transition: 'all 0.3s ease', padding: 0 },
  nodeMastered: { borderColor: 'var(--accent)', background: 'rgba(0, 240, 255, 0.1)', boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)' },
  nodeCurrent: { borderColor: 'var(--accent)', background: 'var(--accent-gradient)', transform: 'scale(1.1)', boxShadow: '0 0 20px var(--accent-glow)' },
  nodeLocked: { opacity: 0.5, filter: 'grayscale(0.5)', background: 'rgba(255,255,255,0.05)' },
  checkBadge: { position: 'absolute', bottom: -4, right: -4, background: 'var(--accent)', color: 'var(--bg)', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, border: '2px solid var(--bg-card)' },
  labelGroup: { width: 200 },
  creativeName: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 2 },
  originalDesc: { fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7 },
};
