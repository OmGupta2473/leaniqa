import re

with open("src/features/profile/pages/ProfilePage.tsx", "r") as f:
    c = f.read()

old_ui = """      {/* Subscription & Plans */}
      <div className="mb-12">
        <div className="text-[16px] font-semibold text-white tracking-tight mb-3">Subscription</div>
        {isSubLoading ? (
          <div className="h-32 rounded-3xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] animate-pulse" />
        ) : subscription?.isPremium ? (
          <div className="bg-[rgba(212,255,0,0.04)] border-[1.5px] border-[rgba(212,255,0,0.3)] rounded-3xl p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Crown size={64} />
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-[#D4FF00] text-black px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                <Crown size={12} /> PRO ACTIVE
              </div>
            </div>
            
            <div className="text-[20px] font-bold text-white tracking-tight mb-1">
              LeanIQA Premium
            </div>
            <div className="text-[13px] text-[rgba(255,255,255,0.5)] mb-5 flex items-center gap-1.5">
               <Zap size={14} className="text-[#D4FF00]" /> All premium features unlocked
            </div>

            <button 
              onClick={() => {
                haptics.tap();
                navigate('/pricing');
              }}
              className="flex items-center justify-between w-full p-3.5 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.05)] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <CreditCardIcon size={18} className="text-[rgba(255,255,255,0.6)] group-hover:text-white transition-colors" />
                <div className="flex flex-col text-left">
                  <span className="text-[14px] font-medium text-white leading-tight">Manage Subscription</span>
                  <span className="text-[12px] text-[rgba(255,255,255,0.4)]">View plan & billing</span>
                </div>
              </div>
              <ArrowRight size={16} className="text-[rgba(255,255,255,0.3)] group-hover:text-white transition-colors" />
            </button>
          </div>
        ) : (
          <div className="card-base p-6 rounded-3xl flex flex-col relative overflow-hidden group border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Crown size={64} />
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.7)] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                FREE PLAN
              </div>
            </div>
            
            <div className="text-[20px] font-bold text-white tracking-tight mb-2">
              Upgrade to Pro
            </div>
            
            <ul className="flex flex-col gap-2 mb-5">
              <li className="flex items-start gap-2 text-[13px] text-[rgba(255,255,255,0.6)]">
                <Sparkles size={14} className="text-[#D4FF00] shrink-0 mt-[2px]" />
                <span>Advanced AI Weekly Reports</span>
              </li>
              <li className="flex items-start gap-2 text-[13px] text-[rgba(255,255,255,0.6)]">
                <Sparkles size={14} className="text-[#D4FF00] shrink-0 mt-[2px]" />
                <span>Physique timeline projections</span>
              </li>
            </ul>

            <button 
              onClick={() => {
                haptics.tap();
                navigate('/pricing');
              }}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white text-black font-semibold text-[15px] hover:bg-[#D4FF00] transition-colors"
            >
              <Crown size={18} />
              View Plans
            </button>
          </div>
        )}
      </div>"""

new_ui = """      {/* Subscription & Plans */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[16px] font-semibold text-white tracking-tight leading-tight">Plan & Billing</div>
        </div>
        
        {isSubLoading ? (
          <div className="h-40 rounded-3xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] animate-pulse" />
        ) : subscription?.isPremium ? (
          <motion.div 
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-br from-[rgba(212,255,0,0.08)] to-[rgba(212,255,0,0.02)] border-[1.5px] border-[rgba(212,255,0,0.2)] rounded-3xl p-6 flex flex-col relative overflow-hidden backdrop-blur-xl shadow-[0_8px_32px_rgba(212,255,0,0.05)]"
          >
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#D4FF00] opacity-[0.07] blur-3xl rounded-full" />
            <div className="absolute top-4 right-4 text-[rgba(212,255,0,0.4)]">
              <Crown size={48} strokeWidth={1} />
            </div>
            
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="bg-[#D4FF00] text-black px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-[0_2px_8px_rgba(212,255,0,0.4)]">
                <Crown size={12} strokeWidth={2.5} /> PRO ACTIVE
              </div>
            </div>
            
            <div className="text-[22px] font-bold text-white tracking-tight mb-1 relative z-10">
              LeanIQA Premium
            </div>
            <div className="text-[13px] text-[rgba(255,255,255,0.6)] mb-6 flex items-center gap-1.5 relative z-10">
               <Zap size={14} className="text-[#D4FF00]" /> Yearly Billing Cycle
            </div>

            <button 
              onClick={() => {
                haptics.tap();
                navigate('/pricing');
              }}
              className="flex items-center justify-between w-full p-4 rounded-2xl bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(212,255,0,0.3)] transition-all duration-300 group relative z-10 backdrop-blur-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[rgba(212,255,0,0.1)] flex items-center justify-center border border-[rgba(212,255,0,0.2)]">
                  <CreditCardIcon size={18} className="text-[#D4FF00]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[15px] font-semibold text-white leading-tight">Manage Subscription</span>
                  <span className="text-[12px] text-[rgba(255,255,255,0.5)] mt-0.5">View plan, billing, restore</span>
                </div>
              </div>
              <ArrowRight size={18} className="text-[rgba(255,255,255,0.4)] group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              haptics.tap();
              navigate('/pricing');
            }}
            className="cursor-pointer bg-gradient-to-b from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(212,255,0,0.4)] rounded-3xl p-6 flex flex-col relative overflow-hidden backdrop-blur-xl transition-all duration-300 group shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          >
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white opacity-[0.03] group-hover:bg-[#D4FF00] group-hover:opacity-[0.05] transition-colors duration-500 blur-3xl rounded-full" />
            <div className="absolute top-4 right-4 text-[rgba(255,255,255,0.1)] group-hover:text-[rgba(212,255,0,0.2)] transition-colors duration-500">
              <Crown size={48} strokeWidth={1} />
            </div>
            
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="bg-[rgba(255,255,255,0.15)] text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 backdrop-blur-md border border-[rgba(255,255,255,0.1)]">
                FREE PLAN
              </div>
            </div>
            
            <div className="text-[22px] font-bold text-white tracking-tight mb-2 relative z-10">
              Upgrade to Pro
            </div>
            
            <ul className="flex flex-col gap-2.5 mb-6 relative z-10">
              <li className="flex items-start gap-2.5 text-[14px] text-[rgba(255,255,255,0.7)]">
                <Sparkles size={16} className="text-[#D4FF00] shrink-0 mt-[1px]" />
                <span>Advanced AI Weekly Reports</span>
              </li>
              <li className="flex items-start gap-2.5 text-[14px] text-[rgba(255,255,255,0.7)]">
                <Sparkles size={16} className="text-[#D4FF00] shrink-0 mt-[1px]" />
                <span>Physique timeline projections</span>
              </li>
            </ul>

            <button 
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white text-black font-semibold text-[15px] group-hover:bg-[#D4FF00] transition-colors duration-300 relative z-10 shadow-[0_4px_12px_rgba(255,255,255,0.15)] group-hover:shadow-[0_4px_16px_rgba(212,255,0,0.3)]"
            >
              <Crown size={18} strokeWidth={2.5} />
              View Plans
            </button>
          </motion.div>
        )}
      </div>"""

if old_ui in c:
    c = c.replace(old_ui, new_ui)
else:
    print("Could not find exact text to replace")

with open("src/features/profile/pages/ProfilePage.tsx", "w") as f:
    f.write(c)
