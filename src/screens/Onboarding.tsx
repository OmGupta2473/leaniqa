import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { cn } from '../lib/utils';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { complianceService } from '../services/complianceService';

export function OnboardingScreen() {
  const { setScreen, setOnboardingData, onboardingCompleted, setOnboardingCompleted, onboardingData, clearStore } = useAppStore();
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
  const [gender, setGender] = useState<'Male'|'Female'|''>('');
  const [activity, setActivity] = useState<'Sedentary'|'Lightly Active'|'Moderately Active'|'Very Active'|'Athlete'|''>('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showStep2, setShowStep2] = useState(false);
  
  // Results
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    const newErrors = { ...errors };
    if (name.trim() && newErrors.name) delete newErrors.name;
    if (age && newErrors.age) delete newErrors.age;
    if (weight && newErrors.weight) delete newErrors.weight;
    if (heightUnit === 'cm' && height && newErrors.height) delete newErrors.height;
    if (heightUnit === 'ft' && heightFt && heightIn && newErrors.height) delete newErrors.height;
    if (waist && newErrors.waist) delete newErrors.waist;
    if (neck && newErrors.neck) delete newErrors.neck;
    if (gender === 'Female' && hip && newErrors.hip) delete newErrors.hip;
    if (gender && newErrors.gender) delete newErrors.gender;
    if (activity && newErrors.activity) delete newErrors.activity;
    
    if (Object.keys(newErrors).length !== Object.keys(errors).length) {
      setErrors(newErrors);
    }
  }, [name, age, weight, height, heightFt, heightIn, waist, neck, hip, heightUnit, gender, activity, errors]);

  const saveMutation = useMutation({
    mutationFn: async (profile: any) => {
      return await profileService.upsertProfile(profile);
    },
    onSuccess: (data) => {
      console.log('Navigating to Screen 2');
      if (data) {
        queryClient.setQueryData(['profile'], data);
      } else {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
      complianceService.updateTodayScore().then(() => {
        queryClient.invalidateQueries({ queryKey: ['complianceScore'] });
      }).catch(console.error);
      setOnboardingData({
        ...results,
        weightKg: parseFloat(weight) || 80,
        heightCm: getComputedHeight(),
        age: parseFloat(age) || 30,
        gender,
        activityLevel: activity,
        name: name.trim() || 'User'
      });
      setOnboardingCompleted(true);
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

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!gender) newErrors.gender = 'Please select your gender';
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!age) newErrors.age = 'Age is required';
    if (!weight) newErrors.weight = 'Weight is required';
    if (heightUnit === 'cm') {
      if (!height) newErrors.height = 'Height is required';
    } else {
      if (!heightFt || !heightIn) newErrors.height = 'Height is required';
    }
    if (!activity) newErrors.activity = 'Please select your activity level';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!waist) newErrors.waist = 'Waist is required';
    if (!neck) newErrors.neck = 'Neck is required';
    if (gender === 'Female' && !hip) newErrors.hip = 'Hip is required';
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
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

  const calculateResults = () => {
    if (!validateStep1()) return;

    const w = parseFloat(weight) || 80;
    const h = getComputedHeight();
    const a = parseFloat(age) || 30;

    // Maintenance Mifflin-St Jeor
    const maintBase = (w * 10) + (h * 6.25) - (a * 5) + (gender === 'Male' ? 5 : -161);
    const activityLevel = activity || 'Lightly Active';
    const multipliers: Record<string, number> = { 
      'Sedentary': 1.2, 
      'Lightly Active': 1.375, 
      'Moderately Active': 1.55, 
      'Very Active': 1.725, 
      'Athlete': 1.9 
    };
    const tdee = Math.round((maintBase * multipliers[activityLevel]) / 10) * 10;
    
    // Protein and Fat by activity level
    let proteinFactor = 1.8;
    let fatPercentageMid = 0.265;
    let fatPercentageMin = 0.25;
    let fatPercentageMax = 0.28;

    if (activityLevel === 'Sedentary') {
      proteinFactor = 1.6;
      fatPercentageMid = 0.25;
      fatPercentageMin = 0.22;
      fatPercentageMax = 0.28;
    } else if (activityLevel === 'Lightly Active') {
      proteinFactor = 1.8;
      fatPercentageMid = 0.265;
      fatPercentageMin = 0.25;
      fatPercentageMax = 0.28;
    } else if (activityLevel === 'Moderately Active') {
      proteinFactor = 2.0;
      fatPercentageMid = 0.275;
      fatPercentageMin = 0.26;
      fatPercentageMax = 0.29;
    } else if (activityLevel === 'Very Active') {
      proteinFactor = 2.2;
      fatPercentageMid = 0.285;
      fatPercentageMin = 0.27;
      fatPercentageMax = 0.30;
    } else if (activityLevel === 'Athlete') {
      proteinFactor = 2.4;
      fatPercentageMid = 0.30;
      fatPercentageMin = 0.28;
      fatPercentageMax = 0.32;
    }

    const proteinMid = Math.round(w * proteinFactor);
    const proteinMin = Math.round(w * (proteinFactor - 0.1));
    const proteinMax = Math.round(w * (proteinFactor + 0.1));

    const fatMid = Math.round((tdee * fatPercentageMid) / 9);
    const fatMin = Math.round((tdee * fatPercentageMin) / 9);
    const fatMax = Math.round((tdee * fatPercentageMax) / 9);

    // Carbs: Remainder
    let carbKcal = tdee - (proteinMid * 4) - (fatMid * 9);
    if (isNaN(carbKcal) || !isFinite(carbKcal) || carbKcal < 0) {
      carbKcal = 0;
    }
    const carbMid = Math.max(0, Math.round(carbKcal / 4));
    const carbMin = Math.max(0, carbMid - 20);
    const carbMax = carbMid + 20;

    // Fiber
    const fiberMin = gender === 'Female' ? 25 : 35;
    const fiberMax = gender === 'Female' ? 28 : 38;

    // Water
    let water = (w * 35) / 1000;
    if (activity === 'Very Active' || activity === 'Athlete') {
      water += 0.5;
    }

    setResults({
      tdee,
      proteinMin,
      proteinMax,
      proteinMid,
      fatMin,
      fatMax,
      fatMid,
      carbMin,
      carbMax,
      carbMid,
      fiberMin,
      fiberMax,
      waterLitres: water.toFixed(1)
    });
    setShowResults(true);
  };

  const handleSave = () => {
    if (!validateStep1() || !results) return;

    const w = parseFloat(weight) || 80;
    const h = getComputedHeight();
    const a = parseFloat(age) || 30;

    saveMutation.mutate({
      name: name.trim() || 'User', 
      age: a, 
      height: h, 
      weight: w, 
      gender: gender || 'Male', 
      activity_level: activity || 'Lightly Active',
      maintenance_kcal: results.tdee, 
      protein_target: results.proteinMid
    });
  };

  if (onboardingCompleted) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 p-4 max-w-md mx-auto">
        <div className="text-center py-6">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-[20px] font-medium text-text-primary mb-2">Profile Completed</h2>
          <p className="text-[14px] text-text-secondary">You have already set up your profile and goals.</p>
        </div>

        <div className="bg-background-secondary rounded-xl p-5 mb-6 border border-border-secondary">
          <h3 className="text-[12px] font-bold tracking-widest uppercase text-text-secondary mb-4">Current Profile Data</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[13px] text-text-secondary">Name</span>
              <span className="text-[13px] font-medium text-text-primary">{onboardingData?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-text-secondary">Age</span>
              <span className="text-[13px] font-medium text-text-primary">{onboardingData?.age || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-text-secondary">Weight</span>
              <span className="text-[13px] font-medium text-text-primary">{onboardingData?.weightKg || '-'} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-text-secondary">Height</span>
              <span className="text-[13px] font-medium text-text-primary">{onboardingData?.heightCm || '-'} cm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-text-secondary">Activity</span>
              <span className="text-[13px] font-medium text-text-primary">{onboardingData?.activityLevel || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-text-secondary">TDEE</span>
              <span className="text-[13px] font-medium text-text-primary">{onboardingData?.tdee || '-'} kcal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-text-secondary">Protein Target</span>
              <span className="text-[13px] font-medium text-text-primary">{onboardingData?.proteinMid || '-'} g</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            if (window.confirm("Are you sure? Once reset, your current profile data cannot be recovered.")) {
              setOnboardingCompleted(false);
              setOnboardingData(undefined);
              clearStore();
              window.location.reload();
            }
          }}
          className="w-full py-3 bg-red-500/10 text-red-500 font-medium rounded-xl hover:bg-red-500/20 transition-colors"
        >
          Reset profile
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-center py-4 pb-5">
        <div className="text-[10px] text-purple font-bold tracking-widest uppercase mb-2">Step 1 of 2</div>
        <h2 className="text-[20px] font-medium text-text-primary mb-1.5">Personal Information</h2>
        <p className="text-[13px] text-text-secondary max-w-[320px] mx-auto">We use US Navy standards for precision targeting.</p>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[13px] text-center font-medium">
          Please fill in all fields to get your plan
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="flex flex-col gap-1 col-span-2 mt-1">
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Gender</span>
          <div className="flex gap-1.5 flex-wrap">
            {['Male', 'Female'].map(g => (
              <button key={g} onClick={() => setGender(g as any)} className={cn("px-3 py-1.5 border-[0.5px] border-border-secondary text-[12px] cursor-pointer transition-all bg-background-primary flex-1", gender === g ? "bg-purple text-background-primary font-medium border-purple" : "text-text-secondary hover:bg-background-secondary", errors.gender && "border-red-500")}>{g}</button>
            ))}
          </div>
          {errors.gender && <span className="text-[10px] text-red-500 mt-0.5">{errors.gender}</span>}
        </div>

        <div className="flex flex-col gap-1 col-span-2">
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Your name</span>
          <input className={cn("px-2.5 py-1.5 border-[0.5px] text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple", errors.name ? "border-red-500" : "border-border-secondary")} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="First name" />
          {errors.name && <span className="text-[10px] text-red-500 mt-0.5">{errors.name}</span>}
        </div>

        <div className="flex flex-col gap-1 col-span-2">
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Age</span>
          <input className={cn("px-2.5 py-1.5 border-[0.5px] text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple", errors.age ? "border-red-500" : "border-border-secondary")} type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Age" />
          {errors.age && <span className="text-[10px] text-red-500 mt-0.5">{errors.age}</span>}
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
            <input className={cn("px-2.5 py-1.5 border-[0.5px] text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple", errors.height ? "border-red-500" : "border-border-secondary")} type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 172" />
          ) : (
            <div className="flex items-center gap-1.5">
              <input className={cn("px-2.5 py-1.5 border-[0.5px] text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple w-full min-w-0", errors.height ? "border-red-500" : "border-border-secondary")} type="number" value={heightFt} onChange={e => setHeightFt(e.target.value)} placeholder="5" />
              <span className="text-text-secondary font-medium text-[13px]">'</span>
              <input className={cn("px-2.5 py-1.5 border-[0.5px] text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple w-full min-w-0", errors.height ? "border-red-500" : "border-border-secondary")} type="number" value={heightIn} onChange={e => setHeightIn(e.target.value)} placeholder="10" />
              <span className="text-text-secondary font-medium text-[13px]">"</span>
            </div>
          )}
          {errors.height && <span className="text-[10px] text-red-500 mt-0.5">{errors.height}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Weight (kg)</span>
          <input className={cn("px-2.5 py-1.5 border-[0.5px] text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple", errors.weight ? "border-red-500" : "border-border-secondary")} type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="kg" />
          {errors.weight && <span className="text-[10px] text-red-500 mt-0.5">{errors.weight}</span>}
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
                    : "bg-background-primary text-text-secondary hover:bg-background-secondary",
                  errors.activity && activity !== a.label ? "border-red-500" : (activity !== a.label ? "border-border-secondary" : "")
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
          {errors.activity && <span className="text-[10px] text-red-500 mt-0.5">{errors.activity}</span>}
        </div>
      </div>
      
      {!showResults && <button onClick={calculateResults} disabled={saveMutation.isPending} className="w-full p-2.5 border-none bg-purple text-background-primary text-[14px] font-bold tracking-tight uppercase cursor-pointer transition-opacity hover:opacity-90 mb-3.5 disabled:opacity-50">Calculate</button>}
      
      {showResults && results && (
        <div className="mb-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-background-secondary border border-border-tertiary mb-3">
            <div className="p-3 border-b border-border-tertiary">
              <h3 className="text-[14px] font-medium text-text-primary">Daily Nutrition Targets</h3>
              <p className="text-[11px] text-text-secondary mt-0.5">Based on your stats — here's what your body needs each day</p>
            </div>
            
            <div className="p-0">
              <div className="flex justify-between items-center p-3 border-b border-border-tertiary">
                <span className="text-[12px] text-text-secondary">Calories</span>
                <span className="text-[13px] font-medium text-text-primary">{results.tdee} kcal <span className="text-[11px] font-normal text-text-secondary ml-1">(maintenance)</span></span>
              </div>
              <div className="flex justify-between items-center p-3 border-b border-border-tertiary">
                <span className="text-[12px] text-text-secondary">Protein</span>
                <span className="text-[13px] font-medium text-text-primary">{results.proteinMin}–{results.proteinMax} g/day <span className="text-[11px] font-normal text-text-secondary ml-1">(≈2.0–2.2 g/kg)</span></span>
              </div>
              <div className="flex justify-between items-center p-3 border-b border-border-tertiary">
                <span className="text-[12px] text-text-secondary">Fat</span>
                <span className="text-[13px] font-medium text-text-primary">{results.fatMin}–{results.fatMax} g/day</span>
              </div>
              <div className="flex justify-between items-center p-3 border-b border-border-tertiary">
                <span className="text-[12px] text-text-secondary">Carbohydrates</span>
                <span className="text-[13px] font-medium text-text-primary">{results.carbMin}–{results.carbMax} g/day <span className="text-[11px] font-normal text-text-secondary ml-1">(remainder)</span></span>
              </div>
              <div className="flex justify-between items-center p-3 border-b border-border-tertiary">
                <span className="text-[12px] text-text-secondary">Fiber</span>
                <span className="text-[13px] font-medium text-text-primary">{results.fiberMin}–{results.fiberMax} g/day</span>
              </div>
              <div className="flex justify-between items-center p-3">
                <span className="text-[12px] text-text-secondary">Water</span>
                <span className="text-[13px] font-medium text-text-primary">{results.waterLitres} L/day</span>
              </div>
            </div>
          </div>

          <div className="bg-background-secondary border border-border-tertiary mb-4 p-3">
            <h3 className="text-[12px] font-medium text-text-primary mb-2">Your Stats</h3>
            <div className="grid grid-cols-2 gap-y-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Current Weight</span>
                <span className="text-[13px] text-text-primary font-medium">{weight || '—'} kg</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Maintenance Calories</span>
                <span className="text-[13px] text-text-primary font-medium">{results.tdee} kcal</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Height</span>
                <span className="text-[13px] text-text-primary font-medium">
                  {heightUnit === 'cm' ? `${height || '—'} cm` : `${heightFt || '—'}'${heightIn || '—'}"`}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Activity Level</span>
                <span className="text-[13px] text-text-primary font-medium">{activity || '—'}</span>
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saveMutation.isPending} className="w-full p-2.5 border-[0.5px] border-purple bg-purple/10 text-purple text-[14px] font-bold tracking-tight uppercase cursor-pointer transition-opacity hover:bg-purple/20 disabled:opacity-50">
            {saveMutation.isPending ? 'Saving...' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}

