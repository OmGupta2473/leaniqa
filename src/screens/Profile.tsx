import { useState } from "react";
import { useAppStore } from "../store";
import { profileService } from "../services/profileService";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function ProfileScreen() {
  const { setScreen, onboardingData, setOnboardingData, setEditProfileMode } = useAppStore();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });

  const [editOpen, setEditOpen] = useState(false);
  const [editState, setEditState] = useState<'summary' | 'form' | 'reset'>('summary');
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [activity, setActivity] = useState('');

  const openEdit = () => {
    setName(profile?.name || onboardingData?.name || '');
    setAge(String(profile?.age || onboardingData?.age || ''));
    setWeight(String(profile?.weight || onboardingData?.weightKg || ''));
    setHeight(String(profile?.height || onboardingData?.heightCm || ''));
    setGender((profile?.gender || onboardingData?.gender || '') as 'Male' | 'Female' | '');
    setActivity(profile?.activity_level || onboardingData?.activityLevel || '');
    setConfirmed(false);
    setEditState('summary'); // Always start on summary
    setEditOpen(true);
  };

  const handleSave = () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    // We update global state and navigate to onboarding step 1 to process the recalculations
    setEditProfileMode(true);
    setEditOpen(false);
    setScreen('onboard');
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await profileService.deleteProfile?.(); // if this method exists, else skip
      setOnboardingData({});
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setScreen('onboard'); // Go back to onboarding
      setEditOpen(false);
    } catch (err) {
      console.error('Reset failed:', err);
      setEditState('summary');
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

      {/* ── PROFILE EDIT MODAL ── */}
      {editOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.82)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => { setEditOpen(false); setEditState('summary'); setConfirmed(false); }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'rgba(20,20,22,0.99)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderRadius: '20px 20px 0 0',
              borderTop: '0.5px solid rgba(255,255,255,0.12)',
              maxHeight: '92dvh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Scrollable content */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 20px calc(env(safe-area-inset-bottom) + 24px)' }}>

              {/* ── STATE A: SUMMARY VIEW ── */}
              {editState === 'summary' && (
                <>
                  {/* Step 1 icon header — matches GoalSetter visual language */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', padding: '16px 0 0' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, rgba(212,255,0,0.2) 0%, rgba(212,255,0,0.08) 100%)',
                      border: '1.5px solid rgba(212,255,0,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <i className="ti ti-user-circle" style={{ fontSize: '22px', color: '#D4FF00' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>
                        Personal Details
                      </div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)', marginTop: '2px' }}>
                        Step 1 of your profile setup
                      </div>
                    </div>
                  </div>

                  {/* Summary card */}
                  <div className="glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
                    {[
                      { icon: 'ti-id-badge-2', label: 'Name', value: name || profile?.name || '—', color: '#D4FF00' },
                      { icon: 'ti-calendar-stats', label: 'Age', value: age ? `${age} years` : profile?.age ? `${profile.age} years` : '—', color: '#378ADD' },
                      { icon: 'ti-gender-bigender', label: 'Gender', value: gender || profile?.gender || '—', color: '#FF4D1C' },
                      { icon: 'ti-weight', label: 'Weight', value: weight ? `${weight} kg` : profile?.weight ? `${profile.weight} kg` : '—', color: '#D4FF00' },
                      { icon: 'ti-arrows-vertical', label: 'Height', value: height ? `${height} cm` : profile?.height ? `${profile.height} cm` : '—', color: '#378ADD' },
                      { icon: 'ti-run', label: 'Activity', value: activity || profile?.activity_level || '—', color: '#FF4D1C' },
                    ].map((item, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 0',
                        borderBottom: i < 5 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: `${item.color}18`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <i className={`ti ${item.icon}`} style={{ fontSize: '16px', color: item.color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.45)', fontWeight: 500 }}>{item.label}</div>
                          <div style={{ fontSize: 'var(--font-sm)', color: 'white', fontWeight: 600 }}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <button
                    onClick={() => setEditState('form')}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '100px',
                      background: '#D4FF00',
                      border: 'none',
                      color: '#0A0A0A',
                      fontWeight: 700,
                      fontSize: '16px',
                      cursor: 'pointer',
                      marginBottom: '10px',
                    }}
                  >
                    Edit details
                  </button>
                  <button
                    onClick={() => setEditState('reset')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '100px',
                      background: 'rgba(255,77,28,0.1)',
                      border: '0.5px solid rgba(255,77,28,0.3)',
                      color: '#FF4D1C',
                      fontWeight: 600,
                      fontSize: '15px',
                      cursor: 'pointer',
                    }}
                  >
                    Reset profile
                  </button>
                </>
              )}

              {/* ── STATE B: EDIT FORM VIEW ── */}
              {editState === 'form' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 0 20px' }}>
                    <button
                      onClick={() => setEditState('summary')}
                      style={{ background: 'none', border: 'none', color: 'rgba(235,235,245,0.6)', cursor: 'pointer', padding: '4px' }}
                    >
                      <i className="ti ti-arrow-left" style={{ fontSize: '20px' }} />
                    </button>
                    <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'white' }}>Edit Details</div>
                  </div>

                  {/* Warning banner */}
                  <div style={{
                    background: 'rgba(255,196,0,0.08)',
                    border: '0.5px solid rgba(255,196,0,0.25)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '20px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}>
                    <i className="ti ti-alert-triangle" style={{ fontSize: '16px', color: '#FFC400', flexShrink: 0, marginTop: '1px' }} />
                    <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(255,196,0,0.85)', lineHeight: 1.5 }}>
                      Updating your measurements recalculates your daily calorie and protein targets. Your physique goal and deficit strategy are unchanged.
                    </div>
                  </div>

                  {/* Gender picker */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.65)', marginBottom: '8px', fontWeight: 500 }}>Gender</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {(['Male', 'Female'] as const).map(g => (
                        <button
                          key={g}
                          onClick={() => setGender(g)}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            border: `1px solid ${gender === g ? 'rgba(212,255,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
                            background: gender === g ? 'rgba(212,255,0,0.1)' : 'rgba(255,255,255,0.04)',
                            color: gender === g ? '#D4FF00' : 'rgba(235,235,245,0.7)',
                            cursor: 'pointer',
                            fontWeight: gender === g ? 700 : 400,
                            fontSize: '15px',
                            transition: 'all 0.15s ease',
                          }}
                        >{g}</button>
                      ))}
                    </div>
                  </div>

                  {/* Text/number fields */}
                  {[
                    { label: 'Full name', value: name, setter: setName, type: 'text', placeholder: 'Your name' },
                    { label: 'Age', value: age, setter: setAge, type: 'number', placeholder: 'e.g. 28' },
                    { label: 'Weight (kg)', value: weight, setter: setWeight, type: 'number', placeholder: 'e.g. 78' },
                    { label: 'Height (cm)', value: height, setter: setHeight, type: 'number', placeholder: 'e.g. 175' },
                  ].map(field => (
                    <div key={field.label} style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.65)', marginBottom: '6px', fontWeight: 500 }}>{field.label}</div>
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={e => field.setter(e.target.value)}
                        placeholder={field.placeholder}
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.07)',
                          border: `0.5px solid ${field.value ? 'rgba(212,255,0,0.3)' : 'rgba(255,255,255,0.12)'}`,
                          borderRadius: '12px',
                          padding: '12px 14px',
                          color: 'white',
                          fontSize: '15px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}

                  {/* Activity level */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.65)', marginBottom: '8px', fontWeight: 500 }}>Activity Level</div>
                    {(['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Athlete'] as const).map(a => (
                      <button
                        key={a}
                        onClick={() => setActivity(a)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: `1px solid ${activity === a ? 'rgba(212,255,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                          background: activity === a ? 'rgba(212,255,0,0.08)' : 'rgba(255,255,255,0.03)',
                          color: activity === a ? '#D4FF00' : 'rgba(235,235,245,0.75)',
                          cursor: 'pointer',
                          textAlign: 'left' as const,
                          fontWeight: activity === a ? 600 : 400,
                          fontSize: '14px',
                          marginBottom: '8px',
                          transition: 'all 0.15s ease',
                        }}
                      >{a}</button>
                    ))}
                  </div>

                  {/* Two-step confirm button */}
                  {confirmed && (
                    <div style={{
                      background: 'rgba(212,255,0,0.08)',
                      border: '0.5px solid rgba(212,255,0,0.3)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      marginBottom: '12px',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      fontSize: 'var(--font-xs)',
                      color: 'rgba(212,255,0,0.9)',
                    }}>
                      <i className="ti ti-circle-check" style={{ fontSize: '16px', color: '#D4FF00' }} />
                      Tap "Confirm save" to apply changes and recalculate your targets.
                    </div>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving || !name || !age || !weight || !height || !gender || !activity}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '100px',
                      background: confirmed ? '#D4FF00' : 'rgba(212,255,0,0.12)',
                      border: `1px solid ${confirmed ? 'transparent' : 'rgba(212,255,0,0.3)'}`,
                      color: confirmed ? '#0A0A0A' : '#D4FF00',
                      fontWeight: 700,
                      fontSize: '16px',
                      cursor: 'pointer',
                      opacity: saving ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {saving ? 'Saving…' : confirmed ? 'Confirm save' : 'Review & save'}
                  </button>
                </>
              )}

              {/* ── STATE C: RESET WARNING ── */}
              {editState === 'reset' && (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    background: 'rgba(255,77,28,0.12)',
                    border: '1.5px solid rgba(255,77,28,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <i className="ti ti-alert-triangle-filled" style={{ fontSize: '28px', color: '#FF4D1C' }} />
                  </div>
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'white', marginBottom: '10px' }}>Reset Profile?</div>
                  <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.6)', lineHeight: 1.6, maxWidth: '300px', margin: '0 auto 24px' }}>
                    This will clear all your personal measurements. Your macro targets, calorie goal, and protein target will all be recalculated from scratch after you re-enter your details.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      onClick={handleReset}
                      style={{
                        padding: '14px',
                        borderRadius: '100px',
                        background: '#FF4D1C',
                        border: 'none',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '16px',
                        cursor: 'pointer',
                      }}
                    >
                      Yes, reset my profile
                    </button>
                    <button
                      onClick={() => setEditState('summary')}
                      style={{
                        padding: '12px',
                        borderRadius: '100px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '0.5px solid rgba(255,255,255,0.15)',
                        color: 'rgba(235,235,245,0.8)',
                        fontWeight: 600,
                        fontSize: '15px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
