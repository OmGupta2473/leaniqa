import { Check, X, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store';

export function PricingScreen() {
  const { setScreen } = useAppStore();

  const activateBeta = () => {
    alert("Founding Member Beta - Premium features unlocked.");
    setScreen('dash');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-center py-2 pb-4">
        <h2 className="text-[20px] font-medium text-text-primary mb-1.5">Launch pricing</h2>
        <p className="text-[13px] text-text-secondary max-w-[320px] mx-auto">Get early access at a significant discount.</p>
        
        <div className="mt-4 bg-purple/10 border border-purple/30 text-purple p-3 rounded-md text-[13px] font-medium">
          Founding Member Beta - Premium features unlocked.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 opacity-75">
        <div className="border-[0.5px] border-border-tertiary rounded-xl p-4 flex flex-col bg-background-secondary">
          <div><span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mb-2 bg-purple-bg text-text-primary border border-border-primary">Monthly</span></div>
          <div className="text-[13px] font-medium text-text-primary">Pro Monthly</div>
          <div className="text-[26px] font-medium my-1.5 text-text-primary">₹199</div>
          <div className="text-[11px] text-text-secondary">/month · cancel anytime</div>
          <ul className="list-none my-3 space-y-1.5 flex-1">
            <li className="text-[12px] text-text-secondary flex items-start gap-1.5"><Check size={14} className="text-purple shrink-0 mt-0.5" /> Full macro engine</li>
            <li className="text-[12px] text-text-secondary flex items-start gap-1.5"><Check size={14} className="text-purple shrink-0 mt-0.5" /> US Navy body fat standard</li>
            <li className="text-[12px] text-text-secondary flex items-start gap-1.5"><Check size={14} className="text-purple shrink-0 mt-0.5" /> Physique timeline</li>
            <li className="text-[12px] text-text-secondary flex items-start gap-1.5"><Check size={14} className="text-purple shrink-0 mt-0.5" /> Weekly reports</li>
          </ul>
          <button 
            onClick={activateBeta}
            className="w-full p-2.5 rounded-md border-[0.5px] border-border-secondary bg-transparent text-text-primary text-[14px] font-medium cursor-pointer"
          >
            Continue
          </button>
        </div>
        
        <div className="border-[2px] border-purple rounded-xl p-4 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-purple text-background-primary text-[9px] font-bold px-2 py-1 uppercase tracking-widest rounded-bl-lg">Best Value</div>
          <div><span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mb-2 bg-purple text-background-primary">Early Adopter</span></div>
          <div className="text-[13px] font-medium text-text-primary">Pro Yearly</div>
          <div className="text-[26px] font-medium my-1.5 text-purple">₹999</div>
          <div className="text-[11px] text-text-secondary">/year · ₹83/mo equivalent</div>
          <ul className="list-none my-3 space-y-1.5 flex-1">
            <li className="text-[12px] text-text-secondary flex items-start gap-1.5"><Check size={14} className="text-purple shrink-0 mt-0.5" /> Everything in monthly</li>
            <li className="text-[12px] text-text-secondary flex items-start gap-1.5"><Check size={14} className="text-purple shrink-0 mt-0.5" /> Priority AI processing</li>
            <li className="text-[12px] text-text-secondary flex items-start gap-1.5"><Check size={14} className="text-purple shrink-0 mt-0.5" /> Locked in early pricing</li>
          </ul>
          <button 
            onClick={activateBeta}
            className="w-full p-2.5 rounded-md border-none bg-purple text-background-primary text-[14px] font-medium cursor-pointer transition-opacity hover:opacity-90 shadow-lg shadow-purple/20"
          >
            Continue
          </button>
        </div>
      </div>

      <div className="bg-background-secondary rounded-md p-3 text-center text-[12px] text-text-secondary border-[0.5px] border-border-tertiary flex items-center justify-center gap-1">
        <ShieldCheck size={16} className="text-teal" />
        <span>No barcode scanner. No social feed. A focused tool that works.</span>
      </div>
    </div>
  );
}
