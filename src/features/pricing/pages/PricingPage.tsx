import { CheckCircle2, Shield, Clock, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { haptics } from '@/shared/utils/haptics';

export function PricingPage() {
  const navigate = useNavigate();

  const activateBeta = () => {
    alert("Founding Member Beta - Premium features unlocked.");
    navigate('/dashboard');
  };

  return (
    <div className="page-enter min-h-[100dvh] bg-[#0A0A0A] pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] px-5 flex flex-col">
      
      <div className="flex-1">
        <div className="text-center py-6 mb-4">
          <h2 className="text-[30px] font-bold text-white tracking-tight leading-tight mb-2">Invest in your<br/>consistency.</h2>
          <p className="text-[15px] text-[rgba(255,255,255,0.5)] max-w-[400px] mx-auto leading-relaxed">
            Get early access to our premium features at a significant discount.
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-[400px] mx-auto">
          {/* Free Card */}
          <div className="card-base p-7 flex flex-col">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#378ADD] mb-2">Free</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[44px] font-bold text-white tracking-tighter leading-none">₹0</span>
            </div>
            <div className="text-[13px] text-[rgba(255,255,255,0.4)] mb-6">Forever free tier</div>

            <ul className="flex flex-col gap-3 flex-1 mb-8">
              <li className="flex items-start gap-2.5 text-[14px] text-white">
                <CheckCircle2 size={18} className="text-[rgba(255,255,255,0.4)] shrink-0" />
                <span>Basic macro tracking</span>
              </li>
              <li className="flex items-start gap-2.5 text-[14px] text-white">
                <CheckCircle2 size={18} className="text-[rgba(255,255,255,0.4)] shrink-0" />
                <span>Progress logging</span>
              </li>
              <li className="flex items-start gap-2.5 text-[14px] text-[rgba(255,255,255,0.3)] line-through">
                <CheckCircle2 size={18} className="text-[rgba(255,255,255,0.3)] shrink-0" />
                <span>Weekly AI Insights</span>
              </li>
              <li className="flex items-start gap-2.5 text-[14px] text-[rgba(255,255,255,0.3)] line-through">
                <CheckCircle2 size={18} className="text-[rgba(255,255,255,0.3)] shrink-0" />
                <span>Advanced body fat metrics</span>
              </li>
            </ul>

            <button 
              onClick={activateBeta}
              className="btn-ghost w-full py-3.5 text-[15px]"
            >
              Start Free
            </button>
          </div>

          {/* Pro Card */}
          <div className="bg-[rgba(212,255,0,0.04)] border-[1.5px] border-[rgba(212,255,0,0.3)] rounded-3xl p-7 flex flex-col relative mt-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4FF00] text-black px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-[0_4px_12px_rgba(212,255,0,0.2)]">
              Most Popular
            </div>

            <div className="text-[10px] font-bold uppercase tracking-widest text-[#D4FF00] mb-2 mt-1">Pro Yearly</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[44px] font-bold text-white tracking-tighter leading-none">₹999</span>
              <span className="text-[16px] font-medium text-[rgba(255,255,255,0.4)]">/yr</span>
            </div>
            <div className="text-[13px] text-[rgba(255,255,255,0.4)] mb-6">Billed annually (₹83/mo)</div>

            <ul className="flex flex-col gap-3 flex-1 mb-8">
              <li className="flex items-start gap-2.5 text-[14px] text-white">
                <CheckCircle2 size={18} className="text-[#D4FF00] shrink-0" />
                <span>Everything in Free</span>
              </li>
              <li className="flex items-start gap-2.5 text-[14px] text-white">
                <CheckCircle2 size={18} className="text-[#D4FF00] shrink-0" />
                <span>Advanced AI Weekly Reports</span>
              </li>
              <li className="flex items-start gap-2.5 text-[14px] text-white">
                <CheckCircle2 size={18} className="text-[#D4FF00] shrink-0" />
                <span>US Navy BF% calculations</span>
              </li>
              <li className="flex items-start gap-2.5 text-[14px] text-white">
                <CheckCircle2 size={18} className="text-[#D4FF00] shrink-0" />
                <span>Physique timeline & projections</span>
              </li>
            </ul>

            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(212,255,0,0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={activateBeta}
              className="w-full py-3.5 rounded-full bg-[#D4FF00] text-black text-[15px] font-bold shadow-[0_4px_16px_rgba(212,255,0,0.2)]"
            >
              Get Premium Access
            </motion.button>
          </div>
        </div>
      </div>

      {/* Trust Bar */}
      <div className="flex items-center justify-center gap-4 py-6 mt-4">
        <div className="flex items-center gap-1.5">
          <Shield size={16} className="text-[rgba(255,255,255,0.4)]" />
          <span className="text-[12px] text-[rgba(255,255,255,0.35)]">Secure</span>
        </div>
        <div className="w-[1px] h-4 bg-[rgba(255,255,255,0.08)]"></div>
        <div className="flex items-center gap-1.5">
          <Clock size={16} className="text-[rgba(255,255,255,0.4)]" />
          <span className="text-[12px] text-[rgba(255,255,255,0.35)]">Cancel anytime</span>
        </div>
        <div className="w-[1px] h-4 bg-[rgba(255,255,255,0.08)]"></div>
        <div className="flex items-center gap-1.5">
          <CreditCard size={16} className="text-[rgba(255,255,255,0.4)]" />
          <span className="text-[12px] text-[rgba(255,255,255,0.35)]">No hidden fees</span>
        </div>
      </div>

    </div>
  );
}
