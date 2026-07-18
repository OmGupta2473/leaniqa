import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, X, Info } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { haptics } from '@/shared/utils/haptics';

export interface BodyFatOption {
  range: string;
  label: string;
  characteristics: string[];
  mid: number;
}

const maleOptions: BodyFatOption[] = [
  { range: 'Under 8%', label: 'Essential fat', characteristics: ['Extremely lean', 'Visible striations', 'Competition level'], mid: 5 },
  { range: '8–12%', label: 'Athletic', characteristics: ['Visible abs', 'Very defined', 'Typical fitness model'], mid: 10 },
  { range: '12–15%', label: 'Fit', characteristics: ['Some ab definition', 'Lean look', 'Low belly fat'], mid: 13.5 },
  { range: '15–20%', label: 'Average fit', characteristics: ['Slight lower belly', 'Face appears lean', 'Waist visible', 'No visible abs'], mid: 17.5 },
  { range: '20–25%', label: 'Average', characteristics: ['Soft belly', 'Fuller face', 'No muscle definition'], mid: 22.5 },
  { range: '25–30%', label: 'Above average', characteristics: ['Noticeable belly', 'Rounder build', 'Love handles'], mid: 27.5 },
  { range: '30–40%', label: 'High body fat', characteristics: ['Significant fat storage', 'Round face', 'High waist circumference'], mid: 35 },
  { range: 'Above 40%', label: 'Obese', characteristics: ['Excessive fat storage across whole body', 'Health risks'], mid: 45 }
];

const femaleOptions: BodyFatOption[] = [
  { range: 'Under 14%', label: 'Essential fat', characteristics: ['Extremely lean', 'Visible striations', 'Competition level'], mid: 12 },
  { range: '14–20%', label: 'Athletic', characteristics: ['Visible abs', 'Very defined', 'Typical fitness model'], mid: 17 },
  { range: '20–24%', label: 'Fit', characteristics: ['Some definition', 'Lean look', 'Low belly fat'], mid: 22 },
  { range: '24–30%', label: 'Average fit', characteristics: ['Slight lower belly', 'Face appears lean', 'Waist visible', 'No visible abs'], mid: 27 },
  { range: '30–35%', label: 'Average', characteristics: ['Soft belly', 'Fuller face', 'No muscle definition'], mid: 32.5 },
  { range: '35–40%', label: 'Above average', characteristics: ['Noticeable belly', 'Rounder build', 'Love handles'], mid: 37.5 },
  { range: '40–50%', label: 'High body fat', characteristics: ['Significant fat storage', 'Round face', 'High waist circumference'], mid: 45 },
  { range: 'Above 50%', label: 'Obese', characteristics: ['Excessive fat storage across whole body', 'Health risks'], mid: 55 }
];

interface BodyFatImagePlaceholderProps {
  gender: string;
  categoryRange: string;
  className?: string;
}

function BodyFatImagePlaceholder({ gender, categoryRange, className }: BodyFatImagePlaceholderProps) {
  return (
    <div className={cn("w-full aspect-[3/4] bg-[rgba(255,255,255,0.02)] rounded-lg overflow-hidden flex flex-col items-center justify-center border border-[rgba(255,255,255,0.05)] relative", className)}>
      {/* Upload area placeholder for future illustration */}
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.5)] to-transparent pointer-events-none" />
      <div className="text-[rgba(255,255,255,0.2)] flex flex-col items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
          <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          <rect width="20" height="14" x="2" y="6" rx="2"/>
        </svg>
        <span className="text-[10px] uppercase font-bold tracking-wider">{gender}</span>
        <span className="text-[10px] mt-1">{categoryRange}</span>
      </div>
    </div>
  );
}

interface BodyFatCardProps {
  option: BodyFatOption;
  isSelected: boolean;
  isRecommended: boolean;
  gender: string;
  onSelect: () => void;
  onPreview: () => void;
}

