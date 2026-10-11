import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Shield } from 'lucide-react';
import { Logo } from '@/shared/components/Logo';
import { type OnboardingDraft } from '../types';

interface ConsentScreenProps {
  draft: OnboardingDraft;
  setDraft: (updater: OnboardingDraft | ((prev: OnboardingDraft) => OnboardingDraft)) => void;
  onFinish: () => Promise<void>;
}

export function ConsentScreen({ draft, setDraft, onFinish }: ConsentScreenProps) {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const isValid =
    draft.termsAccepted && draft.privacyAccepted && draft.aiConsentAccepted;

  const handleContinue = async () => {
    if (!isValid || isSaving) return;
    setIsSaving(true);
    try {
      await onFinish();
    } catch {
      setIsSaving(false);
    }
  };

  const toggle = (
    key: 'termsAccepted' | 'privacyAccepted' | 'aiConsentAccepted' | 'marketingAccepted',
  ) => {
    setDraft((d) => ({ ...d, [key]: !d[key] }));
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full max-w-md mx-auto">
      <header className="flex-shrink-0 px-[clamp(1rem,4vw,1.5rem)] pt-2 pb-[clamp(0.75rem,2dvh,1.25rem)]">
        {/* Top bar: back + step indicator */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setDraft((d) => ({ ...d, step: 3 }))}
            aria-label="Back to plan"
            className="p-2 -ml-2 bg-zinc-900/60 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-[clamp(0.7rem,1.8dvh,0.8rem)] text-zinc-500 font-medium">
            Step 4 of 4
          </div>
        </div>

        {/* Logo + title */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center shrink-0">
            <Logo className="w-7 h-7" />
          </div>
          <div className="min-w-0 pt-0.5">
            <h1 className="text-[clamp(1.35rem,3.6dvh,1.75rem)] font-semibold tracking-tight text-white leading-tight">
              You&apos;re almost there
            </h1>
            <p className="text-[clamp(0.72rem,1.85dvh,0.85rem)] text-zinc-400 mt-1.5 leading-snug">
              To give you a personalized experience, we need your consent to a few things.
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-[clamp(1rem,4vw,1.5rem)] pb-4">
        {/* Data safety card */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-[clamp(0.75rem,2dvh,1.25rem)] mb-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#D4FF00]/10 border border-[#D4FF00]/20 flex items-center justify-center shrink-0">
              <Shield className="w-7 h-7 text-[#D4FF00]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[clamp(0.9rem,2.3dvh,1.05rem)] font-semibold text-white mb-1">
                Your data is safe with us
              </h3>
              <p className="text-[clamp(0.72rem,1.85dvh,0.85rem)] text-zinc-400 leading-relaxed">
                We use your information only to provide personalized nutrition, habit tracking
                and coaching. We never sell your data to third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Consent rows */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
          <ConsentRow
            checked={draft.termsAccepted}
            onToggle={() => toggle('termsAccepted')}
            onOpen={() => navigate('/terms')}
            title="I agree to the Terms and Conditions"
            description="I have read and agree to the Terms and Conditions for using LeanIQA."
          />
          <ConsentRow
            checked={draft.privacyAccepted}
            onToggle={() => toggle('privacyAccepted')}
            onOpen={() => navigate('/privacy')}
            title="I agree to the Privacy Policy"
            description="I understand how my data is collected, used and protected as described in the Privacy Policy."
          />
          <ConsentRow
            checked={draft.aiConsentAccepted}
            onToggle={() => toggle('aiConsentAccepted')}
            title="I consent to data processing for AI coaching"
            description="I allow LeanIQA to use my food logs, activity data and health information to provide personalized insights and AI-powered recommendations."
          />
          <ConsentRow
            checked={draft.marketingAccepted}
            onToggle={() => toggle('marketingAccepted')}
            optional
            isLast
            title="I agree to receive product updates"
            description="Get notified about new features, tips and special offers via email or push notifications. You can opt out anytime."
          />
        </div>
      </main>

      <footer className="flex-shrink-0 px-[clamp(1rem,4vw,1.5rem)] pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <button
          onClick={handleContinue}
          disabled={!isValid || isSaving}
          className={`w-full py-[clamp(0.75rem,2.1dvh,1rem)] rounded-full font-semibold text-[clamp(0.9rem,2.3dvh,1rem)] transition-all flex items-center justify-center gap-3 ${
            isValid && !isSaving
              ? 'bg-[#D4FF00] text-black hover:brightness-110'
              : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Saving…' : 'Continue'}
          {!isSaving && (
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                isValid ? 'bg-black/10' : 'bg-zinc-800/50'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </button>
      </footer>
    </div>
  );
}

function ConsentRow({
  checked,
  onToggle,
  onOpen,
  title,
  description,
  optional = false,
  isLast = false,
}: {
  checked: boolean;
  onToggle: () => void;
  onOpen?: () => void;
  title: string;
  description: string;
  optional?: boolean;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-[clamp(0.5rem,1.4dvh,0.75rem)] p-[clamp(0.75rem,2dvh,1.1rem)] ${
        !isLast ? 'border-b border-zinc-800/60' : ''
      }`}
    >
      <button
        onClick={onToggle}
        className="flex-1 flex items-start gap-[clamp(0.6rem,1.6dvh,0.9rem)] text-left min-w-0"
        aria-pressed={checked}
      >
        <div
          className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            checked ? 'bg-[#D4FF00] border-[#D4FF00]' : 'border-zinc-700'
          }`}
        >
          {checked && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[clamp(0.8rem,2.1dvh,0.95rem)] font-semibold text-white leading-snug">
            {title}
            {optional && (
              <span className="text-zinc-500 font-normal ml-1.5">(optional)</span>
            )}
          </div>
          <p className="text-[clamp(0.68rem,1.75dvh,0.8rem)] text-zinc-400 leading-relaxed mt-0.5">
            {description}
          </p>
        </div>
      </button>
      {onOpen && (
        <button
          onClick={onOpen}
          aria-label={`Open ${title}`}
          className="p-1.5 -mr-1 -mt-0.5 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}