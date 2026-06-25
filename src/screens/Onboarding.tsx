import { useState } from 'react';
import { useAppStore } from '../store';
import { cn } from '../lib/utils';
import { Sparkles } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';

export function OnboardingScreen() {
  const { setScreen } = useAppStore();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm'|'ft'>('cm');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [hip, setHip] = useState('');
  const [gender, setGender] = useState<'Male'|'Female'>('Male');
  const [activity, setActivity] = useState<'Sedentary'|'Lightly Active'|'Moderately Active'|'Very Active'|'Athlete'>('Lightly Active');
  
  const [showResults, setShowResults] = useState(false);
  const [showStep2, setShowStep2] = useState(false);
  const [results, setResults] = useState({ maint: 0, protein: 0, bf: 0 });

  const saveMutation = useMutation({
    mutationFn: async (data: { profile: any, goal: any }) => {
      await profileService.upsertProfile(data.profile);
      await profileService.upsertGoal(data.goal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
      setScreen('goal');
    }
  });

  const toggleHeightUnit = (unit: 'cm'|'ft') => {
    if (unit === heightUnit) return;
    if (unit === 'ft') {
      const cm = parseFloat(height);
      if (!isNaN(cm) && cm > 0) {
        const totalInches = cm / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        setHeightFt(ft.toString());
        setHeightIn(inches.toString());
      } else {
        setHeightFt('');
        setHeightIn('');
      }
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inc = parseFloat(heightIn) || 0;
      if (ft > 0 || inc > 0) {
        const totalInches = (ft * 12) + inc;
        const cm = Math.round(totalInches * 2.54);
        setHeight(cm.toString());
      } else {
        setHeight('');
      }
    }
    setHeightUnit(unit);
  };

  const getComputedHeight = () => {
    let h = parseFloat(height) || 0;
    if (heightUnit === 'ft') {
      const ft = parseFloat(heightFt) || 0;
      const inc = parseFloat(heightIn) || 0;
      if (ft > 0 || inc > 0) {
        h = Math.round(((ft * 12) + inc) * 2.54);
      }
    }
    return h || 175;
  };

  const calculateRough = () => {
    const w = parseFloat(weight) || 80;
    const h = getComputedHeight();
    const a = parseFloat(age) || 30;

    // Maintenance Mifflin-St Jeor
    const maintBase = (w * 10) + (h * 6.25) - (a * 5) + (gender === 'Male' ? 5 : -161);
    const multipliers: Record<string, number> = { 
      'Sedentary': 1.2, 
      'Lightly Active': 1.375, 
      'Moderately Active': 1.55, 
      'Very Active': 1.725, 
      'Athlete': 1.9 
    };
    const maint = Math.round(maintBase * multipliers[activity]);
    
    // Rough BF formula
    let bf = ((w - (h - 100) * 0.9) / w) * 100;
    bf = Math.max(8, Math.min(45, Math.round(bf * 10) / 10)); // clamp to 8-45%
    
    const lbm = w * (1 - bf / 100);
    const protein = Math.round(lbm * 2.2);
    
    setResults({ maint, protein, bf });
    setShowResults(true);
  };

  const calculateNavy = () => {
    const w = parseFloat(weight) || 80;
    const h = getComputedHeight();
    const a = parseFloat(age) || 30;
    const waistVal = parseFloat(waist) || (gender === 'Male' ? 90 : 80);
    const neckVal = parseFloat(neck) || (gender === 'Male' ? 38 : 34);
    const hipVal = parseFloat(hip) || 100;

    const maintBase = (w * 10) + (h * 6.25) - (a * 5) + (gender === 'Male' ? 5 : -161);
    const multipliers: Record<string, number> = { 
      'Sedentary': 1.2, 
      'Lightly Active': 1.375, 
      'Moderately Active': 1.55, 
      'Very Active': 1.725, 
      'Athlete': 1.9 
    };
    const maint = Math.round(maintBase * multipliers[activity]);
    
    let bf = 0;
    if (gender === 'Male') {
      bf = 495 / (1.0324 - 0.19077 * Math.log10(waistVal - neckVal) + 0.15456 * Math.log10(h)) - 450;
    } else {
      bf = 495 / (1.29579 - 0.35004 * Math.log10(waistVal + hipVal - neckVal) + 0.22100 * Math.log10(h)) - 450;
    }
    
    bf = Math.max(3, Math.min(60, Math.round(bf * 10) / 10));
    const lbm = w * (1 - bf / 100);
    const protein = Math.round(lbm * 2.2);
    
    setResults({ maint, protein, bf });
  };

  const handleSave = () => {
    const w = parseFloat(weight) || 80;
    const h = getComputedHeight();
    const a = parseFloat(age) || 30;
    const waistVal = showStep2 && waist ? parseFloat(waist) : undefined;
    const neckVal = showStep2 && neck ? parseFloat(neck) : undefined;
    const hipVal = showStep2 && hip && gender === 'Female' ? parseFloat(hip) : undefined;

    const strategy = 'Recommended';
    const strategyDeficits: Record<string, number> = { 'Aggressive': 600, 'Recommended': 400, 'Slow cut': 200 };
    
    saveMutation.mutate({
      profile: {
        name: name.trim() || 'User', 
        age: a, 
        height: h, 
        weight: w, 
        gender, 
        waist: waistVal, 
        neck: neckVal, 
        hip: hipVal, 
        activity_level: activity,
        maintenance_kcal: results.maint, 
        protein_target: results.protein
      },
      goal: {
        current_bf: results.bf,
        target_bf: gender === 'Male' ? 12 : 20,
        strategy: strategy,
        deficit_kcal: strategyDeficits[strategy]
      }
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-center py-4 pb-5">
        <h2 className="text-[20px] font-medium text-text-primary mb-1.5">Elite Coaching Setup</h2>
        <p className="text-[13px] text-text-secondary max-w-[320px] mx-auto">We use US Navy standards for precision targeting.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="flex flex-col gap-1 col-span-2 mt-1">
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Gender</span>
          <div className="flex gap-1.5 flex-wrap">
            {['Male', 'Female'].map(g => (
              <button key={g} onClick={() => setGender(g as any)} className={cn("px-3 py-1.5 border-[0.5px] border-border-secondary text-[12px] cursor-pointer transition-all bg-background-primary flex-1", gender === g ? "bg-purple text-background-primary font-medium border-purple" : "text-text-secondary hover:bg-background-secondary")}>{g}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 col-span-2">
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Your name</span>
          <input className="px-2.5 py-1.5 border-[0.5px] border-border-secondary text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="First name" />
        </div>

        <div className="flex flex-col gap-1 col-span-2">
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Age</span>
          <input className="px-2.5 py-1.5 border-[0.5px] border-border-secondary text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Age" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center h-[16px]">
            <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Height</span>
            <div className="flex bg-background-secondary rounded-sm p-[2px] border-[0.5px] border-border-secondary">
              <button 
                onClick={() => toggleHeightUnit('cm')} 
                className={cn("px-1.5 py-0.5 text-[9px] rounded-[1px] transition-colors leading-none font-medium uppercase tracking-wider", heightUnit === 'cm' ? "bg-purple text-background-primary" : "text-text-secondary hover:text-text-primary")}
              >cm</button>
              <button 
                onClick={() => toggleHeightUnit('ft')} 
                className={cn("px-1.5 py-0.5 text-[9px] rounded-[1px] transition-colors leading-none font-medium uppercase tracking-wider", heightUnit === 'ft' ? "bg-purple text-background-primary" : "text-text-secondary hover:text-text-primary")}
              >ft / in</button>
            </div>
          </div>
          {heightUnit === 'cm' ? (
            <input className="px-2.5 py-1.5 border-[0.5px] border-border-secondary text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple" type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 172" />
          ) : (
            <div className="flex items-center gap-1.5">
              <input className="px-2.5 py-1.5 border-[0.5px] border-border-secondary text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple w-full min-w-0" type="number" value={heightFt} onChange={e => setHeightFt(e.target.value)} placeholder="5" />
              <span className="text-text-secondary font-medium text-[13px]">'</span>
              <input className="px-2.5 py-1.5 border-[0.5px] border-border-secondary text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple w-full min-w-0" type="number" value={heightIn} onChange={e => setHeightIn(e.target.value)} placeholder="10" />
              <span className="text-text-secondary font-medium text-[13px]">"</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Weight (kg)</span>
          <input className="px-2.5 py-1.5 border-[0.5px] border-border-secondary text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple" type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="kg" />
        </div>

        <div className="flex flex-col gap-2 col-span-2 mt-2">
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Activity level</span>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Sedentary', desc: 'Desk job, little or no exercise, mostly sitting through the day' },
              { label: 'Lightly Active', desc: 'Daily walks, light home workouts, occasional stretching or yoga' },
              { label: 'Moderately Active', desc: 'Gym or sports 3–4 times a week with moderate effort' },
              { label: 'Very Active', desc: 'Intense gym sessions 5–6 times a week or a physically demanding job' },
              { label: 'Athlete', desc: 'Twice-a-day training, competitive sports, or heavy manual labour every day' }
            ].map(a => (
              <button 
                key={a.label} 
                onClick={() => setActivity(a.label as any)} 
                className={cn(
                  "p-3 border-[0.5px] cursor-pointer transition-all text-left flex flex-col gap-1", 
                  activity === a.label 
                    ? "bg-purple/5 border-purple" 
                    : "border-border-secondary bg-background-primary text-text-secondary hover:bg-background-secondary"
                )}
              >
                <div className={cn("text-[13px] font-medium", activity === a.label ? "text-purple" : "text-text-primary")}>
                  {a.label}
                </div>
                <div className="text-[11px] leading-snug text-text-secondary">
                  {a.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {!showResults && <button onClick={calculateRough} disabled={saveMutation.isPending} className="w-full p-2.5 border-none bg-purple text-background-primary text-[14px] font-bold tracking-tight uppercase cursor-pointer transition-opacity hover:opacity-90 mb-3.5 disabled:opacity-50">Calculate</button>}
      
      {showResults && (
        <div className="bg-background-secondary p-4 mb-3.5 border border-border-tertiary animate-in fade-in slide-in-from-top-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-purple mb-2.5">
            {showStep2 ? 'US Navy Projection' : 'Estimated Projection'}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-background-primary p-2.5 text-center border-[0.5px] border-border-tertiary">
              <div className="text-[18px] font-medium text-text-primary">{results.maint.toLocaleString()}</div>
              <div className="text-[10px] text-text-secondary mt-0.5">MAINTENANCE</div>
            </div>
            <div className="bg-background-primary p-2.5 text-center border-[0.5px] border-border-tertiary">
              <div className="text-[18px] font-medium text-text-primary">{results.protein}g</div>
              <div className="text-[10px] text-text-secondary mt-0.5">PROTEIN TARGET</div>
            </div>
            <div className="bg-background-primary p-2.5 text-center border-[0.5px] border-border-tertiary">
              <div className="text-[18px] font-medium text-text-primary">{results.bf}%</div>
              <div className="text-[10px] text-text-secondary mt-0.5">BODY FAT</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border-tertiary">
            <button onClick={handleSave} disabled={saveMutation.isPending} className="w-full p-2.5 border-[0.5px] border-purple bg-purple/10 text-purple text-[14px] font-bold tracking-tight uppercase cursor-pointer transition-opacity hover:bg-purple/20 disabled:opacity-50">
              {saveMutation.isPending ? 'Saving...' : 'Set my physique goal →'}
            </button>
          </div>
        </div>
      )}

      {showResults && !showStep2 && (
        <div className="text-center mb-4">
          <button 
            onClick={() => setShowStep2(true)}
            className="text-[12px] text-text-secondary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer underline underline-offset-2"
          >
            Refine with body measurements (more accurate)
          </button>
        </div>
      )}

      {showStep2 && (
        <div className="animate-in fade-in slide-in-from-top-2 p-4 border border-border-secondary bg-background-primary mb-4">
          <div className="text-[11px] font-medium uppercase tracking-widest text-text-secondary mb-3">Navy Method Refinement</div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Waist (cm)</span>
              <input className="px-2.5 py-1.5 border-[0.5px] border-border-secondary text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple" type="number" value={waist} onChange={e => setWaist(e.target.value)} placeholder="Navel" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Neck (cm)</span>
              <input className="px-2.5 py-1.5 border-[0.5px] border-border-secondary text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple" type="number" value={neck} onChange={e => setNeck(e.target.value)} placeholder="Below larynx" />
            </div>
            
            {gender === 'Female' && (
              <div className="flex flex-col gap-1 col-span-2">
                <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Hip (cm)</span>
                <input className="px-2.5 py-1.5 border-[0.5px] border-border-secondary text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple" type="number" value={hip} onChange={e => setHip(e.target.value)} placeholder="Widest part" />
              </div>
            )}
          </div>
          <button onClick={calculateNavy} className="w-full mt-3 p-2 border-[0.5px] border-border-secondary bg-background-secondary text-text-primary text-[12px] font-medium uppercase tracking-wider cursor-pointer transition-opacity hover:opacity-80">
            Recalculate with measurements
          </button>
        </div>
      )}
    </div>
  );
}

