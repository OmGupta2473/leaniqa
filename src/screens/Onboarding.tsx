import { useState } from 'react';
import { useAppStore } from '../store';
import { cn } from '../lib/utils';
import { Sparkles } from 'lucide-react';

export function OnboardingScreen() {
  const { setScreen, updateProfile, updateGoal } = useAppStore();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [hip, setHip] = useState('');
  const [gender, setGender] = useState<'Male'|'Female'>('Male');
  const [activity, setActivity] = useState<'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very active'>('Light');
  
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({ maint: 0, protein: 0, bf: 0 });

  const calculate = () => {
    const w = parseFloat(weight) || 80;
    const h = parseFloat(height) || 175;
    const a = parseFloat(age) || 30;
    const waistVal = parseFloat(waist) || (gender === 'Male' ? 90 : 80);
    const neckVal = parseFloat(neck) || (gender === 'Male' ? 38 : 34);
    const hipVal = parseFloat(hip) || 100;

    // Maintenance Katch-McArdle or Mifflin-St Jeor (using Mifflin for simplicity)
    const maintBase = (w * 10) + (h * 6.25) - (a * 5) + (gender === 'Male' ? 5 : -161);
    const maint = Math.round(maintBase * (activity === 'Light' ? 1.375 : activity === 'Moderate' ? 1.55 : 1.2));
    
    // US Navy Method BF%
    let bf = 0;
    if (gender === 'Male') {
      bf = 495 / (1.0324 - 0.19077 * Math.log10(waistVal - neckVal) + 0.15456 * Math.log10(h)) - 450;
    } else {
      bf = 495 / (1.29579 - 0.35004 * Math.log10(waistVal + hipVal - neckVal) + 0.22100 * Math.log10(h)) - 450;
    }
    
    bf = Math.max(3, Math.min(60, Math.round(bf * 10) / 10)); // Round to 1 decimal
    const lbm = w * (1 - bf / 100);
    const protein = Math.round(lbm * 2.2); // 2.2g per kg of LBM
    
    setResults({ maint, protein, bf });
    setShowResults(true);
    
    updateProfile({
      name: name || 'User', age: a, height: h, weight: w, gender, waist: waistVal, neck: neckVal, hip: hipVal, activityLevel: activity,
      maintenanceKcal: maint, proteinTarget: protein, estimatedBf: bf
    });

    updateGoal({
      currentBf: bf,
      targetBf: gender === 'Male' ? 12 : 20,
      strategy: 'Recommended'
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

        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-widest">Name</span>
          <input className="px-2.5 py-1.5 border-[0.5px] border-border-secondary text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
        </div>
        <div className="flex flex-col gap-1">
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
      
      {!showResults && <button onClick={calculate} className="w-full p-2.5 border-none bg-purple text-background-primary text-[14px] font-bold tracking-tight uppercase cursor-pointer transition-opacity hover:opacity-90 mb-3.5">Calculate Baseline</button>}
      
      {showResults && (
        <div className="bg-background-secondary p-4 mb-3.5 border border-border-tertiary animate-in fade-in slide-in-from-top-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-purple mb-2.5">US Navy Projection</div>
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
            <button onClick={() => setScreen('dash')} className="w-full p-2.5 border-[0.5px] border-purple bg-purple/10 text-purple text-[14px] font-bold tracking-tight uppercase cursor-pointer transition-opacity hover:bg-purple/20">Enter Command Center →</button>
          </div>
        </div>
      )}
    </div>
  );
}
