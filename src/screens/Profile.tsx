import { useState } from "react";
import { useAppStore } from "../store";
import { profileService } from "../services/profileService";
import { complianceService } from "../services/complianceService";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { cn } from "../lib/utils";
import { AlertTriangle, X, CheckCircle2 } from "lucide-react";

export function ProfileScreen() {
  const { setScreen, onboardingData, setOnboardingData } = useAppStore();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });

  // Edit form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [activity, setActivity] = useState('');

  const openEdit = () => {
    // Pre-fill from current profile
    setName(profile?.name || onboardingData?.name || '');
    setAge(String(profile?.age || onboardingData?.age || ''));
    setWeight(String(profile?.weight || onboardingData?.weightKg || ''));
    setHeight(String(profile?.height || onboardingData?.heightCm || ''));
    setGender((profile?.gender || onboardingData?.gender || '') as 'Male' | 'Female' | '');
    setActivity(profile?.activity_level || onboardingData?.activityLevel || '');
    setConfirmed(false);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!confirmed) { setConfirmed(true); return; }
    setSaving(true);
    try {
      const w = parseFloat(weight) || 80;
      const h = parseFloat(height) || 175;
      const a = parseFloat(age) || 30;

      // Recalculate TDEE (Mifflin-St Jeor)
      const maintBase = (w * 10) + (h * 6.25) - (a * 5) + (gender === 'Male' ? 5 : -161);
      const multipliers: Record<string, number> = { 'Sedentary': 1.2, 'Lightly Active': 1.375, 'Moderately Active': 1.55, 'Very Active': 1.725, 'Athlete': 1.9 };
      const tdee = Math.round((maintBase * (multipliers[activity] || 1.375)) / 10) * 10;

      // Protein target
      const proteinFactors: Record<string, number> = { 'Sedentary': 1.6, 'Lightly Active': 1.8, 'Moderately Active': 2.0, 'Very Active': 2.2, 'Athlete': 2.4 };
      const proteinMid = Math.round(w * (proteinFactors[activity] || 1.8));

      await profileService.upsertProfile({ name, age: a, weight: w, height: h, gender: gender || 'Male', activity_level: activity as any, maintenance_kcal: tdee, protein_target: proteinMid });
      await complianceService.updateTodayScore();

      // Update local store
      setOnboardingData({ ...onboardingData, name, age: a, weightKg: w, heightCm: h, gender, activityLevel: activity, tdee, proteinMid });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['complianceScore'] });

      setEditOpen(false);
    } catch (err) {
      console.error('Profile save error:', err);
    }
    setSaving(false);
  };

  // All the existing display values
  const displayVal = (val: any) => val !== undefined && val !== null && !Number.isNaN(val) ? val : '—';
  const name_ = onboardingData?.name ?? profile?.name ?? '';
  const age_ = onboardingData?.age ?? profile?.age;
  const gender_ = onboardingData?.gender ?? profile?.gender;
  const activityLevel_ = onboardingData?.activityLevel ?? profile?.activity_level;
  const weightKg_ = onboardingData?.weightKg ?? profile?.weight;
  const heightCm_ = onboardingData?.heightCm ?? profile?.height;
  const tdee_ = onboardingData?.tdee ?? profile?.maintenance_kcal;
  const proteinMin_ = onboardingData?.proteinMin;
  const proteinMax_ = onboardingData?.proteinMax;
  const fatMin_ = onboardingData?.fatMin;
  const fatMax_ = onboardingData?.fatMax;
  const carbMin_ = onboardingData?.carbMin;
  const carbMax_ = onboardingData?.carbMax;
  const fiberMin_ = onboardingData?.fiberMin;
  const fiberMax_ = onboardingData?.fiberMax;
  const waterLitres_ = onboardingData?.waterLitres;
  const currentBodyFatPct_ = onboardingData?.currentBodyFatPct;
  const targetBodyFatPct_ = onboardingData?.targetBodyFatPct;
  const fatToLoseKg_ = onboardingData?.fatToLoseKg;
  const targetWeightKg_ = onboardingData?.targetWeightKg;
  const chosenStrategyName_ = onboardingData?.chosenStrategyName;
  const dailyCalorieGoal_ = onboardingData?.dailyCalorieGoal;
  const dailyDeficit_ = onboardingData?.dailyDeficit;
  const estimatedWeeks_ = onboardingData?.estimatedWeeks;
  const estimatedCompletionDate_ = onboardingData?.estimatedCompletionDate;
  let initials = '—';
  if (name_ && name_.trim().length > 0) { const words = name_.trim().split(' '); initials = words.length > 1 ? (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase() : words[0].substring(0, 2).toUpperCase(); }
  let heightStr = displayVal(heightCm_);
  let heightSub = null;
  if (heightCm_ && heightCm_ >= 150) { const feet = Math.floor(heightCm_ / 30.48); const inches = Math.round((heightCm_ / 2.54) % 12); heightSub = `${feet}'${inches}"`; }
  let dateStr = '—';
  if (estimatedCompletionDate_) { const d = new Date(estimatedCompletionDate_); if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); else dateStr = estimatedCompletionDate_; }

  const inputStyle = (val: string) => ({
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: `0.5px solid ${val ? 'rgba(212,255,0,0.3)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: '12px',
    padding: '12px 14px',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
  });

  const activities = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Athlete'];

  return (
    <div className="profile-screen">
      <div className="profile-scroll-area">
        {/* Header */}
        <div className="profile-header">
          <i className="ti ti-arrow-left" style={{ fontSize: '22px', color: '#FFFFFF', cursor: 'pointer' }} onClick={() => setScreen('dash')}></i>
          <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.3px' }}>Profile</div>
        </div>

        {/* Avatar */}
        <div className="avatar-section" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="profile-avatar">{initials}</div>
          <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.4px', marginBottom: '8px' }}>{displayVal(name_)}</div>
          <div className="identity-row">
            <div className="identity-pill">{gender_ ? gender_.charAt(0).toUpperCase() + gender_.slice(1) : '—'}</div>
            <div className="identity-pill">{displayVal(age_)} yrs</div>
            <div className="identity-pill">{displayVal(activityLevel_)}</div>
          </div>
          <div style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '4px' }}></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 4px', marginBottom: '16px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: 'white' }}>
            1
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '17px', fontWeight: 600, color: 'white', letterSpacing: '-0.2px' }}>
              Personal Info
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(235,235,245,0.6)' }}>
              Step 1 of 2 · Body stats & activity level
            </div>
          </div>
          <button onClick={openEdit} style={{ background: 'rgba(212,255,0,0.1)', border: '0.5px solid rgba(212,255,0,0.3)', borderRadius: '8px', padding: '6px 12px', color: '#D4FF00', fontSize: 'var(--font-xs)', fontWeight: 600, cursor: 'pointer' }}>
            ✎ Edit
          </button>
        </div>

        {/* Body stats */}
        <div className="profile-card">
          <div className="profile-card-label">Body stats</div>
          <div className="stats-grid">
            <div className="stat-tile"><div className="stat-tile-label">Weight</div><div className="stat-tile-value">{displayVal(weightKg_)} <span className="stat-tile-unit">kg</span></div></div>
            <div className="stat-tile"><div className="stat-tile-label">Height</div><div className="stat-tile-value">{heightStr} <span className="stat-tile-unit">cm</span></div>{heightSub && <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.45)' }}>{heightSub}</div>}</div>
            <div className="stat-tile"><div className="stat-tile-label">Current body fat</div><div className="stat-tile-value">{displayVal(currentBodyFatPct_)}<span className="stat-tile-unit">%</span></div></div>
            <div className="stat-tile" style={{ background: 'rgba(212,255,0,0.08)', border: '0.5px solid rgba(212,255,0,0.2)' }}><div className="stat-tile-label" style={{ color: 'rgba(212,255,0,0.6)' }}>Target body fat</div><div className="stat-tile-value" style={{ color: '#D4FF00' }}>{displayVal(targetBodyFatPct_)}<span className="stat-tile-unit" style={{ color: 'rgba(212,255,0,0.6)' }}>%</span></div></div>
          </div>
        </div>

        {/* Nutrition targets */}
        <div className="profile-card">
          <div className="profile-card-label">Daily nutrition targets</div>
          {[
            { icon: 'ti-flame', color: '#D4FF00', bg: 'rgba(212,255,0,0.15)', label: 'Calories', val: `${displayVal(tdee_)} kcal`, valColor: '#D4FF00' },
            { icon: 'ti-meat', color: '#FF4D1C', bg: 'rgba(255,77,28,0.15)', label: 'Protein', val: `${displayVal(proteinMin_)}–${displayVal(proteinMax_)} g/day` },
            { icon: 'ti-droplet', color: '#378ADD', bg: 'rgba(55,138,221,0.15)', label: 'Fat', val: `${displayVal(fatMin_)}–${displayVal(fatMax_)} g/day` },
            { icon: 'ti-grain', color: '#BA7517', bg: 'rgba(186,117,23,0.15)', label: 'Carbohydrates', val: `${displayVal(carbMin_)}–${displayVal(carbMax_)} g/day` },
            { icon: 'ti-leaf', color: '#639922', bg: 'rgba(99,153,34,0.15)', label: 'Fiber', val: `${displayVal(fiberMin_)}–${displayVal(fiberMax_)} g/day` },
            { icon: 'ti-droplets', color: '#378ADD', bg: 'rgba(55,138,221,0.12)', label: 'Water', val: `${displayVal(waterLitres_)} L/day` },
          ].map((row, i) => (
            <div key={i} className="nutrition-profile-row">
              <div className="np-label"><div className="np-icon" style={{ background: row.bg }}><i className={`ti ${row.icon}`} style={{ color: row.color, fontSize: '14px' }}></i></div>{row.label}</div>
              <div className="np-value" style={row.valColor ? { color: row.valColor } : {}}>{row.val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 4px', marginTop: '32px', marginBottom: '16px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: 'white' }}>
            2
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '17px', fontWeight: 600, color: 'white', letterSpacing: '-0.2px' }}>
              Body Goal
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(235,235,245,0.6)' }}>
              Step 2 of 2 · Target physique & strategy
            </div>
          </div>
          <button 
            onClick={() => {
              setScreen('goal');
            }}
            style={{
              background: 'rgba(55,138,221,0.12)',
              border: '0.5px solid rgba(55,138,221,0.3)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#378ADD',
              fontSize: 'var(--font-xs)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Update →
          </button>
        </div>

        {/* Transformation goal */}
        <div className="profile-card">
          <div className="profile-card-label">Transformation goal</div>
          {[
            { icon: 'ti-trending-down', color: '#FF4D1C', bg: 'rgba(255,77,28,0.15)', label: 'Fat to lose', val: `${displayVal(fatToLoseKg_)} kg` },
            { icon: 'ti-target', color: '#378ADD', bg: 'rgba(55,138,221,0.15)', label: 'Target weight', val: `${displayVal(targetWeightKg_)} kg` },
            { icon: 'ti-bolt', color: '#D4FF00', bg: 'rgba(212,255,0,0.15)', label: 'Strategy', val: displayVal(chosenStrategyName_), valColor: '#D4FF00' },
            { icon: 'ti-flame', color: '#D4FF00', bg: 'rgba(212,255,0,0.15)', label: 'Daily calorie goal', val: `${displayVal(dailyCalorieGoal_)} kcal` },
            { icon: 'ti-minus', color: '#FFFFFF', bg: 'rgba(255,255,255,0.15)', label: 'Daily deficit', val: `${displayVal(dailyDeficit_)} kcal` },
            { icon: 'ti-calendar', color: '#FFFFFF', bg: 'rgba(255,255,255,0.15)', label: 'Estimated time', val: `${displayVal(estimatedWeeks_)} weeks` },
            { icon: 'ti-flag', color: '#FFFFFF', bg: 'rgba(255,255,255,0.15)', label: 'Target date', val: dateStr },
          ].map((row, i) => (
            <div key={i} className="nutrition-profile-row">
              <div className="np-label"><div className="np-icon" style={{ background: row.bg }}><i className={`ti ${row.icon}`} style={{ color: row.color, fontSize: '14px' }}></i></div>{row.label}</div>
              <div className="np-value" style={(row as any).valColor ? { color: (row as any).valColor } : {}}>{row.val}</div>
            </div>
          ))}
        </div>

        <div className="profile-bottom-spacer"></div>
      </div>

      {/* ── EDIT MODAL ── */}
      {editOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setEditOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: 'rgba(28,28,30,0.98)', backdropFilter: 'blur(30px)', borderRadius: '20px 20px 0 0', borderTop: '0.5px solid rgba(255,255,255,0.1)', padding: '20px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)', maxHeight: '90dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'white' }}>Edit Profile</div>
              <button onClick={() => setEditOpen(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><X size={16} /></button>
            </div>

            {/* Warning banner */}
            <div style={{ background: 'rgba(255,196,0,0.1)', border: '0.5px solid rgba(255,196,0,0.3)', borderRadius: '12px', padding: '12px 14px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <AlertTriangle size={16} style={{ color: '#FFC400', flexShrink: 0, marginTop: '1px' }} />
              <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(255,196,0,0.9)', lineHeight: 1.5 }}>
                Updating your measurements will recalculate your daily calorie and protein targets. Your physique goal (body fat % and strategy) will remain unchanged — only your maintenance targets will update.
              </div>
            </div>

            {/* Gender */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.7)', marginBottom: '8px', fontWeight: 500 }}>Gender</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['Male', 'Female'].map(g => (
                  <button key={g} onClick={() => setGender(g as any)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${gender === g ? 'rgba(212,255,0,0.5)' : 'rgba(255,255,255,0.12)'}`, background: gender === g ? 'rgba(212,255,0,0.1)' : 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontWeight: gender === g ? 600 : 400 }}>{g}</button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.7)', marginBottom: '6px', fontWeight: 500 }}>Name</div>
              <input style={inputStyle(name)} value={name} onChange={e => setName(e.target.value)} placeholder="First name" />
            </div>

            {/* Age */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.7)', marginBottom: '6px', fontWeight: 500 }}>Age</div>
              <input style={inputStyle(age)} type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 28" />
            </div>

            {/* Weight */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.7)', marginBottom: '6px', fontWeight: 500 }}>Weight (kg)</div>
              <input style={inputStyle(weight)} type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 78" />
            </div>

            {/* Height */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.7)', marginBottom: '6px', fontWeight: 500 }}>Height (cm)</div>
              <input style={inputStyle(height)} type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 175" />
            </div>

            {/* Activity */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.7)', marginBottom: '8px', fontWeight: 500 }}>Activity Level</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activities.map(a => (
                  <button key={a} onClick={() => setActivity(a)} style={{ padding: '12px 14px', borderRadius: '12px', border: `1px solid ${activity === a ? 'rgba(212,255,0,0.5)' : 'rgba(255,255,255,0.1)'}`, background: activity === a ? 'rgba(212,255,0,0.1)' : 'rgba(255,255,255,0.04)', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: activity === a ? 600 : 400 }}>{a}</button>
                ))}
              </div>
            </div>

            {/* Confirm + save */}
            {confirmed && (
              <div style={{ background: 'rgba(212,255,0,0.08)', border: '0.5px solid rgba(212,255,0,0.3)', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px', fontSize: 'var(--font-xs)', color: 'rgba(212,255,0,0.9)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <CheckCircle2 size={14} /> Tap "Save changes" again to confirm. Your macro targets will be recalculated.
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !name || !age || !weight || !height || !gender || !activity}
              style={{ width: '100%', padding: '14px', borderRadius: '100px', background: confirmed ? '#D4FF00' : 'rgba(212,255,0,0.15)', border: `1px solid ${confirmed ? 'transparent' : 'rgba(212,255,0,0.3)'}`, color: confirmed ? '#0A0A0A' : '#D4FF00', fontWeight: 700, fontSize: '16px', cursor: 'pointer', opacity: saving ? 0.6 : 1, transition: 'all 0.2s' }}
            >
              {saving ? 'Saving...' : confirmed ? 'Save changes' : 'Review & save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
