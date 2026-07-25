import re

with open("src/features/profile/pages/ProfilePage.tsx", "r") as f:
    c = f.read()

# Add subscription query
sub_query = """
  const { data: subscription, isLoading: isSubLoading } = useQuery({ 
    queryKey: ['subscription'], 
    queryFn: () => subscriptionService.getSubscriptionStatus() 
  });
"""

c = re.sub(
    r'(const \{ profileData: calculated \} = useCalculatedProfile\(\);)',
    r'\1' + sub_query,
    c
)

# Replace Danger Zone comment to inject Subscription UI
sub_ui = """
      {/* Subscription & Plans */}
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
      </div>

      {/* Danger Zone */}"""

c = c.replace("{/* Danger Zone */}", sub_ui)

with open("src/features/profile/pages/ProfilePage.tsx", "w") as f:
    f.write(c)
