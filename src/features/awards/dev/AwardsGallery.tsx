import { AwardMedal } from '../components/AwardMedal';
import { CATEGORY_COLORS, type AwardCategory } from '../theme';

const SYMBOLS: Record<AwardCategory, string> = {
  streak: '🔥',
  logging: '📝',
  protein: '🥩',
  precision: '🎯',
  weight: '⚖️',
  milestone: '🏆',
};

export function AwardsGallery() {
  const categories = Object.keys(CATEGORY_COLORS) as AwardCategory[];
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 32 }}>
      {categories.map((cat) => (
        <div key={cat} style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <span style={{ width: 100, color: '#fff', fontFamily: 'monospace' }}>{cat}</span>
          <AwardMedal category={cat} symbol={SYMBOLS[cat]} current={3} target={7} unlocked={false} size={64} />
          <AwardMedal category={cat} symbol={SYMBOLS[cat]} current={7} target={7} unlocked={true} size={64} />
        </div>
      ))}
    </div>
  );
}