function BodyFatCard({ option, isSelected, isRecommended, gender, onSelect, onPreview }: BodyFatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-[24px] cursor-pointer transition-all duration-300 flex flex-col overflow-hidden text-left",
        "bg-[#111113] border-[0.5px] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.02)]",
        isSelected && "border-[#D4FF00] bg-[rgba(212,255,0,0.06)] shadow-[0_0_20px_rgba(212,255,0,0.15)] hover:border-[#D4FF00]"
      )}
    >
      {/* Tap target for selecting */}
      <div className="p-3" onClick={() => { haptics.tap(); onSelect(); }}>
        <div className="relative group">
          <BodyFatImagePlaceholder gender={gender} categoryRange={option.range} />
          {/* Expand icon for preview */}
          <button 
            onClick={(e) => { e.stopPropagation(); haptics.tap(); onPreview(); }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[rgba(0,0,0,0.5)] backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity border border-[rgba(255,255,255,0.06)]"
          >
            <Info size={16} />
          </button>
          
          {isRecommended && !isSelected && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-[#D4FF00] text-black text-[9px] font-bold uppercase tracking-wider rounded-full">
              Recommended
            </div>
          )}
        </div>
        
        <div className="mt-4 px-1">
          <div className="flex items-center justify-between mb-1">
            <div className={cn("text-[20px] font-bold tracking-tight leading-none", isSelected ? "text-[#D4FF00]" : "text-white")}>{option.range}</div>
            {isSelected && <CheckCircle2 size={18} className="text-[#D4FF00]" />}
          </div>
          <div className="text-[13px] font-medium text-[rgba(255,255,255,0.8)] mb-3">{option.label}</div>
          
          <ul className="space-y-1.5">
            {option.characteristics.slice(0, 3).map((char, i) => (
              <li key={i} className="text-[11px] text-[rgba(255,255,255,0.5)] flex items-start leading-tight">
                <span className="mr-1.5 text-[rgba(255,255,255,0.2)] mt-[2px]">•</span> {char}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

interface BodyFatPreviewModalProps {
  option: BodyFatOption | null;
  gender: string;
  onClose: () => void;
  onSelect: () => void;
}

function BodyFatPreviewModal({ option, gender, onClose, onSelect }: BodyFatPreviewModalProps) {
  if (!option) return null;
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-[#161618] border-t sm:border border-[rgba(255,255,255,0.06)] rounded-t-3xl sm:rounded-3xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.1)] transition-colors">
            <X size={20} className="text-white" />
          </button>
          
          <div className="mb-6 w-12 h-1 bg-[rgba(255,255,255,0.1)] rounded-full mx-auto sm:hidden" />
          
          <div className="text-center mb-6">
            <h2 className="text-[28px] font-bold text-white tracking-tight">{option.range}</h2>
            <p className="text-[15px] font-medium text-[#D4FF00]">{option.label}</p>
          </div>
          
          <div className="w-full max-w-[240px] mx-auto aspect-[3/4] mb-10 relative">
            <BodyFatImagePlaceholder gender={gender} categoryRange={option.range} className="rounded-[20px] border-[rgba(255,255,255,0.06)]" />
          </div>
          
          <div className="bg-[rgba(255,255,255,0.03)] rounded-[24px] p-5 mb-10 border border-[rgba(255,255,255,0.05)]">
            <h3 className="text-[13px] uppercase tracking-wider text-[rgba(255,255,255,0.4)] font-bold mb-4">Characteristics</h3>
            <ul className="space-y-3">
              {option.characteristics.map((char, i) => (
                <li key={i} className="flex items-start text-[15px] text-white leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] mt-1.5 mr-3 shrink-0" />
                  {char}
                </li>
              ))}
            </ul>
          </div>
          
          <button 
            onClick={() => { haptics.success(); onSelect(); onClose(); }}
            className="w-full bg-[#D4FF00] text-black font-semibold py-4 rounded-full text-[16px] hover:bg-[#bce000] active:scale-95 transition-all shadow-[0_0_20px_rgba(212,255,0,0.3)]"
          >
            Select This Body
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function EstimatedBodyFatBanner({ estimatedBf, recommendedOption }: { estimatedBf: number, recommendedOption?: BodyFatOption }) {
  if (!estimatedBf || !recommendedOption) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[rgba(212,255,0,0.08)] border border-[rgba(212,255,0,0.2)] rounded-[24px] p-5 mb-6 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(212,255,0,0.1)] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex items-start gap-4 relative z-10">
        <div className="w-10 h-10 rounded-full bg-[rgba(212,255,0,0.15)] flex items-center justify-center shrink-0 border border-[rgba(212,255,0,0.3)]">
          <span className="text-[18px]">✨</span>
        </div>
        <div>
          <h3 className="text-[22px] font-semibold tracking-tight text-white tracking-tight mb-1">
            We estimate your current body fat is approximately <span className="text-[#D4FF00]">{Math.round(estimatedBf)}%</span>
          </h3>
          <p className="text-[13px] text-[rgba(255,255,255,0.6)] leading-relaxed mb-3">
            Based on your height, weight, age and gender. Please compare with the reference images below and adjust if necessary.
          </p>
          <div className="inline-flex items-center gap-2 bg-[rgba(212,255,0,0.1)] border border-[rgba(212,255,0,0.15)] px-3 py-1.5 rounded-full">
            <span className="text-[12px] font-medium text-[rgba(255,255,255,0.8)]">Recommended:</span>
            <span className="text-[12px] font-bold text-[#D4FF00]">{recommendedOption.range}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface BodyFatSelectorProps {
  gender: string;
  estimatedBf?: number | null;
  value: number | null;
  onChange: (value: number) => void;
  maxBf?: number | null;
}

export function BodyFatSelector({ gender, estimatedBf, value, onChange, maxBf }: BodyFatSelectorProps) {
  let options = (gender.toLowerCase() === 'female' || gender.toLowerCase() === 'f') ? femaleOptions : maleOptions;
  if (maxBf !== undefined && maxBf !== null) {
    options = options.filter(opt => opt.mid < maxBf);
  }
  const [previewOption, setPreviewOption] = useState<BodyFatOption | null>(null);
  
  // Find recommended option
  let recommendedOption = options[0];
  if (estimatedBf !== null) {
    let minDiff = Infinity;
    for (const opt of options) {
      const diff = Math.abs(opt.mid - estimatedBf);
      if (diff < minDiff) {
        minDiff = diff;
        recommendedOption = opt;
      }
    }
  }
  
  // Automatically select recommended if no value is set
  useEffect(() => {
    if (value === null && estimatedBf !== null && recommendedOption) {
      onChange(recommendedOption.mid);
    }
  }, [value, estimatedBf, recommendedOption, onChange]);

  return (
    <div>
      {estimatedBf !== null && (
        <EstimatedBodyFatBanner estimatedBf={estimatedBf} recommendedOption={recommendedOption} />
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {options.map((opt) => (
          <BodyFatCard
            key={opt.range}
            option={opt}
            isSelected={value === opt.mid}
            isRecommended={estimatedBf !== null && recommendedOption?.mid === opt.mid}
            gender={gender}
            onSelect={() => onChange(opt.mid)}
            onPreview={() => setPreviewOption(opt)}
          />
        ))}
      </div>
      
      {previewOption && (
        <BodyFatPreviewModal
          option={previewOption}
          gender={gender}
          onClose={() => setPreviewOption(null)}
          onSelect={() => onChange(previewOption.mid)}
        />
      )}
    </div>
  );
}
