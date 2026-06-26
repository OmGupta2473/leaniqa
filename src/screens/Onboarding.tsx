import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { cn } from '../lib/utils';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { complianceService } from '../services/complianceService';

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start: number | null = null;
    let animationFrameId: number;

    const update = (time: number) => {
      if (!start) start = time;
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutExpo
      setDisplayValue(Math.round(ease * value));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span ref={elementRef}>{displayValue}</span>;
}

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

  const inputClass = (hasError: boolean) => cn(
    "w-full bg-[rgba(255,255,255,0.07)] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-xl text-[17px] p-[14px_16px] text-white",
    "focus:bg-[rgba(255,255,255,0.1)] focus:border-[rgba(212,255,0,0.6)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(212,255,0,0.12)] transition-all",
    hasError && "border-[rgba(255,59,48,0.6)] bg-[rgba(255,59,48,0.05)] focus:border-[rgba(255,59,48,0.6)] focus:shadow-[0_0_0_3px_rgba(255,59,48,0.12)]"
  );

  if (onboardingCompleted) {
    return (
      <div className="screen-container animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="text-center py-6">
          <CheckCircle2 className="w-16 h-16 text-[#D4FF00] mx-auto mb-4" />
          <h2 className="text-[34px] font-bold text-white tracking-[-0.5px] mb-2">Profile Completed</h2>
          <p className="text-[15px] font-normal tracking-[-0.1px] text-[#EBEBF5CC]">You have already set up your profile and goals.</p>
        </div>

        <div className="glass-card p-[16px_20px] mb-6">
          <h3 className="text-[13px] font-semibold tracking-[0.06em] uppercase text-[#EBEBF599] mb-[12px]">Current Profile Data</h3>
          <div className="space-y-[12px]">
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Name</span>
              <span className="text-[17px] font-semibold text-white">{onboardingData?.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Age</span>
              <span className="text-[17px] font-semibold text-white">{onboardingData?.age || '-'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Weight</span>
              <span className="text-[17px] font-semibold text-white">{onboardingData?.weightKg || '-'} <span className="text-[13px] font-normal text-[#EBEBF599]">kg</span></span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Height</span>
              <span className="text-[17px] font-semibold text-white">{onboardingData?.heightCm || '-'} <span className="text-[13px] font-normal text-[#EBEBF599]">cm</span></span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Activity</span>
              <span className="text-[17px] font-semibold text-white">{onboardingData?.activityLevel || '-'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">TDEE</span>
              <span className="text-[17px] font-semibold text-white">{onboardingData?.tdee || '-'} <span className="text-[13px] font-normal text-[#EBEBF599]">kcal</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Protein Target</span>
              <span className="text-[17px] font-semibold text-white">{onboardingData?.proteinMid || '-'} <span className="text-[13px] font-normal text-[#EBEBF599]">g</span></span>
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
          className="w-full py-[14px] bg-[rgba(255,255,255,0.1)] text-white font-semibold text-[15px] rounded-[100px] border-[0.5px] border-[rgba(255,255,255,0.2)] transition-transform active:scale-[0.96]"
        >
          Reset profile
        </button>
      </div>
    );
  }

  return (
    <div className="screen-container screen-enter">
      <div className="py-[28px] mb-[12px]">
        <div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599] mb-[8px]">Step 1 of 2</div>
        <h2 className="text-[34px] font-bold text-white tracking-[-0.5px] leading-tight mb-[8px]">Personal Information</h2>
        <p className="text-[15px] font-normal text-[#EBEBF5CC] tracking-[-0.1px]">We use US Navy standards for precision targeting.</p>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="mb-[20px] p-[12px] rounded-xl bg-[rgba(255,59,48,0.05)] border-[0.5px] border-[rgba(255,59,48,0.6)] text-[#FF3B30] text-[13px] text-center font-normal">
          Please fill in all fields to get your plan
        </div>
      )}
      
      <div className="flex flex-col gap-[20px] mb-[28px]">
        {/* Gender */}
        <div className="flex flex-col gap-[8px]">
          <span className="text-[15px] font-medium text-white">Gender</span>
          <div className="flex gap-[12px]">
            {['Male', 'Female'].map(g => (
              <button 
                key={g} 
                onClick={() => setGender(g as any)} 
                className={cn(
                  "flex-1 py-[14px] px-[16px] rounded-xl text-[17px] font-medium transition-all",
                  gender === g 
                    ? "bg-[rgba(212,255,0,0.1)] border border-[rgba(212,255,0,0.5)] text-white" 
                    : "bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.12)] text-[#EBEBF5CC] hover:bg-[rgba(255,255,255,0.1)]",
                  errors.gender && "border-[rgba(255,59,48,0.6)] bg-[rgba(255,59,48,0.05)]"
                )}
              >
                {g}
              </button>
            ))}
          </div>
          {errors.gender && <span className="text-[13px] text-[#FF3B30] mt-[6px]">{errors.gender}</span>}
        </div>

        {/* Name */}
        <div className="flex flex-col gap-[8px]">
          <span className="text-[15px] font-medium text-white">Your name</span>
          <input 
            className={inputClass(!!errors.name)} 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="First name" 
          />
          {errors.name && <span className="text-[13px] text-[#FF3B30] mt-[6px]">{errors.name}</span>}
        </div>

        {/* Age */}
        <div className="flex flex-col gap-[8px]">
          <span className="text-[15px] font-medium text-white">Age</span>
          <input 
            className={inputClass(!!errors.age)} 
            type="number" 
            value={age} 
            onChange={e => setAge(e.target.value)} 
            placeholder="Age" 
          />
          {errors.age && <span className="text-[13px] text-[#FF3B30] mt-[6px]">{errors.age}</span>}
        </div>

        {/* Height */}
        <div className="flex flex-col gap-[8px]">
          <div className="flex justify-between items-center mb-[4px]">
            <span className="text-[15px] font-medium text-white">Height</span>
            <div className="bg-[rgba(255,255,255,0.08)] rounded-[100px] p-[3px] inline-flex">
              <button 
                onClick={() => toggleHeightUnit('cm')} 
                className={cn("px-[16px] py-[6px] rounded-[100px] text-[14px] font-medium transition-all", heightUnit === 'cm' ? "bg-[#D4FF00] text-[#0A0A0A] font-bold" : "text-[#EBEBF599]")}
              >cm</button>
              <button 
                onClick={() => toggleHeightUnit('ft')} 
                className={cn("px-[16px] py-[6px] rounded-[100px] text-[14px] font-medium transition-all", heightUnit === 'ft' ? "bg-[#D4FF00] text-[#0A0A0A] font-bold" : "text-[#EBEBF599]")}
              >ft / in</button>
            </div>
          </div>
          {heightUnit === 'cm' ? (
            <input 
              className={inputClass(!!errors.height)} 
              type="number" 
              value={height} 
              onChange={e => setHeight(e.target.value)} 
              placeholder="e.g. 172" 
            />
          ) : (
            <div className="flex gap-[12px]">
              <div className="flex-1 relative">
                <input 
                  className={inputClass(!!errors.height)} 
                  type="number" 
                  value={heightFt} 
                  onChange={e => setHeightFt(e.target.value)} 
                  placeholder="5" 
                />
                <span className="absolute right-[16px] top-[14px] text-[#EBEBF599] text-[17px]">ft</span>
              </div>
              <div className="flex-1 relative">
                <input 
                  className={inputClass(!!errors.height)} 
                  type="number" 
                  value={heightIn} 
                  onChange={e => setHeightIn(e.target.value)} 
                  placeholder="10" 
                />
                <span className="absolute right-[16px] top-[14px] text-[#EBEBF599] text-[17px]">in</span>
              </div>
            </div>
          )}
          {errors.height && <span className="text-[13px] text-[#FF3B30] mt-[6px]">{errors.height}</span>}
        </div>

        {/* Weight */}
        <div className="flex flex-col gap-[8px]">
          <span className="text-[15px] font-medium text-white">Weight (kg)</span>
          <input 
            className={inputClass(!!errors.weight)} 
            type="number" 
            value={weight} 
            onChange={e => setWeight(e.target.value)} 
            placeholder="e.g. 80" 
          />
          {errors.weight && <span className="text-[13px] text-[#FF3B30] mt-[6px]">{errors.weight}</span>}
        </div>

        {/* Activity level */}
        <div className="flex flex-col gap-[8px] mt-[8px]">
          <span className="text-[15px] font-medium text-white">Activity level</span>
          <div className="flex flex-col gap-[12px]">
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
                  "bg-[rgba(44,44,46,0.6)] border-[0.5px] border-[rgba(255,255,255,0.1)] rounded-[14px] p-[14px_16px] cursor-pointer transition-all text-left flex flex-col gap-[4px]",
                  activity === a.label && "bg-[rgba(212,255,0,0.1)] border-[rgba(212,255,0,0.5)]",
                  errors.activity && activity !== a.label && "border-[rgba(255,59,48,0.6)] bg-[rgba(255,59,48,0.05)]"
                )}
              >
                <div className="text-[15px] font-semibold text-white">
                  {a.label}
                </div>
                <div className="text-[13px] font-normal text-[#EBEBF599]">
                  {a.desc}
                </div>
              </button>
            ))}
          </div>
          {errors.activity && <span className="text-[13px] text-[#FF3B30] mt-[6px]">{errors.activity}</span>}
        </div>
      </div>
      
      {!showResults && (
        <button 
          onClick={calculateResults} 
          disabled={saveMutation.isPending} 
          className="w-full bg-[#D4FF00] text-[#0A0A0A] font-bold text-[17px] rounded-[100px] p-[16px_32px] border-none tracking-[-0.2px] transition-all hover:scale-[1.02] hover:opacity-[0.95] active:scale-[0.97] disabled:opacity-50"
        >
          Calculate targets
        </button>
      )}
      
      {showResults && results && (
        <div className="mb-[28px] card-reveal">
          {/* Header */}
          <div className="mb-[20px]">
            <h2 className="text-[22px] font-semibold text-white tracking-[-0.3px]">Good work, {name.trim() || 'there'}</h2>
            <p className="text-[15px] font-normal text-[#EBEBF5CC] tracking-[-0.1px]">Here's what your body needs daily</p>
          </div>
          
          <div className="glass-card mb-[28px] overflow-hidden">
            <div className="p-[16px_20px]">
              <div className="flex justify-between items-center py-[12px] border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-[15px] font-normal text-[#EBEBF5CC]">Calories</span>
                <span className="text-[17px] font-semibold text-[#D4FF00]">
                  <AnimatedNumber value={results.tdee} /> <span className="text-[13px] font-normal text-[#EBEBF599]">kcal</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-[12px] border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-[15px] font-normal text-[#EBEBF5CC]">Protein</span>
                <span className="text-[17px] font-semibold text-white">
                  <AnimatedNumber value={results.proteinMin} />–<AnimatedNumber value={results.proteinMax} /> <span className="text-[13px] font-normal text-[#EBEBF599]">g/day</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-[12px] border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-[15px] font-normal text-[#EBEBF5CC]">Fat</span>
                <span className="text-[17px] font-semibold text-white">
                  <AnimatedNumber value={results.fatMin} />–<AnimatedNumber value={results.fatMax} /> <span className="text-[13px] font-normal text-[#EBEBF599]">g/day</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-[12px] border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-[15px] font-normal text-[#EBEBF5CC]">Carbohydrates</span>
                <span className="text-[17px] font-semibold text-white">
                  <AnimatedNumber value={results.carbMin} />–<AnimatedNumber value={results.carbMax} /> <span className="text-[13px] font-normal text-[#EBEBF599]">g/day</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-[12px] border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-[15px] font-normal text-[#EBEBF5CC]">Fiber</span>
                <span className="text-[17px] font-semibold text-white">
                  <AnimatedNumber value={results.fiberMin} />–<AnimatedNumber value={results.fiberMax} /> <span className="text-[13px] font-normal text-[#EBEBF599]">g/day</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-[12px]">
                <span className="text-[15px] font-normal text-[#EBEBF5CC]">Water</span>
                <span className="text-[17px] font-semibold text-white">
                  <AnimatedNumber value={parseFloat(results.waterLitres)} /> <span className="text-[13px] font-normal text-[#EBEBF599]">L/day</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mb-[28px]">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599] mb-[12px]">Your Stats</h3>
            <div className="grid grid-cols-3 gap-[12px]">
              <div className="bg-[rgba(255,255,255,0.05)] rounded-[12px] p-[12px] flex flex-col items-center text-center">
                <span className="text-[24px] font-semibold tracking-[-0.5px] text-white leading-none mb-[4px]">{weight || '—'}</span>
                <span className="text-[13px] font-normal text-[#EBEBF599] uppercase">Current<br/>Weight</span>
              </div>
              
              <div className="bg-[rgba(212,255,0,0.12)] border-[0.5px] border-[rgba(212,255,0,0.3)] rounded-[12px] p-[12px] flex flex-col items-center text-center">
                <span className="text-[24px] font-bold tracking-[-0.5px] text-[#D4FF00] leading-none mb-[4px]"><AnimatedNumber value={results.tdee} /></span>
                <span className="text-[13px] font-normal text-[#D4FF00]/70 uppercase">Maint.<br/>Calories</span>
              </div>

              <div className="bg-[rgba(255,255,255,0.05)] rounded-[12px] p-[12px] flex flex-col items-center text-center">
                <span className="text-[24px] font-semibold tracking-[-0.5px] text-white leading-none mb-[4px]">
                  {heightUnit === 'cm' ? height : `${heightFt}'${heightIn}"`}
                </span>
                <span className="text-[13px] font-normal text-[#EBEBF599] uppercase">Current<br/>Height</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={saveMutation.isPending} 
            className="w-full bg-[#D4FF00] text-[#0A0A0A] font-bold text-[17px] rounded-[100px] p-[16px_32px] border-none tracking-[-0.2px] transition-all hover:scale-[1.02] hover:opacity-[0.95] active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-[8px] group"
          >
            {saveMutation.isPending ? 'Saving...' : 'Set my physique goal'}
            <ArrowRight size={20} className="transition-transform duration-200 group-hover:translate-x-[3px]" />
          </button>
        </div>
      )}
    </div>
  );
}
