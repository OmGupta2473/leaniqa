import { Check, X, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store';

export function PricingScreen() {
  const { setScreen } = useAppStore();

  const activateBeta = () => {
    alert("Founding Member Beta - Premium features unlocked.");
    setScreen('dash');
  };

  return (
    <div className="screen-container screen-enter">
      <div className="text-center py-2 pb-4">
        <h2 className="text-[20px] font-medium text-text-primary mb-1.5">Launch pricing</h2>
        <p className="text-[13px] text-text-secondary max-w-[320px] mx-auto">Get early access at a significant discount.</p>
        
        <div style={{ background: 'rgba(212,255,0,0.1)', border: '1px solid rgba(212,255,0,0.3)', color: '#D4FF00', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, marginTop: '16px' }}>
          LeanIQa Beta — Premium features unlocked.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 opacity-75">
        <div style={{ border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', background: 'rgba(44,44,46,0.7)' }}>
          <div><span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mb-2 bg-purple-bg text-text-primary border border-border-primary">Monthly</span></div>
          <div className="text-[13px] font-medium text-text-primary">Pro Monthly</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'white', margin: '8px 0 4px' }}>₹199</div>
          <div className="text-[11px] text-text-secondary">/month · cancel anytime</div>
          <ul className="list-none my-3 space-y-1.5 flex-1">
            <li className="text-[12px] text-text-secondary flex items-start gap-1.5"><Check size={14} style={{ color: '#D4FF00', flexShrink: 0, marginTop: '2px' }} /> Full macro engine</li>
            <li className="text-[12px] text-text-secondary flex items-start gap-1.5"><Check size={14} style={{ color: '#D4FF00', flexShrink: 0, marginTop: '2px' }} /> US Navy body fat standard</li>
            <li className="text-[12px] text-text-secondary flex items-start gap-1.5"><Check size={14} style={{ color: '#D4FF00', flexShrink: 0, marginTop: '2px' }} /> Physique timeline</li>
            <li className="text-[12px] text-text-secondary flex items-start gap-1.5"><Check size={14} style={{ color: '#D4FF00', flexShrink: 0, marginTop: '2px' }} /> Weekly reports</li>
          </ul>
          <button 
            onClick={activateBeta}
            className="w-full p-2.5 rounded-md cursor-pointer"
            style={{ border: '0.5px solid rgba(255,255,255,0.15)', color: 'white', background: 'transparent', fontSize: '14px', fontWeight: 500 }}
          >
            Continue
          </button>
        </div>
        
        <div style={{ border: '2px solid #D4FF00', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', background: 'rgba(44,44,46,0.7)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, background: '#D4FF00', color: '#0A0A0A', fontSize: '9px', fontWeight: 700, padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: '0 14px 0 8px' }}>Best Value</div>
          <div><span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mb-2 bg-purple text-background-primary">Early Adopter</span></div>
          <div className="text-[13px] font-medium text-text-primary">Pro Yearly</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#D4FF00', margin: '8px 0 4px' }}>₹999</div>
          <div className="text-[11px] text-text-secondary">/year · ₹83/mo equivalent</div>
          <ul className="list-none my-3 space-y-1.5 flex-1">
            <li className="text-[12px] text-text-secondary flex items-start gap-1.5"><Check size={14} style={{ color: '#D4FF00', flexShrink: 0, marginTop: '2px' }} /> Everything in monthly</li>
            <li className="text-[12px] text-text-secondary flex items-start gap-1.5"><Check size={14} style={{ color: '#D4FF00', flexShrink: 0, marginTop: '2px' }} /> Priority AI processing</li>
            <li className="text-[12px] text-text-secondary flex items-start gap-1.5"><Check size={14} style={{ color: '#D4FF00', flexShrink: 0, marginTop: '2px' }} /> Locked in early pricing</li>
          </ul>
          <button 
            onClick={activateBeta}
            className="w-full p-2.5 rounded-md cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: '#D4FF00', color: '#0A0A0A', border: 'none', fontWeight: 700, fontSize: '14px' }}
          >
            Continue
          </button>
        </div>
      </div>

      <div style={{ background: 'rgba(44,44,46,0.7)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '12px', textAlign: 'center', fontSize: '12px', color: 'rgba(235,235,245,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <ShieldCheck size={16} style={{ color: '#D4FF00' }} />
        <span>No barcode scanner. No social feed. A focused tool that works.</span>
      </div>
    </div>
  );
}
