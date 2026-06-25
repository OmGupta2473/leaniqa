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
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [hip, setHip] = useState('');
  const [gender, setGender] = useState<'Male'|'Female'>('Male');
  
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

  const calculateRough = () => {
    const w = parseFloat(weight) || 80;
    const h = parseFloat(height) || 175;
    const a = parseFloat(age) || 30;

    // Maintenance Mifflin-St Jeor
    const maintBase = (w * 10) + (h * 6.25) - (a * 5) + (gender === 'Male' ? 5 : -161);
    const maint = Math.round(maintBase * 1.375); // Light activity default
    
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
    const h = parseFloat(height) || 175;
    const a = parseFloat(age) || 30;
    const waistVal = parseFloat(waist) || (gender === 'Male' ? 90 : 80);
    const neckVal = parseFloat(neck) || (gender === 'Male' ? 38 : 34);
    const hipVal = parseFloat(hip) || 100;

    const maintBase = (w * 10) + (h * 6.25) - (a * 5) + (gender === 'Male' ? 5 : -161);
    const maint = Math.round(maintBase * 1.375); // Light activity default
    
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
    const h = parseFloat(height) || 175;
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
        activity_level: 'Light',
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
              <button key={g} onClick={() => setGender(g as any)} className={cn("px-3 py-1.5 border-[0.5px] border-border-secondary text-[12px] cursor-pointer transition-all bg-background-primary", gender === g ? "bg-purple text-background-primary font-medium border-purple" : "text-text-secondary hover:bg-background-secondary")}>{g}</button>
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
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Height (cm)</span>
          <input className="px-2.5 py-1.5 border-[0.5px] border-border-secondary text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple" type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="cm" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Weight (kg)</span>
          <input className="px-2.5 py-1.5 border-[0.5px] border-border-secondary text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple" type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="kg" />
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

